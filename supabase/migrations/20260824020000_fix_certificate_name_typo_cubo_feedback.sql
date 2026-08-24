-- El certificado emitido imprimía «Certiticación» (con T) porque ese era el
-- valor guardado en courses.certificate_name. El PDF sale de ahí, así que la
-- errata viajaba al documento y a la URL de compartir en LinkedIn.
--
-- Se ancla al valor equivocado exacto para que la migración sea idempotente y
-- no pise una corrección hecha a mano entretanto.
update public.courses
set certificate_name = 'Certificación en Metodología Cubo Feedback'
where id = '3f694c35-04e7-451b-a04c-2d8f19502c5d'
  and certificate_name = 'Certiticación en Metodología Cubo Feedback';
