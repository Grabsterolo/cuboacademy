-- Las órdenes existentes decían 'paypal' solo porque era el default de la
-- columna, no porque se hubieran cobrado por PayPal: esa integración no existe
-- en el proyecto. Se pasan a 'manual', que es lo único cierto — se gestionaron
-- a mano. El medio concreto (SINPE o transferencia) no consta en ningún lado
-- para estas órdenes antiguas, así que no se inventa: a partir de ahora el
-- administrador lo registra al aprobar.
update public.orders
set payment_provider = 'manual'
where payment_provider = 'paypal';
