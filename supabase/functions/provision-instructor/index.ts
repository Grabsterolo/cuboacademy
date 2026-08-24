import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function alreadyRegistered(msg: string) {
  return /already.*(registered|been registered|exists)/i.test(msg);
}

/**
 * Creates the real instructor account behind an approved application.
 *
 * Approving an application used to only flip its status and notify — the
 * account was never created, so an approved instructor could not sign in at
 * all. This does the privileged half: Auth user, profiles row with
 * role = 'instructor', and the email carrying a set-password link.
 *
 * The admin check runs here with the service key rather than in the browser,
 * because the browser half of an admin UI is not a trust boundary.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'No autorizado' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Caller-scoped client, used only to learn who is calling.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !caller) return json({ error: 'No autorizado' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: callerProfileErr } = await adminClient
    .from('profiles').select('role').eq('id', caller.id).single();
  if (callerProfileErr || callerProfile?.role !== 'admin') {
    return json({ error: 'Solo un administrador puede crear cuentas de instructor.' }, 403);
  }

  let body: { applicationId?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }

  const { applicationId, mode } = body;
  if (!applicationId) return json({ error: 'Falta applicationId.' }, 400);

  const { data: app, error: appErr } = await adminClient
    .from('instructor_applications')
    .select('id, full_name, last_name, email, phone, country, profession, specialty, years_experience, current_company, bio, linkedin_url, status, profile_id')
    .eq('id', applicationId)
    .single();
  if (appErr || !app) return json({ error: 'La solicitud no existe.' }, 404);

  const email = (app.email || '').trim();
  if (!email) return json({ error: 'La solicitud no tiene correo.' }, 400);
  const fullName = `${app.full_name || ''} ${app.last_name || ''}`.trim();

  // ── Modo «solo enlace» ──────────────────────────────────────────────────
  // Una cuenta recién creada no tiene contraseña hasta que la persona abre el
  // correo. Si ese correo no llegó, el instructor se queda sin acceso y el
  // admin sin recurso: esto le da un enlace que pueda entregar a mano.
  if (mode === 'access-link') {
    const { data: prof } = await adminClient
      .from('profiles').select('id').ilike('email', email).maybeSingle();
    if (!prof) return json({ error: 'Esta solicitud todavía no tiene cuenta. Créala primero.' }, 400);

    // 'recovery' es el único tipo que esta app sabe interpretar: dispara
    // PASSWORD_RECOVERY y lleva a ResetPasswordScreen.
    const rec = await adminClient.auth.admin.generateLink({ type: 'recovery', email });
    const link = rec.data?.properties?.action_link || null;
    if (!link) return json({ error: rec.error?.message || 'No se pudo generar el enlace.' }, 400);
    return json({ profileId: prof.id, actionLink: link, linkOnly: true }, 200);
  }

  // ── Resolve or create the Auth user ─────────────────────────────────────
  let userId: string | null = null;
  let invited = false;       // se creó la cuenta ahora
  let emailSent = false;     // Auth aceptó enviar el correo para poner contraseña
  let actionLink: string | null = null;

  // Una cuenta puede existir ya sin que la solicitud la tenga vinculada (pasa
  // con los aprobados antiguos). En ese caso no se crea nada: se reutiliza.
  const { data: existingProfile } = await adminClient
    .from('profiles').select('id').ilike('email', email).maybeSingle();
  if (existingProfile) userId = existingProfile.id;

  if (!userId) {
    // Deliberadamente NO se usa inviteUserByEmail: su enlace es `type=invite`,
    // que esta app no sabe interpretar. El usuario aterrizaría con sesión
    // iniciada pero sin contraseña, y no podría volver a entrar nunca. La app
    // sí escucha PASSWORD_RECOVERY (AuthContext -> ResetPasswordScreen), así
    // que se crea la cuenta y se manda un correo de recuperación, que lleva
    // directo a la pantalla de establecer contraseña.
    const { data: created, error: createErr } = await adminClient.auth.admin
      .createUser({ email, email_confirm: true, user_metadata: { full_name: fullName } });

    if (created?.user) {
      userId = created.user.id;
      invited = true;
    } else if (alreadyRegistered(createErr?.message || '')) {
      // Existe en Auth pero sin perfil: recuperarlo en vez de fallar.
      const { data: list } = await adminClient.auth.admin.listUsers();
      const match = list?.users?.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
      if (!match) return json({ error: `El correo ${email} ya está registrado pero no se pudo recuperar la cuenta.` }, 400);
      userId = match.id;
    } else {
      return json({ error: createErr?.message || 'No se pudo crear la cuenta.' }, 400);
    }
  }

  if (invited) {
    // Sin redirectTo: así el destino lo manda el Site URL del proyecto y no
    // queda un dominio incrustado aquí que se quede obsoleto.
    const { error: mailErr } = await adminClient.auth.resetPasswordForEmail(email);
    if (!mailErr) {
      emailSent = true;
    } else {
      // El correo suele fallar por SMTP de Auth sin configurar. La cuenta ya
      // existe, así que se devuelve el enlace para que el admin lo entregue a
      // mano en vez de dejar al instructor sin forma de entrar.
      const { data: link } = await adminClient.auth.admin
        .generateLink({ type: 'recovery', email });
      actionLink = link?.properties?.action_link || null;
    }
  }

  // ── Perfil de instructor ────────────────────────────────────────────────
  // handle_new_user ya insertó la fila con role = 'student'; aquí se completa
  // con los datos de la solicitud y se asciende el rol.
  const profilePatch: Record<string, unknown> = {
    role: 'instructor',
    email,
    full_name: app.full_name || fullName,
    last_name: app.last_name || null,
    phone: app.phone || null,
    country: app.country || null,
    profession: app.profession || null,
    specialty: app.specialty || null,
    years_experience: app.years_experience ?? null,
    current_company: app.current_company || null,
    bio: app.bio || null,
    linkedin_url: app.linkedin_url || null,
    is_active: true,
  };

  const { error: upsertErr } = await adminClient
    .from('profiles')
    .upsert({ id: userId, ...profilePatch }, { onConflict: 'id' });
  if (upsertErr) {
    return json({ error: `Cuenta creada, pero no se pudo completar el perfil: ${upsertErr.message}` }, 500);
  }

  // ── Vincular la solicitud ───────────────────────────────────────────────
  await adminClient
    .from('instructor_applications')
    .update({ profile_id: userId })
    .eq('id', app.id);

  // Si la solicitud ya estaba aprobada, el trigger de aprobación corrió cuando
  // profile_id era null y no notificó a nadie. Se compensa aquí. Si todavía
  // está pendiente, no se notifica: el trigger lo hará al aprobarla.
  if (app.status === 'approved') {
    await adminClient.from('notifications').insert({
      recipient_id: userId,
      type: 'instructor_application_approved',
      title: '¡Tu solicitud de instructor fue aprobada!',
      message: 'Ya puedes crear y publicar cursos en Cubo Academy.',
      screen: 'panel',
    });
  }

  return json({ profileId: userId, invited, emailSent, actionLink }, 200);
});
