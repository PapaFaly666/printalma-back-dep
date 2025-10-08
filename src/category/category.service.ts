// categories/category.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PrismaService } from '../prisma.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryStructureDto } from './dto/create-category-structure.dto';

@Injectable()
export class CategoryService {
    constructor(private prisma: PrismaService) { }

    /**
     * Crée une catégorie avec vérification des doublons selon la logique frontend
     */
    async create(createCategoryDto: CreateCategoryDto) {
        const { name, description, parentId, level, order } = createCategoryDto;

        // 1. Vérifier si la catégorie existe déjà
        const existing = await this.prisma.category.findFirst({
            where: {
                name: name.trim(),
                parentId: parentId || null
            }
        });

        if (existing) {
            throw new ConflictException({
                success: false,
                error: 'DUPLICATE_CATEGORY',
                message: `La catégorie "${name}" existe déjà${parentId ? ' dans cette catégorie parent' : ''}`,
                existingCategory: existing
            });
        }

        // 2. Déterminer le level automatiquement si parentId est fourni
        let calculatedLevel = level !== undefined ? level : 0;
        if (parentId) {
            const parent = await this.prisma.category.findUnique({
                where: { id: parentId },
                select: { level: true }
            });

            if (!parent) {
                throw new NotFoundException(`Catégorie parent avec ID ${parentId} non trouvée`);
            }

            calculatedLevel = parent.level + 1;
        }

        // 3. Créer la catégorie
        const newCategory = await this.prisma.category.create({
            data: {
                name: name.trim(),
                description: description?.trim() || '',
                parentId: parentId || null,
                level: calculatedLevel,
                order: order || 0
            },
            include: {
                parent: true,
                children: true
            }
        });

        return {
            success: true,
            message: 'Catégorie créée avec succès',
            data: newCategory
        };
    }

    /**
     * Récupère toutes les catégories avec organisation hiérarchique
     */
    async findAll() {
        const categories = await this.prisma.category.findMany({
            orderBy: [
                { level: 'asc' },
                { order: 'asc' },
                { name: 'asc' }
            ],
            include: {
                parent: true,
                children: true,
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

        // Créer un map pour organiser les catégories
        const categoriesMap: Record<number, any> = {};
        const rootCategories: any[] = [];

        // Initialiser le map
        categories.forEach(cat => {
            categoriesMap[cat.id] = {
                ...cat,
                subcategories: [],
                productCount: cat._count?.products || 0
            };
        });

        // Construire l'arbre hiérarchique
        categories.forEach(cat => {
            if (cat.parentId && categoriesMap[cat.parentId]) {
                categoriesMap[cat.parentId].subcategories.push(categoriesMap[cat.id]);
            } else if (!cat.parentId) {
                rootCategories.push(categoriesMap[cat.id]);
            }
        });

        return rootCategories;
    }

    async findOne(id: number) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                parent: true,
                children: {
                    include: {
                        children: true // Include variations if it's a subcategory
                    }
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
                    parentId: category.parentId || null,
                    id: { not: id } // Exclure la catégorie actuelle
                }
            });

            if (existingCategory) {
                throw new ConflictException({
                    success: false,
                    error: 'DUPLICATE_CATEGORY',
                    message: `Une catégorie avec le nom "${updateCategoryDto.name}" existe déjà${category.parentId ? ' dans cette catégorie parent' : ''}`,
                    existingCategory
                });
            }
        }

        // Mettre à jour la catégorie
        const updatedCategory = await this.prisma.category.update({
            where: { id },
            data: {
                name: updateCategoryDto.name?.trim(),
                description: updateCategoryDto.description?.trim()
            },
            include: {
                parent: true,
                children: true,
                _count: {
                    select: { products: true }
                }
            }
        });

        // 🔄 SYNCHRONISATION AUTOMATIQUE DES PRODUITS
        // Si le nom a changé, mettre à jour tous les produits liés
        if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
            const productsToUpdate = await this.prisma.product.findMany({
                where: {
                    categories: {
                        some: { id }
                    }
                },
                select: { id: true }
            });

            console.log(`🔄 Synchronisation: ${productsToUpdate.length} produit(s) liés à la catégorie "${category.name}" → "${updatedCategory.name}"`);

            // Note: La synchronisation est automatique via la relation many-to-many
            // Les produits afficheront automatiquement le nouveau nom de catégorie
        }

        return {
            success: true,
            message: `Catégorie mise à jour avec succès${updatedCategory._count.products > 0 ? ` (${updatedCategory._count.products} produit(s) synchronisé(s))` : ''}`,
            data: {
                ...updatedCategory,
                productCount: updatedCategory._count.products
            }
        };
    }

    /**
     * Supprime une catégorie et tous ses enfants en cascade
     */
    async remove(id: number) {
        // Vérifier si la catégorie existe
        const category = await this.findOne(id);

        // Récupérer tous les IDs des enfants (récursif)
        const childrenIds = await this.getAllChildrenIds(id);
        const allIds = [id, ...childrenIds];

        // Vérifier si des produits sont liés à cette catégorie ou ses enfants
        const productsCount = await this.prisma.product.count({
            where: {
                categories: {
                    some: {
                        id: { in: allIds }
                    }
                }
            }
        });

        if (productsCount > 0) {
            throw new BadRequestException(
                `Impossible de supprimer la catégorie car elle (ou ses sous-catégories) est liée à ${productsCount} produit(s). ` +
                `Veuillez d'abord supprimer ou déplacer ces produits vers une autre catégorie.`
            );
        }

        // Suppression en cascade (Prisma gère automatiquement avec onDelete: Cascade)
        await this.prisma.category.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Catégorie supprimée avec succès',
            deletedCount: allIds.length
        };
    }

    /**
     * Récupère récursivement tous les IDs des enfants d'une catégorie
     */
    private async getAllChildrenIds(parentId: number): Promise<number[]> {
        const children = await this.prisma.category.findMany({
            where: { parentId },
            select: { id: true }
        });

        let allIds: number[] = [];

        for (const child of children) {
            allIds.push(child.id);
            const subChildren = await this.getAllChildrenIds(child.id);
            allIds = [...allIds, ...subChildren];
        }

        return allIds;
    }

    /**
     * Crée une structure complète de catégories (parent > enfant > variations)
     * Selon la logique frontend décrite dans ha.md
     */
    async createCategoryStructure(dto: CreateCategoryStructureDto) {
        const { parentName, parentDescription, childName, variations } = dto;

        let createdCount = 0;
        let parentResult = null;
        let childResult = null;
        const skippedVariations: string[] = [];

        // 1. Créer ou récupérer le parent
        const existingParent = await this.prisma.category.findFirst({
            where: {
                name: parentName.trim(),
                parentId: null
            }
        });

        if (existingParent) {
            parentResult = existingParent;
        } else {
            const newParent = await this.create({
                name: parentName,
                description: parentDescription,
                parentId: null,
                level: 0
            });
            parentResult = newParent.data;
            createdCount++;
        }

        // 2. Créer ou récupérer l'enfant (sous-catégorie)
        if (childName && childName.trim()) {
            const existingChild = await this.prisma.category.findFirst({
                where: {
                    name: childName.trim(),
                    parentId: parentResult.id
                }
            });

            if (existingChild) {
                childResult = existingChild;
            } else {
                const newChild = await this.create({
                    name: childName,
                    description: `Sous-catégorie de ${parentResult.name}`,
                    parentId: parentResult.id,
                    level: 1
                });
                childResult = newChild.data;
                createdCount++;
            }
        }

        // 3. Ajouter les variations
        const targetParentId = childResult ? childResult.id : parentResult.id;
        const targetLevel = childResult ? 2 : 1;

        for (const variation of variations) {
            if (variation.trim()) {
                const existingVariation = await this.prisma.category.findFirst({
                    where: {
                        name: variation.trim(),
                        parentId: targetParentId
                    }
                });

                if (!existingVariation) {
                    try {
                        await this.create({
                            name: variation.trim(),
                            description: `Variation de ${childResult?.name || parentResult.name}`,
                            parentId: targetParentId,
                            level: targetLevel
                        });
                        createdCount++;
                    } catch (error) {
                        skippedVariations.push(variation);
                    }
                } else {
                    skippedVariations.push(variation);
                }
            }
        }

        return {
            success: true,
            createdCount,
            skippedVariations,
            message: `Structure créée avec succès ! ${createdCount} nouveau(x) élément(s) ajouté(s).`,
            data: {
                parent: parentResult,
                child: childResult,
                totalVariations: variations.length,
                createdVariations: variations.length - skippedVariations.length
            }
        };
    }

    /**
     * Vérifie si une catégorie avec ce nom existe déjà dans le parent spécifié
     */
    async checkDuplicateCategory(name: string, parentId: number | null = null) {
        const existing = await this.prisma.category.findFirst({
            where: {
                name: name.trim(),
                parentId: parentId
            }
        });

        return {
            exists: existing !== null,
            category: existing || null
        };
    }
}