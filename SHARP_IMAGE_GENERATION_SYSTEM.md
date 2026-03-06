# Système de Génération d'Images avec Sharp

## 🎯 Vue d'ensemble

Les deux systèmes de personnalisation (client et vendeur) utilisent **Sharp** pour générer les images finales de manière robuste et performante.

## 📊 Comparaison des systèmes

| Caractéristique | Personnalisation Client | Produit Vendeur |
|----------------|------------------------|-----------------|
| **Service** | OrderMockupGeneratorService | ProductPreviewGeneratorService |
| **Moteur** | ✅ Sharp | ✅ Sharp |
| **Cas d'usage** | Client personnalise avec multi-éléments | Vendeur positionne son design |
| **Entrées** | Plusieurs éléments (textes, images) | Une image de design + position |
| **Support SVG** | ✅ Oui | ✅ Oui |
| **Support rotation** | ✅ Oui | ✅ Oui |
| **Upload Cloudinary** | ✅ Oui | ✅ Oui |
| **Retry logic** | ⚠️ Basique | ✅ Avancé (3 tentatives) |
| **Génération parallèle** | ❌ Non | ✅ Oui (2 couleurs à la fois) |

## 🔄 Architecture commune

Les deux systèmes suivent le même flux :

```
Données de personnalisation
    ↓
  Sharp (traitement d'image)
    ├─→ Téléchargement images
    ├─→ Conversion SVG → PNG si nécessaire
    ├─→ Composition des calques
    ├─→ Application rotation/transformation
    └─→ Export PNG haute qualité
    ↓
  CloudinaryService
    └─→ Upload du buffer
    ↓
  Sauvegarde URL en BD
```

## 🎨 OrderMockupGeneratorService (Client)

### Localisation
`src/order/services/order-mockup-generator.service.ts`

### Cas d'usage
- Client personnalise un produit avec plusieurs éléments
- Commande personnalisée
- Email de confirmation de personnalisation

### Fonctionnalités
```typescript
interface GenerateMockupConfig {
  productImageUrl: string;     // Image du produit de base
  elements: DesignElement[];    // MULTI-ÉLÉMENTS (textes + images)
  delimitation?: {              // Zone imprimable
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### Exemple d'utilisation
```typescript
const mockupUrl = await mockupGenerator.generateOrderMockup({
  productImageUrl: 'https://cdn.example.com/tshirt-red.png',
  elements: [
    {
      id: 'text-1',
      type: 'text',
      text: 'Mon Texte',
      x: 150,
      y: 200,
      width: 300,
      height: 50,
      fontSize: 24,
      color: '#000000',
      rotation: 15,
      zIndex: 1
    },
    {
      id: 'img-1',
      type: 'image',
      imageUrl: 'https://cdn.example.com/logo.png',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 0,
      zIndex: 2
    }
  ],
  delimitation: {
    x: 50,
    y: 80,
    width: 400,
    height: 500
  }
});
```

### Processus de génération
1. **Téléchargement** de l'image du produit
2. **Tri** des éléments par zIndex
3. **Pour chaque élément** :
   - Si texte : Génération SVG avec styles
   - Si image : Téléchargement et conversion SVG si nécessaire
4. **Composition** avec Sharp.composite()
5. **Export** PNG haute qualité
6. **Upload** vers Cloudinary
7. **Retour** de l'URL

### Code Sharp principal
```typescript
// Composition des calques avec Sharp
const finalBuffer = await sharp(productBuffer)
  .composite(composites)  // Tous les éléments superposés
  .png({ quality: 90 })
  .toBuffer();

// Upload vers Cloudinary
const uploadResult = await cloudinaryService.uploadBuffer(finalBuffer, {
  folder: 'order-mockups',
  quality: 90
});
```

## 🏪 ProductPreviewGeneratorService (Vendeur)

### Localisation
`src/vendor-product/services/product-preview-generator.service.ts`

### Cas d'usage
- Vendeur publie un produit avec son design
- Génération de `finalImageUrl` pour chaque couleur
- Affichage produit vendeur

### Fonctionnalités
```typescript
interface ProductPreviewConfig {
  productImageUrl: string;      // Image du produit de base
  designImageUrl: string;        // UNE SEULE image de design
  delimitation: Delimitation;    // Zone imprimable (OBLIGATOIRE)
  position: DesignPosition;      // Position du design
  showDelimitation?: boolean;    // Debug
  isSticker?: boolean;           // Style autocollant
}
```

### Exemple d'utilisation
```typescript
const imageBuffer = await previewGenerator.generatePreviewFromJson(
  'https://cdn.example.com/tshirt-black.png',
  'https://cdn.example.com/design-vendeur.png',
  {
    x: 100,
    y: 150,
    width: 400,
    height: 500,
    coordinateType: 'PIXEL'
  },
  {
    x: 0,
    y: 0,
    scale: 0.8,
    rotation: 0,
    delimitationWidth: 400,
    delimitationHeight: 500
  }
);
```

### Processus de génération
1. **Téléchargement** produit + design
2. **Conversion** SVG → PNG si nécessaire (density: 300)
3. **Calcul** position finale avec délimitation
4. **Application** rotation avec Sharp.rotate()
5. **Redimensionnement** avec fit: 'inside'
6. **Composition** design sur produit
7. **Export** PNG haute qualité
8. **Pas d'upload** - retourne le Buffer

### Code Sharp principal
```typescript
// Rotation du design si nécessaire
let processedDesign = sharp(designBuffer);
if (rotation && rotation !== 0) {
  processedDesign = processedDesign.rotate(rotation, {
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  });
}

// Redimensionnement pour fit dans la délimitation
processedDesign = processedDesign.resize(targetWidth, targetHeight, {
  fit: 'inside',
  withoutEnlargement: false,
  background: { r: 0, g: 0, b: 0, alpha: 0 }
});

// Composition sur l'image produit
const finalBuffer = await sharp(productBuffer)
  .composite([{
    input: await processedDesign.toBuffer(),
    left: finalX,
    top: finalY,
    blend: 'over'
  }])
  .png({ quality: 90 })
  .toBuffer();
```

## 🔄 Intégration dans CustomizationService

Les personnalisations client utilisent maintenant les deux services :

```typescript
export class CustomizationService {
  constructor(
    private mockupGenerator: OrderMockupGeneratorService,
    private previewGenerator: ProductPreviewGeneratorService,  // ✨ NOUVEAU
    private mailService: MailService
  ) {}

  private async generateAndSendCustomizationEmail(...) {
    // Utilise OrderMockupGeneratorService (multi-éléments)
    const mockupUrl = await this.mockupGenerator.generateOrderMockup({
      productImageUrl,
      elements,
      delimitation
    });

    // Sauvegarde et envoi email
    await this.mailService.sendCustomizationEmail({
      email: clientEmail,
      mockupUrl
    });
  }
}
```

## ⚡ Performances

### OrderMockupGeneratorService
- **Temps par mockup**: ~3-8 secondes
- **Dépend de**: Nombre d'éléments, taille des images
- **Optimisations**:
  - Téléchargement parallèle des images
  - Conversion SVG en mémoire
  - Compression PNG optimisée

### ProductPreviewGeneratorService + ImageGenerationQueueService
- **Temps par couleur**: ~8-15 secondes
- **Parallélisation**: 2 couleurs simultanées
- **Retry**: 3 tentatives automatiques
- **Optimisations**:
  - Queue avec concurrency limit
  - Retry avec délai progressif
  - Logs détaillés pour debug

## 🛠️ Configuration Sharp

Les deux services utilisent les mêmes paramètres Sharp optimaux :

```typescript
// Conversion SVG
sharp(buffer, {
  density: 300,              // DPI pour conversion SVG
  limitInputPixels: false    // Pas de limite pour grands SVG
})

// Redimensionnement
.resize(targetWidth, targetHeight, {
  fit: 'inside',             // Garde aspect ratio
  withoutEnlargement: false, // Permet agrandissement
  background: { r: 0, g: 0, b: 0, alpha: 0 }  // Transparent
})

// Export PNG
.png({
  quality: 90,               // Haute qualité
  compressionLevel: 6,       // Compromis taille/vitesse
  effort: 5                  // Effort de compression
})
```

## 📊 Comparison détaillée

### Support des éléments

| Type d'élément | OrderMockupGenerator | ProductPreviewGenerator |
|---------------|---------------------|------------------------|
| Texte simple | ✅ SVG natif | ❌ Doit être pré-rendu |
| Texte multi-ligne | ✅ Support \n | ❌ Doit être pré-rendu |
| Image PNG/JPG | ✅ Oui | ✅ Oui |
| Image SVG | ✅ Conversion auto | ✅ Conversion auto |
| Rotation texte | ✅ SVG transform | ❌ N/A |
| Rotation image | ✅ Sharp rotate | ✅ Sharp rotate |
| Multi-éléments | ✅ Support natif | ❌ Un seul design |
| zIndex | ✅ Tri automatique | ❌ N/A |

### Support des formats

| Format | OrderMockupGenerator | ProductPreviewGenerator |
|--------|---------------------|------------------------|
| PNG | ✅ Direct | ✅ Direct |
| JPG | ✅ Direct | ✅ Direct |
| SVG | ✅ Conversion auto | ✅ Conversion auto (300 DPI) |
| WebP | ⚠️ Via Sharp | ⚠️ Via Sharp |

## 🧪 Tests

### Test personnalisation client
```bash
./test-customization-email.sh
```

### Test produit vendeur
```bash
./test-regenerate-vendor-images.sh <PRODUCT_ID> <JWT_TOKEN>
```

## 📝 Recommandations

### Pour personnalisations client (multi-éléments)
✅ **Utiliser**: `OrderMockupGeneratorService`
- Support natif multi-éléments
- Support texte avec styles
- Gestion zIndex automatique

### Pour produits vendeurs (design unique)
✅ **Utiliser**: `ProductPreviewGeneratorService` + `ImageGenerationQueueService`
- Retry automatique
- Génération parallèle
- Logging avancé
- Queue robuste

## 🔍 Debugging

### Logs OrderMockupGeneratorService
```
🎨 [Mockup] Génération d'une image finale avec 3 élément(s)
📥 [Mockup] Téléchargement de l'image du produit: https://...
📐 [Mockup] Image du produit: 1200x1400px
🔢 [Mockup] Éléments triés par zIndex: text(z:1), image(z:2)
🎨 [Mockup] Traitement élément 1/2: text (id: text-1)
  📝 [Mockup] Texte SVG créé: 300x50px
🎨 [Mockup] Traitement élément 2/2: image (id: img-1)
  📥 [Mockup] Téléchargement image: https://...
  📐 [Mockup] Image: 500x500px
📐 [Mockup] Création composite final: 1200x1400px avec 2 calques
📤 [Mockup] Upload vers Cloudinary: order-mockups/mockup-1234567890...
✅ [Mockup] Upload terminé: https://res.cloudinary.com/...
```

### Logs ProductPreviewGeneratorService
```
📥 Téléchargement de l'image: https://...
✅ Téléchargement réussi - Status: 200, Taille: 125000 bytes
📐 Délimitation (PIXEL): {"x":100,"y":150,"width":400,"height":500}
🎨 Génération preview pour Noir...
✅ Image générée pour Noir (250000 bytes)
☁️ Upload vers Cloudinary pour Noir...
☁️ Upload terminé pour Noir: https://res.cloudinary.com/...
```

## 🎯 Résumé

Les **deux systèmes utilisent Sharp** de manière robuste :

| Aspect | Statut |
|--------|--------|
| **Même moteur (Sharp)** | ✅ Oui |
| **Support SVG** | ✅ Les deux |
| **Support rotation** | ✅ Les deux |
| **Haute qualité PNG** | ✅ Les deux |
| **Upload Cloudinary** | ✅ Les deux |
| **Production-ready** | ✅ Les deux |

**Le système de personnalisation client utilise déjà le même système robuste Sharp que les produits vendeurs !** 🎨✨

---

**Date**: 2026-03-03
**Version**: 1.0.0
**Services**: OrderMockupGeneratorService + ProductPreviewGeneratorService
