-- Payment details the student needs in order to actually pay. Kept in
-- platform_settings so an admin can change an account number without a deploy.
--
-- Seeded empty on purpose: the real SINPE number and bank account are not
-- known here, and a placeholder that looks like an account number is worse
-- than a blank the UI can detect and degrade around. payment_note ships with
-- editable default copy because it is prose, not an identifier.
insert into public.platform_settings (key, value) values
  ('payment_instructions', ''),
  ('sinpe_number',         ''),
  ('bank_account',         ''),
  ('payment_note',         'Una vez recibido el comprobante, verificamos el pago y activamos tu acceso en un plazo de 1 a 2 días hábiles.')
on conflict (key) do nothing;

-- The public allowlist policy ("Configuración pública visible") deliberately
-- stays as it is: account numbers should not be scrapeable by anonymous
-- visitors. Only signed-in users can reach these — and requesting an
-- enrollment already requires signing in.
create policy "Datos de pago visibles a usuarios autenticados"
on public.platform_settings
for select
to authenticated
using (
  key = any (array[
    'payment_instructions',
    'sinpe_number',
    'bank_account',
    'payment_note'
  ])
);

-- Set the default for new orders. Existing rows keep whatever they had.
alter table public.orders alter column payment_provider set default 'manual';
