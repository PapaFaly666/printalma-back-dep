import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
  Logger,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorGuard } from '../core/guards/vendor.guard';
import {
  SaveDesignTransformsDto,
  LoadDesignTransformsQueryDto,
} from './dto/vendor-design-transform.dto';
import { VendorDesignTransformService } from './vendor-design-transform.service';

@ApiBearerAuth()
@ApiTags('Vendor Design Transforms')
@Controller('vendor/design-transforms')
@UseGuards(JwtAuthGuard, VendorGuard)
export class VendorDesignTransformController {
  private readonly logger = new Logger(VendorDesignTransformController.name);

  constructor(
    private readonly transformService: VendorDesignTransformService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sauvegarder les transformations de design' })
  @ApiBody({ type: SaveDesignTransformsDto })
  @ApiResponse({ status: 200, description: 'Transformations sauvegardées' })
  async saveTransforms(
    @Body() dto: SaveDesignTransformsDto,
    @Request() req: any,
  ) {
    const vendorId = req.user.sub;
    
    // Normaliser le paramètre designUrl : ignorer la chaîne "undefined"
    const designUrl = dto.designUrl && dto.designUrl !== 'undefined' ? dto.designUrl : undefined;
    const normalizedDto = { ...dto, designUrl };
    
    const logUrl = designUrl ? designUrl.substring(0, 50) : 'undefined';
    this.logger.log(`🎯 POST /vendor/design-transforms - vendorId: ${vendorId}, productId: ${dto.productId}, designUrl: ${logUrl}...`);
    this.logger.log(`📋 DTO: ${JSON.stringify({ ...normalizedDto, designUrl: logUrl })}`);
    
    const result = await this.transformService.saveTransforms(vendorId, normalizedDto);
    
    this.logger.log(`✅ Transform sauvegardé: id=${result.id}`);
    return {
      success: true,
      message: 'Transformations sauvegardées',
      data: {
        id: result.id,
        lastModified: result.lastModified,
      },
    };
  }

  /**
   * 🔄 Alias legacy : POST /api/vendor/design-transforms/save
   * Certains fronts plus anciens appellent encore cette route.
   * On la redirige vers la méthode moderne `saveTransforms`.
   */
  @Post('save')
  @HttpCode(HttpStatus.OK)
  async saveTransformsLegacy(
    @Body() dto: SaveDesignTransformsDto,
    @Request() req: any,
  ) {
    return this.saveTransforms(dto, req);
  }

  @Get(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Charger les transformations enregistrées' })
  @ApiParam({ name: 'productId', type: 'number' })
  @ApiQuery({ name: 'designUrl', type: 'string' })
  @ApiResponse({ status: 200, description: 'Transformations trouvées ou null' })
  async loadTransforms(
    @Param('productId') productId: string,
    @Query() query: LoadDesignTransformsQueryDto,
    @Request() req: any,
  ) {
    const vendorId = req.user.sub;
    const productIdNumber = parseInt(productId, 10);
    
    // Normaliser le paramètre designUrl : ignorer la chaîne "undefined"
    const designUrl = query.designUrl && query.designUrl !== 'undefined' ? query.designUrl : undefined;

    this.logger.log(`🎯 GET /vendor/design-transforms/${productId} - vendorId: ${vendorId}, designUrl: ${designUrl?.substring(0, 50)}...`);
    this.logger.log(`📋 Params: productId=${productId} (string) -> ${productIdNumber} (number), query=${JSON.stringify({ ...query, designUrl: designUrl?.substring(0, 50) + '...' })}`);
    
    if (isNaN(productIdNumber)) {
      this.logger.error(`❌ Invalid productId: ${productId}`);
      throw new Error('Invalid productId parameter');
    }
    
    const transform = await this.transformService.loadTransforms(
      vendorId,
      productIdNumber,
      designUrl,
    );

    if (transform) {
      this.logger.log(`✅ Transform trouvé et retourné`);
    } else {
      this.logger.log(`🔍 Aucun transform trouvé`);
    }

    return {
      success: true,
      data: transform
        ? {
            productId: productIdNumber,
            designUrl: designUrl,
            transforms: transform.transforms,
            lastModified: transform.lastModified.getTime(),
          }
        : null,
    };
  }

  /**
   * 🆕 ENDPOINT: Obtient le positionnement optimal pour un produit
   */
  @Get('products/:productId/design-positioning')
  async getOptimalPositioning(
    @Param('productId') productId: number,
    @Query('designUrl') designUrl: string,
    @Request() req: any
  ) {
    try {
      const result = await this.transformService.getOptimalPositioning(
        req.user.id,
        Number(productId),
        designUrl
      );
      
      return {
        success: true,
        data: result,
        message: `Positionnement optimal pour ${result.productType} calculé`
      };
    } catch (error) {
      this.logger.error('❌ Erreur récupération positionnement optimal:', error);
      throw error;
    }
  }

  /**
   * 🆕 ENDPOINT: Sauvegarde un positionnement personnalisé
   */
  @Post('products/:productId/design-positioning')
  async saveCustomPositioning(
    @Param('productId') productId: number,
    @Body() dto: {
      designUrl: string;
      positioning: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
      };
    },
    @Request() req: any
  ) {
    try {
      await this.transformService.saveCustomPositioning(
        req.user.id,
        Number(productId),
        dto.designUrl,
        dto.positioning
      );
      
      return {
        success: true,
        message: 'Positionnement personnalisé sauvegardé avec succès'
      };
    } catch (error) {
      this.logger.error('❌ Erreur sauvegarde positionnement:', error);
      throw error;
    }
  }

  /**
   * 🆕 ENDPOINT: Obtient les presets de positionnement pour un type de produit
   */
  @Get('products/:productId/positioning-presets')
  async getPositioningPresets(
    @Param('productId') productId: number,
    @Request() req: any
  ) {
    try {
      const result = await this.transformService.getOptimalPositioning(
        req.user.id,
        Number(productId)
      );
      
      return {
        success: true,
        data: {
          productType: result.productType,
          description: result.description,
          presets: result.presets
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur récupération presets:', error);
      throw error;
    }
  }
} 