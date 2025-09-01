import { Controller, Post, Body, UseGuards, Get, Put, Req, BadRequestException, Res, Query, Param, ParseIntPipe } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/user-dto';
import { CreateClientDto, ChangePasswordDto, ListClientsQueryDto, ForgotPasswordDto, ResetPasswordDto, VerifyResetTokenDto, ForceChangePasswordDto, AdminResetPasswordDto, UpdateVendorProfileDto, ExtendedVendorProfileResponseDto } from './dto/create-client.dto';
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
		@Res({ passthrough: true }) response: Response
	) {
		const result = await this.authService.login(loginDto);

		// Si changement de mot de passe requis, pas de cookie
		if ('mustChangePassword' in result) {
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
		return {
			isAuthenticated: true,
			user: {
				id: req.user.sub,
				email: req.user.email,
				firstName: req.user.firstName,
				lastName: req.user.lastName,
				role: req.user.role,
				vendeur_type: req.user.vendeur_type
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
		@Body() updateDto: UpdateVendorProfileDto,
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
}
