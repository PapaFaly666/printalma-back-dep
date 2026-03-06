-- Migration SQL pour ajouter la table login_otps
-- À exécuter manuellement sur la base de données

CREATE TABLE IF NOT EXISTS "login_otps" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "login_otps_pkey" PRIMARY KEY ("id")
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "login_otps_user_id_idx" ON "login_otps"("user_id");
CREATE INDEX IF NOT EXISTS "login_otps_code_idx" ON "login_otps"("code");
CREATE INDEX IF NOT EXISTS "login_otps_expires_at_idx" ON "login_otps"("expires_at");
CREATE INDEX IF NOT EXISTS "login_otps_verified_idx" ON "login_otps"("verified");

-- Clé étrangère vers la table User (Prisma utilise le nom du modèle)
ALTER TABLE "login_otps" ADD CONSTRAINT "login_otps_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Commentaire
COMMENT ON TABLE "login_otps" IS 'OTP pour authentification à deux facteurs (2FA) - Code envoyé par email lors du login';
