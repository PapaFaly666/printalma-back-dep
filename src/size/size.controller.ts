// sizes/size.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { SizeService } from './size.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Sizes')
@Controller('sizes')
export class SizeController {
  constructor(private readonly sizeService: SizeService) {}

  //@UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une taille' })
  @ApiResponse({ status: 201, description: 'Taille créée avec succès' })
  @ApiBody({
    type: CreateSizeDto,
    description: 'Les tailles possibles sont: XS, S, M, L, XL, XXL, XXXL',
  })
  create(@Body() createSizeDto: CreateSizeDto) {
    return this.sizeService.create(createSizeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les tailles' })
  @ApiResponse({ status: 200, description: 'Liste des tailles (XS, S, M, L, XL, XXL, XXXL)' })
  findAll() {
    return this.sizeService.findAll();
  }

  //@UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une taille par ID' })
  @ApiResponse({ status: 200, description: 'Taille trouvée' })
  @ApiResponse({ status: 404, description: 'Taille non trouvée' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sizeService.findOne(id);
  }

  //@UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une taille' })
  @ApiResponse({ status: 204, description: 'Taille supprimée' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sizeService.remove(id);
  }
}