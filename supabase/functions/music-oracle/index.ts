import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

const jsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const buildOraclePrompt = ({
  focus,
  tasteProfile,
  candidates,
}: {
  focus: string;
  tasteProfile: Record<string, unknown>;
  candidates: Array<Record<string, unknown>>;
}) => {
  const topFive = Array.isArray(tasteProfile?.topFive)
    ? tasteProfile.topFive
    : [];
  const favoriteArtists = Array.isArray(tasteProfile?.favoriteArtists)
    ? tasteProfile.favoriteArtists
    : [];
  const recentReviewMood = `${tasteProfile?.recentReviewMood || ''}`.trim();

  return [
    'Eres el Oraculo Musical de B-Side.',
    'Tu trabajo es elegir exactamente 3 discos desde la lista de candidatos que ya recibiste.',
    'No inventes discos nuevos ni uses ids que no aparezcan en candidates.',
    'Devuelve SOLO JSON valido con esta forma: {"recommendations":[{"id":"...","reason":"..."}]}.',
    'Cada razon debe sonar humana, corta, especifica y conectada con el gusto de la persona.',
    `Focus opcional del usuario: ${focus || 'sin foco extra'}.`,
    `Top 5 actual: ${JSON.stringify(topFive)}.`,
    `Artistas mas presentes: ${JSON.stringify(favoriteArtists)}.`,
    `Clima general de resenas: ${recentReviewMood || 'sin texto claro'}.`,
    `Candidates: ${JSON.stringify(candidates)}.`,
  ].join('\n');
};

const parseModelJson = (content: string) => {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
  } catch {
    return [];
  }
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY') || '';

    if (!apiKey) {
      return jsonResponse(503, {
        error: 'Falta OPENAI_API_KEY para el Oraculo Musical.',
      });
    }

    const body = await request.json();
    const focus = `${body?.focus || ''}`.trim();
    const tasteProfile =
      body?.tasteProfile && typeof body.tasteProfile === 'object'
        ? body.tasteProfile
        : {};
    const candidates = Array.isArray(body?.candidates)
      ? body.candidates.slice(0, 12)
      : [];

    if (!candidates.length) {
      return jsonResponse(200, {
        recommendations: [],
      });
    }

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Responde solo con JSON valido. Nunca agregues texto fuera del objeto.',
          },
          {
            role: 'user',
            content: buildOraclePrompt({
              focus,
              tasteProfile,
              candidates,
            }),
          },
        ],
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: payload?.error?.message || 'OpenAI no respondio bien.',
      });
    }

    const content =
      payload?.choices?.[0]?.message?.content &&
      typeof payload.choices[0].message.content === 'string'
        ? payload.choices[0].message.content
        : '';
    const candidateIds = new Set(candidates.map((candidate) => candidate.id));
    const recommendations = parseModelJson(content)
      .filter((recommendation) => candidateIds.has(recommendation?.id))
      .slice(0, 3);

    return jsonResponse(200, {
      recommendations,
    });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Music Oracle fallo.',
    });
  }
});
