[00:06:00] Starting compilation in watch mode...

src/category/category.service.ts:16:36 - error TS2339: Property 'parentId' does not exist on type 'CreateCategoryDto'.

16         const { name, description, parentId, level, order } = createCategoryDto;
                                      ~~~~~~~~

src/category/category.service.ts:16:46 - error TS2339: Property 'level' does not exist on type 'CreateCategoryDto'.

16         const { name, description, parentId, level, order } = createCategoryDto;
                                                ~~~~~

src/category/category.service.ts:16:53 - error TS2339: Property 'order' does not exist on type 'CreateCategoryDto'.

16         const { name, description, parentId, level, order } = createCategoryDto;
                                                       ~~~~~

src/category/category.service.ts:22:17 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

22                 parentId: parentId || null
                   ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14218:5
    14218     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:40:27 - error TS2353: Object literal may only specify known properties, and 'level' does not exist in type 'CategorySelect<DefaultArgs>'.

40                 select: { level: true }
                             ~~~~~

  node_modules/.prisma/client/index.d.ts:14162:5
    14162     select?: CategorySelect<ExtArgs> | null
              ~~~~~~
    The expected type comes from property 'select' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; where: CategoryWhereUniqueInput; }'

src/category/category.service.ts:47:38 - error TS2339: Property 'level' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

47             calculatedLevel = parent.level + 1;
                                        ~~~~~

src/category/category.service.ts:55:17 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type '(Without<CategoryCreateInput, CategoryUncheckedCreateInput> & CategoryUncheckedCreateInput) | (Without<...> & CategoryCreateInput)'.

55                 parentId: parentId || null,
                   ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14369:5
    14369     data: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
              ~~~~
    The expected type comes from property 'data' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; data: (Without<...> & CategoryUncheckedCreateInput) | (Without<...> & CategoryCreateInput); }'

src/category/category.service.ts:60:17 - error TS2353: Object literal may only specify known properties, and 'parent' does not exist in type 'CategoryInclude<DefaultArgs>'.

60                 parent: true,
                   ~~~~~~

  node_modules/.prisma/client/index.d.ts:14365:5
    14365     include?: CategoryInclude<ExtArgs> | null
              ~~~~~~~
    The expected type comes from property 'include' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; data: (Without<...> & CategoryUncheckedCreateInput) | (Without<...> & CategoryCreateInput); }'

src/category/category.service.ts:78:19 - error TS2353: Object literal may only specify known properties, and 'level' does not exist in type 'CategoryOrderByWithRelationInput'.

78                 { level: 'asc' },
                     ~~~~~

src/category/category.service.ts:79:19 - error TS2353: Object literal may only specify known properties, and 'order' does not exist in type 'CategoryOrderByWithRelationInput'.

79                 { order: 'asc' },
                     ~~~~~

src/category/category.service.ts:83:17 - error TS2353: Object literal may only specify known properties, and 'parent' does not exist in type 'CategoryInclude<DefaultArgs>'.

83                 parent: true,
                   ~~~~~~

  node_modules/.prisma/client/index.d.ts:14318:5
    14318     include?: CategoryInclude<ExtArgs> | null
              ~~~~~~~
    The expected type comes from property 'include' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:109:35 - error TS2339: Property '_count' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

109                 productCount: cat._count?.products || 0
                                      ~~~~~~

src/category/category.service.ts:115:21 - error TS2339: Property 'parentId' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

115             if (cat.parentId && categoriesMap[cat.parentId]) {
                        ~~~~~~~~

src/category/category.service.ts:115:51 - error TS2339: Property 'parentId' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

115             if (cat.parentId && categoriesMap[cat.parentId]) {
                                                      ~~~~~~~~

src/category/category.service.ts:116:35 - error TS2339: Property 'parentId' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

116                 categoriesMap[cat.parentId].subcategories.push(categoriesMap[cat.id]);
                                      ~~~~~~~~

src/category/category.service.ts:117:29 - error TS2339: Property 'parentId' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

117             } else if (!cat.parentId) {
                                ~~~~~~~~

src/category/category.service.ts:129:17 - error TS2353: Object literal may only specify known properties, and 'parent' does not exist in type 'CategoryInclude<DefaultArgs>'.

129                 parent: true,
                    ~~~~~~

  node_modules/.prisma/client/index.d.ts:14170:5
    14170     include?: CategoryInclude<ExtArgs> | null
              ~~~~~~~
    The expected type comes from property 'include' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; where: CategoryWhereUniqueInput; }'

src/category/category.service.ts:147:36 - error TS2339: Property '_count' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

147             productCount: category._count.products
                                       ~~~~~~

src/category/category.service.ts:160:21 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

160                     parentId: category.parentId || null,
                        ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14218:5
    14218     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:160:40 - error TS2339: Property 'parentId' does not exist on type '{ productCount: any; id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

160                     parentId: category.parentId || null,
                                           ~~~~~~~~

src/category/category.service.ts:169:107 - error TS2339: Property 'parentId' does not exist on type '{ productCount: any; id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

169                     message: `Une catégorie avec le nom "${updateCategoryDto.name}" existe déjà${category.parentId ? ' dans cette catégorie parent' : ''}`,
                                                                                                              ~~~~~~~~

src/category/category.service.ts:183:17 - error TS2353: Object literal may only specify known properties, and 'parent' does not exist in type 'CategoryInclude<DefaultArgs>'.

183                 parent: true,
                    ~~~~~~

  node_modules/.prisma/client/index.d.ts:14417:5
    14417     include?: CategoryInclude<ExtArgs> | null
              ~~~~~~~
    The expected type comes from property 'include' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; data: (Without<...> & CategoryUncheckedUpdateInput) | (Without<...> & CategoryUpdateInput); where: CategoryWhereUniqueInput; }'

src/category/category.service.ts:196:21 - error TS2561: Object literal may only specify known properties, but 'categories' does not exist in type 'ProductWhereInput'. Did you mean to write 'categoryId'?

196                     categories: {
                        ~~~~~~~~~~

  node_modules/.prisma/client/index.d.ts:9522:5
    9522     where?: ProductWhereInput
             ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: ProductSelect<DefaultArgs>; omit?: ProductOmit<DefaultArgs>; include?: ProductInclude<DefaultArgs>; ... 5 more ...; distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]; }'

src/category/category.service.ts:211:74 - error TS2339: Property '_count' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

211             message: `Catégorie mise à jour avec succès${updatedCategory._count.products > 0 ? ` (${updatedCategory._count.products} produit(s) synchronisé(s))` : ''}`,
                                                                             ~~~~~~

src/category/category.service.ts:211:117 - error TS2339: Property '_count' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

211             message: `Catégorie mise à jour avec succès${updatedCategory._count.products > 0 ? ` (${updatedCategory._count.products} produit(s) synchronisé(s))` : ''}`,
                                                                                                                        ~~~~~~

src/category/category.service.ts:214:47 - error TS2339: Property '_count' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

214                 productCount: updatedCategory._count.products
                                                  ~~~~~~

src/category/category.service.ts:233:17 - error TS2561: Object literal may only specify known properties, but 'categories' does not exist in type 'ProductWhereInput'. Did you mean to write 'categoryId'?

233                 categories: {
                    ~~~~~~~~~~

  node_modules/.prisma/client/index.d.ts:9522:5
    9522     where?: ProductWhereInput
             ~~~~~
    The expected type comes from property 'where' which is declared here on type 'Subset<ProductCountArgs<DefaultArgs>, ProductCountArgs<DefaultArgs>>'

src/category/category.service.ts:266:22 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

266             where: { parentId },
                         ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14322:5
    14322     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:292:22 - error TS2561: Object literal may only specify known properties, but 'categories' does not exist in type 'ProductWhereInput'. Did you mean to write 'categoryId'?

292             where: { categories: { some: { id } } }
                         ~~~~~~~~~~

  node_modules/.prisma/client/index.d.ts:9522:5
    9522     where?: ProductWhereInput
             ~~~~~
    The expected type comes from property 'where' which is declared here on type 'Subset<ProductCountArgs<DefaultArgs>, ProductCountArgs<DefaultArgs>>'

src/category/category.service.ts:297:22 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

297             where: { parentId: id },
                         ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14322:5
    14322     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:303:22 - error TS2561: Object literal may only specify known properties, but 'categories' does not exist in type 'ProductWhereInput'. Did you mean to write 'categoryId'?

303             where: { categories: { some: { id: { in: subcategoryIds } } } }
                         ~~~~~~~~~~

  node_modules/.prisma/client/index.d.ts:9522:5
    9522     where?: ProductWhereInput
             ~~~~~
    The expected type comes from property 'where' which is declared here on type 'Subset<ProductCountArgs<DefaultArgs>, ProductCountArgs<DefaultArgs>>'

src/category/category.service.ts:310:26 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

310                 where: { parentId: { in: subcategoryIds } }
                             ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14322:5
    14322     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type 'Subset<CategoryCountArgs<DefaultArgs>, CategoryCountArgs<DefaultArgs>>'

src/category/category.service.ts:361:83 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

361             const directChildren = await this.prisma.category.findMany({ where: { parentId: id }, select: { id: true } });
                                                                                      ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14322:5
    14322     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:373:22 - error TS2561: Object literal may only specify known properties, but 'categories' does not exist in type 'ProductWhereInput'. Did you mean to write 'categoryId'?

373             where: { categories: { some: { id: { in: categoryIds } } } },
                         ~~~~~~~~~~

  node_modules/.prisma/client/index.d.ts:9522:5
    9522     where?: ProductWhereInput
             ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: ProductSelect<DefaultArgs>; omit?: ProductOmit<DefaultArgs>; include?: ProductInclude<DefaultArgs>; ... 5 more ...; distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]; }'

src/category/category.service.ts:374:33 - error TS2561: Object literal may only specify known properties, but 'categories' does not exist in type 'ProductSelect<DefaultArgs>'. Did you mean to write 'category'?

374             select: { id: true, categories: { select: { id: true } } }
                                    ~~~~~~~~~~

  node_modules/.prisma/client/index.d.ts:9510:5
    9510     select?: ProductSelect<ExtArgs> | null
             ~~~~~~
    The expected type comes from property 'select' which is declared here on type '{ select?: ProductSelect<DefaultArgs>; omit?: ProductOmit<DefaultArgs>; include?: ProductInclude<DefaultArgs>; ... 5 more ...; distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]; }'

src/category/category.service.ts:380:46 - error TS2551: Property 'categories' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; updatedAt: Date; stock: number; categoryId: number; subCategoryId: number; price: number; status: PublicationStatus; ... 11 more ...; variationId: number; }'. Did you mean 'categoryId'?

380                 const productCategoryIds = p.categories.map(c => c.id);
                                                 ~~~~~~~~~~

src/category/category.service.ts:387:25 - error TS2561: Object literal may only specify known properties, but 'categories' does not exist in type '(Without<ProductUpdateInput, ProductUncheckedUpdateInput> & ProductUncheckedUpdateInput) | (Without<...> & ProductUpdateInput)'. Did you mean to write 'category'?

387                         categories: {
                            ~~~~~~~~~~

  node_modules/.prisma/client/index.d.ts:9625:5
    9625     data: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
             ~~~~
    The expected type comes from property 'data' which is declared here on type '{ select?: ProductSelect<DefaultArgs>; omit?: ProductOmit<DefaultArgs>; include?: ProductInclude<DefaultArgs>; data: (Without<...> & ProductUncheckedUpdateInput) | (Without<...> & ProductUpdateInput); where: ProductWhereUniqueInput; }'

src/category/category.service.ts:406:22 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

406             where: { parentId: categoryId },
                         ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14322:5
    14322     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:407:25 - error TS2353: Object literal may only specify known properties, and 'order' does not exist in type 'CategoryOrderByWithRelationInput'.

407             orderBy: [{ order: 'asc' }, { name: 'asc' }]
                            ~~~~~

src/category/category.service.ts:417:22 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

417             where: { parentId: categoryId },
                         ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14322:5
    14322     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:418:25 - error TS2353: Object literal may only specify known properties, and 'order' does not exist in type 'CategoryOrderByWithRelationInput'.

418             orderBy: [{ order: 'asc' }, { name: 'asc' }]
                            ~~~~~

src/category/category.service.ts:428:25 - error TS2353: Object literal may only specify known properties, and 'level' does not exist in type 'CategoryOrderByWithRelationInput'.

428             orderBy: [{ level: 'asc' }, { order: 'asc' }, { name: 'asc' }]
                            ~~~~~

src/category/category.service.ts:428:43 - error TS2353: Object literal may only specify known properties, and 'order' does not exist in type 'CategoryOrderByWithRelationInput'.

428             orderBy: [{ level: 'asc' }, { order: 'asc' }, { name: 'asc' }]
                                              ~~~~~

src/category/category.service.ts:435:19 - error TS2339: Property 'parentId' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

435             if (c.parentId && byId[c.parentId]) {
                      ~~~~~~~~

src/category/category.service.ts:435:38 - error TS2339: Property 'parentId' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

435             if (c.parentId && byId[c.parentId]) {
                                         ~~~~~~~~

src/category/category.service.ts:436:24 - error TS2339: Property 'parentId' does not exist on type '{ id: number; name: string; description: string; createdAt: Date; slug: string; updatedAt: Date; coverImageUrl: string; coverImagePublicId: string; displayOrder: number; isActive: boolean; }'.

436                 byId[c.parentId].subcategories.push(byId[c.id]);
                           ~~~~~~~~

src/category/category.service.ts:475:17 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

475                 parentId: null
                    ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14218:5
    14218     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:485:17 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CreateCategoryDto'.

485                 parentId: null,
                    ~~~~~~~~

src/category/category.service.ts:497:21 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

497                     parentId: parentResult.id
                        ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14218:5
    14218     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:507:21 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CreateCategoryDto'.

507                     parentId: parentResult.id,
                        ~~~~~~~~

src/category/category.service.ts:524:25 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

524                         parentId: targetParentId
                            ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14218:5
    14218     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

src/category/category.service.ts:533:29 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CreateCategoryDto'.

533                             parentId: targetParentId,
                                ~~~~~~~~

src/category/category.service.ts:567:17 - error TS2353: Object literal may only specify known properties, and 'parentId' does not exist in type 'CategoryWhereInput'.

567                 parentId: parentId
                    ~~~~~~~~

  node_modules/.prisma/client/index.d.ts:14218:5
    14218     where?: CategoryWhereInput
              ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: CategorySelect<DefaultArgs>; omit?: CategoryOmit<DefaultArgs>; include?: CategoryInclude<DefaultArgs>; ... 5 more ...; distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]; }'

[00:06:06] Found 53 errors. Watching for file changes.