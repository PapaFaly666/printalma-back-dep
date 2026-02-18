import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class HomeContentService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Valider qu'une URL d'image est valide
   * Accepte:
   * - URLs complètes (http/https) de sources autorisées
   * - URLs relatives commençant par / (pour compatibilité)
   */
  private isValidImageUrl(url: string): boolean {
    // URLs relatives sont acceptées (commencent par /)
    if (url.startsWith('/')) {
      return true;
    }

    const allowedDomains = [
      'res.cloudinary.com',
      'images.unsplash.com',
      'tse2.mm.bing.net',
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com',
    ];

    try {
      const urlObj = new URL(url);
      return allowedDomains.some((domain) => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * Récupérer tout le contenu (Admin)
   */
  async getContent() {
    try {
      const content = await this.prisma.homeContent.findMany({
        orderBy: { order: 'asc' },
      });

      return {
        designs: content
          .filter((item) => item.type === 'DESIGN')
          .map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            order: item.order,
          })),
        influencers: content
          .filter((item) => item.type === 'INFLUENCER')
          .map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            order: item.order,
          })),
        merchandising: content
          .filter((item) => item.type === 'MERCHANDISING')
          .map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            order: item.order,
          })),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu:', error);
      throw new BadRequestException('Erreur lors de la récupération du contenu');
    }
  }

  /**
   * Mettre à jour tout le contenu (Admin)
   */
  async updateContent(data: UpdateContentDto) {
    try {
      // Validation des quantités
      if (data.designs.length !== 6) {
        throw new BadRequestException('Designs: 6 items requis');
      }
      if (data.influencers.length !== 5) {
        throw new BadRequestException('Influenceurs: 5 items requis');
      }
      if (data.merchandising.length !== 6) {
        throw new BadRequestException('Merchandising: 6 items requis');
      }

      // Vérifier que tous les IDs existent
      const allIds = [
        ...data.designs.map((d) => d.id),
        ...data.influencers.map((i) => i.id),
        ...data.merchandising.map((m) => m.id),
      ];

      const existingItems = await this.prisma.homeContent.findMany({
        where: { id: { in: allIds } },
      });

      if (existingItems.length !== allIds.length) {
        const existingIds = existingItems.map((item) => item.id);
        const invalidIds = allIds.filter((id) => !existingIds.includes(id));

        console.error('❌ IDs invalides détectés:', {
          invalidIds,
          receivedIds: allIds,
          existingIds,
        });

        throw new BadRequestException(
          `Certains IDs sont invalides. IDs non trouvés: ${invalidIds.join(', ')}. ` +
          `Veuillez d'abord récupérer le contenu via GET /admin/content pour obtenir les IDs valides.`
        );
      }

      // Valider les URLs d'images
      for (const item of [...data.designs, ...data.influencers, ...data.merchandising]) {
        if (!this.isValidImageUrl(item.imageUrl)) {
          throw new BadRequestException(`URL d'image invalide: ${item.imageUrl}`);
        }
      }

      // Transaction pour garantir la cohérence
      return await this.prisma.$transaction(async (tx) => {
        // Mettre à jour chaque item individuellement
        const updates = [
          ...data.designs.map((item) =>
            tx.homeContent.update({
              where: { id: item.id },
              data: {
                name: item.name,
                imageUrl: item.imageUrl,
              },
            }),
          ),
          ...data.influencers.map((item) =>
            tx.homeContent.update({
              where: { id: item.id },
              data: {
                name: item.name,
                imageUrl: item.imageUrl,
              },
            }),
          ),
          ...data.merchandising.map((item) =>
            tx.homeContent.update({
              where: { id: item.id },
              data: {
                name: item.name,
                imageUrl: item.imageUrl,
              },
            }),
          ),
        ];

        await Promise.all(updates);

        return { success: true, message: 'Contenu sauvegardé avec succès' };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contenu:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erreur lors de la mise à jour du contenu');
    }
  }

  /**
   * Upload d'image vers Cloudinary (Admin)
   * Supporte: JPG, PNG, SVG, WEBP
   */
  async uploadContentImage(
    file: Express.Multer.File,
    section: string,
  ): Promise<{ url: string; publicId: string }> {
    try {
      // Détecter si c'est un SVG (par MIME type ou extension)
      const isSVG = file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg');

      // Validation du type de fichier
      const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/svg+xml',
        'image/webp',
      ];

      // Accepter aussi les SVG avec MIME type text/plain ou text/xml
      const isSvgByExtension = file.originalname.toLowerCase().endsWith('.svg');
      const isValidMimeType = allowedMimes.includes(file.mimetype) || isSvgByExtension;

      if (!isValidMimeType) {
        throw new BadRequestException(
          'Type de fichier non supporté. Formats acceptés: JPG, PNG, SVG, WEBP',
        );
      }

      // Limite de taille: 5MB
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Fichier trop volumineux (max 5MB)');
      }

      // Valider la section
      const validSections = ['designs', 'influencers', 'merchandising'];
      if (!validSections.includes(section)) {
        throw new BadRequestException('Section invalide');
      }

      console.log(
        `📤 Upload image contenu: ${file.originalname} (${Math.round(file.size / 1024)}KB) pour section: ${section} ${isSVG ? '[SVG]' : ''}`,
      );

      // Configuration d'upload selon le type de fichier
      let uploadOptions: any = {
        folder: `home_content/${section}`,
      };

      if (isSVG) {
        // Configuration spéciale pour SVG - pas de transformations
        console.log('🎨 Détection SVG - upload sans transformations');
        uploadOptions = {
          ...uploadOptions,
          resource_type: 'image',
          format: 'svg',
          // Pas de transformation pour préserver le SVG
        };
      } else {
        // Configuration pour images raster (jpg, png, webp)
        uploadOptions = {
          ...uploadOptions,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        };
      }

      // Upload vers Cloudinary
      const result = await this.cloudinaryService.uploadImageWithOptions(file, uploadOptions);

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erreur lors de l\'upload de l\'image');
    }
  }

  /**
   * Initialiser le contenu de la page d'accueil (Seed)
   * Cette méthode est utilisée pour créer les 17 items initiaux
   */
  async initializeContent() {
    try {
      // Vérifier si le contenu existe déjà
      const existingCount = await this.prisma.homeContent.count();

      if (existingCount > 0) {
        throw new BadRequestException('Le contenu existe déjà');
      }

      const designs = [
        { name: 'Pap Musa', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/pap_musa', order: 0 },
        { name: 'Ceeneer', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/ceeneer', order: 1 },
        { name: 'K & C', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/k_ethiakh', order: 2 },
        { name: 'Breadwinner', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/breadwinner', order: 3 },
        { name: 'Meissa Biguey', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/meissa_biguey', order: 4 },
        { name: 'DAD', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/dad', order: 5 },
      ];

      const influencers = [
        {
          name: 'Ebu Jomlong',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
          order: 0,
        },
        {
          name: 'Dip Poundou Guiss',
          imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
          order: 1,
        },
        {
          name: 'Massamba Amadeus',
          imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
          order: 2,
        },
        {
          name: 'Amina Abed',
          imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
          order: 3,
        },
        {
          name: 'Mut Cash',
          imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
          order: 4,
        },
      ];

      const merchandising = [
        {
          name: 'Bathie Drizzy',
          imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=7',
          order: 0,
        },
        {
          name: 'Latzo Dozé',
          imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=8',
          order: 1,
        },
        {
          name: 'Jaaw Ketchup',
          imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=9',
          order: 2,
        },
        {
          name: 'Dudu FDV',
          imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=10',
          order: 3,
        },
        {
          name: 'Adja Everywhere',
          imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=11',
          order: 4,
        },
        {
          name: 'Pape Sidy Fall',
          imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=12',
          order: 5,
        },
      ];

      await this.prisma.homeContent.createMany({
        data: [
          ...designs.map((d) => ({ ...d, type: 'DESIGN' as const })),
          ...influencers.map((i) => ({ ...i, type: 'INFLUENCER' as const })),
          ...merchandising.map((m) => ({ ...m, type: 'MERCHANDISING' as const })),
        ],
      });

      console.log('✅ Home content seeded successfully');

      return {
        success: true,
        message: 'Contenu initialisé avec succès',
        count: 17,
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du contenu:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erreur lors de l\'initialisation du contenu');
    }
  }
}
