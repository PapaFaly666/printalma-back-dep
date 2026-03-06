-- ✅ SOLUTION SIMPLE : Ajouter UNIQUEMENT les credentials retailer
-- Sans toucher à votre configuration Orange Money existante

-- ============================================
-- CES 2 COMMANDES RÉSOLVENT VOTRE ERREUR
-- ============================================

-- 1️⃣ Ajouter le MSISDN du compte retailer
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{retailerMsisdn}',
  '"221781234567"'  -- ⚠️ REMPLACER PAR VOTRE NUMÉRO RETAILER
)
WHERE provider = 'ORANGE_MONEY';

-- 2️⃣ Ajouter le PIN pour le mode LIVE
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{liveRetailerPin}',
  '"1234"'  -- ⚠️ REMPLACER PAR VOTRE PIN
)
WHERE provider = 'ORANGE_MONEY';

-- ============================================
-- VÉRIFICATION (optionnel)
-- ============================================

SELECT
  "activeMode",
  "isActive",
  metadata->>'retailerMsisdn' as retailer_phone,
  metadata->>'liveRetailerPin' as pin_configured
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- Résultat attendu :
-- activeMode | isActive | retailer_phone | pin_configured
-- -----------+----------+----------------+----------------
-- live       | t        | 221781234567   | 1234
