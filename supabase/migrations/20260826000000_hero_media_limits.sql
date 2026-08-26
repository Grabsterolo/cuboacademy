-- El bucket del vídeo de portada aceptaba hasta 50 MB y solo video/mp4.
--
-- 50 MB es demasiado para un fondo decorativo que descarga cada visitante: el
-- vídeo que había pesaba 3,61 MB y ya penalizaba la primera visita. Se baja a
-- 10 MB, que deja margen de sobra frente a los ~600 KB del vídeo recomprimido.
--
-- Se añaden dos tipos: video/webm, para poder servir AV1 (pesa la mitad que el
-- MP4 equivalente), e image/webp para el póster, que ahora se genera solo a
-- partir del primer fotograma y se guarda junto al vídeo.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['video/mp4', 'video/webm', 'image/webp']
where id = 'hero-video';

-- Claves nuevas: la variante WebM y el póster. hero_video_url ya existía y
-- sigue siendo el MP4, para no romper lo que ya hay guardado.
insert into public.platform_settings (key, value) values
  ('hero_video_webm_url', ''),
  ('hero_poster_url', '')
on conflict (key) do nothing;

-- El póster y el WebM tienen que ser legibles sin sesión, como el resto de la
-- configuración pública: se pintan en la portada de un visitante anónimo.
drop policy if exists "Configuración pública visible" on public.platform_settings;
create policy "Configuración pública visible" on public.platform_settings for select
using (key = any (array[
  'platform_name','platform_description','logo_url','primary_color',
  'hero_title','hero_subtitle','hero_video_url','hero_video_webm_url','hero_poster_url',
  'social_instagram','social_linkedin','social_youtube',
  'contact_email','contact_whatsapp',
  'legal_terms','legal_privacy','legal_refund']));
