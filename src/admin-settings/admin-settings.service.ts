import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { Role, OrderStatus } from '@prisma/client';
import {
  ChangeAdminPasswordDto,
  ChangePasswordResponseDto
} from './dto/change-admin-password.dto';
import {
  AppSettingsDto,
  AppSettingsResponseDto,
  AdminStatsDto
} from './dto/app-settings.dto';

@Injectable()
export class AdminSettingsService {
  // Clé pour stocker les paramètres dans la base de données
  private readonly SETTINGS_KEY = 'app_settings';

  constructor(private prisma: PrismaService) {}

  /**
   * Changer le mot de passe d'un administrateur (ADMIN ou SUPERADMIN uniquement)
   */
  async changeAdminPassword(
    userId: number,
    dto: ChangeAdminPasswordDto
  ): Promise<ChangePasswordResponseDto> {
    const { currentPassword, newPassword, confirmPassword } = dto;

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'Le nouveau mot de passe et la confirmation ne correspondent pas'
      );
    }

    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que l'utilisateur est bien un admin ou superadmin
    if (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN) {
      throw new UnauthorizedException(
        'Cette action est réservée aux administrateurs'
      );
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Le mot de passe actuel est incorrect');
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l\'ancien'
      );
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date()
      }
    });

    console.log(
      `🔑 Mot de passe modifié pour ${user.role}: ${user.email} (ID: ${user.id})`
    );

    return {
      success: true,
      message: 'Mot de passe modifié avec succès',
      changedAt: new Date()
    };
  }

  /**
   * Récupérer les paramètres généraux de l'application
   */
  async getAppSettings(): Promise<AppSettingsResponseDto> {
    try {
      // Récupérer tous les paramètres depuis la BDD (avec gestion d'erreur si la table n'existe pas)
      let dbSettings = [];
      try {
        dbSettings = await this.prisma.appSettings.findMany();
      } catch (dbError) {
        console.warn('⚠️ Table app_settings non disponible, utilisation des variables d\'environnement');
      }

      // Convertir en objet clé-valeur
      const settingsMap = new Map<string, any>();
      dbSettings.forEach(setting => {
        settingsMap.set(setting.key, this.parseSettingValue(setting));
      });

      // Valeurs par défaut avec fallback sur variables d'environnement
      const settings: AppSettingsResponseDto = {
        appName: settingsMap.get('appName') || process.env.APP_NAME || 'PrintAlma',
        contactEmail: settingsMap.get('contactEmail') || process.env.CONTACT_EMAIL || 'contact@printalma.com',
        supportEmail: settingsMap.get('supportEmail') || process.env.SUPPORT_EMAIL || 'support@printalma.com',
        contactPhone: settingsMap.get('contactPhone') || process.env.CONTACT_PHONE || '+221 77 123 45 67',
        companyAddress: settingsMap.get('companyAddress') || process.env.COMPANY_ADDRESS || 'Dakar, Sénégal',
        websiteUrl: settingsMap.get('websiteUrl') || process.env.WEBSITE_URL || 'https://printalma.com',
        vendorRegistrationEnabled: settingsMap.get('vendorRegistrationEnabled') ?? (process.env.VENDOR_REGISTRATION_ENABLED === 'true'),
        emailNotificationsEnabled: settingsMap.get('emailNotificationsEnabled') ?? (process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false'),
        defaultVendorCommission: settingsMap.get('defaultVendorCommission') || parseFloat(process.env.DEFAULT_VENDOR_COMMISSION || '15'),
        minWithdrawalAmount: settingsMap.get('minWithdrawalAmount') || parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '5000'),
        currency: settingsMap.get('currency') || process.env.CURRENCY || 'XOF',
        maintenanceMode: settingsMap.get('maintenanceMode') ?? (process.env.MAINTENANCE_MODE === 'true'),
        maintenanceMessage: settingsMap.get('maintenanceMessage') || process.env.MAINTENANCE_MESSAGE || 'Le site est en maintenance',
        updatedAt: dbSettings.length > 0 ? dbSettings[0].updatedAt : new Date(),
        updatedBy: dbSettings.length > 0 ? dbSettings[0].updatedBy || undefined : undefined
      };

      return settings;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des paramètres de l\'application'
      );
    }
  }

  /**
   * Parser la valeur d'un paramètre selon son type
   */
  private parseSettingValue(setting: any): any {
    if (!setting.value) return null;

    switch (setting.dataType) {
      case 'boolean':
        return setting.value === 'true';
      case 'number':
        return parseFloat(setting.value);
      case 'json':
        try {
          return JSON.parse(setting.value);
        } catch {
          return setting.value;
        }
      default:
        return setting.value;
    }
  }

  /**
   * Mettre à jour les paramètres généraux de l'application
   */
  async updateAppSettings(
    adminId: number,
    dto: AppSettingsDto
  ): Promise<AppSettingsResponseDto> {
    try {
      // Vérifier que l'utilisateur est bien un admin
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        select: { role: true }
      });

      if (!admin || (admin.role !== Role.ADMIN && admin.role !== Role.SUPERADMIN)) {
        throw new UnauthorizedException(
          'Cette action est réservée aux administrateurs'
        );
      }

      // Vérifier si la table app_settings existe
      let tableExists = true;
      try {
        await this.prisma.appSettings.findFirst();
      } catch (tableError) {
        console.warn('⚠️ Table app_settings non disponible. Veuillez exécuter la migration.');
        tableExists = false;
      }

      if (tableExists) {
        // Sauvegarder chaque paramètre dans la base de données
        const settingsToUpdate = [
          { key: 'appName', value: dto.appName, dataType: 'string', category: 'company' },
          { key: 'contactEmail', value: dto.contactEmail, dataType: 'string', category: 'company' },
          { key: 'supportEmail', value: dto.supportEmail, dataType: 'string', category: 'company' },
          { key: 'contactPhone', value: dto.contactPhone, dataType: 'string', category: 'company' },
          { key: 'companyAddress', value: dto.companyAddress, dataType: 'string', category: 'company' },
          { key: 'websiteUrl', value: dto.websiteUrl, dataType: 'string', category: 'company' },
          { key: 'vendorRegistrationEnabled', value: dto.vendorRegistrationEnabled?.toString(), dataType: 'boolean', category: 'vendors' },
          { key: 'emailNotificationsEnabled', value: dto.emailNotificationsEnabled?.toString(), dataType: 'boolean', category: 'email' },
          { key: 'defaultVendorCommission', value: dto.defaultVendorCommission?.toString(), dataType: 'number', category: 'vendors' },
          { key: 'minWithdrawalAmount', value: dto.minWithdrawalAmount?.toString(), dataType: 'number', category: 'vendors' },
          { key: 'currency', value: dto.currency, dataType: 'string', category: 'general' },
          { key: 'maintenanceMode', value: dto.maintenanceMode?.toString(), dataType: 'boolean', category: 'maintenance' },
          { key: 'maintenanceMessage', value: dto.maintenanceMessage, dataType: 'string', category: 'maintenance' }
        ];

        // Mettre à jour ou créer chaque paramètre
        for (const setting of settingsToUpdate) {
          if (setting.value !== undefined) {
            await this.prisma.appSettings.upsert({
              where: { key: setting.key },
              update: {
                value: setting.value,
                dataType: setting.dataType,
                category: setting.category,
                updatedBy: adminId,
                updatedAt: new Date()
              },
              create: {
                key: setting.key,
                value: setting.value,
                dataType: setting.dataType,
                category: setting.category,
                updatedBy: adminId
              }
            });
          }
        }

        console.log(`✅ Paramètres mis à jour par l'admin ID: ${adminId}`);
      } else {
        console.warn(`⚠️ Les paramètres ne peuvent pas être sauvegardés car la table app_settings n'existe pas.`);
        console.warn(`📝 Pour créer la table, exécutez le script SQL: prisma/migrations/20260305123259_add_app_settings_table/migration.sql`);
      }

      // Retourner les paramètres mis à jour (depuis les valeurs envoyées ou depuis la BDD)
      return {
        ...dto,
        updatedAt: new Date(),
        updatedBy: adminId
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      console.error('Stack trace:', error.stack);
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour des paramètres de l\'application'
      );
    }
  }

  /**
   * Récupérer les statistiques générales pour le dashboard admin
   */
  async getAdminStats(): Promise<AdminStatsDto> {
    try {
      // Statistiques des vendeurs
      const [totalVendors, activeVendors] = await Promise.all([
        this.prisma.user.count({
          where: {
            role: Role.VENDEUR,
            is_deleted: false
          }
        }),
        this.prisma.user.count({
          where: {
            role: Role.VENDEUR,
            status: true,
            is_deleted: false
          }
        })
      ]);

      const inactiveVendors = totalVendors - activeVendors;

      // Statistiques des commandes
      const [totalOrders, pendingOrders] = await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.count({
          where: {
            status: {
              in: [OrderStatus.PENDING, OrderStatus.PROCESSING]
            }
          }
        })
      ]);

      // Chiffre d'affaires total
      const revenueResult = await this.prisma.order.aggregate({
        where: {
          status: {
            in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED]
          }
        },
        _sum: {
          totalAmount: true
        }
      });

      const totalRevenue = revenueResult._sum.totalAmount || 0;

      // Statistiques des produits (produits admin + produits vendeurs)
      const [totalAdminProducts, totalVendorProducts] = await Promise.all([
        this.prisma.product.count({
          where: { isDelete: false }
        }),
        this.prisma.vendorProduct.count({
          where: { isDelete: false }
        })
      ]);

      const totalProducts = totalAdminProducts + totalVendorProducts;

      const [activeAdminProducts, activeVendorProducts] = await Promise.all([
        this.prisma.product.count({
          where: {
            isDelete: false,
            isValidated: true
          }
        }),
        this.prisma.vendorProduct.count({
          where: {
            isDelete: false,
            isValidated: true
          }
        })
      ]);

      const activeProducts = activeAdminProducts + activeVendorProducts;

      return {
        totalVendors,
        activeVendors,
        inactiveVendors,
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalProducts,
        activeProducts
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des statistiques'
      );
    }
  }

  /**
   * Récupérer les informations du profil admin
   */
  async getAdminProfile(userId: number) {
    try {
      const admin = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          profile_photo_url: true,
          created_at: true,
          last_login_at: true,
          customRole: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      if (!admin) {
        throw new NotFoundException('Administrateur non trouvé');
      }

      // Formater les permissions si un customRole existe
      let formattedCustomRole = null;
      if (admin.customRole) {
        formattedCustomRole = {
          id: admin.customRole.id,
          name: admin.customRole.name,
          slug: admin.customRole.slug,
          description: admin.customRole.description,
          permissions: admin.customRole.permissions.map(rp => ({
            id: rp.permission.id,
            key: rp.permission.key,
            name: rp.permission.name,
            module: rp.permission.module,
            description: rp.permission.description
          }))
        };
      }

      return {
        ...admin,
        customRole: formattedCustomRole
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erreur lors de la récupération du profil admin:', error);
      throw new InternalServerErrorException(
        'Erreur lors de la récupération du profil'
      );
    }
  }
}
