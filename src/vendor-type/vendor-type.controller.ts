import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VendorTypeService } from './vendor-type.service';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { UpdateVendorTypeDto } from './dto/update-vendor-type.dto';
import { VendorTypeResponseDto } from './dto/vendor-type-response.dto';
import { VendorWithDesignsAndProductsResponseDto, VendorsListResponseDto } from './dto/vendor-with-designs-products-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Vendor Types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor-types')
export class VendorTypeController {
  constructor(private readonly vendorTypeService: VendorTypeService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Créer un nouveau type de vendeur' })
  @ApiResponse({
    status: 201,
    description: 'Type de vendeur créé avec succès',
    type: VendorTypeResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Le type existe déjà' })
  create(@Body() createVendorTypeDto: CreateVendorTypeDto) {
    return this.vendorTypeService.create(createVendorTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les types de vendeurs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des types de vendeurs',
    type: [VendorTypeResponseDto],
  })
  findAll() {
    return this.vendorTypeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un type de vendeur par ID' })
  @ApiResponse({
    status: 200,
    description: 'Type de vendeur trouvé',
    type: VendorTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Type introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorTypeService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Modifier un type de vendeur' })
  @ApiResponse({
    status: 200,
    description: 'Type de vendeur modifié avec succès',
    type: VendorTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Type introuvable' })
  @ApiResponse({ status: 409, description: 'Le nouveau nom existe déjà' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorTypeDto: UpdateVendorTypeDto,
  ) {
    return this.vendorTypeService.update(id, updateVendorTypeDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Supprimer un type de vendeur' })
  @ApiResponse({ status: 200, description: 'Type de vendeur supprimé' })
  @ApiResponse({ status: 404, description: 'Type introuvable' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer car utilisé par des vendeurs',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorTypeService.remove(id);
  }

  // 🌐 ENDPOINTS PUBLICS - Sans authentification
  @Get('vendors/with-designs-products')
  @ApiOperation({ summary: 'Récupérer tous les vendeurs avec leurs designs et produits (PUBLIC)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des vendeurs avec leurs designs et produits',
    type: VendorsListResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'vendorTypeId', required: false, type: Number, description: 'Filter by vendor type ID' })
  @ApiQuery({ name: 'country', required: false, type: String, description: 'Filter by country' })
  findAllVendorsWithDesignsAndProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('vendorTypeId') vendorTypeId?: string,
    @Query('country') country?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const vendorTypeIdNum = vendorTypeId ? parseInt(vendorTypeId, 10) : undefined;

    return this.vendorTypeService.findAllVendorsWithDesignsAndProducts(
      pageNum,
      limitNum,
      vendorTypeIdNum,
      country,
    );
  }

  @Get('vendors/:vendorId/with-designs-products')
  @ApiOperation({ summary: "Récupérer un vendeur spécifique avec ses designs et produits (PUBLIC)" })
  @ApiResponse({
    status: 200,
    description: 'Vendeur avec ses designs et produits',
    type: VendorWithDesignsAndProductsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendeur introuvable' })
  findVendorWithDesignsAndProducts(@Param('vendorId', ParseIntPipe) vendorId: number) {
    return this.vendorTypeService.findVendorWithDesignsAndProducts(vendorId);
  }
}
