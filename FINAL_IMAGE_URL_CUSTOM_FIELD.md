# Champ `finalImageUrlCustom` - Image Finale de Personnalisation Client

## 📋 Vue d'ensemble

Le champ `finalImageUrlCustom` stocke l'URL de l'**image finale générée avec Sharp** pour les personnalisations clients. Cette image contient tous les éléments de design (textes, images, rotations) appliqués sur le produit.

## 🎯 Différence avec `previewImageUrl`

| Champ | Description | Utilisation |
|-------|-------------|-------------|
| **previewImageUrl** | URL de l'aperçu (legacy) | Compatibilité avec ancien système |
| **finalImageUrlCustom** | URL de l'image finale Sharp | Image haute qualité générée avec tous les éléments |

## 🗄️ Structure de la base de données

### Modèle Prisma

```prisma
model ProductCustomization {
  id                   Int       @id @default(autoincrement())
  // ... autres champs ...
  previewImageUrl      String?   @map("preview_image_url")
  finalImageUrlCustom  String?   @map("final_image_url_custom")  // ✨ NOUVEAU
  // ... autres champs ...

  @@map("product_customizations")
}
```

### Table SQL

```sql
-- Colonne ajoutée
ALTER TABLE product_customizations
ADD COLUMN final_image_url_custom TEXT;

-- Index pour les requêtes
CREATE INDEX idx_product_customizations_final_image_url_custom
ON product_customizations(final_image_url_custom)
WHERE final_image_url_custom IS NOT NULL;
```

## 🔄 Flux de génération

```
Client sauvegarde personnalisation
    ↓
CustomizationService.upsertCustomization()
    ↓
generateAndSendCustomizationEmail()
    ├─→ Extraction des éléments depuis elementsByView
    ├─→ Récupération de l'image produit
    ├─→ OrderMockupGeneratorService.generateOrderMockup()
    │   ├─→ Téléchargement image produit
    │   ├─→ Génération SVG pour les textes
    │   ├─→ Téléchargement images des éléments
    │   ├─→ Composition avec Sharp
    │   └─→ Upload vers Cloudinary
    ├─→ Sauvegarde URL dans finalImageUrlCustom  ✨
    └─→ Envoi email avec l'image finale
```

## 💾 Sauvegarde dans la base de données

### Code CustomizationService

```typescript
// Mettre à jour la personnalisation avec l'URL du mockup
await this.prisma.productCustomization.update({
  where: { id: customization.id },
  data: {
    previewImageUrl: mockupUrl,        // Compatibilité
    finalImageUrlCustom: mockupUrl     // ✨ Image finale Sharp
  }
});
```

### Exemple de données

```json
{
  "id": 123,
  "productId": 1,
  "colorVariationId": 5,
  "clientEmail": "client@example.com",
  "clientName": "Jean Dupont",
  "previewImageUrl": "https://res.cloudinary.com/.../mockup-1234567890.png",
  "finalImageUrlCustom": "https://res.cloudinary.com/.../mockup-1234567890.png",
  "elementsByView": {
    "5-1": [
      {
        "id": "text-1",
        "type": "text",
        "text": "Mon Texte",
        "x": 150,
        "y": 200,
        "fontSize": 24,
        "color": "#000000"
      }
    ]
  }
}
```

## 📊 Utilisation dans l'API

### Récupération d'une personnalisation

**GET** `/customization/:id`

```json
{
  "id": 123,
  "productId": 1,
  "finalImageUrlCustom": "https://res.cloudinary.com/.../mockup-1234567890.png",
  "elementsByView": { ... }
}
```

### Affichage de l'image finale

```typescript
// Frontend
const customization = await fetch('/customization/123').then(r => r.json());

// Utiliser finalImageUrlCustom pour l'affichage
<img
  src={customization.finalImageUrlCustom}
  alt="Personnalisation finale"
/>
```

## 🎨 Génération de l'image

### Processus avec Sharp

```typescript
// 1. Téléchargement de l'image du produit
const productBuffer = await downloadImage(productImageUrl);

// 2. Création des calques pour chaque élément
const composites = [];

for (const element of elements) {
  if (element.type === 'text') {
    // SVG pour le texte
    const textSvg = createTextSvg(element);
    composites.push({
      input: Buffer.from(textSvg),
      left: element.x,
      top: element.y
    });
  } else if (element.type === 'image') {
    // Image téléchargée
    const imageBuffer = await downloadImage(element.imageUrl);
    composites.push({
      input: imageBuffer,
      left: element.x,
      top: element.y
    });
  }
}

// 3. Composition finale avec Sharp
const finalBuffer = await sharp(productBuffer)
  .composite(composites)
  .png({ quality: 90 })
  .toBuffer();

// 4. Upload vers Cloudinary
const uploadResult = await cloudinaryService.uploadBuffer(finalBuffer, {
  folder: 'order-mockups',
  public_id: `mockup-${Date.now()}`,
  quality: 90
});

// 5. Retour de l'URL
return uploadResult.secure_url;
```

## 🔍 Requêtes SQL utiles

### Récupérer toutes les personnalisations avec image finale

```sql
SELECT
  id,
  client_email,
  client_name,
  final_image_url_custom,
  created_at
FROM product_customizations
WHERE final_image_url_custom IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;
```

### Statistiques de génération

```sql
SELECT
  COUNT(*) as total_customizations,
  COUNT(final_image_url_custom) as with_final_image,
  ROUND(COUNT(final_image_url_custom)::numeric / COUNT(*)::numeric * 100, 2) as percentage
FROM product_customizations
WHERE client_email IS NOT NULL;
```

### Personnalisations avec email mais sans image finale

```sql
SELECT
  id,
  client_email,
  created_at
FROM product_customizations
WHERE client_email IS NOT NULL
  AND final_image_url_custom IS NULL
ORDER BY created_at DESC;
```

## 🧪 Tests

### Test de sauvegarde

```bash
# 1. Créer une personnalisation avec email
curl -X POST http://localhost:3004/customization/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "clientEmail": "test@example.com",
    "clientName": "Test User",
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "text": "Mon Texte",
        "x": 150,
        "y": 200,
        "width": 300,
        "height": 50,
        "fontSize": 24,
        "color": "#000000",
        "rotation": 0,
        "zIndex": 1
      }
    ]
  }'

# 2. Vérifier que finalImageUrlCustom est rempli
curl http://localhost:3004/customization/123 | jq '.finalImageUrlCustom'
```

### Script de test fourni

```bash
./test-customization-email.sh
```

Ce script teste automatiquement :
- ✅ Création de personnalisation
- ✅ Génération du mockup
- ✅ Sauvegarde dans `finalImageUrlCustom`
- ✅ Envoi de l'email

## 📈 Migration

### Appliquer la migration

```bash
# Option 1: Via psql
psql $DATABASE_URL -f migrations/add-final-image-url-custom.sql

# Option 2: Via Prisma (recommandé)
npx prisma migrate dev --name add_final_image_url_custom
```

### Rollback (si nécessaire)

```sql
-- Supprimer la colonne
ALTER TABLE product_customizations
DROP COLUMN IF EXISTS final_image_url_custom;

-- Supprimer l'index
DROP INDEX IF EXISTS idx_product_customizations_final_image_url_custom;
```

## 🔄 Rétrocompatibilité

Le système maintient **les deux champs** pour assurer la rétrocompatibilité :

```typescript
// Les deux champs sont remplis
data: {
  previewImageUrl: mockupUrl,        // Ancien système
  finalImageUrlCustom: mockupUrl     // Nouveau système
}
```

**Recommandation**: Utiliser `finalImageUrlCustom` pour les nouvelles fonctionnalités, mais garder `previewImageUrl` pour la compatibilité avec l'ancien code frontend.

## 📊 Différences techniques

| Aspect | previewImageUrl | finalImageUrlCustom |
|--------|----------------|---------------------|
| **Génération** | Variable | Toujours Sharp |
| **Qualité** | Variable | PNG 90% qualité |
| **Multi-éléments** | Limité | ✅ Complet |
| **Rotation** | Limité | ✅ Support complet |
| **Upload** | Cloudinary | Cloudinary |
| **Format** | Variable | PNG |

## 🎯 Cas d'usage

### 1. Afficher la personnalisation dans l'admin

```typescript
// Backend - Récupérer avec l'image finale
const customization = await prisma.productCustomization.findUnique({
  where: { id: 123 },
  select: {
    id: true,
    clientEmail: true,
    clientName: true,
    finalImageUrlCustom: true,  // ✨ Image finale
    elementsByView: true,
    product: {
      select: {
        name: true
      }
    }
  }
});

// Frontend - Afficher
<div className="customization-preview">
  <img src={customization.finalImageUrlCustom} alt="Personnalisation" />
  <p>Client: {customization.clientName}</p>
  <p>Produit: {customization.product.name}</p>
</div>
```

### 2. Envoyer dans un email

```typescript
await mailService.sendCustomizationEmail({
  email: customization.clientEmail,
  productName: customization.product.name,
  mockupUrl: customization.finalImageUrlCustom,  // ✨ Image finale
  clientName: customization.clientName
});
```

### 3. Utiliser dans une commande

```typescript
// Lors de la création de commande depuis une personnalisation
const orderItem = await prisma.orderItem.create({
  data: {
    orderId: order.id,
    productId: customization.productId,
    mockupUrl: customization.finalImageUrlCustom,  // ✨ Image finale
    quantity: 1,
    customizationId: customization.id
  }
});
```

## 🚀 Prochaines améliorations possibles

- [ ] Générer plusieurs vues (avant/arrière) et stocker dans un JSON
- [ ] Ajouter des thumbnails (petites images) pour la liste
- [ ] Versionning des images (garder l'historique des modifications)
- [ ] Optimisation WebP en plus de PNG
- [ ] Cache CDN pour les images fréquemment consultées

## 📚 Fichiers modifiés

### Backend
- ✅ `prisma/schema.prisma` - Ajout du champ
- ✅ `migrations/add-final-image-url-custom.sql` - Migration SQL
- ✅ `src/customization/customization.service.ts` - Sauvegarde de l'URL

### Tests
- ✅ `test-customization-email.sh` - Script de test existant

## 🎯 Résumé

Le champ **`finalImageUrlCustom`** :

✅ Stocke l'URL de l'image finale générée avec Sharp
✅ Contient tous les éléments de design appliqués
✅ Haute qualité PNG 90%
✅ Upload automatique vers Cloudinary
✅ Sauvegardé automatiquement lors de la personnalisation avec email
✅ Rétrocompatible avec `previewImageUrl`

---

**Date**: 2026-03-03
**Version**: 1.0.0
**Migration**: `add-final-image-url-custom.sql`
