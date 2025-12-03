-- AlterTable
ALTER TABLE "orders"
ADD COLUMN     "commission_rate" DOUBLE PRECISION,
ADD COLUMN     "commission_amount" DOUBLE PRECISION,
ADD COLUMN     "vendor_amount" DOUBLE PRECISION,
ADD COLUMN     "commission_applied_at" TIMESTAMP(3);