-- Migration manuelle pour PaymentStatus enum
-- Basé sur la documentation officielle PayTech

-- Étape 1: Créer l'enum PaymentStatus
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Étape 2: Ajouter les nouvelles colonnes temporaires
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatusNew" "PaymentStatus";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentToken" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentDate" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentDetails" JSONB;

-- Étape 3: Migrer les données existantes (String -> Enum)
UPDATE "Order"
SET "paymentStatusNew" =
    CASE
        WHEN "paymentStatus" = 'PAID' THEN 'PAID'::"PaymentStatus"
        WHEN "paymentStatus" = 'PENDING' THEN 'PENDING'::"PaymentStatus"
        WHEN "paymentStatus" = 'FAILED' THEN 'FAILED'::"PaymentStatus"
        WHEN "paymentStatus" = 'REJECTED' THEN 'REJECTED'::"PaymentStatus"
        WHEN "paymentStatus" = 'CANCELLED' THEN 'CANCELLED'::"PaymentStatus"
        ELSE 'PENDING'::"PaymentStatus"  -- Valeur par défaut pour NULL ou valeurs inconnues
    END
WHERE "paymentStatus" IS NOT NULL;

-- Étape 4: Supprimer l'ancienne colonne et renommer la nouvelle
ALTER TABLE "Order" DROP COLUMN IF EXISTS "paymentStatus";
ALTER TABLE "Order" RENAME COLUMN "paymentStatusNew" TO "paymentStatus";

-- Étape 5: Créer les index
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX IF NOT EXISTS "Order_transactionId_idx" ON "Order"("transactionId");

-- Étape 6: Afficher un résumé
DO $$
DECLARE
    total_orders INTEGER;
    paid_orders INTEGER;
    pending_orders INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_orders FROM "Order";
    SELECT COUNT(*) INTO paid_orders FROM "Order" WHERE "paymentStatus" = 'PAID';
    SELECT COUNT(*) INTO pending_orders FROM "Order" WHERE "paymentStatus" = 'PENDING';

    RAISE NOTICE 'Migration terminée:';
    RAISE NOTICE '- Total commandes: %', total_orders;
    RAISE NOTICE '- Commandes PAID: %', paid_orders;
    RAISE NOTICE '- Commandes PENDING: %', pending_orders;
END $$;
