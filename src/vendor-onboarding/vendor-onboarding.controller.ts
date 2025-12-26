import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VendorOnboardingService } from './vendor-onboarding.service';
import {
  CompleteOnboardingDto,
  UpdatePhonesDto,
} from './dto/complete-onboarding.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorOnboardingController {
  constructor(private readonly onboardingService: VendorOnboardingService) {}

  /**
   * POST /api/vendor/complete-onboarding
   * Compléter l'onboarding du vendeur
   */
  @Post('complete-onboarding')
  @Roles('VENDEUR')
  @UseInterceptors(FileInterceptor('profileImage'))
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(
    @Request() req,
    @Body() body: any,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    try {
      // Parser les données JSON du body (car envoyé en multipart/form-data)
      const phones = JSON.parse(body.phones || '[]');
      const socialMedia = body.socialMedia ? JSON.parse(body.socialMedia) : undefined;

      const dto: CompleteOnboardingDto = {
        phones,
        socialMedia,
      };

      // Valider qu'une image est fournie
      if (!profileImage) {
        throw new BadRequestException('La photo de profil est requise');
      }

      const result = await this.onboardingService.completeOnboarding(
        req.user.id,
        dto,
        profileImage,
      );

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Données invalides');
    }
  }

  /**
   * GET /api/vendor/profile-status
   * Vérifier le statut de complétion du profil
   */
  @Get('profile-status')
  @Roles('VENDEUR')
  async getProfileStatus(@Request() req) {
    return this.onboardingService.getProfileStatus(req.user.id);
  }

  /**
   * GET /api/vendor/onboarding-info
   * Récupérer les informations d'onboarding
   */
  @Get('onboarding-info')
  @Roles('VENDEUR')
  async getOnboardingInfo(@Request() req) {
    return this.onboardingService.getOnboardingInfo(req.user.id);
  }

  /**
   * PUT /api/vendor/update-phones
   * Mettre à jour les numéros de téléphone
   */
  @Put('update-phones')
  @Roles('VENDEUR')
  @HttpCode(HttpStatus.OK)
  async updatePhones(@Request() req, @Body() dto: UpdatePhonesDto) {
    return this.onboardingService.updatePhones(req.user.id, dto);
  }
}
