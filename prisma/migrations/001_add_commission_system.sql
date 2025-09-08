-- Migration: Ajout du système de commission vendeur
-- Date: 2024-09-08

-- Table principale pour les commissions vendeur
CREATE TABLE "vendor_commissions" (
    "id" SERIAL PRIMARY KEY,
    "vendor_id" INTEGER NOT NULL UNIQUE,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 40.00,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    
    -- Contraintes
    CONSTRAINT "vendor_commissions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "vendor_commissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL,
    CONSTRAINT "check_commission_rate" CHECK ("commission_rate" >= 0.00 AND "commission_rate" <= 100.00)
);

-- Table de logs d'audit pour traçabilité
CREATE TABLE "commission_audit_log" (
    "id" SERIAL PRIMARY KEY,
    "vendor_id" INTEGER NOT NULL,
    "old_rate" DECIMAL(5,2),
    "new_rate" DECIMAL(5,2) NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "changed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    "user_agent" TEXT,
    
    -- Contraintes
    CONSTRAINT "commission_audit_log_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "commission_audit_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Index pour les performances
CREATE INDEX "idx_vendor_commissions_vendor_id" ON "vendor_commissions"("vendor_id");
CREATE INDEX "idx_vendor_commissions_rate" ON "vendor_commissions"("commission_rate");
CREATE INDEX "idx_commission_audit_vendor" ON "commission_audit_log"("vendor_id");
CREATE INDEX "idx_commission_audit_admin" ON "commission_audit_log"("changed_by");
CREATE INDEX "idx_commission_audit_date" ON "commission_audit_log"("changed_at");

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_commissions_updated_at 
    BEFORE UPDATE ON "vendor_commissions" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();