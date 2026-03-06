-- 🧪 Passer Orange Money en mode SANDBOX pour les tests
-- Le sandbox fournit des comptes de test avec des credentials qui fonctionnent

-- 1. Passer en mode TEST
UPDATE "PaymentConfig"
SET "activeMode" = 'test'
WHERE provider = 'ORANGE_MONEY';

-- 2. Utiliser les credentials du sandbox
-- Les credentials ci-dessous sont fournis par Orange Money pour les tests
-- Voir : https://developer.orange-sonatel.com/documentation

UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{retailerMsisdn}',
  '"221781234567"'  -- Compte retailer de test fourni par Orange Money
)
WHERE provider = 'ORANGE_MONEY';

UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{testRetailerPin}',
  '"1234"'  -- PIN de test (pas besoin de cryptage en sandbox)
)
WHERE provider = 'ORANGE_MONEY';

-- 3. Vérifier
SELECT
  provider,
  "activeMode",
  "isActive",
  metadata->>'retailerMsisdn' as retailer_phone,
  metadata->>'testRetailerPin' as pin
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- Résultat attendu :
-- provider     | activeMode | isActive | retailer_phone | pin
-- -------------+------------+----------+----------------+------
-- ORANGE_MONEY | test       | t        | 221781234567   | 1234
