[Nest] 110652  - 09/19/2025, 4:21:41 PM     LOG [VendorWizardProductService] 🎨 Début création produit WIZARD pour vendeur 7
prisma:error 
Invalid `this.prisma.product.findUnique()` invocation in
/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/vendor-wizard-product.service.ts:51:53

  48 
  49 try {
  50   // 1. Vérifier que le mockup existe
→ 51   const baseProduct = await this.prisma.product.findUnique({
         where: {
           id: undefined,
       ?   AND?: ProductWhereInput | ProductWhereInput[],
       ?   OR?: ProductWhereInput[],
       ?   NOT?: ProductWhereInput | ProductWhereInput[],
       ?   name?: StringFilter | String,
       ?   description?: StringFilter | String,
       ?   price?: FloatFilter | Float,
       ?   stock?: IntFilter | Int,
       ?   status?: EnumPublicationStatusFilter | PublicationStatus,
       ?   createdAt?: DateTimeFilter | DateTime,
       ?   updatedAt?: DateTimeFilter | DateTime,
       ?   designsMetadata?: JsonNullableFilter,
       ?   genre?: EnumProductGenreFilter | ProductGenre,
       ?   hasCustomDesigns?: BoolFilter | Boolean,
       ?   isDelete?: BoolFilter | Boolean,
       ?   isReadyProduct?: BoolFilter | Boolean,
       ?   isValidated?: BoolFilter | Boolean,
       ?   rejectionReason?: StringNullableFilter | String | Null,
       ?   submittedForValidationAt?: DateTimeNullableFilter | DateTime | Null,
       ?   validatedAt?: DateTimeNullableFilter | DateTime | Null,
       ?   validatedBy?: IntNullableFilter | Int | Null,
       ?   suggestedPrice?: FloatNullableFilter | Float | Null,
       ?   colorVariations?: ColorVariationListRelationFilter,
       ?   orderItems?: OrderItemListRelationFilter,
       ?   validator?: UserNullableScalarRelationFilter | UserWhereInput | Null,
       ?   sizes?: ProductSizeListRelationFilter,
       ?   themeProducts?: ThemeProductListRelationFilter,
       ?   vendorProducts?: VendorProductListRelationFilter,
       ?   categories?: CategoryListRelationFilter
         }
       })

Argument `where` of type ProductWhereUniqueInput needs at least one of `id` arguments. Available options are listed in green.
[Nest] 110652  - 09/19/2025, 4:21:41 PM   ERROR [VendorWizardProductService] ❌ Erreur création produit wizard:     
Invalid `this.prisma.product.findUnique()` invocation in
/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/vendor-wizard-product.service.ts:51:53

  48 
  49 try {
  50   // 1. Vérifier que le mockup existe
→ 51   const baseProduct = await this.prisma.product.findUnique({
         where: {
           id: undefined,
       ?   AND?: ProductWhereInput | ProductWhereInput[],
       ?   OR?: ProductWhereInput[],
       ?   NOT?: ProductWhereInput | ProductWhereInput[],
       ?   name?: StringFilter | String,
       ?   description?: StringFilter | String,
       ?   price?: FloatFilter | Float,
       ?   stock?: IntFilter | Int,
       ?   status?: EnumPublicationStatusFilter | PublicationStatus,
       ?   createdAt?: DateTimeFilter | DateTime,
       ?   updatedAt?: DateTimeFilter | DateTime,
       ?   designsMetadata?: JsonNullableFilter,
       ?   genre?: EnumProductGenreFilter | ProductGenre,
       ?   hasCustomDesigns?: BoolFilter | Boolean,
       ?   isDelete?: BoolFilter | Boolean,
       ?   isReadyProduct?: BoolFilter | Boolean,
       ?   isValidated?: BoolFilter | Boolean,
       ?   rejectionReason?: StringNullableFilter | String | Null,
       ?   submittedForValidationAt?: DateTimeNullableFilter | DateTime | Null,
       ?   validatedAt?: DateTimeNullableFilter | DateTime | Null,
       ?   validatedBy?: IntNullableFilter | Int | Null,
       ?   suggestedPrice?: FloatNullableFilter | Float | Null,
       ?   colorVariations?: ColorVariationListRelationFilter,
       ?   orderItems?: OrderItemListRelationFilter,
       ?   validator?: UserNullableScalarRelationFilter | UserWhereInput | Null,
       ?   sizes?: ProductSizeListRelationFilter,
       ?   themeProducts?: ThemeProductListRelationFilter,
       ?   vendorProducts?: VendorProductListRelationFilter,
       ?   categories?: CategoryListRelationFilter
         }
       })

Argument `where` of type ProductWhereUniqueInput needs at least one of `id` arguments. Available options are listed in green.
[Nest] 110652  - 09/19/2025, 4:21:41 PM   ERROR [VendorWizardProductController] ❌ Erreur création produit wizard:  
Invalid `this.prisma.product.findUnique()` invocation in
/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/vendor-wizard-product.service.ts:51:53

  48 
  49 try {
  50   // 1. Vérifier que le mockup existe
→ 51   const baseProduct = await this.prisma.product.findUnique({
         where: {
           id: undefined,
       ?   AND?: ProductWhereInput | ProductWhereInput[],
       ?   OR?: ProductWhereInput[],
       ?   NOT?: ProductWhereInput | ProductWhereInput[],
       ?   name?: StringFilter | String,
       ?   description?: StringFilter | String,
       ?   price?: FloatFilter | Float,
       ?   stock?: IntFilter | Int,
       ?   status?: EnumPublicationStatusFilter | PublicationStatus,
       ?   createdAt?: DateTimeFilter | DateTime,
       ?   updatedAt?: DateTimeFilter | DateTime,
       ?   designsMetadata?: JsonNullableFilter,
       ?   genre?: EnumProductGenreFilter | ProductGenre,
       ?   hasCustomDesigns?: BoolFilter | Boolean,
       ?   isDelete?: BoolFilter | Boolean,
       ?   isReadyProduct?: BoolFilter | Boolean,
       ?   isValidated?: BoolFilter | Boolean,
       ?   rejectionReason?: StringNullableFilter | String | Null,
       ?   submittedForValidationAt?: DateTimeNullableFilter | DateTime | Null,
       ?   validatedAt?: DateTimeNullableFilter | DateTime | Null,
       ?   validatedBy?: IntNullableFilter | Int | Null,
       ?   suggestedPrice?: FloatNullableFilter | Float | Null,
       ?   colorVariations?: ColorVariationListRelationFilter,
       ?   orderItems?: OrderItemListRelationFilter,
       ?   validator?: UserNullableScalarRelationFilter | UserWhereInput | Null,
       ?   sizes?: ProductSizeListRelationFilter,
       ?   themeProducts?: ThemeProductListRelationFilter,
       ?   vendorProducts?: VendorProductListRelationFilter,
       ?   categories?: CategoryListRelationFilter
         }
       })

Argument `where` of type ProductWhereUniqueInput needs at least one of `id` arguments. Available options are listed in green.