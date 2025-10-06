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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VendorTypeService } from './vendor-type.service';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { UpdateVendorTypeDto } from './dto/update-vendor-type.dto';
import { VendorTypeResponseDto } from './dto/vendor-type-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Vendor Types')
@ApiBearerAuth()
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
}
