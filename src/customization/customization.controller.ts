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
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomizationService } from './customization.service';
import { CreateCustomizationDto, UpdateCustomizationDto } from './dto/create-customization.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@ApiTags('Product Customizations')
@Controller('customizations')
export class CustomizationController {
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
    const userId = req.user?.id; // undefined si guest
    const customizationIdNum = customizationId ? parseInt(customizationId, 10) : undefined;
    return this.customizationService.upsertCustomization(dto, userId, customizationIdNum);
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
