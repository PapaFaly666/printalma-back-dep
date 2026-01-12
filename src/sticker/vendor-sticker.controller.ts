import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StickerService } from './sticker.service';
import { CreateStickerDto } from './dto/create-sticker.dto';
import { UpdateStickerDto } from './dto/update-sticker.dto';
import { StickerQueryDto } from './dto/sticker-query.dto';

@ApiTags('Vendor Stickers')
@ApiBearerAuth()
@Controller('vendor/stickers')
@UseGuards(JwtAuthGuard)
export class VendorStickerController {
  constructor(private readonly stickerService: StickerService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau sticker' })
  @ApiResponse({ status: 201, description: 'Sticker créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async create(@Request() req, @Body() createDto: CreateStickerDto) {
    const vendorId = req.user.id;
    return this.stickerService.create(vendorId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les stickers du vendeur' })
  @ApiResponse({ status: 200, description: 'Liste des stickers' })
  async findAll(@Request() req, @Query() query: StickerQueryDto) {
    const vendorId = req.user.id;
    return this.stickerService.findAllByVendor(vendorId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'un sticker' })
  @ApiResponse({ status: 200, description: 'Détails du sticker' })
  @ApiResponse({ status: 404, description: 'Sticker introuvable' })
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const vendorId = req.user.id;
    return this.stickerService.findOne(id, vendorId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un sticker' })
  @ApiResponse({ status: 200, description: 'Sticker mis à jour' })
  @ApiResponse({ status: 404, description: 'Sticker introuvable' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStickerDto,
  ) {
    const vendorId = req.user.id;
    return this.stickerService.update(id, vendorId, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un sticker' })
  @ApiResponse({ status: 200, description: 'Sticker supprimé' })
  @ApiResponse({ status: 404, description: 'Sticker introuvable' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const vendorId = req.user.id;
    return this.stickerService.remove(id, vendorId);
  }
}
