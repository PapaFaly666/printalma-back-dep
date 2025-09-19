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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorGuard } from '../core/guards/vendor.guard';
import { VendorWizardProductService } from './vendor-wizard-product.service';
import { CreateWizardProductDto, WizardProductResponseDto } from './dto/wizard-product.dto';

@ApiTags('Vendor Wizard Products')
@Controller('vendor')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth()
export class VendorWizardProductController {
  private readonly logger = new Logger(VendorWizardProductController.name);

  constructor(private readonly vendorWizardProductService: VendorWizardProductService) {}

  @Post('wizard-products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🎨 Créer un produit wizard (sans design)',
    description: `
    **ENDPOINT DÉDIÉ POUR PRODUITS WIZARD:**

    - ✅ **Spécialisé** : Uniquement pour produits avec images propres
    - ✅ **Sans design** : Pas besoin de designId
    - ✅ **Images base64** : Upload direct d'images personnalisées
    - ✅ **Validation marge** : Minimum 10% automatique
    - ✅ **Calculs auto** : Profit, revenu, commission calculés

    **DIFFÉRENCES AVEC /vendor/products :**
    - ❌ Pas de designId requis
    - ❌ Pas de productStructure complexe
    - ✅ Images propres au produit
    - ✅ Validation simplifiée
    `
  })
  @ApiBody({
    type: CreateWizardProductDto,
    description: 'Données pour créer un produit wizard',
    examples: {
      wizard_product: {
        summary: 'Produit wizard typique',
        value: {
          baseProductId: 34,
          vendorName: 'Sweat Custom Noir',
          vendorDescription: 'Sweat à capuche personnalisé de qualité',
          vendorPrice: 10000,
          vendorStock: 10,
          selectedColors: [
            {
              id: 1,
              name: 'Noir',
              colorCode: '#000000'
            }
          ],
          selectedSizes: [
            {
              id: 1,
              sizeName: 'S'
            },
            {
              id: 2,
              sizeName: 'M'
            }
          ],
          productImages: {
            baseImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
            detailImages: [
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
            ]
          },
          forcedStatus: 'DRAFT'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Produit wizard créé avec succès',
    type: WizardProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Prix trop bas. Minimum: 6600 FCFA (marge 10%)' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Produit de base introuvable',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Produit de base introuvable' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Authentification vendeur requise'
  })
  async createWizardProduct(
    @Body() createWizardProductDto: CreateWizardProductDto,
    @Request() req: any
  ): Promise<WizardProductResponseDto> {
    const vendorId = req.user.sub;
    this.logger.log(`🎨 Création produit WIZARD par vendeur ${vendorId}`);
    this.logger.log(`📥 Body reçu dans controller: ${JSON.stringify(createWizardProductDto, null, 2)}`);

    try {
      const result = await this.vendorWizardProductService.createWizardProduct(
        createWizardProductDto,
        vendorId
      );

      return result;

    } catch (error) {
      this.logger.error(`❌ Erreur création produit wizard: ${error.message}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(error.message || 'Erreur lors de la création du produit wizard');
    }
  }
}