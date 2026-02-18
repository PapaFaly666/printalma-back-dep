import {
  Controller,
  Get,
  Put,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HomeContentService } from './home-content.service';
import { UpdateContentDto } from './dto/update-content.dto';

@Controller('admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class AdminContentController {
  constructor(private readonly homeContentService: HomeContentService) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Récupérer tout le contenu (Admin)
   * GET /api/admin/content
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getContent() {
    return this.homeContentService.getContent();
  }

  /**
   * Sauvegarder tout le contenu (Admin)
   * PUT /api/admin/content
   */
  @Put()
  @HttpCode(HttpStatus.OK)
  async updateContent(@Body() updateDto: UpdateContentDto) {
    return this.homeContentService.updateContent(updateDto);
  }

  /**
   * Upload d'image vers Cloudinary (Admin)
   * POST /api/admin/content/upload
   *
   * Supporte: JPG, PNG, SVG, WEBP (max 5MB)
   *
   * @param file - Fichier image
   * @param section - Section (designs, influencers, merchandising)
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
      },
      fileFilter: (req, file, cb) => {
        // MIME types autorisés pour les images classiques
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/svg+xml',
          'text/xml', // Certains navigateurs envoient text/xml pour les SVG
        ];

        // Vérifier le MIME type
        const isValidMimeType = allowedMimeTypes.includes(file.mimetype);

        // Vérifier l'extension pour les SVG avec MIME type atypique
        const isSvgByExtension = file.originalname.toLowerCase().endsWith('.svg');

        if (isValidMimeType || isSvgByExtension) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Format non supporté. Utilisez JPG, PNG, WEBP ou SVG'), false);
        }
      },
    })
  )
  @HttpCode(HttpStatus.OK)
  async uploadContentImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('section') section: string,
  ) {
    if (!file) {
      return {
        success: false,
        message: 'Aucun fichier fourni',
      };
    }

    const result = await this.homeContentService.uploadContentImage(
      file,
      section,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Initialiser le contenu (Seed) - À utiliser uniquement lors de la première installation
   * POST /api/admin/content/initialize
   */
  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  async initializeContent() {
    return this.homeContentService.initializeContent();
  }
}
