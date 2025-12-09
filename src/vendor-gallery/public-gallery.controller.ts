import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { VendorGalleryService } from './vendor-gallery.service';
import { PaginatedGalleryResponseDto, GalleryResponseDto } from './dto/gallery-response.dto';

@ApiTags('Public Galleries')
@Controller('public/galleries')
export class PublicGalleryController {
  constructor(private readonly galleryService: VendorGalleryService) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les galeries publiées',
    description: 'Récupère toutes les galeries publiées (accessible au public)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiQuery({ name: 'vendorId', required: false, type: Number, description: 'Filtrer par vendeur' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des galeries publiées',
    type: PaginatedGalleryResponseDto,
  })
  async getPublishedGalleries(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('vendorId', new ParseIntPipe({ optional: true })) vendorId?: number,
  ) {
    return this.galleryService.getPublishedGalleries(
      vendorId,
      page || 1,
      limit || 12,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une galerie publiée par son ID',
    description: 'Récupère une galerie publiée spécifique (accessible au public)',
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
  async getPublishedGallery(@Param('id', ParseIntPipe) id: number) {
    const gallery = await this.galleryService.getGalleryById(id);

    if (!gallery.isPublished) {
      return {
        success: false,
        message: 'Cette galerie n\'est pas publiée',
      };
    }

    return {
      success: true,
      data: gallery,
    };
  }
}
