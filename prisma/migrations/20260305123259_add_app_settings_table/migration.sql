-- CreateTable
CREATE TABLE "app_settings" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT,
    "dataType" VARCHAR(20) NOT NULL DEFAULT 'string',
    "category" VARCHAR(50),
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- CreateIndex
CREATE INDEX "app_settings_key_idx" ON "app_settings"("key");

-- CreateIndex
CREATE INDEX "app_settings_category_idx" ON "app_settings"("category");

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default values
INSERT INTO "app_settings" ("key", "value", "dataType", "category") VALUES
('appName', 'PrintAlma', 'string', 'company'),
('contactEmail', 'contact@printalma.com', 'string', 'company'),
('supportEmail', 'support@printalma.com', 'string', 'company'),
('contactPhone', '+221 77 123 45 67', 'string', 'company'),
('companyAddress', 'Dakar, Sénégal', 'string', 'company'),
('websiteUrl', 'https://printalma.com', 'string', 'company'),
('vendorRegistrationEnabled', 'true', 'boolean', 'vendors'),
('emailNotificationsEnabled', 'true', 'boolean', 'email'),
('defaultVendorCommission', '15', 'number', 'vendors'),
('minWithdrawalAmount', '5000', 'number', 'vendors'),
('currency', 'XOF', 'string', 'general'),
('maintenanceMode', 'false', 'boolean', 'maintenance'),
('maintenanceMessage', 'Le site est en maintenance. Nous revenons bientôt.', 'string', 'maintenance');
