// categories/category.controller.ts
import { Controller, Get, Post, Body, Patch, Put, Param, Delete, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateVariationBatchDto } from './dto/create-variation-batch.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Créer une catégorie principale' })
    @ApiResponse({ status: 201, description: 'Catégorie créée avec succès.' })
    @ApiResponse({ status: 400, description: 'Données invalides.' })
    @ApiResponse({ status: 409, description: 'La catégorie existe déjà.' })
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoryService.create(createCategoryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Lister toutes les catégories' })
    @ApiResponse({ status: 200, description: 'Liste des catégories.' })
    findAll() {
        return this.categoryService.findAll();
    }

    @Get('hierarchy')
    @ApiOperation({
        summary: 'Récupérer les catégories avec leur hiérarchie complète (arbre)',
        description: 'Retourne les catégories organisées en arbre hiérarchique avec sous-catégories et variations'
    })
    @ApiResponse({ status: 200, description: 'Arbre hiérarchique des catégories.' })
    findAllHierarchy() {
        return this.categoryService.findAllHierarchy();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Afficher une catégorie' })
    @ApiResponse({ status: 200, description: 'Catégorie trouvée.' })
    @ApiResponse({ status: 404, description: 'Catégorie non trouvée.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la catégorie' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie (PUT)' })
    @ApiResponse({ status: 200, description: 'Catégorie mise à jour avec succès.' })
    @ApiResponse({ status: 404, description: 'Catégorie non trouvée.' })
    @ApiResponse({ status: 409, description: 'Le nom de catégorie existe déjà.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la catégorie' })
    updatePut(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoryService.update(id, updateCategoryDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie (PATCH)' })
    @ApiResponse({ status: 200, description: 'Catégorie mise à jour.' })
    @ApiResponse({ status: 404, description: 'Catégorie non trouvée.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la catégorie' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoryService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer une catégorie' })
    @ApiResponse({ status: 204, description: 'Catégorie supprimée.' })
    @ApiResponse({ status: 404, description: 'Catégorie non trouvée.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la catégorie' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.remove(id);
    }

    // =========================
    // Admin endpoints
    // =========================

    @Get('admin/:id/usage')
    @ApiOperation({ summary: 'Obtenir l\'usage d\'une catégorie (admin)' })
    @ApiParam({ name: 'id', type: Number })
    getUsage(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.getUsage(id);
    }

    @Get('admin/:id/children')
    @ApiOperation({ summary: 'Lister les sous-catégories d\'une catégorie' })
    @ApiParam({ name: 'id', type: Number })
    getChildren(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.getChildren(id);
    }

    @Post('subcategory')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Ajouter une sous-catégorie à une catégorie existante',
        description: 'Permet de créer une sous-catégorie rattachée à une catégorie principale existante'
    })
    @ApiResponse({
        status: 201,
        description: 'Sous-catégorie créée avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Sous-catégorie créée avec succès' },
                data: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', example: 8 },
                        name: { type: 'string', example: 'T-Shirts' },
                        slug: { type: 'string', example: 't-shirts' },
                        description: { type: 'string', example: 'T-shirts en coton bio et tissus recyclés' },
                        parentId: { type: 'number', example: 4 },
                        level: { type: 'number', example: 1 },
                        display_order: { type: 'number', example: 1 },
                        is_active: { type: 'boolean', example: true },
                        created_at: { type: 'string', example: '2025-10-17T10:30:00Z' },
                        updated_at: { type: 'string', example: '2025-10-17T10:30:00Z' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 404, description: 'Catégorie parente non trouvée' })
    @ApiResponse({ status: 409, description: 'Une sous-catégorie avec ce nom existe déjà' })
    createSubCategory(@Body() createSubCategoryDto: CreateSubCategoryDto) {
        return this.categoryService.createSubCategory(createSubCategoryDto);
    }

    @Post('variations/batch')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Ajouter plusieurs variations à une sous-catégorie en lot',
        description: 'Permet de créer plusieurs variations pour une sous-catégorie en une seule requête'
    })
    @ApiResponse({
        status: 201,
        description: 'Variations créées avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: '4 variation(s) créée(s) avec succès' },
                data: {
                    type: 'object',
                    properties: {
                        created: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number', example: 15 },
                                    name: { type: 'string', example: 'Col V' },
                                    slug: { type: 'string', example: 'col-v' },
                                    parentId: { type: 'number', example: 6 },
                                    level: { type: 'number', example: 2 },
                                    displayOrder: { type: 'number', example: 1 },
                                    isActive: { type: 'boolean', example: true },
                                    created_at: { type: 'string', example: '2025-10-17T10:30:00Z' }
                                }
                            }
                        },
                        skipped: { type: 'array', items: { type: 'string' }, example: [] },
                        duplicates: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'Col Rond' },
                                    reason: { type: 'string', example: 'Cette variation existe déjà dans cette sous-catégorie' }
                                }
                            },
                            example: []
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Données invalides ou tableau vide' })
    @ApiResponse({ status: 404, description: 'Sous-catégorie non trouvée' })
    createBatchVariations(@Body() createVariationBatchDto: CreateVariationBatchDto) {
        return this.categoryService.createBatchVariations(createVariationBatchDto);
    }

    // =========================
    // Routes de suppression avec protection
    // =========================

    @Delete('subcategory/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Supprimer une sous-catégorie',
        description: 'Supprime une sous-catégorie si aucun produit ne l\'utilise'
    })
    @ApiResponse({ status: 200, description: 'Sous-catégorie supprimée avec succès.' })
    @ApiResponse({ status: 404, description: 'Sous-catégorie non trouvée.' })
    @ApiResponse({
        status: 409,
        description: 'Impossible de supprimer: des produits utilisent cette sous-catégorie'
    })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la sous-catégorie' })
    removeSubCategory(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.removeSubCategory(id);
    }

    @Delete('variation/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Supprimer une variation',
        description: 'Supprime une variation si aucun produit ne l\'utilise'
    })
    @ApiResponse({ status: 200, description: 'Variation supprimée avec succès.' })
    @ApiResponse({ status: 404, description: 'Variation non trouvée.' })
    @ApiResponse({
        status: 409,
        description: 'Impossible de supprimer: des produits utilisent cette variation'
    })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la variation' })
    removeVariation(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.removeVariation(id);
    }

    // =========================
    // Routes de vérification avant suppression
    // =========================

    @Get(':id/can-delete')
    @ApiOperation({
        summary: 'Vérifier si une catégorie peut être supprimée',
        description: 'Retourne si la catégorie peut être supprimée et le nombre de produits qui l\'utilisent'
    })
    @ApiResponse({
        status: 200,
        description: 'Informations sur la possibilité de suppression',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        canDelete: { type: 'boolean', example: false },
                        categoryId: { type: 'number', example: 1 },
                        categoryName: { type: 'string', example: 'Vêtements' },
                        blockers: {
                            type: 'object',
                            properties: {
                                directProducts: { type: 'number', example: 5 },
                                subCategoryProducts: { type: 'number', example: 12 },
                                variationProducts: { type: 'number', example: 8 },
                                total: { type: 'number', example: 25 }
                            }
                        },
                        message: { type: 'string', example: 'Cette catégorie ne peut pas être supprimée car 25 produit(s) l\'utilise(nt)' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Catégorie non trouvée.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la catégorie' })
    canDeleteCategory(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.canDeleteCategory(id);
    }

    @Get('subcategory/:id/can-delete')
    @ApiOperation({
        summary: 'Vérifier si une sous-catégorie peut être supprimée',
        description: 'Retourne si la sous-catégorie peut être supprimée et le nombre de produits qui l\'utilisent'
    })
    @ApiResponse({ status: 200, description: 'Informations sur la possibilité de suppression.' })
    @ApiResponse({ status: 404, description: 'Sous-catégorie non trouvée.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la sous-catégorie' })
    canDeleteSubCategory(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.canDeleteSubCategory(id);
    }

    @Get('variation/:id/can-delete')
    @ApiOperation({
        summary: 'Vérifier si une variation peut être supprimée',
        description: 'Retourne si la variation peut être supprimée et le nombre de produits qui l\'utilisent'
    })
    @ApiResponse({ status: 200, description: 'Informations sur la possibilité de suppression.' })
    @ApiResponse({ status: 404, description: 'Variation non trouvée.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la variation' })
    canDeleteVariation(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.canDeleteVariation(id);
    }
}
