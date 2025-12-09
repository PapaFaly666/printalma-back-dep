import {
  Controller,
  Get,
  Param,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { VendorGalleryService } from './vendor-gallery.service';
import { GalleryResponseDto } from './dto/gallery-response.dto';

@ApiTags('Public Vendor Gallery')
@Controller('public/galleries/vendor')
export class PublicVendorGalleryController {
  constructor(private readonly galleryService: VendorGalleryService) {}

  @Get(':vendorId')
  @ApiOperation({
    summary: 'Récupérer la galerie publique d\'un vendeur',
    description: 'Récupère la galerie publiée d\'un vendeur spécifique',
  })
  @ApiParam({ name: 'vendorId', description: 'ID du vendeur', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Galerie récupérée avec succès',
    type: GalleryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aucune galerie publiée trouvée pour ce vendeur',
  })
  async getPublicVendorGallery(@Param('vendorId', ParseIntPipe) vendorId: number) {
    const gallery = await this.galleryService.getPublishedGalleryByVendorId(vendorId);

    if (!gallery) {
      return {
        success: false,
        message: 'Aucune galerie publiée trouvée pour ce vendeur',
      };
    }

    return {
      success: true,
      data: {
        gallery,
      },
    };
  }
}