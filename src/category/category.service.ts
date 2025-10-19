import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateVariationBatchDto } from './dto/create-variation-batch.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { PrismaService } from '../prisma.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MockupService } from '../product/services/mockup.service';

@Injectable()
export class CategoryService {
    private readonly logger = new Logger(CategoryService.name);

    constructor(
        private prisma: PrismaService,
        private mockupService: MockupService
    ) { }

    /**
     * Crée une catégorie principale avec vérification des doublons
     */
    async create(createCategoryDto: CreateCategoryDto) {
        const { name, description, displayOrder, coverImageUrl, coverImagePublicId } = createCategoryDto;

        // 1. Vérifier si la catégorie existe déjà
        const existing = await this.prisma.category.findFirst({
            where: {
                name: name.trim()
            }
        });

        if (existing) {
            throw new ConflictException({
                success: false,
                error: 'DUPLICATE_CATEGORY',
                message: `La catégorie "${name}" existe déjà`,
                existingCategory: existing
            });
        }

        // 2. Générer le slug
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // 3. Créer la catégorie
        const newCategory = await this.prisma.category.create({
            data: {
                name: name.trim(),
                slug,
                description: description?.trim() || '',
                displayOrder: displayOrder || 0,
                coverImageUrl: coverImageUrl || null,
                coverImagePublicId: coverImagePublicId || null
            },
            include: {
                subCategories: true,
                _count: {
                    select: { products: true }
                }
            }
        });

        return {
            success: true,
            message: 'Catégorie créée avec succès',
            data: newCategory
        };
    }

    /**
     * Récupère toutes les catégories avec leurs sous-catégories
     */
    async findAll() {
        const categories = await this.prisma.category.findMany({
            where: { isActive: true },
            orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' }
            ],
            include: {
                subCategories: {
                    where: { isActive: true },
                    include: {
                        variations: {
                            where: { isActive: true },
                            orderBy: { displayOrder: 'asc' }
                        }
                    },
                    orderBy: { displayOrder: 'asc' }
                },
                _count: {
                    select: { products: true }
                }
            }
        });

        return categories;
    }

    /**
     * Récupère les catégories avec leur hiérarchie complète (arbre)
     */
    async findAllHierarchy() {
        const categories = await this.findAll();

        return categories.map(cat => ({
            ...cat,
            productCount: cat._count?.products || 0,
            subcategories: cat.subCategories || []
        }));
    }

    async findOne(id: number) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                subCategories: {
                    where: { isActive: true },
                    include: {
                        variations: {
                            where: { isActive: true },
                            orderBy: { displayOrder: 'asc' }
                        }
                    },
                    orderBy: { displayOrder: 'asc' }
                },
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!category) {
            throw new NotFoundException(`Catégorie avec ID ${id} non trouvée`);
        }

        return {
            ...category,
            productCount: category._count.products
        };
    }

    async update(id: number, updateCategoryDto: UpdateCategoryDto) {
        // Vérifier si la catégorie existe
        const category = await this.findOne(id);

        // Si le nom est modifié, vérifier qu'il n'existe pas déjà
        if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
            const existingCategory = await this.prisma.category.findFirst({
                where: {
                    name: updateCategoryDto.name.trim(),
                    id: { not: id } // Exclure la catégorie actuelle
                }
            });

            if (existingCategory) {
                throw new ConflictException({
                    success: false,
                    error: 'DUPLICATE_CATEGORY',
                    message: `Une catégorie avec le nom "${updateCategoryDto.name}" existe déjà`,
                    existingCategory
                });
            }
        }

        // Construire les données à mettre à jour
        const dataToUpdate: any = {};
        if (updateCategoryDto.name) {
            dataToUpdate.name = updateCategoryDto.name.trim();
            // Régénérer le slug si le nom change
            dataToUpdate.slug = updateCategoryDto.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
        if (updateCategoryDto.description !== undefined) {
            dataToUpdate.description = updateCategoryDto.description?.trim() || '';
        }
        if (updateCategoryDto.displayOrder !== undefined) {
            dataToUpdate.displayOrder = updateCategoryDto.displayOrder;
        }
        if (updateCategoryDto.coverImageUrl !== undefined) {
            dataToUpdate.coverImageUrl = updateCategoryDto.coverImageUrl;
        }
        if (updateCategoryDto.coverImagePublicId !== undefined) {
            dataToUpdate.coverImagePublicId = updateCategoryDto.coverImagePublicId;
        }

        // Mettre à jour la catégorie
        const updatedCategory = await this.prisma.category.update({
            where: { id },
            data: dataToUpdate,
            include: {
                subCategories: true,
                _count: {
                    select: { products: true }
                }
            }
        });

        // Régénérer les mockups pour cette catégorie
        this.logger.log(`🔄 Déclenchement de la régénération des mockups pour la catégorie ${id}`);
        try {
            await this.mockupService.regenerateMockupsForCategory(id);
        } catch (error) {
            this.logger.warn(`⚠️ Erreur lors de la régénération des mockups: ${error.message}`);
            // On continue même si la régénération échoue
        }

        return {
            success: true,
            message: `Catégorie mise à jour avec succès${updatedCategory._count.products > 0 ? ` (${updatedCategory._count.products} produit(s) affecté(s))` : ''}`,
            data: {
                ...updatedCategory,
                productCount: updatedCategory._count.products
            }
        };
    }

    /**
     * Supprime une catégorie et toutes ses sous-catégories en cascade
     * Protection: bloque la suppression si des produits utilisent cette catégorie
     */
    async remove(id: number) {
        // Vérifier si la catégorie existe
        const category = await this.findOne(id);

        // Vérifier si des produits sont liés directement à cette catégorie
        const directProductsCount = await this.prisma.product.count({
            where: { categoryId: id, isDelete: false }
        });

        if (directProductsCount > 0) {
            throw new ConflictException({
                code: 'CategoryInUse',
                message: `Impossible de supprimer cette catégorie car ${directProductsCount} produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre catégorie.`,
                details: {
                    categoryId: id,
                    categoryName: category.name,
                    directProductsCount,
                    suggestedAction: 'Déplacez les produits vers une autre catégorie avant de supprimer celle-ci.'
                }
            });
        }

        // Vérifier si des produits utilisent les sous-catégories de cette catégorie
        const subCategoryIds = category.subCategories?.map(sub => sub.id) || [];
        if (subCategoryIds.length > 0) {
            const subCategoryProductsCount = await this.prisma.product.count({
                where: {
                    subCategoryId: { in: subCategoryIds },
                    isDelete: false
                }
            });

            if (subCategoryProductsCount > 0) {
                throw new ConflictException({
                    code: 'CategoryInUse',
                    message: `Impossible de supprimer cette catégorie car ${subCategoryProductsCount} produit(s) utilise(nt) ses sous-catégories. Veuillez d'abord déplacer les produits.`,
                    details: {
                        categoryId: id,
                        categoryName: category.name,
                        subCategoryProductsCount,
                        suggestedAction: 'Déplacez les produits des sous-catégories avant de supprimer la catégorie principale.'
                    }
                });
            }
        }

        // Suppression en cascade (Prisma gère automatiquement avec onDelete: Cascade)
        await this.prisma.category.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Catégorie supprimée avec succès'
        };
    }

    /**
     * Supprime une sous-catégorie
     * Protection: bloque la suppression si des produits utilisent cette sous-catégorie
     */
    async removeSubCategory(id: number) {
        // Vérifier si la sous-catégorie existe
        const subCategory = await this.prisma.subCategory.findUnique({
            where: { id },
            include: {
                category: true,
                variations: true,
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!subCategory) {
            throw new NotFoundException(`Sous-catégorie avec ID ${id} non trouvée`);
        }

        // Vérifier si des produits sont liés directement à cette sous-catégorie
        const directProductsCount = await this.prisma.product.count({
            where: { subCategoryId: id, isDelete: false }
        });

        if (directProductsCount > 0) {
            throw new ConflictException({
                code: 'SubCategoryInUse',
                message: `Impossible de supprimer cette sous-catégorie car ${directProductsCount} produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre sous-catégorie.`,
                details: {
                    subCategoryId: id,
                    subCategoryName: subCategory.name,
                    categoryName: subCategory.category.name,
                    directProductsCount,
                    suggestedAction: 'Déplacez les produits vers une autre sous-catégorie avant de la supprimer.'
                }
            });
        }

        // Vérifier si des produits utilisent les variations de cette sous-catégorie
        const variationIds = subCategory.variations?.map(v => v.id) || [];
        if (variationIds.length > 0) {
            const variationProductsCount = await this.prisma.product.count({
                where: {
                    variationId: { in: variationIds },
                    isDelete: false
                }
            });

            if (variationProductsCount > 0) {
                throw new ConflictException({
                    code: 'SubCategoryInUse',
                    message: `Impossible de supprimer cette sous-catégorie car ${variationProductsCount} produit(s) utilise(nt) ses variations. Veuillez d'abord déplacer les produits.`,
                    details: {
                        subCategoryId: id,
                        subCategoryName: subCategory.name,
                        variationProductsCount,
                        suggestedAction: 'Déplacez les produits des variations avant de supprimer la sous-catégorie.'
                    }
                });
            }
        }

        // Suppression (les variations seront supprimées en cascade grâce à onDelete: Cascade)
        await this.prisma.subCategory.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Sous-catégorie supprimée avec succès'
        };
    }

    /**
     * Supprime une variation
     * Protection: bloque la suppression si des produits utilisent cette variation
     */
    async removeVariation(id: number) {
        // Vérifier si la variation existe
        const variation = await this.prisma.variation.findUnique({
            where: { id },
            include: {
                subCategory: {
                    include: {
                        category: true
                    }
                },
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!variation) {
            throw new NotFoundException(`Variation avec ID ${id} non trouvée`);
        }

        // Vérifier si des produits utilisent cette variation
        const productsCount = await this.prisma.product.count({
            where: { variationId: id, isDelete: false }
        });

        if (productsCount > 0) {
            throw new ConflictException({
                code: 'VariationInUse',
                message: `Impossible de supprimer cette variation car ${productsCount} produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre variation.`,
                details: {
                    variationId: id,
                    variationName: variation.name,
                    subCategoryName: variation.subCategory.name,
                    categoryName: variation.subCategory.category.name,
                    productsCount,
                    suggestedAction: 'Déplacez les produits vers une autre variation avant de la supprimer.'
                }
            });
        }

        // Suppression
        await this.prisma.variation.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Variation supprimée avec succès'
        };
    }

    /**
     * Vérifie si une catégorie peut être supprimée
     */
    async canDeleteCategory(id: number) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                subCategories: {
                    include: {
                        variations: true
                    }
                }
            }
        });

        if (!category) {
            throw new NotFoundException(`Catégorie avec ID ${id} non trouvée`);
        }

        const directProducts = await this.prisma.product.count({
            where: { categoryId: id, isDelete: false }
        });

        const subCategoryIds = category.subCategories?.map(sub => sub.id) || [];
        const subCategoryProducts = subCategoryIds.length > 0
            ? await this.prisma.product.count({
                where: {
                    subCategoryId: { in: subCategoryIds },
                    isDelete: false
                }
            })
            : 0;

        const variationIds = category.subCategories?.flatMap(sub =>
            sub.variations?.map(v => v.id) || []
        ) || [];
        const variationProducts = variationIds.length > 0
            ? await this.prisma.product.count({
                where: {
                    variationId: { in: variationIds },
                    isDelete: false
                }
            })
            : 0;

        const canDelete = directProducts === 0 && subCategoryProducts === 0 && variationProducts === 0;

        return {
            success: true,
            data: {
                canDelete,
                categoryId: id,
                categoryName: category.name,
                blockers: {
                    directProducts,
                    subCategoryProducts,
                    variationProducts,
                    total: directProducts + subCategoryProducts + variationProducts
                },
                message: canDelete
                    ? 'Cette catégorie peut être supprimée'
                    : `Cette catégorie ne peut pas être supprimée car ${directProducts + subCategoryProducts + variationProducts} produit(s) l'utilise(nt)`
            }
        };
    }

    /**
     * Vérifie si une sous-catégorie peut être supprimée
     */
    async canDeleteSubCategory(id: number) {
        const subCategory = await this.prisma.subCategory.findUnique({
            where: { id },
            include: {
                category: true,
                variations: true
            }
        });

        if (!subCategory) {
            throw new NotFoundException(`Sous-catégorie avec ID ${id} non trouvée`);
        }

        const directProducts = await this.prisma.product.count({
            where: { subCategoryId: id, isDelete: false }
        });

        const variationIds = subCategory.variations?.map(v => v.id) || [];
        const variationProducts = variationIds.length > 0
            ? await this.prisma.product.count({
                where: {
                    variationId: { in: variationIds },
                    isDelete: false
                }
            })
            : 0;

        const canDelete = directProducts === 0 && variationProducts === 0;

        return {
            success: true,
            data: {
                canDelete,
                subCategoryId: id,
                subCategoryName: subCategory.name,
                categoryName: subCategory.category.name,
                blockers: {
                    directProducts,
                    variationProducts,
                    total: directProducts + variationProducts
                },
                message: canDelete
                    ? 'Cette sous-catégorie peut être supprimée'
                    : `Cette sous-catégorie ne peut pas être supprimée car ${directProducts + variationProducts} produit(s) l'utilise(nt)`
            }
        };
    }

    /**
     * Vérifie si une variation peut être supprimée
     */
    async canDeleteVariation(id: number) {
        const variation = await this.prisma.variation.findUnique({
            where: { id },
            include: {
                subCategory: {
                    include: {
                        category: true
                    }
                }
            }
        });

        if (!variation) {
            throw new NotFoundException(`Variation avec ID ${id} non trouvée`);
        }

        const productsCount = await this.prisma.product.count({
            where: { variationId: id, isDelete: false }
        });

        const canDelete = productsCount === 0;

        return {
            success: true,
            data: {
                canDelete,
                variationId: id,
                variationName: variation.name,
                subCategoryName: variation.subCategory.name,
                categoryName: variation.subCategory.category.name,
                blockers: {
                    productsCount
                },
                message: canDelete
                    ? 'Cette variation peut être supprimée'
                    : `Cette variation ne peut pas être supprimée car ${productsCount} produit(s) l'utilise(nt)`
            }
        };
    }

    /**
     * Obtenir l'usage d'une catégorie (produits liés, sous-catégories, variations)
     */
    async getUsage(id: number) {
        // Vérifier existence
        const cat = await this.prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        products: true,
                        subCategories: true
                    }
                }
            }
        });

        if (!cat) {
            throw new NotFoundException(`Catégorie avec ID ${id} non trouvée`);
        }

        // Compter les variations dans toutes les sous-catégories
        const subCategories = await this.prisma.subCategory.findMany({
            where: { categoryId: id },
            include: {
                _count: {
                    select: { variations: true }
                }
            }
        });

        const variationsCount = subCategories.reduce((sum, sub) => sum + sub._count.variations, 0);

        return {
            success: true,
            data: {
                categoryId: id,
                productsCount: cat._count.products,
                subCategoriesCount: cat._count.subCategories,
                variationsCount
            }
        };
    }

    /**
     * Admin: lister les sous-catégories d'une catégorie
     */
    async getChildren(categoryId: number) {
        const children = await this.prisma.subCategory.findMany({
            where: { categoryId, isActive: true },
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
        });
        return { success: true, data: children };
    }

    /**
     * Créer une sous-catégorie rattachée à une catégorie principale existante
     */
    async createSubCategory(createSubCategoryDto: CreateSubCategoryDto) {
        const { name, description, categoryId, parentId, displayOrder, level = 1 } = createSubCategoryDto;

        // Utiliser categoryId ou parentId (pour compatibilité)
        const finalCategoryId = categoryId || parentId;

        // 1. Validation du nom (requis)
        if (!name || !name.trim()) {
            throw new BadRequestException({
                success: false,
                error: 'MISSING_NAME',
                message: 'Le nom de la sous-catégorie est requis'
            });
        }

        // 2. Validation du categoryId (requis)
        if (!finalCategoryId || isNaN(finalCategoryId)) {
            throw new BadRequestException({
                success: false,
                error: 'MISSING_CATEGORY_ID',
                message: 'L\'ID de la catégorie parente est requis'
            });
        }

        // 3. Validation du niveau (doit être 1 pour sous-catégorie)
        if (level !== 1) {
            throw new BadRequestException({
                success: false,
                error: 'INVALID_LEVEL',
                message: 'Le niveau doit être 1 pour une sous-catégorie'
            });
        }

        // 4. Vérifier que la catégorie parente existe et est active
        const parentCategory = await this.prisma.category.findFirst({
            where: {
                id: finalCategoryId,
                isActive: true
            }
        });

        if (!parentCategory) {
            throw new NotFoundException({
                success: false,
                error: 'PARENT_CATEGORY_NOT_FOUND',
                message: 'La catégorie parente n\'existe pas ou n\'est pas une catégorie principale'
            });
        }

        // 5. Vérifier qu'une sous-catégorie avec le même nom n'existe pas déjà dans cette catégorie
        const existingSubCategory = await this.prisma.subCategory.findFirst({
            where: {
                name: name.trim(),
                categoryId: finalCategoryId,
                isActive: true
            }
        });

        if (existingSubCategory) {
            throw new ConflictException({
                success: false,
                error: 'DUPLICATE_SUBCATEGORY',
                message: 'Une sous-catégorie avec ce nom existe déjà dans cette catégorie'
            });
        }

        // 6. Calculer le display_order (utiliser celui fourni ou le calculer automatiquement)
        let finalDisplayOrder;
        if (displayOrder !== undefined) {
            finalDisplayOrder = displayOrder;
        } else {
            const maxOrderResult = await this.prisma.subCategory.findFirst({
                where: {
                    categoryId: finalCategoryId
                },
                orderBy: { displayOrder: 'desc' },
                select: { displayOrder: true }
            });
            finalDisplayOrder = (maxOrderResult?.displayOrder || 0) + 1;
        }

        // 7. Générer le slug unique
        const slug = await this.generateUniqueSubCategorySlug(name.trim(), finalCategoryId);

        // 8. Créer la sous-catégorie
        const newSubCategory = await this.prisma.subCategory.create({
            data: {
                name: name.trim(),
                slug,
                description: description?.trim() || null,
                categoryId: finalCategoryId,
                displayOrder: finalDisplayOrder,
                isActive: true
            },
            include: {
                variations: true,
                _count: {
                    select: { variations: true }
                }
            }
        });

        return {
            success: true,
            message: 'Sous-catégorie créée avec succès',
            data: {
                id: newSubCategory.id,
                name: newSubCategory.name,
                slug: newSubCategory.slug,
                description: newSubCategory.description,
                parentId: newSubCategory.categoryId,
                level: 1, // Niveau par défaut pour les sous-catégories
                display_order: newSubCategory.displayOrder,
                is_active: newSubCategory.isActive,
                created_at: newSubCategory.createdAt,
                updated_at: newSubCategory.updatedAt
            }
        };
    }

    /**
     * Ajouter plusieurs variations à une sous-catégorie en lot
     */
    async createBatchVariations(createVariationBatchDto: CreateVariationBatchDto) {
        const { variations } = createVariationBatchDto;

        // 1. Validation initiale
        if (!variations || !Array.isArray(variations) || variations.length === 0) {
            throw new BadRequestException({
                success: false,
                error: 'MISSING_VARIATIONS',
                message: 'Le tableau des variations est requis et ne doit pas être vide'
            });
        }

        // 2. Validation des données de chaque variation
        for (const variation of variations) {
            if (!variation.name || typeof variation.name !== 'string' || variation.name.trim() === '') {
                throw new BadRequestException({
                    success: false,
                    error: 'INVALID_VARIATION_DATA',
                    message: 'Données de variation invalides: le nom est requis'
                });
            }
            if (!variation.parentId || typeof variation.parentId !== 'number' || variation.parentId <= 0) {
                throw new BadRequestException({
                    success: false,
                    error: 'INVALID_VARIATION_DATA',
                    message: 'Données de variation invalides: parentId est requis et doit être un nombre positif'
                });
            }
        }

        // 3. Vérifier que toutes les sous-catégories parentes existent
        const uniqueParentIds = [...new Set(variations.map(v => v.parentId))];

        for (const parentId of uniqueParentIds) {
            const parentSubCategory = await this.prisma.subCategory.findFirst({
                where: {
                    id: parentId,
                    isActive: true
                }
            });

            if (!parentSubCategory) {
                throw new NotFoundException({
                    success: false,
                    error: 'SUBCATEGORY_NOT_FOUND',
                    message: `La sous-catégorie avec l'ID ${parentId} n'existe pas ou n'est pas active`
                });
            }
        }

        // 4. Traitement en lot
        const results = {
            created: [],
            skipped: [],
            duplicates: []
        };

        for (const variationData of variations) {
            try {
                // Vérifier les doublons pour cette variation spécifique
                const existingVariation = await this.prisma.variation.findFirst({
                    where: {
                        name: variationData.name.trim(),
                        subCategoryId: variationData.parentId,
                        isActive: true
                    }
                });

                if (existingVariation) {
                    results.duplicates.push({
                        name: variationData.name,
                        reason: 'Cette variation existe déjà dans cette sous-catégorie'
                    });
                    results.skipped.push(variationData.name);
                    continue;
                }

                // Créer la variation
                const variation = await this.createSingleVariation(variationData);
                results.created.push(variation);

            } catch (error) {
                results.skipped.push(variationData.name);
                this.logger.error(`Erreur création variation ${variationData.name}:`, error);
            }
        }

        // 5. Construire le message de résultat
        const createdCount = results.created.length;
        const skippedCount = results.skipped.length;

        let message = `${createdCount} variation(s) créée(s) avec succès`;
        if (skippedCount > 0) {
            message += `, ${skippedCount} ignorée(s)`;
        }

        return {
            success: true,
            message,
            data: results
        };
    }

    /**
     * Créer une variation individuelle
     */
    private async createSingleVariation(variationData: any) {
        const { name, parentId, description } = variationData;

        // Générer le slug unique
        const slug = await this.generateUniqueSlug(name.trim(), parentId);

        // Calculer le display_order
        const maxOrderResult = await this.prisma.variation.findFirst({
            where: { subCategoryId: parentId },
            orderBy: { displayOrder: 'desc' },
            select: { displayOrder: true }
        });

        const displayOrder = (maxOrderResult?.displayOrder || 0) + 1;

        // Insérer la variation
        const newVariation = await this.prisma.variation.create({
            data: {
                name: name.trim(),
                slug,
                description: description?.trim() || null,
                subCategoryId: parentId,
                displayOrder,
                isActive: true
            }
        });

        return newVariation;
    }

    /**
     * Générer un slug unique pour une variation
     */
    private async generateUniqueSlug(name: string, subCategoryId: number): Promise<string> {
        let baseSlug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        let slug = baseSlug;
        let counter = 1;

        // Vérifier si le slug existe déjà pour cette sous-catégorie
        while (await this.prisma.variation.findFirst({
            where: { slug, subCategoryId }
        })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    /**
     * Générer un slug unique pour une sous-catégorie
     */
    private async generateUniqueSubCategorySlug(name: string, categoryId: number): Promise<string> {
        let baseSlug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        let slug = baseSlug;
        let counter = 1;

        // Vérifier si le slug existe déjà pour cette catégorie
        while (await this.prisma.subCategory.findFirst({
            where: { slug, categoryId }
        })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }
}
