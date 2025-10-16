-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'PENDING');

-- CreateEnum
CREATE TYPE "VendorProductStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProductGenre" AS ENUM ('HOMME', 'FEMME', 'BEBE', 'UNISEXE');

-- CreateEnum
CREATE TYPE "PostValidationAction" AS ENUM ('AUTO_PUBLISH', 'TO_DRAFT');

-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM', 'DETAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'VENDEUR');

-- CreateEnum
CREATE TYPE "SizeType" AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_NEW', 'ORDER_UPDATED', 'SYSTEM', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "CoordinateType" AS ENUM ('PERCENTAGE', 'ABSOLUTE');

-- CreateEnum
CREATE TYPE "ThemeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "FundsRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role",
    "role_id" INTEGER,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "user_status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "photo_profil" TEXT,
    "avatar" TEXT,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "vendor_type_id" INTEGER,
    "address" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "profile_photo_url" TEXT,
    "shop_name" TEXT,
    "activation_code" TEXT,
    "activation_code_expires" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "designsMetadata" JSONB DEFAULT '{"lastUpdated": null, "totalDesigns": 0}',
    "genre" "ProductGenre" NOT NULL DEFAULT 'UNISEXE',
    "hasCustomDesigns" BOOLEAN NOT NULL DEFAULT false,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "isReadyProduct" BOOLEAN NOT NULL DEFAULT false,
    "isValidated" BOOLEAN NOT NULL DEFAULT true,
    "rejectionReason" TEXT,
    "submittedForValidationAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "validatedBy" INTEGER,
    "suggested_price" DOUBLE PRECISION,
    "category_id" INTEGER,
    "sub_category_id" INTEGER,
    "variation_id" INTEGER,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSize" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "sizeName" TEXT NOT NULL,

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStock" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "colorId" INTEGER NOT NULL,
    "sizeName" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "color_id" INTEGER NOT NULL,
    "size_name" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "cover_image_url" TEXT,
    "cover_image_public_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sub_category_id" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorVariation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "ColorVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" SERIAL NOT NULL,
    "view" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "naturalWidth" INTEGER,
    "naturalHeight" INTEGER,
    "designUrl" TEXT,
    "designPublicId" TEXT,
    "designFileName" TEXT,
    "designUploadDate" TIMESTAMP(3),
    "designSize" INTEGER,
    "designOriginalName" TEXT,
    "designDescription" TEXT,
    "isDesignActive" BOOLEAN NOT NULL DEFAULT true,
    "colorVariationId" INTEGER NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delimitation" (
    "id" SERIAL NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "name" TEXT,
    "coordinateType" "CoordinateType" NOT NULL DEFAULT 'ABSOLUTE',
    "absoluteX" DOUBLE PRECISION,
    "absoluteY" DOUBLE PRECISION,
    "absoluteWidth" DOUBLE PRECISION,
    "absoluteHeight" DOUBLE PRECISION,
    "originalImageWidth" INTEGER,
    "originalImageHeight" INTEGER,
    "productImageId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceWidth" INTEGER NOT NULL DEFAULT 0,
    "referenceHeight" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Delimitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" INTEGER,
    "shippingName" TEXT,
    "shippingStreet" TEXT,
    "shippingCity" TEXT,
    "shippingRegion" TEXT,
    "shippingPostalCode" TEXT,
    "shippingCountry" TEXT,
    "shippingAddressFull" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "shippedAt" TIMESTAMP(3),
    "shippingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "colorId" INTEGER,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "coverImagePublicId" TEXT,
    "coverImageUrl" TEXT,

    CONSTRAINT "DesignCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "cloudinaryPublicId" TEXT NOT NULL,
    "thumbnailPublicId" TEXT,
    "fileSize" INTEGER NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "format" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentHash" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isPending" BOOLEAN NOT NULL DEFAULT false,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" INTEGER,
    "rejectionReason" TEXT,
    "submittedForValidationAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "categoryId" INTEGER,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProduct" (
    "id" SERIAL NOT NULL,
    "base_product_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "status" "VendorProductStatus" NOT NULL DEFAULT 'PENDING',
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "post_validation_action" "PostValidationAction" NOT NULL DEFAULT 'AUTO_PUBLISH',
    "admin_product_name" TEXT,
    "admin_product_description" TEXT,
    "admin_product_price" INTEGER,
    "design_base64" TEXT,
    "design_cloudinary_url" TEXT,
    "design_cloudinary_public_id" TEXT,
    "design_positioning" TEXT DEFAULT 'CENTER',
    "design_scale" DOUBLE PRECISION DEFAULT 0.6,
    "design_application_mode" TEXT DEFAULT 'PRESERVED',
    "design_id" INTEGER,
    "sales_count" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION,
    "last_sale_date" TIMESTAMP(3),
    "is_best_seller" BOOLEAN NOT NULL DEFAULT false,
    "best_seller_rank" INTEGER,
    "best_seller_category" TEXT,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "design_width" INTEGER,
    "design_height" INTEGER,
    "design_format" TEXT,
    "design_file_size" INTEGER,
    "sizes" JSONB NOT NULL,
    "colors" JSONB NOT NULL,
    "vendorName" TEXT,
    "vendorDescription" TEXT,
    "vendorStock" INTEGER NOT NULL DEFAULT 0,
    "basePriceAdmin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" INTEGER,
    "rejectionReason" TEXT,
    "submittedForValidationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "admin_validated" BOOLEAN,
    "vendor_selected_theme_id" INTEGER,
    "vendor_selected_theme_name" TEXT,

    CONSTRAINT "VendorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProductImage" (
    "id" SERIAL NOT NULL,
    "vendorProductId" INTEGER NOT NULL,
    "colorId" INTEGER,
    "colorName" TEXT,
    "colorCode" TEXT,
    "imageType" TEXT NOT NULL DEFAULT 'color',
    "cloudinaryUrl" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "originalImageKey" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "format" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDesignTransform" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "vendorProductId" INTEGER NOT NULL,
    "designUrl" VARCHAR(500) NOT NULL,
    "transforms" JSONB NOT NULL,
    "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDesignTransform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignProductLink" (
    "id" SERIAL NOT NULL,
    "design_id" INTEGER NOT NULL,
    "vendor_product_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignProductLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDesignPosition" (
    "vendor_product_id" INTEGER NOT NULL,
    "design_id" INTEGER NOT NULL,
    "position" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDesignPosition_pkey" PRIMARY KEY ("vendor_product_id","design_id")
);

-- CreateTable
CREATE TABLE "EmailChangeRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "newEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "EmailChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "coverImagePublicId" TEXT,
    "category" TEXT NOT NULL,
    "status" "ThemeStatus" NOT NULL DEFAULT 'ACTIVE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeProduct" (
    "id" SERIAL NOT NULL,
    "themeId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThemeProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_commissions" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 40.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,

    CONSTRAINT "vendor_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_audit_log" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "old_rate" DOUBLE PRECISION,
    "new_rate" DOUBLE PRECISION NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "commission_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_funds_requests" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "requested_amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "payment_method" "PaymentMethodType" NOT NULL,
    "phone_number" VARCHAR(20),
    "status" "FundsRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reject_reason" TEXT,
    "admin_note" TEXT,
    "processed_by" INTEGER,
    "processed_at" TIMESTAMP(3),
    "available_balance" DOUBLE PRECISION NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "bank_iban" VARCHAR(64),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated_at" TIMESTAMP(3),

    CONSTRAINT "vendor_funds_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_funds_request_orders" (
    "id" SERIAL NOT NULL,
    "funds_request_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_funds_request_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_earnings" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "total_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pending_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "this_month_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_month_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_commission_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_types" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToProduct" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_shop_name_key" ON "User"("shop_name");

-- CreateIndex
CREATE INDEX "User_country_idx" ON "User"("country");

-- CreateIndex
CREATE INDEX "User_shop_name_idx" ON "User"("shop_name");

-- CreateIndex
CREATE INDEX "User_vendor_type_id_idx" ON "User"("vendor_type_id");

-- CreateIndex
CREATE INDEX "User_is_deleted_idx" ON "User"("is_deleted");

-- CreateIndex
CREATE INDEX "User_deleted_at_idx" ON "User"("deleted_at");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_id_idx" ON "User"("role_id");

-- CreateIndex
CREATE INDEX "User_user_status_idx" ON "User"("user_status");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "Product_isValidated_idx" ON "Product"("isValidated");

-- CreateIndex
CREATE INDEX "Product_submittedForValidationAt_idx" ON "Product"("submittedForValidationAt");

-- CreateIndex
CREATE INDEX "Product_isReadyProduct_idx" ON "Product"("isReadyProduct");

-- CreateIndex
CREATE INDEX "Product_category_id_idx" ON "Product"("category_id");

-- CreateIndex
CREATE INDEX "Product_sub_category_id_idx" ON "Product"("sub_category_id");

-- CreateIndex
CREATE INDEX "Product_variation_id_idx" ON "Product"("variation_id");

-- CreateIndex
CREATE INDEX "ProductSize_productId_idx" ON "ProductSize"("productId");

-- CreateIndex
CREATE INDEX "ProductStock_productId_idx" ON "ProductStock"("productId");

-- CreateIndex
CREATE INDEX "ProductStock_colorId_idx" ON "ProductStock"("colorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStock_productId_colorId_sizeName_key" ON "ProductStock"("productId", "colorId", "sizeName");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

-- CreateIndex
CREATE INDEX "categories_display_order_idx" ON "categories"("display_order");

-- CreateIndex
CREATE INDEX "sub_categories_category_id_idx" ON "sub_categories"("category_id");

-- CreateIndex
CREATE INDEX "sub_categories_is_active_idx" ON "sub_categories"("is_active");

-- CreateIndex
CREATE INDEX "sub_categories_display_order_idx" ON "sub_categories"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_name_category_id_key" ON "sub_categories"("name", "category_id");

-- CreateIndex
CREATE INDEX "variations_sub_category_id_idx" ON "variations"("sub_category_id");

-- CreateIndex
CREATE INDEX "variations_is_active_idx" ON "variations"("is_active");

-- CreateIndex
CREATE INDEX "variations_display_order_idx" ON "variations"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "variations_name_sub_category_id_key" ON "variations"("name", "sub_category_id");

-- CreateIndex
CREATE INDEX "ProductImage_colorVariationId_idx" ON "ProductImage"("colorVariationId");

-- CreateIndex
CREATE INDEX "ProductImage_designUrl_idx" ON "ProductImage"("designUrl");

-- CreateIndex
CREATE INDEX "ProductImage_isDesignActive_idx" ON "ProductImage"("isDesignActive");

-- CreateIndex
CREATE INDEX "Delimitation_productImageId_idx" ON "Delimitation"("productImageId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_colorId_idx" ON "OrderItem"("colorId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DesignCategory_name_key" ON "DesignCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DesignCategory_slug_key" ON "DesignCategory"("slug");

-- CreateIndex
CREATE INDEX "DesignCategory_isActive_idx" ON "DesignCategory"("isActive");

-- CreateIndex
CREATE INDEX "DesignCategory_sortOrder_idx" ON "DesignCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "DesignCategory_slug_idx" ON "DesignCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Design_contentHash_key" ON "Design"("contentHash");

-- CreateIndex
CREATE INDEX "Design_vendorId_idx" ON "Design"("vendorId");

-- CreateIndex
CREATE INDEX "Design_categoryId_idx" ON "Design"("categoryId");

-- CreateIndex
CREATE INDEX "Design_isPublished_idx" ON "Design"("isPublished");

-- CreateIndex
CREATE INDEX "Design_isPending_idx" ON "Design"("isPending");

-- CreateIndex
CREATE INDEX "Design_isValidated_idx" ON "Design"("isValidated");

-- CreateIndex
CREATE INDEX "Design_submittedForValidationAt_idx" ON "Design"("submittedForValidationAt");

-- CreateIndex
CREATE INDEX "Design_createdAt_idx" ON "Design"("createdAt");

-- CreateIndex
CREATE INDEX "Design_contentHash_idx" ON "Design"("contentHash");

-- CreateIndex
CREATE INDEX "VendorProduct_vendor_id_idx" ON "VendorProduct"("vendor_id");

-- CreateIndex
CREATE INDEX "VendorProduct_base_product_id_idx" ON "VendorProduct"("base_product_id");

-- CreateIndex
CREATE INDEX "VendorProduct_design_id_idx" ON "VendorProduct"("design_id");

-- CreateIndex
CREATE INDEX "VendorProduct_isValidated_idx" ON "VendorProduct"("isValidated");

-- CreateIndex
CREATE INDEX "VendorProduct_submittedForValidationAt_idx" ON "VendorProduct"("submittedForValidationAt");

-- CreateIndex
CREATE INDEX "VendorProduct_post_validation_action_idx" ON "VendorProduct"("post_validation_action");

-- CreateIndex
CREATE INDEX "VendorProduct_is_best_seller_idx" ON "VendorProduct"("is_best_seller");

-- CreateIndex
CREATE INDEX "VendorProduct_best_seller_rank_idx" ON "VendorProduct"("best_seller_rank");

-- CreateIndex
CREATE INDEX "VendorProduct_sales_count_idx" ON "VendorProduct"("sales_count");

-- CreateIndex
CREATE INDEX "VendorProduct_total_revenue_idx" ON "VendorProduct"("total_revenue");

-- CreateIndex
CREATE INDEX "VendorProduct_last_sale_date_idx" ON "VendorProduct"("last_sale_date");

-- CreateIndex
CREATE INDEX "VendorProductImage_vendorProductId_idx" ON "VendorProductImage"("vendorProductId");

-- CreateIndex
CREATE INDEX "VendorProductImage_colorId_idx" ON "VendorProductImage"("colorId");

-- CreateIndex
CREATE INDEX "VendorProductImage_imageType_idx" ON "VendorProductImage"("imageType");

-- CreateIndex
CREATE INDEX "idx_vendor_product" ON "VendorDesignTransform"("vendorId", "vendorProductId");

-- CreateIndex
CREATE INDEX "idx_design_url" ON "VendorDesignTransform"("designUrl");

-- CreateIndex
CREATE UNIQUE INDEX "VendorDesignTransform_vendorId_vendorProductId_designUrl_key" ON "VendorDesignTransform"("vendorId", "vendorProductId", "designUrl");

-- CreateIndex
CREATE INDEX "idx_design_links" ON "DesignProductLink"("design_id");

-- CreateIndex
CREATE INDEX "idx_product_links" ON "DesignProductLink"("vendor_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "DesignProductLink_design_id_vendor_product_id_key" ON "DesignProductLink"("design_id", "vendor_product_id");

-- CreateIndex
CREATE INDEX "ProductDesignPosition_vendor_product_id_idx" ON "ProductDesignPosition"("vendor_product_id");

-- CreateIndex
CREATE INDEX "ProductDesignPosition_design_id_idx" ON "ProductDesignPosition"("design_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailChangeRequest_token_key" ON "EmailChangeRequest"("token");

-- CreateIndex
CREATE INDEX "EmailChangeRequest_token_idx" ON "EmailChangeRequest"("token");

-- CreateIndex
CREATE INDEX "EmailChangeRequest_userId_idx" ON "EmailChangeRequest"("userId");

-- CreateIndex
CREATE INDEX "Theme_status_idx" ON "Theme"("status");

-- CreateIndex
CREATE INDEX "Theme_category_idx" ON "Theme"("category");

-- CreateIndex
CREATE INDEX "Theme_featured_idx" ON "Theme"("featured");

-- CreateIndex
CREATE INDEX "ThemeProduct_themeId_idx" ON "ThemeProduct"("themeId");

-- CreateIndex
CREATE INDEX "ThemeProduct_productId_idx" ON "ThemeProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeProduct_themeId_productId_key" ON "ThemeProduct"("themeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_commissions_vendor_id_key" ON "vendor_commissions"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_commissions_vendor_id_idx" ON "vendor_commissions"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_commissions_commission_rate_idx" ON "vendor_commissions"("commission_rate");

-- CreateIndex
CREATE INDEX "commission_audit_log_vendor_id_idx" ON "commission_audit_log"("vendor_id");

-- CreateIndex
CREATE INDEX "commission_audit_log_changed_by_idx" ON "commission_audit_log"("changed_by");

-- CreateIndex
CREATE INDEX "commission_audit_log_changed_at_idx" ON "commission_audit_log"("changed_at");

-- CreateIndex
CREATE INDEX "idx_vendor_status" ON "vendor_funds_requests"("vendor_id", "status");

-- CreateIndex
CREATE INDEX "idx_status_date" ON "vendor_funds_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_processed_date" ON "vendor_funds_requests"("processed_at");

-- CreateIndex
CREATE INDEX "idx_funds_request" ON "vendor_funds_request_orders"("funds_request_id");

-- CreateIndex
CREATE INDEX "idx_order" ON "vendor_funds_request_orders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_funds_request_orders_funds_request_id_order_id_key" ON "vendor_funds_request_orders"("funds_request_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_earnings_vendor_id_key" ON "vendor_earnings"("vendor_id");

-- CreateIndex
CREATE INDEX "idx_vendor" ON "vendor_earnings"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_types_label_key" ON "vendor_types"("label");

-- CreateIndex
CREATE UNIQUE INDEX "custom_roles_slug_key" ON "custom_roles"("slug");

-- CreateIndex
CREATE INDEX "custom_roles_slug_idx" ON "custom_roles"("slug");

-- CreateIndex
CREATE INDEX "custom_roles_is_system_idx" ON "custom_roles"("is_system");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permissions_key_idx" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "_CategoryToProduct_B_index" ON "_CategoryToProduct"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "custom_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_vendor_type_id_fkey" FOREIGN KEY ("vendor_type_id") REFERENCES "vendor_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_variation_id_fkey" FOREIGN KEY ("variation_id") REFERENCES "variations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "ColorVariation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variations" ADD CONSTRAINT "variations_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorVariation" ADD CONSTRAINT "ColorVariation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_colorVariationId_fkey" FOREIGN KEY ("colorVariationId") REFERENCES "ColorVariation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delimitation" ADD CONSTRAINT "Delimitation_productImageId_fkey" FOREIGN KEY ("productImageId") REFERENCES "ProductImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "ColorVariation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignCategory" ADD CONSTRAINT "DesignCategory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DesignCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_base_product_id_fkey" FOREIGN KEY ("base_product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProductImage" ADD CONSTRAINT "VendorProductImage_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "ColorVariation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProductImage" ADD CONSTRAINT "VendorProductImage_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDesignTransform" ADD CONSTRAINT "VendorDesignTransform_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDesignTransform" ADD CONSTRAINT "VendorDesignTransform_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProductLink" ADD CONSTRAINT "DesignProductLink_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProductLink" ADD CONSTRAINT "DesignProductLink_vendor_product_id_fkey" FOREIGN KEY ("vendor_product_id") REFERENCES "VendorProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDesignPosition" ADD CONSTRAINT "ProductDesignPosition_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDesignPosition" ADD CONSTRAINT "ProductDesignPosition_vendor_product_id_fkey" FOREIGN KEY ("vendor_product_id") REFERENCES "VendorProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailChangeRequest" ADD CONSTRAINT "EmailChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeProduct" ADD CONSTRAINT "ThemeProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeProduct" ADD CONSTRAINT "ThemeProduct_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_commissions" ADD CONSTRAINT "vendor_commissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_commissions" ADD CONSTRAINT "vendor_commissions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_audit_log" ADD CONSTRAINT "audit_log_changer_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_audit_log" ADD CONSTRAINT "audit_log_vendor_commission_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor_commissions"("vendor_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_audit_log" ADD CONSTRAINT "audit_log_vendor_user_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_funds_requests" ADD CONSTRAINT "vendor_funds_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_funds_requests" ADD CONSTRAINT "vendor_funds_requests_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_funds_request_orders" ADD CONSTRAINT "vendor_funds_request_orders_funds_request_id_fkey" FOREIGN KEY ("funds_request_id") REFERENCES "vendor_funds_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_funds_request_orders" ADD CONSTRAINT "vendor_funds_request_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_earnings" ADD CONSTRAINT "vendor_earnings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "custom_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
