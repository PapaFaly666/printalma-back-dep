import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/user-dto';
import { CreateClientDto, ChangePasswordDto, ListClientsQueryDto, ListClientsResponseDto, ForgotPasswordDto, ResetPasswordDto, VerifyResetTokenDto, ForceChangePasswordDto, UpdateVendorProfileDto, ExtendedVendorProfileResponseDto } from './dto/create-client.dto';
import { PrismaService } from '../prisma.service';
import { MailService } from '../core/mail/mail.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { Role, VendeurType } from '@prisma/client';
import { RegisterVendorDto } from './dto/register-vendor.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
        private cloudinaryService: CloudinaryService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Récupérer l'utilisateur par email
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        // Vérifier si l'utilisateur existe
        if (!user) {
            throw new UnauthorizedException('❌ Email ou mot de passe incorrect');
        }

        // Vérifier si le compte est actif (SAUF pour les SUPERADMIN qui ne peuvent pas être désactivés)
        if (!user.status && user.role !== Role.SUPERADMIN) {
            throw new UnauthorizedException('🚫 Votre compte a été désactivé. Contactez l\'administrateur.');
        }

        // Vérifier si le compte est verrouillé (SAUF pour les SUPERADMIN)
        if (user.locked_until && user.locked_until > new Date() && user.role !== Role.SUPERADMIN) {
            const remainingTime = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
            const hours = Math.floor(remainingTime / 60);
            const minutes = remainingTime % 60;
            
            let timeMessage = '';
            if (hours > 0) {
                timeMessage = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
            } else {
                timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''}`;
            }
            
            throw new UnauthorizedException(`🔒 Votre compte est temporairement verrouillé. Temps restant : ${timeMessage}`);
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            const MAX_ATTEMPTS = 5;
            const currentAttempts = user.login_attempts + 1;
            const remainingAttempts = MAX_ATTEMPTS - currentAttempts;

            // ⭐ PROTECTION SUPERADMIN : Ne jamais verrouiller les comptes SUPERADMIN
            if (user.role === Role.SUPERADMIN) {
                // Pour les SUPERADMIN, on incrémente seulement le compteur pour les logs/statistiques
                // mais on ne verrouille jamais le compte et on ne révèle pas qu'il s'agit d'un SUPERADMIN
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { login_attempts: currentAttempts },
                });

                console.warn(`🚨 Tentative de connexion échouée pour SUPERADMIN: ${user.email} (${currentAttempts} tentatives)`);
                throw new UnauthorizedException('❌ Email ou mot de passe incorrect');
            }

            // Pour les autres utilisateurs, appliquer la logique de verrouillage normale avec messages informatifs
            if (currentAttempts >= MAX_ATTEMPTS) {
                const LOCK_DURATION_MINUTES = 30;
                const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);

                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        login_attempts: 0,
                        locked_until: lockedUntil
                    },
                });

                throw new UnauthorizedException(`🔒 Trop de tentatives échouées. Votre compte est verrouillé pour ${LOCK_DURATION_MINUTES} minutes.`);
            } else {
                // Incrémenter le compteur de tentatives et informer l'utilisateur
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { login_attempts: currentAttempts },
                });

                let attemptsMessage;
                if (remainingAttempts > 1) {
                    attemptsMessage = `Il vous reste ${remainingAttempts} tentatives`;
                } else if (remainingAttempts === 1) {
                    attemptsMessage = `⚠️ Dernière tentative avant verrouillage`;
                } else {
                    attemptsMessage = `Compte sur le point d'être verrouillé`;
                }

                throw new UnauthorizedException(`❌ Email ou mot de passe incorrect. ${attemptsMessage}.`);
            }
        }

        // Réinitialiser le compteur de tentatives et mettre à jour la date de dernière connexion
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                login_attempts: 0,
                locked_until: null,
                last_login_at: new Date()
            },
        });

        // Vérifier si l'utilisateur doit changer son mot de passe
        if (user.must_change_password) {
            return {
                mustChangePassword: true,
                userId: user.id,
                message: 'Vous devez changer votre mot de passe avant de continuer'
            };
        }

        // Générer le token JWT
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            vendeur_type: user.vendeur_type,
            firstName: user.firstName,
            lastName: user.lastName,
            profile_photo_url: user.profile_photo_url || null,
            phone: user.phone || null,
            shop_name: user.shop_name || null,
            country: user.country || null,
            address: user.address || null,
        };

        const access_token = this.jwtService.sign(payload);

        // Retourner le token et les données utilisateur (le cookie sera géré par le controller)
        return {
            access_token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                vendeur_type: user.vendeur_type,
                status: user.status,
                profile_photo_url: user.profile_photo_url,
                phone: user.phone,
                shop_name: user.shop_name,
                country: user.country,
                address: user.address,
            }
        };
    }

    /**
     * Créer un nouveau client (réservé aux admins)
     */
    async createClient(createClientDto: CreateClientDto) {
        const { 
            firstName, 
            lastName, 
            email, 
            vendeur_type,
            phone,
            country,
            address,
            shop_name 
        } = createClientDto;

        // Vérifier si l'email existe déjà
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Un utilisateur avec cet email existe déjà');
        }

        // Vérifier si le nom de boutique existe déjà (si fourni)
        if (shop_name) {
            const existingShop = await this.prisma.user.findFirst({
                where: { shop_name: shop_name }
            });

            if (existingShop) {
                throw new ConflictException('Ce nom de boutique est déjà utilisé par un autre vendeur');
            }
        }

        // Générer un mot de passe temporaire
        const temporaryPassword = this.mailService.generateRandomPassword();

        // Hasher le mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

        try {
            // Créer l'utilisateur avec les nouveaux champs étendus
            const newUser = await this.prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    role: Role.VENDEUR,
                    vendeur_type: vendeur_type as any,
                    must_change_password: true,
                    status: true,
                    // 🆕 Nouveaux champs étendus
                    phone: phone || null,
                    country: country || null,
                    address: address || null,
                    shop_name: shop_name || null,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    vendeur_type: true,
                    status: true,
                    created_at: true,
                    // 🆕 Inclure les nouveaux champs dans la réponse
                    phone: true,
                    country: true,
                    address: true,
                    shop_name: true,
                }
            });

            // Envoyer l'email avec le mot de passe temporaire et le type de vendeur
            await this.mailService.sendPasswordEmailWithType(
                email,
                firstName,
                lastName,
                temporaryPassword,
                vendeur_type as any // Conversion pour compatibilité avec MailService
            );

            return {
                message: 'Vendeur créé avec succès. Un email avec le mot de passe temporaire a été envoyé.',
                user: newUser
            };
        } catch (error) {
            console.error('Erreur lors de la création du vendeur:', error);
            
            // ✅ Gestion spécifique des erreurs de contrainte d'unicité
            if (error.code === 'P2002') {
                if (error.meta?.target?.includes('shop_name')) {
                    throw new ConflictException('Ce nom de boutique est déjà utilisé par un autre vendeur');
                } else if (error.meta?.target?.includes('email')) {
                    throw new ConflictException('Un utilisateur avec cet email existe déjà');
                }
            }
            
            throw new BadRequestException('Erreur lors de la création du vendeur');
        }
    }

    // =======================
    //  📥  Inscription Vendeur (public)
    // =======================
    async registerVendor(dto: RegisterVendorDto) {
        const { email, password, firstName, lastName, vendeur_type } = dto;

        // 👉 1. Valider présence des champs obligatoires
        if (!email || !password || !firstName || !lastName || !vendeur_type) {
            throw new BadRequestException('Tous les champs sont requis');
        }

        // Vérifier l'unicité de l'email
        const exists = await this.prisma.user.findUnique({ where: { email } });
        if (exists) {
            throw new BadRequestException('Email déjà utilisé');
        }

        // Vérifier rapidement la robustesse du mot de passe (≥ 8 caractères)
        if (!password || password.length < 8) {
            throw new BadRequestException('Mot de passe trop faible (minimum 8 caractères)');
        }

        // Hasher le mot de passe
        const hashed = await bcrypt.hash(password, 10);

        // Créer l'utilisateur inactif
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashed,
                firstName,
                lastName,
                role: Role.VENDEUR,
                vendeur_type: vendeur_type as any,
                status: false, // en attente d'activation
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                vendeur_type: true,
                status: true,
                created_at: true,
            }
        });

        // Notifier les SuperAdmin réels (tous comptes role=SUPERADMIN actifs)
        try {
            // Récupérer les emails des superadmins depuis la base
            const superAdmins = await this.prisma.user.findMany({
                where: { role: Role.SUPERADMIN, status: true },
                select: { email: true }
            });

            const emailsToNotify = superAdmins.map(sa => sa.email);

            // Si aucun compte superadmin trouvé, fallback à la variable d'env
            const fallback = process.env.SUPERADMIN_EMAIL;
            if (emailsToNotify.length === 0 && fallback) {
                emailsToNotify.push(fallback);
            }

            // Envoyer la notification à chaque superadmin
            for (const adminEmail of emailsToNotify) {
                await this.mailService.sendNotificationEmail(
                    adminEmail,
                    'Nouveau vendeur à activer',
                    `<p>Un nouveau compte vendeur (<strong>${user.email}</strong>) attend votre activation.</p>`
                );
            }
        } catch (e) {
            console.warn('Notification email non envoyé:', e.message);
        }

        return {
            success: true,
            message: 'Votre compte a été créé. Il sera activé prochainement par le SuperAdmin.'
        };
    }

    // =======================
    //  👨‍💼  Création Vendeur par Admin (activé directement)
    // =======================
    async adminCreateVendor(dto: RegisterVendorDto) {
        const { email, password, firstName, lastName, vendeur_type, phone, country, address, shop_name } = dto;

        // 👉 1. Valider présence des champs obligatoires
        if (!email || !password || !firstName || !lastName || !vendeur_type) {
            throw new BadRequestException('Tous les champs sont requis');
        }

        // Vérifier l'unicité de l'email
        const exists = await this.prisma.user.findUnique({ where: { email } });
        if (exists) {
            throw new BadRequestException('Email déjà utilisé');
        }

        // Vérifier l'unicité du nom de boutique (si fourni)
        if (shop_name) {
            const existingShop = await this.prisma.user.findFirst({
                where: { shop_name: shop_name }
            });

            if (existingShop) {
                throw new BadRequestException('Ce nom de boutique est déjà utilisé par un autre vendeur');
            }
        }

        // Vérifier rapidement la robustesse du mot de passe (≥ 8 caractères)
        if (!password || password.length < 8) {
            throw new BadRequestException('Mot de passe trop faible (minimum 8 caractères)');
        }

        // Hasher le mot de passe
        const hashed = await bcrypt.hash(password, 10);

        // Créer l'utilisateur ACTIF directement (différence avec registerVendor)
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashed,
                firstName,
                lastName,
                role: Role.VENDEUR,
                vendeur_type: vendeur_type as any,
                status: true, // ✅ ACTIF directement car créé par admin
                must_change_password: false, // Admin définit le mot de passe initial
                // 🆕 Champs étendus du profil
                phone: phone || null,
                country: country || null,
                address: address || null,
                shop_name: shop_name || null,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                vendeur_type: true,
                status: true,
                created_at: true,
                // 🆕 Inclure les champs étendus dans la réponse
                phone: true,
                country: true,
                address: true,
                shop_name: true,
            }
        });

        // Envoyer un email de bienvenue complet avec le mot de passe fourni
        try {
            await this.mailService.sendPasswordEmailWithType(
                user.email,
                firstName,
                lastName,
                password,
                vendeur_type as any // Conversion pour compatibilité avec MailService
            );
        } catch (e) {
            console.warn('Email de bienvenue non envoyé:', e.message);
        }

        return {
            success: true,
            message: 'Vendeur créé avec succès et activé directement',
            vendor: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                vendeur_type: user.vendeur_type,
                status: user.status,
                created_at: user.created_at,
                // 🆕 Inclure les champs étendus dans la réponse
                phone: user.phone,
                country: user.country,
                address: user.address,
                shop_name: user.shop_name,
            }
        };
    } catch (error) {
        console.error('Erreur lors de la création du vendeur:', error);
        
        // ✅ Gestion spécifique des erreurs de contrainte d'unicité
        if (error.code === 'P2002') {
            if (error.meta?.target?.includes('shop_name')) {
                throw new ConflictException('Ce nom de boutique est déjà utilisé par un autre vendeur');
            } else if (error.meta?.target?.includes('email')) {
                throw new ConflictException('Un utilisateur avec cet email existe déjà');
            }
        }
        
        throw new BadRequestException('Erreur lors de la création du vendeur');
    }

    /**
     * Lister les clients avec pagination, filtres et recherche
     */
    async listClients(queryDto: ListClientsQueryDto): Promise<ListClientsResponseDto> {
        const { page = 1, limit = 10, status, vendeur_type, search } = queryDto;
        
        // Construction de la condition WHERE
        const whereCondition: any = {
            role: Role.VENDEUR // On ne veut que les clients (VENDEUR)
        };

        // Filtrer par statut si spécifié
        if (status !== undefined) {
            whereCondition.status = status;
        }

        // Filtrer par type de vendeur si spécifié
        if (vendeur_type) {
            whereCondition.vendeur_type = vendeur_type;
        }

        // Recherche par nom ou email si spécifiée
        if (search) {
            whereCondition.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Calculer l'offset pour la pagination
        const skip = (page - 1) * limit;

        try {
            // Exécuter la requête avec pagination
            const [clients, total] = await Promise.all([
                this.prisma.user.findMany({
                    where: whereCondition,
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        vendeur_type: true,
                        status: true,
                        must_change_password: true,
                        last_login_at: true,
                        created_at: true,
                        updated_at: true,
                        login_attempts: true,
                        locked_until: true,
                    },
                    orderBy: { created_at: 'desc' }, // Les plus récents en premier
                    skip,
                    take: limit,
                }),
                this.prisma.user.count({
                    where: whereCondition,
                })
            ]);

            // Calculer les informations de pagination
            const totalPages = Math.ceil(total / limit);
            const hasNext = page < totalPages;
            const hasPrevious = page > 1;

            return {
                clients,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext,
                    hasPrevious,
                },
                filters: {
                    ...(status !== undefined && { status }),
                    ...(vendeur_type && { vendeur_type }),
                    ...(search && { search }),
                }
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des clients:', error);
            throw new BadRequestException('Erreur lors de la récupération des clients');
        }
    }

    /**
     * Activer/Désactiver un client
     */
    async toggleClientStatus(clientId: number) {
        const client = await this.prisma.user.findUnique({
            where: { id: clientId },
        });

        if (!client) {
            throw new NotFoundException('Client non trouvé');
        }

        // ⭐ PROTECTION SUPERADMIN : Ne jamais permettre la désactivation d'un SUPERADMIN
        if (client.role === Role.SUPERADMIN) {
            throw new BadRequestException('Impossible de modifier le statut d\'un compte SUPERADMIN');
        }

        if (client.role !== Role.VENDEUR) {
            throw new BadRequestException('Cet utilisateur n\'est pas un client');
        }

        const updatedClient = await this.prisma.user.update({
            where: { id: clientId },
            data: {
                status: !client.status,
                updated_at: new Date()
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
                updated_at: true,
            }
        });

        // ✅ Si le compte vient d'être activé, envoyer un email au vendeur
        if (!client.status && updatedClient.status) {
            try {
                await this.mailService.sendNotificationEmail(
                    updatedClient.email,
                    'Votre compte PrintAlma est maintenant actif',
                    `<p>Bonjour ${updatedClient.firstName} ${updatedClient.lastName},</p>
                     <p>🎉 Votre compte vendeur vient d'être <strong>activé</strong> !</p>
                     <p>Vous pouvez dès à présent vous connecter sur la plateforme avec vos identifiants.</p>
                     <p>À bientôt sur PrintAlma.</p>`
                );
            } catch (e) {
                console.warn('Email d\'activation non envoyé:', e.message);
            }
        }

        return {
            message: `Client ${updatedClient.status ? 'activé' : 'désactivé'} avec succès`,
            client: updatedClient
        };
    }

    /**
     * Changer le mot de passe (obligatoire pour les nouveaux comptes)
     */
    async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
        const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

        // Vérifier que les nouveaux mots de passe correspondent
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Les mots de passe ne correspondent pas');
        }

        // Récupérer l'utilisateur
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        // Vérifier l'ancien mot de passe
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Mot de passe actuel incorrect');
        }

        // Vérifier que le nouveau mot de passe est différent de l'ancien
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
        }

        // Hasher le nouveau mot de passe
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Mettre à jour le mot de passe et désactiver l'obligation de changement
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNewPassword,
                must_change_password: false,
                updated_at: new Date()
            },
        });

        return {
            message: 'Mot de passe changé avec succès'
        };
    }

    /**
     * Changement de mot de passe forcé (pour utilisateurs non encore authentifiés)
     */
    async forceChangePassword(forceChangePasswordDto: ForceChangePasswordDto) {
        const { userId, currentPassword, newPassword, confirmPassword } = forceChangePasswordDto;

        // Vérifier que les nouveaux mots de passe correspondent
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Les mots de passe ne correspondent pas');
        }

        // Récupérer l'utilisateur
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        // Vérifier que l'utilisateur doit effectivement changer son mot de passe
        if (!user.must_change_password) {
            throw new BadRequestException('Ce compte ne nécessite pas de changement de mot de passe');
        }

        // Vérifier si le compte est actif
        if (!user.status) {
            throw new UnauthorizedException('Ce compte est désactivé');
        }

        // Vérifier l'ancien mot de passe
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Mot de passe actuel incorrect');
        }

        // Vérifier que le nouveau mot de passe est différent de l'ancien
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
        }

        // Hasher le nouveau mot de passe
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Mettre à jour le mot de passe et désactiver l'obligation de changement
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNewPassword,
                must_change_password: false,
                login_attempts: 0, // Réinitialiser les tentatives
                locked_until: null, // Déverrouiller si nécessaire
                updated_at: new Date()
            },
        });

        // Générer le token JWT pour connecter l'utilisateur
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            vendeur_type: user.vendeur_type,
            firstName: user.firstName,
            lastName: user.lastName,
            profile_photo_url: user.profile_photo_url || null
        };

        const access_token = this.jwtService.sign(payload);

        return {
            message: 'Mot de passe changé avec succès',
            access_token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                vendeur_type: user.vendeur_type,
                status: user.status,
                profile_photo_url: user.profile_photo_url
            }
        };
    }
    
    async getUserProfile(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                vendeur_type: true,
                status: true,
                must_change_password: true,
                last_login_at: true,
                created_at: true,
                updated_at: true,
                profile_photo_url: true,
                phone: true,
                shop_name: true,
                country: true,
                address: true,
            }
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        return user;
    }

    async onModuleInit() {
        // Mot de passe à hasher
        const password = 'printalmatest123';

        // Générer un salt et hasher le mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Afficher le mot de passe hashé dans la console
        console.log('\n---------------------------------------------');
        console.log('MOT DE PASSE HASHÉ POUR LA BASE DE DONNÉES:');
        console.log(hashedPassword);
        console.log('---------------------------------------------\n');
    }

    /**
     * Vérifier si un nom de boutique est disponible
     */
    async checkShopNameAvailability(shopName: string) {
        if (!shopName || shopName.trim().length < 2) {
            return null;
        }

        const existingUser = await this.prisma.user.findFirst({
            where: { 
                shop_name: shopName.trim(),
                role: Role.VENDEUR
            },
            select: { id: true, email: true, shop_name: true }
        });

        return existingUser;
    }

    /**
     * Décoder un token JWT sans vérification (pour les logs de déconnexion)
     */
    decodeToken(token: string): any {
        try {
            // Décoder sans vérifier la signature (juste pour récupérer les données)
            const base64Payload = token.split('.')[1];
            const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
            return JSON.parse(payload);
        } catch (error) {
            console.error('Erreur de décodage du token:', error);
            return null;
        }
    }

    /**
     * Logger une déconnexion d'utilisateur
     */
    async logLogout(userId: number) {
        try {
            // Optionnel : Mettre à jour une date de "dernière déconnexion" si vous avez ce champ
            // await this.prisma.user.update({
            //     where: { id: userId },
            //     data: { last_logout_at: new Date() }
            // });

            console.log(`👋 Utilisateur ${userId} s'est déconnecté à ${new Date().toISOString()}`);
            
            // Vous pouvez aussi ajouter des logs dans une table dédiée si nécessaire
            // await this.prisma.userLog.create({
            //     data: {
            //         userId,
            //         action: 'LOGOUT',
            //         timestamp: new Date(),
            //         ip: req.ip,
            //         userAgent: req.headers['user-agent']
            //     }
            // });
            
        } catch (error) {
            console.error('Erreur lors du logging de déconnexion:', error);
            // Ne pas faire échouer la déconnexion pour un problème de log
        }
    }

    /**
     * Débloquer manuellement un compte utilisateur (réservé aux admins)
     */
    async unlockUserAccount(userId: number) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    locked_until: true,
                    login_attempts: true,
                    status: true
                }
            });

            if (!user) {
                throw new NotFoundException('Utilisateur non trouvé');
            }

            // Vérifier si le compte est effectivement verrouillé
            const isLocked = user.locked_until && user.locked_until > new Date();
            
            if (!isLocked && user.login_attempts === 0) {
                return {
                    message: 'Le compte n\'est pas verrouillé',
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        status: 'already_unlocked'
                    }
                };
            }

            // Débloquer le compte
            const updatedUser = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    locked_until: null,
                    login_attempts: 0,
                    updated_at: new Date()
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    updated_at: true
                }
            });

            console.log(`🔓 Compte débloqué manuellement: ${user.email} (ID: ${user.id})`);

            return {
                message: 'Compte débloqué avec succès',
                user: {
                    ...updatedUser,
                    status: 'unlocked'
                },
                unlockedAt: new Date().toISOString()
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('Erreur lors du déblocage du compte:', error);
            throw new BadRequestException('Erreur lors du déblocage du compte');
        }
    }

    async getActivationStatus(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email }, select: { status: true } });
        if (!user) {
            throw new NotFoundException('Utilisateur introuvable');
        }
        return { activated: user.status };
    }

    // =======================
    //  🔧 MÉTHODES RESTAURÉES (implémentations simplifiées)
    // =======================

    async listVendors(userId: number) {
        // TODO: Rebrancher logique business complète
        return { vendors: [], total: 0, message: 'Feature en cours de réimplémentation' };
    }

    async getVendorsStats() {
        return { stats: [], total: 0, message: 'Feature en cours de réimplémentation' };
    }

    async forgotPassword(dto?: any) {
        throw new BadRequestException('Endpoint désactivé temporairement');
    }

    async verifyResetToken(dto?: any) {
        throw new BadRequestException('Endpoint désactivé temporairement');
    }

    async resetPassword(dto?: any) {
        throw new BadRequestException('Endpoint désactivé temporairement');
    }

    async cleanupExpiredResetTokens() {
        return { deletedCount: 0 };
    }

    async adminResetVendorPassword(dto?: any) {
        throw new BadRequestException('Fonctionnalité non implémentée');
    }

    // 🆕 ========================
    // MÉTHODES PROFIL VENDEUR ÉTENDU
    // ========================

    /**
     * Créer un vendeur avec photo de profil optionnelle (multipart/form-data)
     */
    async createVendorWithPhoto(createClientDto: CreateClientDto, profilePhoto?: Express.Multer.File) {
        const { 
            firstName, 
            lastName, 
            email, 
            vendeur_type,
            phone,
            country,
            address,
            shop_name 
        } = createClientDto;

        // Vérifier si l'email existe déjà
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Un utilisateur avec cet email existe déjà');
        }

        // Vérifier si le nom de boutique existe déjà (si fourni)
        if (shop_name) {
            const existingShop = await this.prisma.user.findFirst({
                where: { shop_name: shop_name }
            });

            if (existingShop) {
                throw new ConflictException('Ce nom de boutique est déjà utilisé par un autre vendeur');
            }
        }

        let profilePhotoUrl = null;
        let profilePhotoPublicId = null;

        try {
            // Uploader la photo de profil si fournie
            if (profilePhoto) {
                console.log(`📸 Upload photo de profil pour ${firstName} ${lastName}`);
                const uploadResult = await this.cloudinaryService.uploadProfilePhoto(profilePhoto);
                profilePhotoUrl = uploadResult.secure_url;
                profilePhotoPublicId = uploadResult.public_id;
            }

            // Générer un mot de passe temporaire
            const temporaryPassword = this.mailService.generateRandomPassword();
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

            // Créer l'utilisateur avec tous les champs
            const newUser = await this.prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    role: Role.VENDEUR,
                    vendeur_type: vendeur_type as any,
                    must_change_password: true,
                    status: true,
                    // Nouveaux champs étendus
                    phone: phone || null,
                    country: country || null,
                    address: address || null,
                    shop_name: shop_name || null,
                    profile_photo_url: profilePhotoUrl,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    vendeur_type: true,
                    status: true,
                    created_at: true,
                    phone: true,
                    country: true,
                    address: true,
                    shop_name: true,
                    profile_photo_url: true,
                }
            });

            // Envoyer l'email de bienvenue avec les informations étendues
            await this.mailService.sendVendorWelcomeEmail({
                email,
                firstName,
                lastName,
                tempPassword: temporaryPassword,
                shopName: shop_name || 'Votre boutique',
                vendeur_type: vendeur_type
            });

            return {
                success: true,
                message: 'Vendeur créé avec succès. Un email avec les identifiants a été envoyé.',
                user: newUser
            };
        } catch (error) {
            // Nettoyer la photo uploadée en cas d'erreur
            if (profilePhotoPublicId) {
                try {
                    await this.cloudinaryService.deleteImage(profilePhotoPublicId);
                } catch (deleteError) {
                    console.error('Erreur suppression photo de profil:', deleteError);
                }
            }
            
            console.error('Erreur lors de la création du vendeur:', error);
            
            // ✅ Gestion spécifique des erreurs de contrainte d'unicité
            if (error.code === 'P2002') {
                if (error.meta?.target?.includes('shop_name')) {
                    throw new ConflictException('Ce nom de boutique est déjà utilisé par un autre vendeur');
                } else if (error.meta?.target?.includes('email')) {
                    throw new ConflictException('Un utilisateur avec cet email existe déjà');
                }
            }
            
            throw new BadRequestException('Erreur lors de la création du vendeur');
        }
    }

    /**
     * Récupérer le profil complet d'un vendeur
     */
    async getExtendedVendorProfile(userId: number): Promise<ExtendedVendorProfileResponseDto> {
        const vendor = await this.prisma.user.findUnique({
            where: { id: userId, role: Role.VENDEUR },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                vendeur_type: true,
                phone: true,
                country: true,
                address: true,
                shop_name: true,
                profile_photo_url: true,
                created_at: true,
                last_login_at: true,
            }
        });

        if (!vendor) {
            throw new NotFoundException('Vendeur non trouvé');
        }

        return vendor;
    }

    /**
     * Mettre à jour le profil d'un vendeur avec photo optionnelle
     */
    async updateVendorProfile(userId: number, updateDto: UpdateVendorProfileDto, newProfilePhoto?: Express.Multer.File) {
        const vendor = await this.prisma.user.findUnique({
            where: { id: userId, role: Role.VENDEUR },
            select: { id: true, profile_photo_url: true, email: true }
        });

        if (!vendor) {
            throw new NotFoundException('Vendeur non trouvé');
        }

        let profilePhotoUrl = undefined;
        let oldPhotoPublicId = null;

        try {
            // Gérer la nouvelle photo si fournie
            if (newProfilePhoto) {
                console.log(`📸 Mise à jour photo de profil pour vendeur ${userId}`);
                
                // Extraire l'ancien public_id pour suppression
                if (vendor.profile_photo_url) {
                    const urlParts = vendor.profile_photo_url.split('/');
                    const fileNameWithExt = urlParts[urlParts.length - 1];
                    const fileName = fileNameWithExt.split('.')[0];
                    oldPhotoPublicId = `profile-photos/${fileName}`;
                }

                // Uploader la nouvelle photo
                const uploadResult = await this.cloudinaryService.uploadProfilePhoto(newProfilePhoto, userId);
                profilePhotoUrl = uploadResult.secure_url;
            }

            // Préparer les données de mise à jour
            const updateData: any = {
                ...updateDto,
                updated_at: new Date()
            };

            // Gestion de la modification de l'email
            if (updateDto.email && updateDto.email !== vendor.email) {
                // Vérifier si l'email est déjà utilisé par un autre utilisateur
                const existing = await this.prisma.user.findUnique({ where: { email: updateDto.email } });
                if (existing && existing.id !== userId) {
                    throw new BadRequestException('Cet email est déjà utilisé par un autre utilisateur.');
                }
                updateData.email = updateDto.email;
            }
            
            // Gestion de la modification du nom de boutique
            if (updateDto.shop_name) {
                // Vérifier si le nom de boutique est déjà utilisé par un autre vendeur
                const existingShop = await this.prisma.user.findFirst({ 
                    where: { 
                        shop_name: updateDto.shop_name,
                        id: { not: userId }
                    } 
                });
                if (existingShop) {
                    throw new BadRequestException('Ce nom de boutique est déjà utilisé par un autre vendeur.');
                }
                updateData.shop_name = updateDto.shop_name;
            }
            
            // Gestion du prénom et nom
            if (updateDto.firstName) {
                updateData.firstName = updateDto.firstName;
            }
            if (updateDto.lastName) {
                updateData.lastName = updateDto.lastName;
            }

            if (profilePhotoUrl) {
                updateData.profile_photo_url = profilePhotoUrl;
            }

            // Mettre à jour le profil
            await this.prisma.user.update({
                where: { id: userId },
                data: updateData
            });

            // Supprimer l'ancienne photo après succès
            if (oldPhotoPublicId && profilePhotoUrl) {
                try {
                    await this.cloudinaryService.deleteImage(oldPhotoPublicId);
                } catch (deleteError) {
                    console.warn('Impossible de supprimer l\'ancienne photo:', deleteError);
                }
            }

            return {
                success: true,
                message: 'Profil mis à jour avec succès'
            };
        } catch (error) {
            console.error('Erreur mise à jour profil vendeur:', error);
            throw new BadRequestException('Erreur lors de la mise à jour du profil');
        }
    }

    /**
     * Statistiques vendeurs par pays
     */
    async getVendorStatsByCountry() {
        try {
            const stats = await this.prisma.user.groupBy({
                by: ['country'],
                where: { 
                    role: Role.VENDEUR,
                    country: { not: null }
                },
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                }
            });

            const formattedStats = stats.map(stat => ({
                country: stat.country || 'Non spécifié',
                count: stat._count.id
            }));

            return {
                success: true,
                stats: formattedStats,
                total: formattedStats.reduce((sum, stat) => sum + stat.count, 0)
            };
        } catch (error) {
            console.error('Erreur stats vendeurs par pays:', error);
            throw new BadRequestException('Erreur lors de la récupération des statistiques');
        }
    }

    /**
   * Demande de changement d'email sécurisé pour un vendeur
   */
  async requestVendorEmailChange(userId: number, newEmail: string, currentPassword: string) {
    // 1. Vérifier l'utilisateur
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    // 2. Vérifier le mot de passe
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new UnauthorizedException('Mot de passe incorrect');
    // 3. Vérifier unicité de l'email
    if (newEmail === user.email) throw new BadRequestException('Nouvel email identique à l\'actuel');
    const exists = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (exists) throw new BadRequestException('Cet email est déjà utilisé');
    // 4. Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    // 5. Stocker la demande (table email_change_request à créer)
    await this.prisma.emailChangeRequest.create({
      data: {
        userId: userId,
        newEmail: newEmail,
        token,
        expiresAt: expiresAt
      }
    });
    // 6. Envoyer l'email de confirmation à la nouvelle adresse
    const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/confirm-email-change?token=${token}`;
    await this.mailService.sendEmail({
      to: newEmail,
      subject: 'Confirmez votre nouvelle adresse email',
      template: 'generic',
      context: {
        content: `<p>Pour valider votre nouvelle adresse email, cliquez sur ce lien : <a href="${confirmUrl}">Confirmer mon email</a></p><p>Ce lien est valable 24h.</p>`
      }
    });
    // 7. Notifier l'ancienne adresse
    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Demande de changement d\'email',
      template: 'generic',
      context: {
        content: `<p>Une demande de changement d'email a été initiée pour votre compte. Si ce n'est pas vous, contactez le support.</p>`
      }
    });
    return { success: true, message: 'Un email de confirmation a été envoyé à la nouvelle adresse.' };
  }

  /**
   * Confirmation du changement d'email via token
   */
  async confirmVendorEmailChange(token: string) {
    // 1. Retrouver la demande
    const req = await this.prisma.emailChangeRequest.findUnique({ where: { token } });
    if (!req || req.expiresAt < new Date()) throw new BadRequestException('Lien invalide ou expiré');
    // 2. Mettre à jour l'email
    await this.prisma.user.update({ where: { id: req.userId }, data: { email: req.newEmail } });
    // 3. Supprimer la demande
    await this.prisma.emailChangeRequest.delete({ where: { token } });
    // 4. (Optionnel) Notifier l'utilisateur
    // ...
    return { success: true, message: 'Votre adresse email a été mise à jour.' };
    }
}