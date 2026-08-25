-- El enum solo tenía pasarelas (paypal, stripe) y ninguna está integrada, así
-- que toda orden heredaba 'paypal' por defecto y los recibos imprimían un medio
-- de pago falso. 'manual' ya se añadió al introducir el flujo de pago manual;
-- faltan los dos medios que se usan de verdad para poder registrar cuál fue.
--
-- Va en su propia migración porque un valor de enum recién añadido no puede
-- usarse en la misma transacción que lo crea.
alter type payment_provider add value if not exists 'sinpe';
alter type payment_provider add value if not exists 'transferencia';
