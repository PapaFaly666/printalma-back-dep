import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import {
  CompleteOnboardingDto,
  UpdatePhonesDto,
} from './dto/complete-onboarding.dto';
import {
  validateSenegalPhone,
  normalizeSenegalPhone,
  extractUsername,
} from './validators/phone.validator';

@Injectable()
export class VendorOnboardingService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Compléter l'onboarding vendeur
   */
  async completeOnboarding(
    vendorId: number,
    dto: CompleteOnboardingDto,
    profileImage?: Express.Multer.File,
    keepExistingImage: boolean = false,
  ) {
    // 1. Validation et normalisation des numéros de téléphone (si fournis)
    let normalizedPhones: Array<{ number: string; isPrimary: boolean }> = [];

    if (dto.phones && dto.phones.length > 0) {
      // Validation des numéros
      this.validatePhones(dto.phones);

      // Vérifier qu'il y a exactement un numéro principal
      const primaryCount = dto.phones.filter((p) => p.isPrimary).length;
      if (primaryCount !== 1) {
        throw new BadRequestException(
          'Vous devez désigner exactement un numéro comme principal',
        );
      }

      // Normaliser les numéros
      normalizedPhones = dto.phones.map((phone) => ({
        number: normalizeSenegalPhone(phone.number),
        isPrimary: phone.isPrimary,
      }));

      // Vérifier les doublons
      const phoneNumbers = normalizedPhones.map((p) => p.number);
      if (new Set(phoneNumbers).size !== phoneNumbers.length) {
        throw new BadRequestException(
          'Vous avez fourni le même numéro plusieurs fois',
        );
      }
    }

    // 5. Récupérer le vendeur actuel
    const currentVendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      select: { profile_photo_url: true },
    });

    // 6. Gestion de la photo de profil
    let profileImageUrl: string | undefined;
    let oldImageUrl: string | undefined;

    if (keepExistingImage) {
      // Garder l'image existante
      if (!currentVendor?.profile_photo_url) {
        throw new BadRequestException(
          'Aucune image existante à conserver. Veuillez uploader une photo de profil.',
        );
      }
      profileImageUrl = currentVendor.profile_photo_url;
    } else if (profileImage) {
      // Upload de la nouvelle image
      try {
        const uploadResult = await this.cloudinaryService.uploadImage(
          profileImage,
          'vendor-profiles',
        );
        profileImageUrl = uploadResult.secure_url;
        oldImageUrl = currentVendor?.profile_photo_url;
      } catch (error) {
        throw new BadRequestException(
          `Erreur lors de l'upload de l'image: ${error.message}`,
        );
      }
    } else {
      // Aucune image fournie et keepExistingImage = false
      // C'est maintenant accepté - la photo est optionnelle
      profileImageUrl = currentVendor?.profile_photo_url;
    }

    // 7. Transaction pour garantir la cohérence
    const result = await this.prisma.$transaction(async (prisma) => {
      // Supprimer les anciens numéros
      await prisma.vendorPhone.deleteMany({
        where: { vendorId },
      });

      // Insérer les nouveaux numéros (si fournis)
      if (normalizedPhones.length > 0) {
        await Promise.all(
          normalizedPhones.map((phone) =>
            prisma.vendorPhone.create({
              data: {
                vendorId,
                phoneNumber: phone.number,
                isPrimary: phone.isPrimary,
              },
            }),
          ),
        );
      }

      // Préparer les données de réseaux sociaux
      const socialMediaData: any = {};
      if (dto.socialMedia && dto.socialMedia.length > 0) {
        dto.socialMedia.forEach((social) => {
          const fieldName = `${social.platform}_url`;
          socialMediaData[fieldName] = social.url;
        });
      }

      // Mettre à jour le profil vendeur
      const updatedVendor = await prisma.user.update({
        where: { id: vendorId },
        data: {
          profile_completed: true,
          onboarding_completed_at: new Date(),
          profile_photo_url: profileImageUrl,
          ...socialMediaData,
        },
        include: {
          vendorPhones: true,
        },
      });

      return updatedVendor;
    });

    // 8. Supprimer l'ancienne image de Cloudinary si une nouvelle a été uploadée
    if (oldImageUrl) {
      try {
        await this.cloudinaryService.deleteImage(oldImageUrl);
      } catch (error) {
        console.warn(
          'Erreur lors de la suppression de l\'ancienne image:',
          error,
        );
      }
    }

    // 9. Formater la réponse
    return {
      success: true,
      message: 'Profil complété avec succès',
      vendor: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        profileCompleted: result.profile_completed,
        profileImage: result.profile_photo_url,
        phones: result.vendorPhones.map((p) => ({
          number: p.phoneNumber,
          isPrimary: p.isPrimary,
        })),
        socialMedia: this.extractSocialMedia(result),
      },
    };
  }

  /**
   * Vérifier le statut de complétion du profil
   */
  async getProfileStatus(vendorId: number) {
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      include: {
        vendorPhones: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    // Le profil est considéré complété si le flag profile_completed est true
    // (même si les champs sont vides, car l'onboarding est optionnel)
    const isComplete = vendor.profile_completed;

    return {
      success: true,
      profileCompleted: isComplete,
      details: {
        hasProfileImage: !!vendor.profile_photo_url,
        phoneCount: vendor.vendorPhones.length,
        completedAt: vendor.onboarding_completed_at,
      },
    };
  }

  /**
   * Récupérer les informations d'onboarding
   */
  async getOnboardingInfo(vendorId: number) {
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      include: {
        vendorPhones: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    return {
      success: true,
      data: {
        profileImage: vendor.profile_photo_url,
        phones: vendor.vendorPhones.map((p) => ({
          id: p.id,
          number: p.phoneNumber,
          isPrimary: p.isPrimary,
        })),
        socialMedia: this.extractSocialMedia(vendor),
      },
    };
  }

  /**
   * Mettre à jour les numéros de téléphone
   */
  async updatePhones(vendorId: number, dto: UpdatePhonesDto) {
    // Validation
    this.validatePhones(dto.phones);

    const primaryCount = dto.phones.filter((p) => p.isPrimary).length;
    if (primaryCount !== 1) {
      throw new BadRequestException(
        'Vous devez désigner exactement un numéro comme principal',
      );
    }

    const normalizedPhones = dto.phones.map((phone) => ({
      number: normalizeSenegalPhone(phone.number),
      isPrimary: phone.isPrimary,
    }));

    const phoneNumbers = normalizedPhones.map((p) => p.number);
    if (new Set(phoneNumbers).size !== phoneNumbers.length) {
      throw new BadRequestException(
        'Vous avez fourni le même numéro plusieurs fois',
      );
    }

    // Transaction
    await this.prisma.$transaction(async (prisma) => {
      await prisma.vendorPhone.deleteMany({
        where: { vendorId },
      });

      await Promise.all(
        normalizedPhones.map((phone) =>
          prisma.vendorPhone.create({
            data: {
              vendorId,
              phoneNumber: phone.number,
              isPrimary: phone.isPrimary,
            },
          }),
        ),
      );
    });

    return {
      success: true,
      message: 'Numéros de téléphone mis à jour avec succès',
    };
  }

  /**
   * Valider les numéros de téléphone
   */
  private validatePhones(phones: any[]) {
    phones.forEach((phone, index) => {
      if (!validateSenegalPhone(phone.number)) {
        throw new BadRequestException(
          `Le numéro ${index + 1} est invalide (format attendu: +221XXXXXXXXX ou 7XXXXXXXX)`,
        );
      }
    });
  }

  /**
   * Extraire les réseaux sociaux d'un utilisateur
   */
  private extractSocialMedia(user: any) {
    const socialMedia = [];
    const platforms = [
      'facebook',
      'instagram',
      'twitter',
      'linkedin',
      'youtube',
    ];

    platforms.forEach((platform) => {
      const fieldName = `${platform}_url`;
      if (user[fieldName]) {
        socialMedia.push({
          platform,
          url: user[fieldName],
          username: extractUsername(user[fieldName]),
        });
      }
    });

    return socialMedia;
  }
}
