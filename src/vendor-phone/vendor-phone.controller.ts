import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { VendorPhoneService } from './services/vendor-phone.service';
import {
  SendOTPDto,
  VerifyOTPDto,
  SendOTPResponseDto,
  VerifyOTPResponseDto,
  ListPhoneNumbersResponseDto,
} from './dto/phone-security.dto';

/**
 * Controller pour la gestion sécurisée des numéros de téléphone vendeur
 * Implémente le système OTP + Email + Période de sécurité 48h
 */
@ApiTags('Vendor Phone Security')
@Controller('vendor/phone')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VendorPhoneController {
  constructor(private readonly vendorPhoneService: VendorPhoneService) {}

  /**
   * POST /api/vendor/phone/send-otp
   * Envoie un code OTP au numéro de téléphone
   */
  @Post('send-otp')
  @Roles(Role.VENDEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer un code OTP pour vérifier un nouveau numéro' })
  @ApiResponse({
    status: 200,
    description: 'Code OTP envoyé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Format de numéro invalide ou numéro déjà utilisé',
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives (rate limiting)',
  })
  async sendOTP(
    @Request() req,
    @Body() sendOTPDto: SendOTPDto,
  ): Promise<SendOTPResponseDto> {
    const vendorId = req.user.id;
    const ipAddress = req.ip;

    return this.vendorPhoneService.sendOTP(vendorId, sendOTPDto, ipAddress);
  }

  /**
   * POST /api/vendor/phone/verify-otp
   * Vérifie le code OTP et ajoute le numéro
   */
  @Post('verify-otp')
  @Roles(Role.VENDEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier le code OTP et ajouter le numéro' })
  @ApiResponse({
    status: 200,
    description: 'Numéro vérifié avec succès. Utilisable dans 48 heures.',
  })
  @ApiResponse({
    status: 400,
    description: 'Code invalide ou expiré',
  })
  @ApiResponse({
    status: 404,
    description: 'OTP ID introuvable',
  })
  async verifyOTP(
    @Request() req,
    @Body() verifyOTPDto: VerifyOTPDto,
  ): Promise<VerifyOTPResponseDto> {
    const vendorId = req.user.id;
    const ipAddress = req.ip;
    const userEmail = req.user.email;

    return this.vendorPhoneService.verifyOTP(vendorId, verifyOTPDto, ipAddress, userEmail);
  }

  /**
   * GET /api/vendor/phone/list
   * Récupère tous les numéros du vendeur avec leur statut
   */
  @Get('list')
  @Roles(Role.VENDEUR)
  @ApiOperation({ summary: 'Liste tous les numéros de téléphone du vendeur' })
  @ApiResponse({
    status: 200,
    description: 'Liste des numéros récupérée avec succès',
  })
  async listPhoneNumbers(@Request() req): Promise<ListPhoneNumbersResponseDto> {
    const vendorId = req.user.id;

    return this.vendorPhoneService.listPhoneNumbers(vendorId);
  }

  /**
   * DELETE /api/vendor/phone/:id
   * Supprime un numéro de téléphone
   */
  @Delete(':id')
  @Roles(Role.VENDEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un numéro de téléphone' })
  @ApiResponse({
    status: 200,
    description: 'Numéro supprimé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer le numéro principal',
  })
  @ApiResponse({
    status: 404,
    description: 'Numéro non trouvé',
  })
  async deletePhoneNumber(
    @Request() req,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    const vendorId = req.user.id;
    const phoneNumberId = parseInt(id, 10);

    return this.vendorPhoneService.deletePhoneNumber(vendorId, phoneNumberId);
  }

  /**
   * POST /api/vendor/phone/:id/set-primary
   * Définir un numéro comme principal
   */
  @Post(':id/set-primary')
  @Roles(Role.VENDEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Définir un numéro comme principal' })
  @ApiResponse({
    status: 200,
    description: 'Numéro principal mis à jour',
  })
  @ApiResponse({
    status: 400,
    description: 'Le numéro n\'est pas actif',
  })
  @ApiResponse({
    status: 404,
    description: 'Numéro non trouvé',
  })
  async setPrimaryPhone(
    @Request() req,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    const vendorId = req.user.id;
    const phoneNumberId = parseInt(id, 10);

    return this.vendorPhoneService.setPrimaryPhone(vendorId, phoneNumberId);
  }
}
