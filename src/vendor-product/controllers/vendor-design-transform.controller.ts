import { Controller, Post, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DesignPositionService } from '../services/design-position.service';

interface LegacyTransformPayload {
  productId: number;
  designId?: number; // non utilisé pour la sauvegarde directe via designUrl, mais on le garde pour compat
  transforms: any;
  designUrl: string;
  lastModified?: number | string;
}

@Controller('api/vendor/design-transforms')
@UseGuards(JwtAuthGuard)
export class VendorDesignTransformController {
  private readonly logger = new Logger(VendorDesignTransformController.name);

  constructor(private readonly service: DesignPositionService) {}

  /**
   * Nouveau endpoint « moderne »  (utilisé par certains appels du frontend)
   * POST /api/vendor/design-transforms
   */
  @Post()
  async saveDirect(
    @Req() req: any,
    @Body() payload: LegacyTransformPayload
  ) {
    const vendorId = req.user.id;
    const { productId, designUrl, transforms } = payload;

    this.logger.log(`💾 saveDirect - vendorId=${vendorId}, productId=${productId}`);

    await this.service.savePositionFromTransform(
      vendorId,
      Number(productId),
      designUrl,
      transforms
    );

    return {
      success: true,
      message: 'Transformations sauvegardées',
      data: {}
    };
  }

  /**
   * Endpoint de fallback legacy utilisé par certains anciens bundles frontend
   * POST /api/vendor/design-transforms/save
   */
  @Post('save')
  async saveLegacy(
    @Req() req: any,
    @Body() payload: LegacyTransformPayload
  ) {
    const vendorId = req.user.id;
    const { productId, designUrl, transforms } = payload;

    this.logger.log(`💾 saveLegacy - vendorId=${vendorId}, productId=${productId}`);

    await this.service.savePositionFromTransform(
      vendorId,
      Number(productId),
      designUrl,
      transforms
    );

    return {
      success: true,
      message: 'Transformations legacy sauvegardées',
      data: {}
    };
  }
} 
 
 
 
 