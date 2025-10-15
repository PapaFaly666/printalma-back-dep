import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateVariationDto } from './dto/create-variation.dto';
import { VariationService } from './variation.service';

@ApiTags('Variations')
@Controller('variations')
export class VariationController {
  constructor(private readonly variationService: VariationService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une variation' })
  @ApiResponse({ status: 201, description: 'Variation créée avec succès' })
  async create(@Body() dto: CreateVariationDto) {
    return this.variationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les variations' })
  @ApiQuery({ name: 'subCategoryId', required: false, type: Number })
  async findAll(@Query('subCategoryId') subCategoryId?: string) {
    const parsedSubCategoryId = subCategoryId ? parseInt(subCategoryId, 10) : undefined;
    return this.variationService.findAll(parsedSubCategoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une variation par ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.variationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une variation' })
  @ApiResponse({ status: 200, description: 'Variation mise à jour avec succès' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateVariationDto>
  ) {
    return this.variationService.update(id, dto);
  }
}
