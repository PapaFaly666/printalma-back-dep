# Génération d'Images Finales pour Chaque Couleur

## 🎯 Fonctionnalité

Lors de la création d'un produit vendeur, le système génère automatiquement une image finale (mockup + design positionné) **pour chaque couleur sélectionnée**.

## 📊 Stockage des Images

### VendorProductImage

Chaque image finale est stockée dans `VendorProductImage` avec :

```typescript
{
  vendorProductId: number,      // ID du produit vendeur
  colorId: number,              // ID de la ColorVariation
  colorName: string,            // Nom de la couleur (ex: "Rouge")
  colorCode: string,            // Code hexadécimal (ex: "#ff0000")
  imageType: 'final',           // Type d'image
  cloudinaryUrl: string,        // URL Cloudinary de l'image finale
  cloudinaryPublicId: string,   // Public ID Cloudinary
  width: number,                // Largeur de l'image
  height: number,               // Hauteur de l'image
}
```

### VendorProduct

La première image générée est également stockée dans `VendorProduct` pour la rétrocompatibilité :

```typescript
{
  finalImageUrl: string,        // URL de la première image
  finalImagePublicId: string,   // Public ID de la première image
}
```

## 🔄 Flux de Génération

```
1. Vendeur crée un produit avec :
   - Design sélectionné
   - Couleurs sélectionnées (ex: Rouge, Bleu, Vert)
   - Position du design (x, y, scale, rotation)

2. Backend itère sur chaque couleur :
   ├─> Récupère la ColorVariation
   ├─> Récupère l'image du mockup pour cette couleur
   ├─> Récupère la délimitation (zone imprimable)
   ├─> Génère l'image finale avec le design positionné
   ├─> Upload sur Cloudinary (dossier: vendor-product-finals)
   └─> Sauvegarde dans VendorProductImage

3. Première image sauvegardée dans VendorProduct.finalImageUrl
```

## 📝 Exemple

### Requête

```json
{
  "baseProductId": 5,
  "designId": 42,
  "selectedColors": [
    { "id": 30, "name": "Rouge", "colorCode": "#ff0000" },
    { "id": 31, "name": "Bleu", "colorCode": "#0000ff" },
    { "id": 32, "name": "Vert", "colorCode": "#00ff00" }
  ],
  "designPosition": {
    "x": 0,
    "y": 0,
    "scale": 0.8,
    "rotation": 0
  }
}
```

### Résultat

Le système génère **3 images finales** :

1. **Rouge** : T-shirt rouge avec design positionné
   - Stockée dans `VendorProductImage` (colorId: 30)
   - Également dans `VendorProduct.finalImageUrl` (première)

2. **Bleu** : T-shirt bleu avec design positionné
   - Stockée dans `VendorProductImage` (colorId: 31)

3. **Vert** : T-shirt vert avec design positionné
   - Stockée dans `VendorProductImage` (colorId: 32)

## 📂 Organisation Cloudinary

```
vendor-product-finals/
├── final_123_color_30_1705234567890.png  (Rouge)
├── final_123_color_31_1705234567891.png  (Bleu)
└── final_123_color_32_1705234567892.png  (Vert)
```

## 🔍 Récupération des Images

### Pour une couleur spécifique

```typescript
const image = await prisma.vendorProductImage.findFirst({
  where: {
    vendorProductId: 123,
    colorId: 30,  // Rouge
  },
});
// image.cloudinaryUrl contient l'image finale pour la couleur rouge
```

### Toutes les images d'un produit

```typescript
const images = await prisma.vendorProductImage.findMany({
  where: {
    vendorProductId: 123,
    imageType: 'final',
  },
  orderBy: { colorId: 'asc' },
});
// images[] contient toutes les images finales pour chaque couleur
```

## 🎨 Logs

### Succès

```
🎨 Génération images finales pour produit 123...
📊 Nombre de couleurs sélectionnées: 3
🎨 Génération image pour couleur Rouge (ID: 30)...
✅ Image finale générée pour Rouge (125487 bytes)
☁️ Image uploadée pour Rouge: https://res.cloudinary.com/.../final_123_color_30_1705234567890.png
💾 Image sauvegardée dans VendorProductImage pour couleur Rouge
🎨 Génération image pour couleur Bleu (ID: 31)...
...
💾 Première image sauvegardée dans VendorProduct.finalImageUrl
```

### Erreur (non-bloquante)

```
❌ Erreur génération image pour couleur Bleu: Image mockup introuvable
⚠️ Produit créé sans images finales, peuvent être régénérées plus tard
```

## ✅ Avantages

1. **Prévisualisation complète** : Chaque couleur a son image finale
2. **Performance** : Génération automatique au moment de la création
3. **Flexibilité** : Chaque couleur peut avoir un mockup différent
4. **Non-bloquant** : Si une image échoue, les autres continuent
5. **Rétrocompatibilité** : VendorProduct.finalImageUrl conservée

## 🚀 Utilisation Frontend

```typescript
// Récupérer le produit avec toutes ses images
const product = await api.getVendorProduct(123);

// Afficher l'image pour une couleur sélectionnée
const selectedColorId = 30;
const image = product.images.find(img =>
  img.colorId === selectedColorId &&
  img.imageType === 'final'
);

<img src={image.cloudinaryUrl} alt={`${product.name} - ${image.colorName}`} />
```

---

**Version** : 3.0.0 (Images Multi-Couleurs)
**Date** : 14 janvier 2026
