// categories/category.controller.ts
import { Controller, Get, Post, Body, Patch, Put, Param, Delete, ParseIntPipe, HttpStatus, HttpCode, UseGuards, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryStructureDto } from './dto/create-category-structure.dto';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    //@UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Créer une catégorie avec vérification des doublons' })
    @ApiResponse({ status: 201, description: 'Catégorie créée avec succès.' })
    @ApiResponse({ status: 400, description: 'Données invalides.' })
    @ApiResponse({ status: 409, description: 'La catégorie existe déjà.' })
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoryService.create(createCategoryDto);
    }

    //@UseGuards(JwtAuthGuard)
    @Post('structure')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Créer une structure complète de catégories (parent > sous-catégorie > variations)',
        description: 'Crée automatiquement la hiérarchie complète selon la logique frontend. Réutilise les catégories existantes et saute les doublons.'
    })
    @ApiResponse({ status: 201, description: 'Structure créée avec succès.' })
    @ApiResponse({ status: 400, description: 'Données invalides.' })
    createStructure(@Body() dto: CreateCategoryStructureDto) {
        return this.categoryService.createCategoryStructure(dto);
    }

    //@UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Lister toutes les catégories' })
    @ApiResponse({ status: 200, description: 'Liste des catégories.' })
    findAll() {
        return this.categoryService.findAll();
    }

    //@UseGuards(JwtAuthGuard)
    @Get('hierarchy')
    @ApiOperation({
        summary: 'Récupérer les catégories avec leur hiérarchie complète (arbre)',
        description: 'Retourne les catégories organisées en arbre hiérarchique (parents > enfants > variations)'
    })
    @ApiResponse({ status: 200, description: 'Arbre hiérarchique des catégories.' })
    findAllHierarchy() {
        return this.categoryService.findAllHierarchy();
    }

    //@UseGuards(JwtAuthGuard)
    @Get('check-duplicate')
    @ApiOperation({ summary: 'Vérifier si une catégorie existe déjà' })
    @ApiQuery({ name: 'name', description: 'Nom de la catégorie', required: true })
    @ApiQuery({ name: 'parentId', description: 'ID du parent (null pour catégorie racine)', required: false })
    @ApiResponse({ status: 200, description: 'Résultat de la vérification.' })
    async checkDuplicate(
        @Query('name') name: string,
        @Query('parentId') parentId?: string
    ) {
        const parentIdNum = parentId ? parseInt(parentId, 10) : null;
        return this.categoryService.checkDuplicateCategory(name, parentIdNum);
    }

    //@UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Afficher une catégorie' })
    @ApiResponse({ status: 200, description: 'Catégorie trouvée.' })
    @ApiResponse({ status: 404, description: 'Catégorie non trouvée.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la catégorie' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.findOne(id);
    }

    //@UseGuards(JwtAuthGuard)
    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie (PUT - pour compatibilité frontend)' })
    @ApiResponse({ status: 200, description: 'Catégorie mise à jour avec succès.' })
    @ApiResponse({ status: 404, description: 'Catégorie non trouvée.' })
    @ApiResponse({ status: 409, description: 'Le nom de catégorie existe déjà.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la catégorie' })
    updatePut(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoryService.update(id, updateCategoryDto);
    }

    //@UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie (PATCH)' })
    @ApiResponse({ status: 200, description: 'Catégorie mise à jour.' })
    @ApiResponse({ status: 404, description: 'Catégorie non trouvée.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la catégorie' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoryService.update(id, updateCategoryDto);
    }

    //@UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer une catégorie' })
    @ApiResponse({ status: 204, description: 'Catégorie supprimée.' })
    @ApiResponse({ status: 404, description: 'Catégorie non trouvée.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la catégorie' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.remove(id);
    }
}