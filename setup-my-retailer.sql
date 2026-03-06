-- ✅ Configuration du compte retailer avec vos credentials
-- Numéro : 221775588834
-- PIN : 6667

-- ============================================
-- CONFIGURATION AUTOMATIQUE
-- ============================================

-- Ajouter votre numéro de téléphone retailer
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{retailerMsisdn}',
  '"221775588834"'
)
WHERE provider = 'ORANGE_MONEY';

-- Ajouter votre PIN pour le mode LIVE
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{liveRetailerPin}',
  '"6667"'
)
WHERE provider = 'ORANGE_MONEY';

-- Ajouter aussi pour le mode TEST (au cas où)
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{testRetailerPin}',
  '"6667"'
)
WHERE provider = 'ORANGE_MONEY';

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT
  provider,
  "activeMode" as mode,
  "isActive" as actif,
  metadata->>'retailerMsisdn' as numero_retailer,
  metadata->>'liveRetailerPin' as pin_live,
  metadata->>'testRetailerPin' as pin_test
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- Résultat attendu :
-- provider     | mode | actif | numero_retailer | pin_live | pin_test
-- -------------+------+-------+-----------------+----------+----------
-- ORANGE_MONEY | live | t     | 221775588834    | 6667     | 6667

-- ============================================
-- VOIR LE METADATA COMPLET
-- ============================================

SELECT jsonb_pretty(metadata) as configuration_complete
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';
