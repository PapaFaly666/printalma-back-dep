# 📸 Guide : Génération Automatique d'Image Finale pour les Commandes Personnalisées

## 🎯 Objectif

Générer automatiquement une **image finale** (mockup) lors de la création d'une commande personnalisée, avec :
- ✅ Tous les éléments de design appliqués (textes, images, logos)
- ✅ Positionnement exact selon les personnalisations du client
- ✅ Image stockée dans `OrderItem.mockupUrl`
- ✅ Affichée dans l'email de facture

---

## 🏗️ Architecture actuelle

### Services existants

1. **`ProductPreviewGeneratorService`** (`src/vendor-product/services/product-preview-generator.service.ts`)
   - ✅ Génère des images avec UN design appliqué
   - ✅ Gère le positionnement, rotation, échelle
   - ✅ Supporte SVG, PNG, JPG
   - ✅ Utilise Sharp pour la composition d'images
   - ❌ Ne gère PAS les éléments multiples (texte + images)

2. **`CustomizationService`** (`src/customization/customization.service.ts`)
   - ✅ Sauvegarde les personnalisations
   - ✅ Stocke `elementsByView` (éléments de design par vue)
   - ✅ Gère les multi-vues (FRONT, BACK, etc.)

3. **`CloudinaryService`** (`src/core/cloudinary/cloudinary.service.ts`)
   - ✅ Upload d'images vers Cloudinary
   - ✅ Retourne l'URL publique

### Données dans OrderItem

```typescript
model OrderItem {
  mockupUrl: String?  // 🎯 C'EST ICI qu'on doit stocker l'image générée
  designElementsByView: Json?  // Tous les éléments de personnalisation
  viewsMetadata: Json?  // Métadonnées des vues
  delimitations: Json?  // Zones de placement
  colorVariationData: Json?  // Données de couleur avec images
}
```

---

## 🚧 Solution : Service de Génération d'Image Finale

### Étape 1 : Créer OrderMockupGeneratorService

Créer `src/order/services/order-mockup-generator.service.ts` :

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';
import sharp from 'sharp';
import axios from 'axios';

interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape';

  // Pour les textes
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;

  // Pour les images
  imageUrl?: string;

  // Position commune
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
}

interface GenerateMockupConfig {
  productImageUrl: string;  // Image du produit (t-shirt, mug)
  elements: DesignElement[];  // Tous les éléments à composer
  delimitation: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

@Injectable()
export class OrderMockupGeneratorService {
  private readonly logger = new Logger(OrderMockupGeneratorService.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService
  ) {}

  /**
   * Génère une image finale à partir des éléments de personnalisation
   */
  async generateOrderMockup(config: GenerateMockupConfig): Promise<string> {
    this.logger.log(`🎨 Génération mockup avec ${config.elements.length} éléments`);

    try {
      // 1. Télécharger l'image du produit
      const productBuffer = await this.downloadImage(config.productImageUrl);
      const productMetadata = await sharp(productBuffer).metadata();

      // 2. Trier les éléments par zIndex
      const sortedElements = config.elements.sort((a, b) => a.zIndex - b.zIndex);

      // 3. Créer les calques pour chaque élément
      const composites = [];

      for (const element of sortedElements) {
        if (element.type === 'text') {
          // Générer un calque SVG pour le texte
          const textSvg = this.createTextSvg(element);
          composites.push({
            input: Buffer.from(textSvg),
            left: Math.round(element.x),
            top: Math.round(element.y),
            blend: 'over'
          });
        } else if (element.type === 'image' && element.imageUrl) {
          // Télécharger et redimensionner l'image
          const imageBuffer = await this.downloadImage(element.imageUrl);
          const resizedBuffer = await sharp(imageBuffer)
            .resize(
              Math.round(element.width),
              Math.round(element.height),
              { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }
            )
            .rotate(element.rotation || 0, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();

          composites.push({
            input: resizedBuffer,
            left: Math.round(element.x),
            top: Math.round(element.y),
            blend: 'over'
          });
        }
      }

      // 4. Composer tous les calques sur l'image du produit
      const finalBuffer = await sharp(productBuffer)
        .composite(composites)
        .jpeg({ quality: 90 })
        .toBuffer();

      // 5. Upload vers Cloudinary
      this.logger.log(`📤 Upload de l'image finale vers Cloudinary...`);
      const uploadResult = await this.cloudinaryService.uploadImage(
        finalBuffer,
        `order-mockups/mockup-${Date.now()}`
      );

      this.logger.log(`✅ Mockup généré: ${uploadResult.secure_url}`);
      return uploadResult.secure_url;

    } catch (error) {
      this.logger.error(`❌ Erreur génération mockup:`, error);
      throw error;
    }
  }

  /**
   * Créer un SVG pour un élément texte
   */
  private createTextSvg(element: DesignElement): string {
    const fontSize = element.fontSize || 24;
    const fontFamily = element.fontFamily || 'Arial';
    const color = element.color || '#000000';
    const text = element.text || '';

    // SVG avec transformation pour la rotation
    const rotation = element.rotation || 0;
    const centerX = element.width / 2;
    const centerY = fontSize / 2;

    return `
      <svg width="${element.width}" height="${fontSize * 1.5}" xmlns="http://www.w3.org/2000/svg">
        <text
          x="${centerX}"
          y="${fontSize}"
          font-family="${fontFamily}"
          font-size="${fontSize}"
          fill="${color}"
          text-anchor="middle"
          transform="rotate(${rotation} ${centerX} ${centerY})"
        >${text}</text>
      </svg>
    `;
  }

  /**
   * Télécharger une image depuis une URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }
}
```

---

### Étape 2 : Intégrer dans le flux de commande

Modifier `src/order/order.service.ts` au moment de la création de commande :

```typescript
import { OrderMockupGeneratorService } from './services/order-mockup-generator.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly mockupGenerator: OrderMockupGeneratorService,
    // ... autres services
  ) {}

  async createOrder(userId: number | null, createOrderDto: CreateOrderDto) {
    // ... code existant ...

    // 🆕 GÉNÉRER LES MOCKUPS AVANT LA CRÉATION DE COMMANDE
    for (const item of createOrderDto.orderItems) {
      if (item.designElementsByView && !item.mockupUrl) {
        this.logger.log(`🎨 Génération mockup pour productId ${item.productId}...`);

        try {
          // Récupérer l'image du produit
          const colorVariation = await this.prisma.colorVariation.findFirst({
            where: {
              id: item.colorId,
              productId: item.productId
            },
            include: {
              images: true
            }
          });

          if (!colorVariation || !colorVariation.images[0]) {
            this.logger.warn(`⚠️ Pas d'image trouvée pour colorId ${item.colorId}`);
            continue;
          }

          const productImageUrl = colorVariation.images[0].url;

          // Extraire les éléments de la première vue (ou vue sélectionnée)
          const viewKey = Object.keys(item.designElementsByView)[0];
          const elements = item.designElementsByView[viewKey];

          // Récupérer la délimitation
          const delimitation = item.delimitations?.[0] || item.delimitation;

          if (!delimitation) {
            this.logger.warn(`⚠️ Pas de délimitation trouvée pour productId ${item.productId}`);
            continue;
          }

          // Générer le mockup
          const mockupUrl = await this.mockupGenerator.generateOrderMockup({
            productImageUrl,
            elements,
            delimitation: {
              x: delimitation.x,
              y: delimitation.y,
              width: delimitation.width,
              height: delimitation.height
            }
          });

          // ✅ Stocker l'URL du mockup dans l'item
          item.mockupUrl = mockupUrl;

          this.logger.log(`✅ Mockup généré et stocké: ${mockupUrl}`);

        } catch (error) {
          this.logger.error(`❌ Erreur génération mockup pour productId ${item.productId}:`, error);
          // Continuer même si la génération échoue
        }
      }
    }

    // Créer la commande avec les mockupUrl générés
    const order = await this.prisma.order.create({
      data: {
        // ... données de commande ...
        orderItems: {
          create: await Promise.all(createOrderDto.orderItems.map(async (item) => ({
            // ... autres champs ...
            mockupUrl: item.mockupUrl || null,  // 🎯 L'URL générée
            designElementsByView: item.designElementsByView || null,
            // ... autres champs ...
          })))
        }
      }
    });

    return order;
  }
}
```

---

### Étape 3 : Enregistrer le service dans le module

Modifier `src/order/order.module.ts` :

```typescript
import { OrderMockupGeneratorService } from './services/order-mockup-generator.service';

@Module({
  imports: [
    // ... imports existants ...
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderMockupGeneratorService,  // 🆕 Ajouter le service
    // ... autres providers ...
  ],
  exports: [OrderService]
})
export class OrderModule {}
```

---

## 🎨 Cas d'usage

### Cas 1 : Client personnalise un T-shirt avec du texte

**Données reçues** :
```javascript
{
  productId: 1,
  colorId: 5,
  designElementsByView: {
    "5-10": [  // colorId-viewId
      {
        id: "text-1",
        type: "text",
        text: "PARIS 2024",
        fontSize: 48,
        fontFamily: "Arial",
        color: "#FFFFFF",
        x: 300,
        y: 200,
        width: 400,
        height: 60,
        rotation: 0,
        zIndex: 1
      }
    ]
  },
  delimitations: [{
    x: 200,
    y: 150,
    width: 600,
    height: 400
  }]
}
```

**Résultat** :
- ✅ Image générée avec le texte "PARIS 2024" appliqué
- ✅ Stockée dans `mockupUrl`
- ✅ Affichée dans l'email de facture

### Cas 2 : Client upload un logo + ajoute du texte

**Données reçues** :
```javascript
{
  designElementsByView: {
    "5-10": [
      {
        id: "image-1",
        type: "image",
        imageUrl: "https://cloudinary.com/user-logo.png",
        x: 250,
        y: 180,
        width: 200,
        height: 200,
        rotation: 0,
        zIndex: 1
      },
      {
        id: "text-1",
        type: "text",
        text: "Mon Entreprise",
        fontSize: 36,
        color: "#000000",
        x: 300,
        y: 420,
        width: 300,
        height: 50,
        rotation: 0,
        zIndex: 2
      }
    ]
  }
}
```

**Résultat** :
- ✅ Logo appliqué en premier (zIndex: 1)
- ✅ Texte appliqué au-dessus (zIndex: 2)
- ✅ Image finale composite générée

---

## 📋 Checklist d'implémentation

### Phase 1 : Service de base (Texte uniquement)
- [ ] Créer `OrderMockupGeneratorService`
- [ ] Implémenter `generateOrderMockup()` pour les textes
- [ ] Implémenter `createTextSvg()` pour le rendu de texte
- [ ] Tester avec Sharp localement

### Phase 2 : Support des images
- [ ] Ajouter support des éléments `type: 'image'`
- [ ] Téléchargement et redimensionnement d'images
- [ ] Gestion du zIndex (ordre de composition)

### Phase 3 : Intégration
- [ ] Intégrer dans `OrderService.createOrder()`
- [ ] Générer mockup AVANT la création de commande
- [ ] Stocker `mockupUrl` dans OrderItem
- [ ] Gérer les erreurs (continuer même si génération échoue)

### Phase 4 : Optimisations
- [ ] Cache des images téléchargées
- [ ] Génération asynchrone (queue)
- [ ] Support des polices personnalisées
- [ ] Prévisualisation avant commande

---

## 🔧 Configuration requise

### Dépendances

```bash
npm install sharp axios
```

Déjà installées dans le projet ✅

### Variables d'environnement

```bash
# Cloudinary (déjà configuré)
CLOUDINARY_CLOUD_NAME="xxx"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"

# Frontend URL (pour les images relatives)
FRONTEND_URL="https://printalma.com"
```

---

## 🎯 Résultat final

Après implémentation :

1. ✅ Client personnalise son produit → Éléments stockés dans `designElementsByView`
2. ✅ Client passe commande → **Mockup généré automatiquement**
3. ✅ Mockup stocké dans `OrderItem.mockupUrl`
4. ✅ Email envoyé avec l'image du produit personnalisé
5. ✅ Admin/Vendeur voit l'image exacte à produire

---

## 📚 Ressources

- **Sharp documentation** : https://sharp.pixelplumbing.com/
- **SVG Text Element** : https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
- **Service existant** : `src/vendor-product/services/product-preview-generator.service.ts`

---

## 🚀 Next Steps

1. Implémenter `OrderMockupGeneratorService` de base (texte seulement)
2. Tester localement avec une commande test
3. Ajouter support des images
4. Optimiser et mettre en production

Voulez-vous que je crée le fichier `order-mockup-generator.service.ts` complet maintenant ?
