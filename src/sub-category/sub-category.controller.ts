import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { SubCategoryService } from './sub-category.service';

@ApiTags('SubCategories')
@Controller('sub-categories')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une sous-catégorie' })
  @ApiResponse({ status: 201, description: 'Sous-catégorie créée avec succès' })
  async create(@Body() dto: CreateSubCategoryDto) {
    return this.subCategoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les sous-catégories' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  async findAll(@Query('categoryId') categoryId?: string) {
    const parsedCategoryId = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.subCategoryService.findAll(parsedCategoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une sous-catégorie par ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subCategoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une sous-catégorie' })
  @ApiResponse({ status: 200, description: 'Sous-catégorie mise à jour avec succès' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateSubCategoryDto>
  ) {
    return this.subCategoryService.update(id, dto);
  }
}
