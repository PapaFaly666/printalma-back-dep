import {
  Controller,
  Get,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorGuard } from '../core/guards/vendor.guard';
import { VendorPublishService } from './vendor-publish.service';

@ApiBearerAuth()
@ApiTags('Vendor Design Products')
@Controller('vendor-design-products')
@UseGuards(JwtAuthGuard, VendorGuard)
export class VendorDesignProductsController {
  private readonly logger = new Logger(VendorDesignProductsController.name);

  constructor(
    private readonly vendorPublishService: VendorPublishService,
  ) {}

  /**
   * 📋 ENDPOINT - Récupérer tous les designs du vendeur
   * Compatible avec l'API attendue par le frontend selon ha.md
   */
  @Get()
  @ApiOperation({
    summary: '📋 Lister les designs du vendeur (compatible frontend)',
    description: `
    Endpoint compatible avec l'API attendue par le dashboard frontend.
    Retourne la liste des designs créés par le vendeur connecté.

    **Structure de réponse conforme à ha.md:**
    \`\`\`json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "name": "Mon Super Design",
          "description": "Description du design",
          "status": "validated",
          "createdAt": "2024-01-15T10:30:00Z",
          "updatedAt": "2024-01-15T10:30:00Z",
          "designUrl": "https://cloudinary.../design.png",
          "vendor": {
            "id": 123,
            "email": "vendor@example.com",
            "shop_name": "Mon Shop"
          }
        }
      ]
    }
    \`\`\`
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des designs du vendeur (format frontend)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Mon Super Design' },
              description: { type: 'string', example: 'Description du design' },
              status: { type: 'string', example: 'validated' },
              createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              updatedAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              designUrl: { type: 'string', example: 'https://cloudinary.../design.png' },
              vendor: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 123 },
                  email: { type: 'string', example: 'vendor@example.com' },
                  shop_name: { type: 'string', example: 'Mon Shop' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié'
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Role VENDEUR requis'
  })
  async getVendorDesignProducts(@Request() req: any) {
    const vendorId = req.user.sub;
    this.logger.log(`📋 Récupération designs pour dashboard vendeur ${vendorId}`);

    try {
      // Utiliser le service existant pour récupérer les designs
      const designs = await this.vendorPublishService.getVendorDesigns(vendorId, {
        limit: 100, // Récupérer tous les designs pour le dashboard
        offset: 0,
        status: 'all'
      });

      // Adapter la réponse au format attendu par le frontend
      const formattedData = designs.data.designs.map(design => {
        // Convertir les propriétés booléennes en status string
        let status = 'pending';
        if (design.isValidated) status = 'validated';
        else if (design.isDraft) status = 'draft';
        else if (design.isPending) status = 'pending';

        return {
          id: design.id,
          name: design.name,
          description: design.description || '',
          status: status,
          createdAt: design.createdAt,
          updatedAt: design.createdAt, // utiliser createdAt si updatedAt n'existe pas
          designUrl: design.imageUrl, // utiliser imageUrl comme designUrl
          vendor: {
            id: vendorId,
            email: req.user.email || '',
            shop_name: req.user.shop_name || 'Mon Shop'
          }
        };
      });

      return {
        success: true,
        data: formattedData
      };

    } catch (error) {
      this.logger.error(`❌ Erreur récupération designs pour dashboard: ${error.message}`);
      throw error;
    }
  }
}