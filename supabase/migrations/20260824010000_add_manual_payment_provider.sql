-- There is no payment gateway and none is planned: enrollment payments are
-- arranged manually (SINPE Móvil / bank transfer) and confirmed by an admin.
-- Recording those orders as 'paypal' — the column default — mislabels every
-- manual payment in the admin's order list.
--
-- Kept in its own migration because a new enum value cannot be *used* in the
-- same transaction that adds it; the ALTER TABLE ... SET DEFAULT that depends
-- on it lives in the next migration.
alter type payment_provider add value if not exists 'manual';
