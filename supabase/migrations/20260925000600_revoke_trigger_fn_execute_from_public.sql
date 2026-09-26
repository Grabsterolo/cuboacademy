-- SEC-LOW-001 (continuación) — la migración ...000300 no revocaba nada.
--
-- Aquella hacía `revoke all on function ... from anon, authenticated`, y al
-- comprobar el resultado las 14 funciones seguían siendo ejecutables por anon.
--
-- El motivo: `anon` no tiene el EXECUTE concedido a su nombre, lo hereda de
-- PUBLIC. En el ACL se ve como la entrada sin beneficiario:
--
--     enforce_event_capacity → =X/postgres | postgres=X/postgres | service_role=X/postgres
--                              ^^^^^^^^^^^ esto es PUBLIC
--
-- frente a una ya endurecida, donde esa entrada no está:
--
--     enroll_on_order_complete →  postgres=X/postgres | service_role=X/postgres
--
-- Revocarle a `anon` un permiso que nunca tuvo a su nombre es una operación
-- válida que no hace nada. Hay que quitárselo a PUBLIC, que es de donde cuelga.
--
-- Se mantiene también el revoke explícito a anon y authenticated por si alguna
-- función llevara además un grant directo; quitar solo PUBLIC no lo cubriría.
--
-- No se corrige ...000300 en su sitio: ya está aplicada y registrada en esta
-- base, así que editarla no la volvería a ejecutar aquí. Esta migración la
-- completa, y en un entorno nuevo las dos se aplican en orden con el mismo
-- resultado.

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prorettype = 'pg_catalog.trigger'::regtype
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.sig);
  end loop;
end;
$$;
