import { Controller, Post, Body, UseGuards, Get, Put, Delete, Req, BadRequestException, Res, Query, Param, ParseIntPipe } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/user-dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateClientDto, ChangePasswordDto, ListClientsQueryDto, ForgotPasswordDto, ResetPasswordDto, VerifyResetTokenDto, ForceChangePasswordDto, AdminResetPasswordDto, UpdateVendorProfileDto as UpdateVendorGeneralProfileDto, ExtendedVendorProfileResponseDto, AdminUpdateVendorDto } from './dto/create-client.dto';
import { UpdateSocialMediaDto, SocialMediaResponseDto } from './dto/update-social-media.dto';
import { UpdateVendorBioProfileDto, VendorProfileResponseDto } from './dto/update-vendor-profile.dto';
import { FirstLoginDto, FirstLoginResponseDto } from './dto/first-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from '../core/guards/admin.guard';
import { RequestWithUser } from './jwt.strategy';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { profilePhotoConfig } from '../../multerConfig';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) { }

	@Post('login')
	async login(
		@Body() loginDto: LoginDto,
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response
	) {
		// Récupérer l'IP et le User-Agent
		const ipAddress = request.ip || request.headers['x-forwarded-for'] as string || 'unknown';
		const userAgent = request.headers['user-agent'] || 'unknown';

		// Ajouter au DTO
		loginDto.ipAddress = ipAddress;
		loginDto.userAgent = userAgent;

		const result = await this.authService.login(loginDto);

		// Si changement de mot de passe requis, pas de cookie
		if ('mustChangePassword' in result) {
			return result;
		}

		// Si OTP requis, retourner le message sans cookie
		if ('otpRequired' in result) {
			return result;
		}

		// Définir le cookie httpOnly avec le token
		response.cookie('auth_token', result.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production', // HTTPS en production
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' pour cross-domain HTTPS
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours (correspond au JWT)
			path: '/'
		});

		// Retourner seulement les données utilisateur (pas le token)
		return {
			user: result.user
		};
	}

	/**
	 * Vérifie le code OTP et finalise la connexion
	 * POST /auth/verify-otp
	 */
	@Post('verify-otp')
	async verifyOtp(
		@Body() verifyOtpDto: VerifyOtpDto,
		@Res({ passthrough: true }) response: Response
	) {
		const result = await this.authService.verifyOtpAndLogin(verifyOtpDto);

		// Définir le cookie httpOnly avec le token
		response.cookie('auth_token', result.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
			path: '/'
		});

		// Retourner seulement les données utilisateur
		return {
			user: result.user
		};
	}

	@Post('first-login')
	@ApiOperation({ summary: 'Première connexion avec code d\'activation' })
	@ApiResponse({ status: 201, description: 'Compte activé avec succès', type: FirstLoginResponseDto })
	@ApiResponse({ status: 400, description: 'Code invalide ou mots de passe non correspondants' })
	@ApiResponse({ status: 401, description: 'Email ou code d\'activation invalide' })
	async firstLogin(
		@Body() firstLoginDto: FirstLoginDto,
		@Res({ passthrough: true }) response: Response
	) {
		const result = await this.authService.firstLogin(firstLoginDto);

		// Définir le cookie httpOnly avec le token
		response.cookie('auth_token', result.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
			path: '/'
		});

		// Retourner seulement le message et les données utilisateur
		return {
			message: result.message,
			user: result.user
		};
	}

	@Post('logout')
	async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) response: Response
	) {
		try {
			// Tenter de récupérer l'utilisateur connecté si possible
			let userId: number | null = null;
			const authCookie = req.cookies?.auth_token;
			
			if (authCookie) {
				try {
					// Décoder le token pour obtenir l'ID utilisateur pour les logs
					const decoded = this.authService.decodeToken(authCookie);
					userId = decoded?.sub || null;
				} catch (error) {
					// Token invalide, mais on continue la déconnexion
					console.log('Token invalide lors de la déconnexion');
				}
			}

			// Supprimer le cookie avec toutes les options correctes
			response.clearCookie('auth_token', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
				path: '/'
			});

			// Logger la déconnexion si on a l'ID utilisateur
			if (userId) {
				await this.authService.logLogout(userId);
			}

			return {
				message: 'Déconnexion réussie',
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			console.error('Erreur lors de la déconnexion:', error);
			
			// Même en cas d'erreur, on supprime le cookie
			response.clearCookie('auth_token', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
				path: '/'
			});

			return {
				message: 'Déconnexion effectuée',
				note: 'Cookie supprimé même en cas d\'erreur'
			};
		}
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	async getProfile(@Req() req: RequestWithUser) {
		return this.authService.getUserProfile(req.user.sub);
	}

	@UseGuards(JwtAuthGuard, AdminGuard)
	@Post('admin/create-client')
	async createClient(@Body() createClientDto: CreateClientDto) {
		return this.authService.createClient(createClientDto);
	}

	@UseGuards(JwtAuthGuard, AdminGuard)
	@Get('admin/clients')
	async listClients(@Query() queryDto: ListClientsQueryDto) {
		return this.authService.listClients(queryDto);
	}

	@UseGuards(JwtAuthGuard, AdminGuard)
	@Put('admin/clients/:id/toggle-status')
	async toggleClientStatus(@Param('id', ParseIntPipe) clientId: number) {
		return this.authService.toggleClientStatus(clientId);
	}

	@UseGuards(JwtAuthGuard)
	@Put('change-password')
	async changePassword(@Req() req: RequestWithUser, @Body() changePasswordDto: ChangePasswordDto) {
		const userId = req.user.sub;
		return this.authService.changePassword(userId, changePasswordDto);
	}

	/**
	 * Changement de mot de passe forcé (endpoint public - pour utilisateurs qui doivent changer leur mot de passe)
	 */
	@Post('force-change-password')
	async forceChangePassword(
		@Body() forceChangePasswordDto: ForceChangePasswordDto,
		@Res({ passthrough: true }) response: Response
	) {
		const result = await this.authService.forceChangePassword(forceChangePasswordDto);

		// Définir le cookie httpOnly avec le token après changement réussi
		response.cookie('auth_token', result.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours (correspond au JWT)
			path: '/'
		});

		// Retourner seulement les données utilisateur et le message
		return {
			message: result.message,
			user: result.user
		};
	}

	@UseGuards(JwtAuthGuard)
	@Get('check')
	async checkAuth(@Req() req: RequestWithUser) {
		// Récupérer le profil complet avec customRole
		const profile = await this.authService.getUserProfile(req.user.sub);

		return {
			isAuthenticated: true,
			user: {
				id: profile.id,
				email: profile.email,
				firstName: profile.firstName,
				lastName: profile.lastName,
				role: profile.role,
				customRole: profile.customRole,
				vendeur_type: profile.vendeur_type,
				status: profile.status,
				profile_photo_url: profile.profile_photo_url
			}
		};
	}

	@UseGuards(JwtAuthGuard)
	@Get('vendors')
	async listVendors(@Req() req: RequestWithUser) {
		return this.authService.listVendors(req.user.sub);
	}

	@UseGuards(JwtAuthGuard)
	@Get('vendors/stats')
	async getVendorsStats() {
		return this.authService.getVendorsStats();
	}

	// ============================
	// ENDPOINTS RÉINITIALISATION DE MOT DE PASSE
	// ============================

	/**
	 * Demander une réinitialisation de mot de passe (endpoint public)
	 */
	@Post('forgot-password')
	async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
		return this.authService.forgotPassword(forgotPasswordDto);
	}

	/**
	 * Vérifier la validité d'un token de réinitialisation (endpoint public)
	 */
	@Post('verify-reset-token')
	async verifyResetToken(@Body() verifyTokenDto: VerifyResetTokenDto) {
		return this.authService.verifyResetToken(verifyTokenDto);
	}

	/**
	 * Réinitialiser le mot de passe avec un token valide (endpoint public)
	 */
	@Post('reset-password')
	async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
		return this.authService.resetPassword(resetPasswordDto);
	}

	/**
	 * Nettoyer les tokens expirés (endpoint admin uniquement)
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Post('admin/cleanup-reset-tokens')
	async cleanupExpiredResetTokens() {
		return this.authService.cleanupExpiredResetTokens();
	}

	/**
	 * Admin: Réinitialiser le mot de passe d'un vendeur (endpoint admin uniquement)
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Post('admin/reset-vendor-password')
	async adminResetVendorPassword(@Body() adminResetPasswordDto: AdminResetPasswordDto) {
		return this.authService.adminResetVendorPassword(adminResetPasswordDto);
	}

	/**
	 * Admin: Débloquer manuellement un compte utilisateur (endpoint admin uniquement)
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Put('admin/unlock-account/:id')
	async unlockUserAccount(@Param('id', ParseIntPipe) userId: number) {
		return this.authService.unlockUserAccount(userId);
	}

	/**
	 * Admin: Créer un vendeur (endpoint admin/superadmin uniquement)
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Post('admin/create-vendor')
	async adminCreateVendor(@Body() dto: RegisterVendorDto) {
		return this.authService.adminCreateVendor(dto);
	}

	/**
	 * Endpoint public: Auto-inscription vendeur (nécessite validation admin)
	 */
	@Post('register-vendeur')
	async registerVendor(@Body() dto: RegisterVendorDto) {
		return this.authService.registerVendor(dto);
	}

	@Get('activation-status/:email')
	async activationStatus(@Param('email') email: string) {
		return this.authService.getActivationStatus(email);
	}

	// 🆕 ========================
	// ENDPOINTS PROFIL VENDEUR ÉTENDU
	// ========================

	/**
	 * Admin: Créer un vendeur avec photo de profil optionnelle (multipart/form-data)
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Post('admin/create-vendor-extended')
	@UseInterceptors(FileInterceptor('profilePhoto', profilePhotoConfig))
	@ApiOperation({ summary: 'Créer un vendeur avec profil étendu et photo optionnelle' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Données du vendeur avec photo de profil optionnelle',
		schema: {
			type: 'object',
			properties: {
				firstName: { type: 'string', example: 'Jean' },
				lastName: { type: 'string', example: 'Dupont' },
				email: { type: 'string', example: 'jean.dupont@gmail.com' },
				vendeur_type: { type: 'string', enum: ['DESIGNER', 'INFLUENCEUR', 'ARTISTE'] },
				phone: { type: 'string', example: '+33 6 12 34 56 78' },
				country: { type: 'string', example: 'France' },
				address: { type: 'string', example: '123 Rue de la Paix, 75001 Paris' },
				shop_name: { type: 'string', example: 'Boutique Design Jean' },
				profilePhoto: { type: 'string', format: 'binary', description: 'Photo de profil (optionnelle)' }
			},
			required: ['firstName', 'lastName', 'email', 'vendeur_type', 'shop_name']
		}
	})
	@ApiResponse({ status: 201, description: 'Vendeur créé avec succès' })
	@ApiResponse({ status: 400, description: 'Données invalides ou email déjà utilisé' })
	async createVendorExtended(
		@Body() createClientDto: CreateClientDto,
		@UploadedFile() profilePhoto?: Express.Multer.File
	) {
		return this.authService.createVendorWithPhoto(createClientDto, profilePhoto);
	}

	/**
	 * Vendeur: Récupérer son profil complet
	 */
	@UseGuards(JwtAuthGuard)
	@Get('vendor/profile')
	@ApiOperation({ summary: 'Récupérer le profil complet du vendeur connecté' })
	@ApiResponse({ status: 200, description: 'Profil vendeur récupéré avec succès' })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	async getVendorProfile(@Req() req: RequestWithUser): Promise<ExtendedVendorProfileResponseDto> {
		return this.authService.getExtendedVendorProfile(req.user.sub);
	}

	/**
	 * Vendeur: Désactiver son compte (status=false)
	 */
	@UseGuards(JwtAuthGuard)
	@Post('vendor/deactivate')
	@ApiOperation({ summary: 'Désactiver le compte vendeur' })
	@ApiResponse({ status: 200, description: 'Compte désactivé' })
	async deactivateMyAccount(@Req() req: RequestWithUser) {
		return this.authService.deactivateVendorAccount(req.user.sub);
	}

	/**
	 * Vendeur: Réactiver son compte (status=true)
	 */
	@UseGuards(JwtAuthGuard)
	@Post('vendor/reactivate')
	@ApiOperation({ summary: 'Réactiver le compte vendeur' })
	@ApiResponse({ status: 200, description: 'Compte réactivé' })
	async reactivateMyAccount(@Req() req: RequestWithUser) {
		return this.authService.reactivateVendorAccount(req.user.sub);
	}

	/**
	 * Vendeur: Mettre à jour son profil avec photo optionnelle
	 */
	@UseGuards(JwtAuthGuard)
	@Put('vendor/profile')
	@UseInterceptors(FileInterceptor('profilePhoto', profilePhotoConfig))
	@ApiOperation({ summary: 'Mettre à jour le profil vendeur avec photo optionnelle' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Données de mise à jour du profil avec photo optionnelle',
		schema: {
			type: 'object',
			properties: {
				firstName: { type: 'string', example: 'Jean' },
				lastName: { type: 'string', example: 'Dupont' },
				email: { type: 'string', example: 'jean.dupont@gmail.com' },
				phone: { type: 'string', example: '+33 6 12 34 56 78' },
				country: { type: 'string', example: 'France' },
				address: { type: 'string', example: '123 Rue de la Paix, 75001 Paris' },
				shop_name: { type: 'string', example: 'Boutique Design Jean' },
				profilePhoto: { type: 'string', format: 'binary', description: 'Nouvelle photo de profil (optionnelle)' }
			}
		}
	})
	@ApiResponse({ status: 200, description: 'Profil mis à jour avec succès' })
	@ApiResponse({ status: 400, description: 'Données invalides' })
	async updateVendorProfile(
		@Req() req: RequestWithUser,
		@Body() updateDto: UpdateVendorGeneralProfileDto,
		@UploadedFile() profilePhoto?: Express.Multer.File
	) {
		return this.authService.updateVendorProfile(req.user.sub, updateDto, profilePhoto);
	}

	/**
	 * Vendeur : Demander un changement d'email sécurisé
	 */
	@UseGuards(JwtAuthGuard)
	@Post('vendor/request-email-change')
	async requestEmailChange(@Req() req: RequestWithUser, @Body() body: { newEmail: string, currentPassword: string }) {
		return this.authService.requestVendorEmailChange(req.user.sub, body.newEmail, body.currentPassword);
	}

	/**
	 * Vendeur : Confirmer le changement d'email via le lien reçu
	 */
	@Get('vendor/confirm-email-change')
	async confirmEmailChange(@Query('token') token: string) {
		return this.authService.confirmVendorEmailChange(token);
	}

	/**
	 * Admin: Statistiques vendeurs par pays
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Get('admin/vendors/stats-by-country')
	@ApiOperation({ summary: 'Statistiques des vendeurs par pays' })
	@ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
	async getVendorStatsByCountry() {
		return this.authService.getVendorStatsByCountry();
	}

	/**
	 * Vérifier si un nom de boutique est disponible
	 */
	@Get('check-shop-name')
	async checkShopName(@Query('name') name: string) {
		if (!name || name.trim().length < 2) {
			return { available: true };
		}

		const existingUser = await this.authService.checkShopNameAvailability(name.trim());
		return { available: !existingUser };
	}

	/**
	 * Admin: Liste complète des vendeurs avec filtres avancés
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Get('admin/vendors')
	@ApiOperation({ summary: 'Récupérer la liste complète des vendeurs avec filtres' })
	@ApiResponse({ status: 200, description: 'Liste des vendeurs récupérée avec succès' })
	async listAllVendors(@Query() queryDto: ListClientsQueryDto) {
		return this.authService.listAllVendors(queryDto);
	}

	/**
	 * Admin: Liste de la corbeille (vendeurs supprimés)
	 * ⚠️ IMPORTANT: Cette route doit être AVANT /admin/vendors/:id pour éviter que "trash" soit interprété comme un :id
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Get('admin/vendors/trash')
	@ApiOperation({ summary: 'Récupérer la liste des vendeurs supprimés (corbeille)' })
	@ApiResponse({ status: 200, description: 'Liste de la corbeille récupérée avec succès' })
	async getDeletedVendors(@Query() queryDto: ListClientsQueryDto) {
		return this.authService.getDeletedVendors(queryDto);
	}

	/**
	 * Admin: Récupérer un vendeur spécifique pour modification
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Get('admin/vendors/:id')
	@ApiOperation({ summary: 'Récupérer les informations détaillées d\'un vendeur' })
	@ApiResponse({ status: 200, description: 'Informations du vendeur récupérées avec succès', type: ExtendedVendorProfileResponseDto })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	async getVendorById(@Param('id', ParseIntPipe) vendorId: number): Promise<ExtendedVendorProfileResponseDto> {
		return this.authService.getExtendedVendorProfile(vendorId);
	}

	/**
	 * Admin: Mettre à jour les informations d'un vendeur
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Put('admin/vendors/:id')
	@UseInterceptors(FileInterceptor('profilePhoto', profilePhotoConfig))
	@ApiOperation({ summary: 'Mettre à jour les informations d\'un vendeur par l\'admin' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Données de mise à jour du vendeur avec photo optionnelle',
		schema: {
			type: 'object',
			properties: {
				firstName: { type: 'string', example: 'Jean' },
				lastName: { type: 'string', example: 'Dupont' },
				email: { type: 'string', example: 'jean.dupont@gmail.com' },
				vendeur_type: { type: 'string', enum: ['DESIGNER', 'INFLUENCEUR', 'ARTISTE'] },
				phone: { type: 'string', example: '+33 6 12 34 56 78' },
				country: { type: 'string', example: 'France' },
				address: { type: 'string', example: '123 Rue de la Paix, 75001 Paris' },
				shop_name: { type: 'string', example: 'Boutique Design Jean' },
				status: { type: 'boolean', example: true },
				profilePhoto: { type: 'string', format: 'binary', description: 'Nouvelle photo de profil (optionnelle)' }
			}
		}
	})
	@ApiResponse({ status: 200, description: 'Vendeur mis à jour avec succès', type: ExtendedVendorProfileResponseDto })
	@ApiResponse({ status: 400, description: 'Données invalides' })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	async adminUpdateVendor(
		@Param('id', ParseIntPipe) vendorId: number,
		@Body() updateDto: AdminUpdateVendorDto,
		@UploadedFile() profilePhoto?: Express.Multer.File
	): Promise<ExtendedVendorProfileResponseDto> {
		return this.authService.adminUpdateVendor(vendorId, updateDto, profilePhoto);
	}

	/**
	 * Endpoint de debug pour tester les cookies (temporaire)
	 */
	@Get('debug-cookies')
	async debugCookies(@Req() req: Request) {
		return {
			cookies: req.cookies,
			headers: {
				'user-agent': req.headers['user-agent'],
				'origin': req.headers.origin,
				'referer': req.headers.referer,
				'cookie': req.headers.cookie
			},
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV
		};
	}

	// ========================
	// SOFT DELETE ENDPOINTS
	// ========================

	/**
	 * Admin: Soft delete d'un vendeur
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Put('admin/vendors/:id/soft-delete')
	@ApiOperation({ summary: 'Supprimer un vendeur (soft delete)' })
	@ApiResponse({ status: 200, description: 'Vendeur supprimé avec succès' })
	@ApiResponse({ status: 400, description: 'Vendeur déjà supprimé ou erreur' })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	async softDeleteVendor(
		@Param('id', ParseIntPipe) vendorId: number,
		@Req() req: RequestWithUser
	) {
		return this.authService.softDeleteVendor(vendorId, req.user.sub);
	}

	/**
	 * Admin: Restaurer un vendeur supprimé
	 */
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Put('admin/vendors/:id/restore')
	@ApiOperation({ summary: 'Restaurer un vendeur supprimé' })
	@ApiResponse({ status: 200, description: 'Vendeur restauré avec succès' })
	@ApiResponse({ status: 400, description: 'Vendeur non supprimé ou erreur' })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	async restoreVendor(@Param('id', ParseIntPipe) vendorId: number) {
		return this.authService.restoreVendor(vendorId);
	}

	// ============================
	// ENDPOINTS RÉSEAUX SOCIAUX
	// ============================

	/**
	 * Vendeur: Mettre à jour les réseaux sociaux
	 */
	@UseGuards(JwtAuthGuard)
	@Put('vendor/social-media')
	@ApiOperation({ summary: 'Mettre à jour les réseaux sociaux du vendeur' })
	@ApiResponse({ status: 200, description: 'Réseaux sociaux mis à jour avec succès', type: SocialMediaResponseDto })
	@ApiResponse({ status: 400, description: 'Données invalides' })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	async updateSocialMedia(
		@Req() req: RequestWithUser,
		@Body() updateDto: UpdateSocialMediaDto
	): Promise<SocialMediaResponseDto> {
		return this.authService.updateSocialMedia(req.user.sub, updateDto);
	}

	/**
	 * Vendeur: Récupérer les réseaux sociaux
	 */
	@UseGuards(JwtAuthGuard)
	@Get('vendor/social-media')
	@ApiOperation({ summary: 'Récupérer les réseaux sociaux du vendeur' })
	@ApiResponse({ status: 200, description: 'Réseaux sociaux récupérés avec succès', type: SocialMediaResponseDto })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	async getSocialMedia(@Req() req: RequestWithUser): Promise<SocialMediaResponseDto> {
		return this.authService.getSocialMedia(req.user.sub);
	}

	/**
	 * Vendeur: Supprimer tous les réseaux sociaux
	 */
	@UseGuards(JwtAuthGuard)
	@Delete('vendor/social-media')
	@ApiOperation({ summary: 'Supprimer tous les réseaux sociaux du vendeur' })
	@ApiResponse({ status: 200, description: 'Réseaux sociaux supprimés avec succès', type: SocialMediaResponseDto })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	async clearSocialMedia(@Req() req: RequestWithUser): Promise<SocialMediaResponseDto> {
		return this.authService.clearSocialMedia(req.user.sub);
	}

	/**
	 * Vendeur: Valider une URL de réseau social spécifique
	 */
	@UseGuards(JwtAuthGuard)
	@Post('vendor/social-media/validate')
	@ApiOperation({ summary: 'Valider une URL de réseau social' })
	@ApiResponse({ status: 200, description: 'URL validée avec succès' })
	@ApiResponse({ status: 400, description: 'URL invalide' })
	async validateSocialMediaUrl(
		@Body() body: { platform: string; url: string }
	) {
		return this.authService.validateSocialMediaUrl(body.platform, body.url);
	}

	/**
	 * PUBLIC: Récupérer les réseaux sociaux d'un vendeur (sans authentification)
	 */
	@Get('public/vendor/:identifier/social-media')
	@ApiOperation({ summary: 'Récupérer les réseaux sociaux d\'un vendeur' })
	@ApiResponse({ status: 200, description: 'Réseaux sociaux récupérés avec succès', type: SocialMediaResponseDto })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	@ApiResponse({ status: 400, description: 'Requête invalide' })
	async getVendorSocialMediaPublic(
		@Param('identifier') identifier: string
	): Promise<SocialMediaResponseDto> {
		return this.authService.getVendorSocialMediaPublic(identifier);
	}

	/**
	 * Mettre à jour le profil vendeur (titre et bio)
	 */
	@Put('vendor/profile/bio')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Mettre à jour le profil vendeur (titre et bio)' })
	@ApiResponse({ status: 200, description: 'Profil mis à jour avec succès', type: VendorProfileResponseDto })
	@ApiResponse({ status: 401, description: 'Non authentifié' })
	@ApiResponse({ status: 403, description: 'Accès réservé aux vendeurs' })
	@ApiResponse({ status: 400, description: 'Requête invalide' })
	async updateVendorBioProfile(
		@Req() req: RequestWithUser,
		@Body() updateDto: UpdateVendorBioProfileDto
	): Promise<VendorProfileResponseDto> {
		return this.authService.updateVendorBioProfile(req.user.sub, updateDto);
	}

	/**
	 * PUBLIC: Récupérer l'ID utilisateur par email (pour première connexion)
	 */
	@Post('user-id-by-email')
	@ApiOperation({
		summary: 'Récupérer l\'ID utilisateur par email',
		description: 'Endpoint public pour permettre aux vendeurs de récupérer leur ID via leur email lors de la première connexion.'
	})
	@ApiResponse({ status: 200, description: 'ID utilisateur récupéré avec succès' })
	@ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
	async getUserIdByEmail(@Body() body: { email: string }) {
		return this.authService.getUserIdByEmail(body.email);
	}

	/**
	 * Vérifier si le profil vendeur est complet
	 */
	@UseGuards(JwtAuthGuard)
	@Get('vendor/profile/status')
	@ApiOperation({ summary: 'Vérifier si le profil vendeur est complet' })
	@ApiResponse({ status: 200, description: 'Statut du profil récupéré avec succès' })
	@ApiResponse({ status: 401, description: 'Non authentifié' })
	@ApiResponse({ status: 403, description: 'Accès réservé aux vendeurs' })
	async getVendorProfileStatus(@Req() req: RequestWithUser) {
		return this.authService.getVendorProfileStatus(req.user.sub);
	}

	/**
	 * Marquer la première connexion comme complétée
	 */
	@UseGuards(JwtAuthGuard)
	@Post('vendor/first-login-complete')
	@ApiOperation({ summary: 'Marquer la première connexion comme terminée' })
	@ApiResponse({ status: 200, description: 'Première connexion marquée comme complétée' })
	@ApiResponse({ status: 401, description: 'Non authentifié' })
	@ApiResponse({ status: 403, description: 'Accès réservé aux vendeurs' })
	async completeFirstLogin(@Req() req: RequestWithUser) {
		return this.authService.completeFirstLogin(req.user.sub);
	}

	/**
	 * Récupérer le profil vendeur (titre et bio)
	 */
	@Get('vendor/profile/bio')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Récupérer le profil vendeur (titre et bio)' })
	@ApiResponse({ status: 200, description: 'Profil récupéré avec succès', type: VendorProfileResponseDto })
	@ApiResponse({ status: 401, description: 'Non authentifié' })
	@ApiResponse({ status: 403, description: 'Accès réservé aux vendeurs' })
	@ApiResponse({ status: 404, description: 'Profil non trouvé' })
	async getVendorBioProfile(
		@Req() req: RequestWithUser
	): Promise<VendorProfileResponseDto> {
		return this.authService.getVendorProfile(req.user.sub);
	}

	/**
	 * PUBLIC: Récupérer le profil d'un vendeur (sans authentification)
	 */
	@Get('public/vendor/:identifier/profile/bio')
	@ApiOperation({ summary: 'Récupérer le profil d\'un vendeur (titre et bio)' })
	@ApiResponse({ status: 200, description: 'Profil récupéré avec succès', type: VendorProfileResponseDto })
	@ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
	@ApiResponse({ status: 400, description: 'Requête invalide' })
	async getVendorProfilePublic(
		@Param('identifier') identifier: string
	): Promise<VendorProfileResponseDto> {
		return this.authService.getVendorProfilePublic(identifier);
	}
}
