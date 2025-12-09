import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { VendorGalleryService } from './vendor-gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { TogglePublishDto } from './dto/toggle-publish.dto';
import { GalleryResponseDto, PaginatedGalleryResponseDto } from './dto/gallery-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorGuard } from '../core/guards/vendor.guard';
import { GetUser } from '../core/decorators/get-user.decorator';
import { GalleryStatus } from '@prisma/client';

@ApiTags('Vendor Galleries')
@Controller('vendor/galleries')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth()
export class VendorGalleryController {
  constructor(private readonly galleryService: VendorGalleryService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle galerie',
    description: 'Crée une galerie avec exactement 5 images. Les images sont uploadées sur Cloudinary.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Galerie créée avec succès',
    type: GalleryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation échouée - nombre d\'images incorrect ou format invalide',
  })
  @UseInterceptors(FilesInterceptor('images', 5))
  async createGallery(
    @GetUser('id') vendorId: number,
    @Body(ValidationPipe) createGalleryDto: CreateGalleryDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.galleryService.createGallery(vendorId, createGalleryDto, files);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les galeries du vendeur',
    description: 'Récupère toutes les galeries du vendeur connecté avec pagination',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: GalleryStatus,
    example: GalleryStatus.PUBLISHED,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des galeries récupérée avec succès',
    type: PaginatedGalleryResponseDto,
  })
  async getVendorGalleries(
    @GetUser('id') vendorId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: GalleryStatus,
  ) {
    return this.galleryService.getVendorGalleries(
      vendorId,
      page || 1,
      limit || 10,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une galerie spécifique',
    description: 'Récupère une galerie par son ID',
  })
  @ApiParam({ name: 'id', description: 'ID de la galerie', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Galerie récupérée avec succès',
    type: GalleryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Galerie non trouvée',
  })
  async getGallery(
    @GetUser('id') vendorId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const gallery = await this.galleryService.getGalleryById(id, vendorId);
    return {
      success: true,
      data: gallery,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Mettre à jour une galerie',
    description: 'Met à jour les informations d\'une galerie (titre, description, statut)',
  })
  @ApiParam({ name: 'id', description: 'ID de la galerie', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Galerie mise à jour avec succès',
    type: GalleryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Galerie non trouvée',
  })
  async updateGallery(
    @GetUser('id') vendorId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateGalleryDto: UpdateGalleryDto,
  ) {
    return this.galleryService.updateGallery(id, vendorId, updateGalleryDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une galerie',
    description: 'Supprime une galerie (soft delete) et ses images associées sur Cloudinary',
  })
  @ApiParam({ name: 'id', description: 'ID de la galerie', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Galerie supprimée avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Galerie non trouvée',
  })
  async deleteGallery(
    @GetUser('id') vendorId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.galleryService.deleteGallery(id, vendorId);
  }

  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Publier ou dépublier une galerie',
    description: 'Change le statut de publication d\'une galerie. Nécessite exactement 5 images.',
  })
  @ApiParam({ name: 'id', description: 'ID de la galerie', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statut de publication modifié avec succès',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'La galerie ne contient pas exactement 5 images',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Galerie non trouvée',
  })
  async togglePublish(
    @GetUser('id') vendorId: number,
    @Param('id') id: string, // Changé de ParseIntPipe à string pour éviter le conflit
    @Body(ValidationPipe) togglePublishDto: TogglePublishDto,
  ) {
    // Si l'ID est "my-gallery", utiliser la méthode du nouveau système
    if (id === 'my-gallery') {
      return this.galleryService.toggleGalleryPublishByVendorId(
        vendorId,
        togglePublishDto.is_published,
      );
    }

    // Sinon, utiliser l'ancien système avec parsing manuel
    const galleryId = parseInt(id);
    if (isNaN(galleryId)) {
      throw new BadRequestException('ID de galerie invalide');
    }

    return this.galleryService.togglePublish(
      galleryId,
      vendorId,
      togglePublishDto.is_published,
    );
  }
}
