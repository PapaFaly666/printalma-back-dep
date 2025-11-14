-- CreateIndex
-- Index composés pour optimiser les requêtes fréquentes sur les personnalisations

-- Index pour getUserCustomizations avec tri par date de mise à jour
CREATE INDEX IF NOT EXISTS "product_customizations_userId_status_updatedAt_idx"
ON "product_customizations"("user_id", "status", "updated_at" DESC);

-- Index pour getSessionCustomizations avec tri par date de mise à jour
CREATE INDEX IF NOT EXISTS "product_customizations_sessionId_status_updatedAt_idx"
ON "product_customizations"("session_id", "status", "updated_at" DESC);

-- Index pour getDraftCustomizationForProduct (utilisateur connecté)
CREATE INDEX IF NOT EXISTS "product_customizations_productId_userId_status_idx"
ON "product_customizations"("product_id", "user_id", "status");

-- Index pour getDraftCustomizationForProduct (guest)
CREATE INDEX IF NOT EXISTS "product_customizations_productId_sessionId_status_idx"
ON "product_customizations"("product_id", "session_id", "status");
