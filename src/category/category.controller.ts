// categories/category.controller.ts
import { Controller, Get, Post, Body, Patch, Put, Param, Delete, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
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
}
