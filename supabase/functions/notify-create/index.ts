import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const ALLOWED_TYPES = new Set(['social']);
const ALLOWED_ENTITY_TYPES = new Set([
  'profile',
  'review',
  'message',
  'album-recommendation',
  'social',
]);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const jsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const trimText = (value: unknown, maxLength: number) =>
  `${value || ''}`.trim().slice(0, maxLength);

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get('Authorization') || '';
  const [, token] = authorization.match(/^Bearer\s+(.+)$/i) || [];
  return token || '';
};

type NotifyCreateBody = {
  recipientId?: string;
  actorId?: string;
  type?: string;
  title?: string;
  body?: string;
  entityType?: string;
  entityId?: string | null;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(503, {
        error: 'Falta configurar Supabase para crear notificaciones.',
      });
    }

    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return jsonResponse(401, {
        error: 'Necesitamos una sesión válida para crear la notificación.',
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData?.user?.id) {
      return jsonResponse(401, {
        error: 'La sesión ya no es válida. Volvé a iniciar sesión.',
      });
    }

    const userId = authData.user.id;
    const body = (await request.json()) as NotifyCreateBody;
    const recipientId = trimText(body.recipientId, 80);
    const actorId = trimText(body.actorId || userId, 80);
    const type = trimText(body.type || 'social', 40);
    const title = trimText(body.title, 120);
    const messageBody = trimText(body.body, 240);
    const entityType = trimText(body.entityType || 'social', 60);
    const entityId = body.entityId ? trimText(body.entityId, 160) : null;

    if (!recipientId || !title || !messageBody) {
      return jsonResponse(400, {
        error: 'Faltan datos para crear la notificación.',
      });
    }

    if (actorId !== userId || recipientId === userId) {
      return jsonResponse(403, {
        error: 'No podés crear esta notificación.',
      });
    }

    if (!ALLOWED_TYPES.has(type) || !ALLOWED_ENTITY_TYPES.has(entityType)) {
      return jsonResponse(400, {
        error: 'Tipo de notificación no permitido.',
      });
    }

    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', userId)
      .gte('created_at', since);

    if (countError) {
      throw countError;
    }

    if ((count || 0) >= RATE_LIMIT_MAX) {
      return jsonResponse(429, {
        error: 'Demasiadas notificaciones en poco tiempo. Probá de nuevo en un minuto.',
      });
    }

    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', recipientId)
      .maybeSingle();

    if (recipientError) {
      throw recipientError;
    }

    if (!recipientProfile?.id) {
      return jsonResponse(404, {
        error: 'No encontramos el perfil destino.',
      });
    }

    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        actor_id: userId,
        type,
        title,
        body: messageBody,
        entity_type: entityType,
        entity_id: entityId,
      })
      .select(
        'id, recipient_id, actor_id, type, title, body, entity_type, entity_id, read, created_at'
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    const { data: devices, error: devicesError } = await supabase
      .from('push_devices')
      .select('expo_push_token')
      .eq('user_id', recipientId)
      .eq('is_active', true);

    if (devicesError) {
      throw devicesError;
    }

    const tokens = (devices || [])
      .map((device) => `${device.expo_push_token || ''}`.trim())
      .filter(Boolean);

    let push = { delivered: 0, skipped: true };

    if (tokens.length) {
      const expoResponse = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          tokens.map((token) => ({
            to: token,
            title,
            body: messageBody,
            data: {
              type,
              entityType,
              entityId,
            },
            sound: 'default',
            channelId: 'bside-social',
          }))
        ),
      });

      push = {
        delivered: expoResponse.ok ? tokens.length : 0,
        skipped: false,
      };
    }

    return jsonResponse(200, {
      ok: true,
      notification,
      push,
    });
  } catch (error) {
    console.error('[notify-create] unexpected failure', error);

    return jsonResponse(500, {
      error: 'No pudimos crear la notificación. Probá de nuevo en un momento.',
    });
  }
});
