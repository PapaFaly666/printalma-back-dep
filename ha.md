src/auth/auth.service.ts:1145:9 - error TS2739: Type '{ id: number; firstName: string; lastName: string; email: string; last_login_at: Date; created_at: Date; vendeur_type: VendeurType; phone: string; country: string; address: string; shop_name: string; profile_photo_url: string; }' is missing the following properties from type 'ExtendedVendorProfileResponseDto': status, must_change_password, updated_at
1145         return vendor;
             ~~~~~~
src/auth/auth.service.ts:1444:17 - error TS2367: This comparison appears to be unintentional because the types '"VENDEUR"' and '"SUPERADMIN"' have no overlap.
1444             if (existingVendor.role === Role.SUPERADMIN) {
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
src/auth/auth.service.ts:1486:97 - error TS2345: Argument of type '{ folder: string; resource_type: string; format: string; transformation: ({ width: number; height: number; crop: string; } | { quality: string; })[]; }' is not assignable to parameter of type 'string'.
1486                     const uploadResult = await this.cloudinaryService.uploadImage(profilePhoto, {
                                                                                                     ~
1487                         folder: 'profile-photos',
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ... 
1493                         ]
     ~~~~~~~~~~~~~~~~~~~~~~~~~
1494                     });
     ~~~~~~~~~~~~~~~~~~~~~
src/design/design.service.ts:1536:26 - error TS2339: Property 'category' does not exist on type 'QueryDesignsDto'.
1536     const { page, limit, category, search, sortBy, sortOrder } = queryDto;
                              ~~~~~~~~
src/design/design.service.ts:1546:9 - error TS2552: Cannot find name 'categoryId'. Did you mean 'category'?
1546     if (categoryId) {
             ~~~~~~~~~~
  src/design/design.service.ts:1536:26
    1536     const { page, limit, category, search, sortBy, sortOrder } = queryDto;
                                  ~~~~~~~~
    'category' is declared here.
src/design/design.service.ts:1547:26 - error TS2552: Cannot find name 'categoryId'. Did you mean 'category'?
1547       where.categoryId = categoryId;
                              ~~~~~~~~~~
  src/design/design.service.ts:1536:26
    1536     const { page, limit, category, search, sortBy, sortOrder } = queryDto;
                                  ~~~~~~~~
    'category' is declared here.
src/design/design.service.ts:1635:26 - error TS2339: Property 'category' does not exist on type 'QueryDesignsDto'.
1635     const { page, limit, category, search, sortBy, sortOrder } = queryDto;
                              ~~~~~~~~
src/vendor-product/vendor-publish.service.ts:1403:26 - error TS2551: Property 'category' does not exist on type '{ vendorProducts: { id: number; name: string; status: VendorProductStatus; }[]; } & { id: number; name: string; createdAt: Date; updatedAt: Date; description: string; ... 26 more ...; publishedAt: Date; }'. Did you mean 'categoryId'?
1403         category: design.category,
                              ~~~~~~~~
Found 8 error(s).
==> Build failed 😞
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys