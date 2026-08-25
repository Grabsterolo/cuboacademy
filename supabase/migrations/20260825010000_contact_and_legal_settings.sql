-- El pie solo salía en la portada y los dos catálogos, así que las fichas de
-- curso y evento —donde alguien decide pagar $120— no mostraban ninguna señal
-- de confianza: ni contacto, ni condiciones, ni política de reembolso.
--
-- Los textos legales van en platform_settings y no en archivos del repo para
-- que el cliente pueda ajustarlos sin depender de un despliegue: son documentos
-- suyos y con efectos legales, no copy de la aplicación.
--
-- Se siembran VACÍOS a propósito. Redactar unos términos o una política de
-- reembolso por defecto sería inventar compromisos legales en nombre del
-- negocio; la pantalla pública está preparada para decir que el documento está
-- en preparación y ofrecer el contacto mientras tanto.
insert into public.platform_settings (key, value) values
  ('contact_whatsapp', ''),
  ('legal_terms',      ''),
  ('legal_privacy',    ''),
  ('legal_refund',     '')
on conflict (key) do nothing;

-- Sin esto el pie y las páginas legales quedarían en blanco para cualquier
-- visitante sin sesión, que es justo quien necesita verlos antes de comprar.
drop policy if exists "Configuración pública visible" on public.platform_settings;

create policy "Configuración pública visible"
on public.platform_settings
for select
using (
  key = any (array[
    'platform_name', 'platform_description', 'logo_url', 'primary_color',
    'hero_title', 'hero_subtitle', 'hero_video_url',
    'social_instagram', 'social_linkedin', 'social_youtube',
    'contact_email', 'contact_whatsapp',
    'legal_terms', 'legal_privacy', 'legal_refund'
  ])
);
