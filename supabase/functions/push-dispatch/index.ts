import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const jsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

type PushDispatchBody = {
  recipientId?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const internalSecret = Deno.env.get('PUSH_DISPATCH_SECRET') || '';

    if (!supabaseUrl || !serviceRoleKey || !internalSecret) {
      return jsonResponse(503, {
        error: 'Falta configurar el despacho interno de push.',
      });
    }

    if (request.headers.get('x-bside-function-secret') !== internalSecret) {
      return jsonResponse(401, {
        error: 'No autorizado.',
      });
    }

    const body = (await request.json()) as PushDispatchBody;
    const recipientId = `${body?.recipientId || ''}`.trim();
    const title = `${body?.title || ''}`.trim();
    const messageBody = `${body?.body || ''}`.trim();
    const data =
      body?.data && typeof body.data === 'object' ? body.data : {};

    if (!recipientId || !title || !messageBody) {
      return jsonResponse(400, {
        error: 'Faltan recipientId, title o body.',
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

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

    if (!tokens.length) {
      return jsonResponse(200, {
        delivered: 0,
        skipped: true,
      });
    }

    const messages = tokens.map((token) => ({
      to: token,
      title,
      body: messageBody,
      data,
      sound: 'default',
      channelId: 'bside-social',
    }));

    const expoResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const expoPayload = await expoResponse.json();

    if (!expoResponse.ok) {
      return jsonResponse(expoResponse.status, {
        error: 'Expo Push API no respondió bien.',
        detail: expoPayload,
      });
    }

    return jsonResponse(200, {
      delivered: tokens.length,
      expo: expoPayload,
    });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Push dispatch falló.',
    });
  }
});
