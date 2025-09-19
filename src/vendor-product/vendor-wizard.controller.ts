import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorGuard } from '../core/guards/vendor.guard';
import { VendorWizardService } from './vendor-wizard.service';
import { WizardCreateProductDto, WizardProductDataDto } from './dto/wizard-create-product.dto';

@ApiTags('Vendor Wizard')
@Controller('api/vendeur')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth()
export class VendorWizardController {
  private readonly logger = new Logger(VendorWizardController.name);

  constructor(private readonly vendorWizardService: VendorWizardService) {}

  @Post('create-product')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un produit via le wizard vendeur',
    description: 'Endpoint spécialisé pour la création de produits via l\'interface wizard multi-étapes'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Produit créé avec succès via le wizard',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            vendorId: { type: 'number' },
            productName: { type: 'string' },
            productPrice: { type: 'number' },
            status: { type: 'string' },
            wizard: {
              type: 'object',
              properties: {
                createdViaWizard: { type: 'boolean' },
                priceCustomized: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou erreur de validation',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Authentification vendeur requise'
  })
  @UseInterceptors(FilesInterceptor('files', 16, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB par image
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new BadRequestException(`Type non autorisé: ${file.mimetype}`), false);
      }

      if (file.fieldname === 'baseImage') {
        cb(null, true);
      } else if (file.fieldname.startsWith('detailImage_')) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Nom de champ invalide: ${file.fieldname}`), false);
      }
    }
  }))
  async createProductViaWizard(
    @Request() req: any,
    @Body() body: WizardCreateProductDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      this.logger.log('Création produit via wizard:', {
        vendorId: req.user?.id,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent']
      });

      // Vérifier l'authentification vendeur
      const user = req.user;
      if (!user || !['VENDEUR', 'ADMIN'].includes(user.role)) {
        throw new UnauthorizedException('Accès refusé - Authentification vendeur requise');
      }

      // Parser les données JSON du wizard
      let productData: WizardProductDataDto;
      try {
        productData = JSON.parse(body.productData);
      } catch (error) {
        throw new BadRequestException('Format de données invalide');
      }

      // Organiser les images avec hiérarchie
      const organizedFiles = this.organizeUploadedFiles(files);

      // Vérifier que l'image de base est présente
      if (!organizedFiles.baseImage) {
        throw new BadRequestException('Image principale (base) obligatoire');
      }

      // Appeler le service pour traiter la création
      const result = await this.vendorWizardService.createProductViaWizard(
        user.id,
        productData,
        organizedFiles
      );

      return {
        success: true,
        message: 'Produit créé avec succès via le wizard',
        data: result
      };

    } catch (error) {
      this.logger.error('Erreur création produit wizard:', {
        error: error.message,
        stack: error.stack,
        vendorId: req.user?.id
      });

      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }

      throw new BadRequestException('Erreur lors de la création du produit');
    }
  }

  private organizeUploadedFiles(files: Express.Multer.File[]) {
    const organized = {
      baseImage: null as Express.Multer.File | null,
      detailImages: [] as Express.Multer.File[]
    };

    for (const file of files) {
      if (file.fieldname === 'baseImage') {
        organized.baseImage = file;
      } else if (file.fieldname.startsWith('detailImage_')) {
        organized.detailImages.push(file);
      }
    }

    // Trier les images de détail par ordre
    organized.detailImages.sort((a, b) => {
      const aIndex = parseInt(a.fieldname.replace('detailImage_', ''));
      const bIndex = parseInt(b.fieldname.replace('detailImage_', ''));
      return aIndex - bIndex;
    });

    return organized;
  }
}