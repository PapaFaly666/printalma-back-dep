-- 🔧 Configuration rapide du compte Retailer Orange Money
-- Exécutez ce script pour configurer vos credentials

-- ⚠️ IMPORTANT : Remplacez les valeurs ci-dessous par vos vrais credentials

-- 1. Vérifier la configuration actuelle
SELECT
  id,
  provider,
  "activeMode",
  metadata
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- 2. Configurer le MSISDN du retailer
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{retailerMsisdn}',
  '"221781234567"'  -- ⚠️ REMPLACER par votre numéro retailer (format: 221XXXXXXXXX)
)
WHERE provider = 'ORANGE_MONEY';

-- 3a. Configurer le PIN pour SANDBOX (PIN en clair - 4 chiffres)
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{testRetailerPin}',
  '"1234"'  -- ⚠️ REMPLACER par votre PIN de test
)
WHERE provider = 'ORANGE_MONEY';

-- 3b. Configurer le PIN pour PRODUCTION (PIN crypté avec clé publique RSA)
-- ⚠️ Pour obtenir le PIN crypté, voir CONFIGURATION_ORANGE_RETAILER.md
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{liveRetailerPin}',
  '"1234"'  -- ⚠️ REMPLACER par votre PIN crypté (ou PIN en clair pour tests)
)
WHERE provider = 'ORANGE_MONEY';

-- 4. Vérifier la configuration finale
SELECT
  provider,
  "activeMode",
  "isActive",
  metadata->>'retailerMsisdn' as retailer_msisdn,
  CASE
    WHEN metadata->>'testRetailerPin' IS NOT NULL THEN '✅ Configuré'
    ELSE '❌ Manquant'
  END as test_pin,
  CASE
    WHEN metadata->>'liveRetailerPin' IS NOT NULL THEN '✅ Configuré'
    ELSE '❌ Manquant'
  END as live_pin,
  "livePublicKey" IS NOT NULL as has_client_id,
  "livePrivateKey" IS NOT NULL as has_client_secret,
  "liveToken" IS NOT NULL as has_merchant_code
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- 5. (Optionnel) Passer en mode LIVE
-- UPDATE "PaymentConfig"
-- SET "activeMode" = 'live'
-- WHERE provider = 'ORANGE_MONEY';

-- 6. (Optionnel) Passer en mode TEST/SANDBOX
-- UPDATE "PaymentConfig"
-- SET "activeMode" = 'test'
-- WHERE provider = 'ORANGE_MONEY';
