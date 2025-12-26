import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CustomizationService } from './customization.service';
import { CreateCustomizationDto, UpdateCustomizationDto } from './dto/create-customization.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { multerConfig } from '../../multerConfig';

@ApiTags('Product Customizations')
@Controller('customizations')
export class CustomizationController {
  private readonly logger = new (require('@nestjs/common').Logger)(CustomizationController.name);

  constructor(private readonly customizationService: CustomizationService) {}

  /**
   * Sauvegarder une personnalisation (utilisateur ou guest)
   * POST /customizations
   * Query param optionnel: customizationId pour mettre à jour une personnalisation existante
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard) // Fonctionne avec ou sans authentification
  @ApiOperation({ summary: 'Save product customization' })
  @ApiResponse({ status: 201, description: 'Customization saved successfully' })
  async saveCustomization(
    @Body() dto: CreateCustomizationDto,
    @Query('customizationId') customizationId: string,
    @Req() req: any
  ) {
    // Debug logging - using .log() instead of .debug() for visibility
    this.logger.log(`📥 Received customization request:`);
    this.logger.log(`  - productId: ${dto.productId}`);
    this.logger.log(`  - colorVariationId: ${dto.colorVariationId}`);
    this.logger.log(`  - viewId: ${dto.viewId}`);
    this.logger.log(`  - designElements: ${Array.isArray(dto.designElements) ? dto.designElements.length : 'NOT AN ARRAY'} elements`);
    this.logger.log(`  - elementsByView: ${dto.elementsByView ? Object.keys(dto.elementsByView).length + ' views' : 'undefined'}`);

    if (dto.designElements && dto.designElements.length > 0) {
      this.logger.log(`  - First element: ${JSON.stringify(dto.designElements[0]).substring(0, 200)}...`);
    } else if (!dto.elementsByView) {
      this.logger.warn(`⚠️ designElements AND elementsByView are empty or undefined!`);
    }

    const userId = req.user?.id; // undefined si guest
    const customizationIdNum = customizationId ? parseInt(customizationId, 10) : undefined;
    return this.customizationService.upsertCustomization(dto, userId, customizationIdNum);
  }

  /**
   * 🎯 PURE STORAGE - Sauvegarder exactement comme localStorage
   * POST /customizations/pure
   *
   * Cette route stocke les données BIT-À-BIT identiques au localStorage du frontend
   * - Aucune transformation
   * - Aucune normalisation
   * - Préserve tous les \n, emojis, accents, décimales
   *
   * Utiliser cette route si vous voulez un stockage pur sans aucune modification
   */
  @Post('pure')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Save customization with pure storage (bit-to-bit identical to localStorage)',
    description: 'Stores design elements exactly as received, with no transformations or normalizations'
  })
  @ApiResponse({ status: 201, description: 'Customization saved with pure storage' })
  async saveCustomizationPure(
    @Body() dto: CreateCustomizationDto,
    @Query('customizationId') customizationId: string,
    @Req() req: any
  ) {
    this.logger.log(`💾 PURE Storage request:`);
    this.logger.log(`  - productId: ${dto.productId}`);
    this.logger.log(`  - designElements: ${dto.designElements?.length || 0} elements`);

    const userId = req.user?.id;
    const customizationIdNum = customizationId ? parseInt(customizationId, 10) : undefined;

    return this.customizationService.upsertCustomizationPure(dto, userId, customizationIdNum);
  }

  /**
   * Récupérer une personnalisation par ID
   * GET /customizations/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get customization by ID' })
  async getCustomization(@Param('id', ParseIntPipe) id: number) {
    return this.customizationService.getCustomizationById(id);
  }

  /**
   * Récupérer les personnalisations d'un utilisateur
   * GET /customizations/user/me?status=draft
   */
  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user customizations' })
  async getMyCustomizations(
    @Req() req: any,
    @Query('status') status?: string
  ) {
    return this.customizationService.getUserCustomizations(req.user.id, status);
  }

  /**
   * Récupérer les personnalisations d'une session (guest)
   * GET /customizations/session/:sessionId?status=draft
   */
  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get session customizations (for guests)' })
  async getSessionCustomizations(
    @Param('sessionId') sessionId: string,
    @Query('status') status?: string
  ) {
    return this.customizationService.getSessionCustomizations(sessionId, status);
  }

  /**
   * Mettre à jour une personnalisation
   * PUT /customizations/:id
   */
  @Put(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Update customization' })
  async updateCustomization(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomizationDto
  ) {
    return this.customizationService.updateCustomization(id, dto);
  }

  /**
   * Supprimer une personnalisation
   * DELETE /customizations/:id
   */
  @Delete(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Delete customization' })
  async deleteCustomization(@Param('id', ParseIntPipe) id: number) {
    return this.customizationService.deleteCustomization(id);
  }

  /**
   * Migrer les personnalisations d'une session guest vers l'utilisateur connecté
   * POST /customizations/migrate
   * Body: { sessionId: string }
   */
  @Post('migrate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Migrate guest customizations to authenticated user' })
  @ApiResponse({ status: 200, description: 'Customizations migrated successfully' })
  async migrateCustomizations(
    @Body('sessionId') sessionId: string,
    @Req() req: any
  ) {
    return this.customizationService.migrateGuestCustomizations(sessionId, req.user.id);
  }

  /**
   * Upload d'une image pour une personnalisation
   * POST /customizations/upload-image
   */
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload image for customization' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, WebP, SVG - max 10MB)'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        publicId: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' }
      }
    }
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.customizationService.uploadCustomizationImage(file);
  }

  /**
   * Upload d'une image de prévisualisation en base64
   * POST /customizations/upload-preview
   */
  @Post('upload-preview')
  @ApiOperation({ summary: 'Upload preview image in base64 format' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imageData: {
          type: 'string',
          description: 'Base64 encoded image (data:image/...)'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Preview uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        publicId: { type: 'string' }
      }
    }
  })
  async uploadPreview(@Body('imageData') imageData: string) {
    return this.customizationService.uploadPreviewImage(imageData);
  }

  /**
   * Rechercher des personnalisations avec filtres
   * GET /customizations/search?productId=123&sessionId=xxx&status=draft
   */
  @Get('search')
  @ApiOperation({ summary: 'Search customizations with filters' })
  @ApiResponse({ status: 200, description: 'List of customizations' })
  async searchCustomizations(
    @Query('productId') productId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string
  ) {
    return this.customizationService.findCustomizations({
      productId: productId ? parseInt(productId, 10) : undefined,
      sessionId,
      userId: userId ? parseInt(userId, 10) : undefined,
      status
    });
  }

  /**
   * Récupérer une personnalisation draft pour un produit spécifique
   * GET /customizations/product/:productId/draft
   */
  @Get('product/:productId/draft')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get draft customization for a specific product' })
  async getDraftForProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('sessionId') sessionId: string,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    return this.customizationService.getDraftCustomizationForProduct(
      productId,
      userId,
      sessionId
    );
  }
}
