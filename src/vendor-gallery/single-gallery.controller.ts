import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  HttpStatus,
  ParseIntPipe,
  Query,
  Param,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { VendorGalleryService } from './vendor-gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { TogglePublishDto } from './dto/toggle-publish.dto';
import { GalleryResponseDto } from './dto/gallery-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorGuard } from '../core/guards/vendor.guard';
import { GetUser } from '../core/decorators/get-user.decorator';

@ApiTags('Vendor Single Gallery')
@Controller('vendor/galleries')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth()
export class SingleGalleryController {
  constructor(private readonly galleryService: VendorGalleryService) {}

  @Get('my-gallery')
  @ApiOperation({
    summary: 'Récupérer la galerie du vendeur connecté',
    description: 'Récupère la galerie unique du vendeur connecté',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Galerie récupérée avec succès',
    type: GalleryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aucune galerie trouvée pour ce vendeur',
  })
  async getMyGallery(@GetUser('id') vendorId: number) {
    const gallery = await this.galleryService.getGalleryByVendorId(vendorId);

    if (!gallery) {
      return {
        success: true,
        data: {
          gallery: null,
        },
      };
    }

    return {
      success: true,
      data: {
        gallery,
      },
    };
  }

  @Post('my-gallery')
  @ApiOperation({
    summary: 'Créer ou mettre à jour la galerie du vendeur',
    description: 'Crée une nouvelle galerie ou met à jour la galerie existante avec exactement 5 images',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Galerie créée ou mise à jour avec succès',
    type: GalleryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation échouée - nombre d\'images incorrect ou format invalide',
  })
  @UseInterceptors(FilesInterceptor('images', 5))
  async createOrUpdateMyGallery(
    @GetUser('id') vendorId: number,
    @Body(ValidationPipe) createGalleryDto: CreateGalleryDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.galleryService.createOrUpdateGallery(vendorId, createGalleryDto, files);
  }

  @Put('my-gallery')
  @ApiOperation({
    summary: 'Mettre à jour les informations de la galerie',
    description: 'Met à jour le titre, la description et le statut de la galerie',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Galerie mise à jour avec succès',
    type: GalleryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aucune galerie trouvée pour ce vendeur',
  })
  async updateMyGalleryInfo(
    @GetUser('id') vendorId: number,
    @Body(ValidationPipe) updateGalleryDto: UpdateGalleryDto,
  ) {
    return this.galleryService.updateGalleryByVendorId(vendorId, updateGalleryDto);
  }

  @Patch('my-gallery/publish')
  @ApiOperation({
    summary: 'Publier ou dépublier la galerie',
    description: 'Change le statut de publication de la galerie. Nécessite exactement 5 images.',
  })
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
    description: 'Aucune galerie trouvée pour ce vendeur',
  })
  async toggleMyGalleryPublish(
    @GetUser('id') vendorId: number,
    @Body(ValidationPipe) togglePublishDto: TogglePublishDto,
  ) {
    return this.galleryService.toggleGalleryPublishByVendorId(
      vendorId,
      togglePublishDto.is_published,
    );
  }

  @Delete('my-gallery')
  @ApiOperation({
    summary: 'Supprimer la galerie du vendeur',
    description: 'Supprime (soft delete) la galerie et ses images associées sur Cloudinary',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Galerie supprimée avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aucune galerie trouvée pour ce vendeur',
  })
  async deleteMyGallery(@GetUser('id') vendorId: number) {
    return this.galleryService.deleteGalleryByVendorId(vendorId);
  }

  @Get('my-gallery/stats')
  @ApiOperation({
    summary: 'Obtenir les statistiques de la galerie',
    description: 'Retourne des informations sur l\'état de la galerie du vendeur',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques récupérées avec succès',
  })
  async getMyGalleryStats(@GetUser('id') vendorId: number) {
    return this.galleryService.getGalleryStats(vendorId);
  }
}