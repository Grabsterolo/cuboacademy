-- CERT-001 (MEDIUM) — quitar la asistencia dejaba el certificado en pie.
--
-- Marcar asistencia a un evento pone `enrollments.completed_at`, y el trigger
-- `create_certificate_on_completion` crea la fila en `certificates`. Quitarla
-- (el mismo botón de «Asistió» en Asistencia, que es un interruptor) vuelve a
-- poner `completed_at = null`… y el certificado se quedaba.
--
-- Consecuencia: alguien marcado por error conservaba su certificado en la cola,
-- el admin lo aprobaba sin motivo para sospechar, y quedaba una credencial con
-- código de verificación público sin haberla ganado.
--
-- El arreglo va en la base y no en `markEventAttendance.js` a propósito: quien
-- crea el certificado es un trigger, así que quien lo deshace tiene que ser
-- otro. Puesto en el cliente valdría solo para el botón que ya existe, y no para
-- un reembolso, una corrección por SQL o cualquier pantalla futura que toque
-- `completed_at`.
--
-- Dos casos, sin inventarse ninguna regla nueva:
--
--   · Certificado sin aprobar (`pending` o `rejected`): se borra. No se emitió
--     nada — esa fila era una entrada en la cola de revisión, no una credencial.
--
--   · Certificado ya aprobado: NO se borra. Tiene código de verificación
--     público y un PDF servido desde el bucket `certificates`; hacerlo
--     desaparecer en silencio sería peor que el problema. Pasa a `rejected`,
--     que es el estado terminal que este sistema ya usa para «este certificado
--     no vale», con la nota del motivo. El trigger `notify_certificate_review`
--     se encarga de avisar al estudiante, y `request_certificate_review` le deja
--     reclamar si fue un error. Todo con mecanismos que ya existían.
--
-- Queda fuera, anotado en AUDIT.md: el PDF sigue en el bucket público aunque el
-- certificado pase a `rejected`. Es el mismo asunto de los archivos huérfanos ya
-- conocido, y limpiarlo es otra tarea.

create or replace function public.revoke_certificate_on_attendance_revert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if old.completed_at is not null and new.completed_at is null then
    delete from certificates
     where enrollment_id = new.id
       and status <> 'approved';

    update certificates
       set status      = 'rejected',
           admin_notes = coalesce(admin_notes || ' · ', '')
                         || 'Se retiró la asistencia registrada para este evento.',
           approved_at = now()
     where enrollment_id = new.id
       and status = 'approved';
  end if;
  return new;
end;
$function$;

-- Igual que el resto de funciones de trigger: fuera de la superficie RPC.
revoke all on function public.revoke_certificate_on_attendance_revert() from anon, authenticated;

drop trigger if exists trg_revoke_certificate_on_attendance_revert on public.enrollments;

create trigger trg_revoke_certificate_on_attendance_revert
after update of completed_at on public.enrollments
for each row
execute function public.revoke_certificate_on_attendance_revert();
