-- Tipo de correo para el aviso de cancelación de un evento.
--
-- Queda preparado pero todavía sin usar: la edge function send-notification-email
-- valida el tipo recibido contra una lista propia y rechaza los que no conoce
-- («Faltan campos requeridos», 400). Su código no vive en este repositorio, así
-- que cancelEvent envía 'reminder' de momento. Cuando la función se actualice
-- para aceptar este valor, basta con cambiar esa línea.
alter type public.email_type add value if not exists 'event_cancelled';
