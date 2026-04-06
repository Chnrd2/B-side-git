import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const jsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const authorization = request.headers.get('Authorization') || '';
    const accessToken = authorization.replace('Bearer', '').trim();
    const requestBody = await request
      .json()
      .catch(() => ({} as { userId?: string }));

    console.log('[delete-account] request received', {
      hasAuthorization: Boolean(accessToken),
      requestedUserId: requestBody?.userId || null,
    });

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[delete-account] missing env', {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceRoleKey: Boolean(serviceRoleKey),
      });
      return jsonResponse(503, {
        error: 'Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para borrar cuentas.',
      });
    }

    if (!accessToken) {
      console.error('[delete-account] missing access token');
      return jsonResponse(401, {
        error: 'Falta el token de la sesion actual.',
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('[delete-account] auth validation failed', {
        authError: authError?.message || null,
      });
      return jsonResponse(401, {
        error: 'No pudimos validar la cuenta actual.',
      });
    }

    console.log('[delete-account] deleting user', {
      userId: user.id,
    });

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('[delete-account] delete user failed', {
        userId: user.id,
        error: deleteError.message,
      });
      throw deleteError;
    }

    console.log('[delete-account] delete user success', {
      userId: user.id,
    });

    return jsonResponse(200, {
      ok: true,
      message:
        'La cuenta fue borrada y las sesiones asociadas quedaron cerradas.',
    });
  } catch (error) {
    console.error('[delete-account] unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(500, {
      error:
        error instanceof Error
          ? error.message
          : 'No pudimos borrar la cuenta.',
    });
  }
});
