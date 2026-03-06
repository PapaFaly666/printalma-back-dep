import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AdminSettingsService } from './admin-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';
import { Role } from '@prisma/client';
import { RequestWithUser } from '../auth/jwt.strategy';
import {
  ChangeAdminPasswordDto,
  ChangePasswordResponseDto
} from './dto/change-admin-password.dto';
import {
  AppSettingsDto,
  AppSettingsResponseDto,
  AdminStatsDto
} from './dto/app-settings.dto';

@ApiTags('Admin Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
@ApiBearerAuth()
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  /**
   * Changer le mot de passe de l'administrateur connecté
   * PUT /admin/settings/change-password
   */
  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Changer le mot de passe de l\'administrateur',
    description:
      'Permet à un administrateur (ADMIN ou SUPERADMIN) de changer son mot de passe'
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe modifié avec succès',
    type: ChangePasswordResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides (mots de passe ne correspondent pas, même mot de passe, etc.)'
  })
  @ApiResponse({
    status: 401,
    description: 'Mot de passe actuel incorrect ou utilisateur non autorisé'
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() dto: ChangeAdminPasswordDto
  ): Promise<ChangePasswordResponseDto> {
    return this.adminSettingsService.changeAdminPassword(req.user.sub, dto);
  }

  /**
   * Récupérer les paramètres généraux de l'application
   * GET /admin/settings/app
   */
  @Get('app')
  @ApiOperation({
    summary: 'Récupérer les paramètres de l\'application',
    description:
      'Récupère tous les paramètres généraux de l\'application (nom, emails, téléphone, etc.)'
  })
  @ApiResponse({
    status: 200,
    description: 'Paramètres récupérés avec succès',
    type: AppSettingsResponseDto
  })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async getAppSettings(): Promise<AppSettingsResponseDto> {
    return this.adminSettingsService.getAppSettings();
  }

  /**
   * Mettre à jour les paramètres généraux de l'application
   * PUT /admin/settings/app
   */
  @Put('app')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour les paramètres de l\'application',
    description:
      'Permet de modifier les paramètres généraux de l\'application. Note: Actuellement, les paramètres sont gérés via les variables d\'environnement.'
  })
  @ApiResponse({
    status: 200,
    description: 'Paramètres mis à jour avec succès',
    type: AppSettingsResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Utilisateur non autorisé (réservé aux administrateurs)'
  })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async updateAppSettings(
    @Req() req: RequestWithUser,
    @Body() dto: AppSettingsDto
  ): Promise<AppSettingsResponseDto> {
    return this.adminSettingsService.updateAppSettings(req.user.sub, dto);
  }

  /**
   * Récupérer les statistiques générales du dashboard admin
   * GET /admin/settings/stats
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Récupérer les statistiques du dashboard admin',
    description:
      'Récupère les statistiques générales : vendeurs, commandes, chiffre d\'affaires, produits, etc.'
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
    type: AdminStatsDto
  })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async getAdminStats(): Promise<AdminStatsDto> {
    return this.adminSettingsService.getAdminStats();
  }

  /**
   * Récupérer le profil de l'administrateur connecté
   * GET /admin/settings/profile
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Récupérer le profil de l\'administrateur connecté',
    description:
      'Récupère les informations détaillées du profil de l\'administrateur (nom, email, rôle, permissions, etc.)'
  })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré avec succès'
  })
  @ApiResponse({ status: 404, description: 'Administrateur non trouvé' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async getAdminProfile(@Req() req: RequestWithUser) {
    return this.adminSettingsService.getAdminProfile(req.user.sub);
  }
}
