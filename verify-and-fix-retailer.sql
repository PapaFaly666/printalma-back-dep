-- 🔍 DIAGNOSTIC : Vérifier la configuration actuelle Orange Money
-- Exécutez ce script ligne par ligne pour diagnostiquer et corriger

-- ============================================
-- ÉTAPE 1 : DIAGNOSTIC COMPLET
-- ============================================

-- Voir TOUTE la configuration Orange Money actuelle
SELECT
  id,
  provider,
  "isActive",
  "activeMode",
  "testPublicKey" as test_client_id,
  "testPrivateKey" as test_client_secret,
  "testToken" as test_merchant_code,
  "livePublicKey" as live_client_id,
  "livePrivateKey" as live_client_secret,
  "liveToken" as live_merchant_code,
  metadata
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- Voir spécifiquement le contenu de metadata
SELECT
  provider,
  "activeMode",
  metadata->>'retailerMsisdn' as retailer_msisdn,
  metadata->>'testRetailerPin' as test_pin,
  metadata->>'liveRetailerPin' as live_pin,
  metadata  -- Voir le JSON complet
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- ============================================
-- ÉTAPE 2 : DIAGNOSTIC DE L'ERREUR
-- ============================================

-- Cette requête montre exactement ce qui manque
SELECT
  "activeMode" as mode,
  CASE
    WHEN metadata->>'retailerMsisdn' IS NULL THEN '❌ MANQUANT (CAUSE DE L''ERREUR)'
    ELSE '✅ ' || (metadata->>'retailerMsisdn')
  END as retailer_msisdn_status,
  CASE
    WHEN "activeMode" = 'live' AND metadata->>'liveRetailerPin' IS NULL THEN '❌ MANQUANT (CAUSE DE L''ERREUR)'
    WHEN "activeMode" = 'test' AND metadata->>'testRetailerPin' IS NULL THEN '❌ MANQUANT (CAUSE DE L''ERREUR)'
    ELSE '✅ Configuré'
  END as pin_status,
  CASE
    WHEN metadata->>'retailerMsisdn' IS NOT NULL AND
         (("activeMode" = 'live' AND metadata->>'liveRetailerPin' IS NOT NULL) OR
          ("activeMode" = 'test' AND metadata->>'testRetailerPin' IS NOT NULL))
    THEN '✅ CONFIGURATION OK'
    ELSE '❌ CONFIGURATION INCOMPLETE - APPLIQUER LA FIX CI-DESSOUS'
  END as diagnostic
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- ============================================
-- ÉTAPE 3 : FIX - AJOUTER LES CREDENTIALS RETAILER
-- ============================================

-- ⚠️ IMPORTANT : Remplacez ces valeurs par VOS vrais credentials

-- 3A. Ajouter le MSISDN du retailer (si manquant)
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{retailerMsisdn}',
  '"221781234567"'  -- ⚠️ REMPLACER PAR VOTRE NUMÉRO RETAILER
)
WHERE provider = 'ORANGE_MONEY';

-- 3B. Ajouter le PIN pour le mode LIVE (si manquant)
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{liveRetailerPin}',
  '"1234"'  -- ⚠️ REMPLACER PAR VOTRE PIN (crypté en production !)
)
WHERE provider = 'ORANGE_MONEY';

-- 3C. (Optionnel) Ajouter aussi le PIN pour le mode TEST
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{testRetailerPin}',
  '"1234"'  -- ⚠️ REMPLACER PAR VOTRE PIN DE TEST
)
WHERE provider = 'ORANGE_MONEY';

-- ============================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================

-- Vérifier que tout est OK maintenant
SELECT
  'Configuration Orange Money' as check,
  "activeMode" as mode_actuel,
  CASE
    WHEN metadata->>'retailerMsisdn' IS NOT NULL THEN '✅ ' || (metadata->>'retailerMsisdn')
    ELSE '❌ TOUJOURS MANQUANT'
  END as retailer_msisdn,
  CASE
    WHEN metadata->>'liveRetailerPin' IS NOT NULL THEN '✅ Configuré'
    ELSE '❌ TOUJOURS MANQUANT'
  END as live_pin,
  CASE
    WHEN metadata->>'testRetailerPin' IS NOT NULL THEN '✅ Configuré'
    ELSE '⚠️  Non configuré (optionnel)'
  END as test_pin
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- Si vous voyez "✅" partout, la configuration est correcte !
-- Réessayez votre requête Cash In

-- ============================================
-- AIDE : Voir le metadata complet formaté
-- ============================================

SELECT jsonb_pretty(metadata) as metadata_formaté
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- Le résultat devrait ressembler à :
-- {
--   "retailerMsisdn": "221781234567",
--   "testRetailerPin": "1234",
--   "liveRetailerPin": "1234"
-- }
