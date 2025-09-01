// categories/category.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    //@UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Créer une catégorie' })
    @ApiResponse({ status: 201, description: 'Catégorie créée avec succès.' })
    @ApiResponse({ status: 400, description: 'Données invalides.' })
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoryService.create(createCategoryDto);
    }

    //@UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Lister toutes les catégories' })
    @ApiResponse({ status: 200, description: 'Liste des catégories.' })
    findAll() {
        return this.categoryService.findAll();
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
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie' })
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