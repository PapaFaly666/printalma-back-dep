import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PrismaService } from '../prisma.service';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
    constructor(private prisma: PrismaService) { }

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
     */
    async remove(id: number) {
        // Vérifier si la catégorie existe
        const category = await this.findOne(id);

        // Vérifier si des produits sont liés à cette catégorie
        const productsCount = category._count?.products || 0;

        if (productsCount > 0) {
            throw new ConflictException({
                code: 'CategoryInUse',
                message: `La catégorie est utilisée par ${productsCount} produit(s).`,
                details: {
                    categoryId: id,
                    productsCount
                }
            });
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
}
