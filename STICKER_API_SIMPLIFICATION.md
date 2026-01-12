# Simplification API Stickers - Version 2.1

**Date:** 11 janvier 2026
**Version:** 2.1.0

## Changements Majeurs

### Suppression des Tables de Configuration

Les tables `StickerSize` et `StickerFinish` ne sont plus utilisées. Le système accepte maintenant directement les dimensions et finitions en texte libre.

### Avantages

1. **Flexibilité totale** - Le vendeur peut spécifier n'importe quelle dimension
2. **Pas de pré-configuration** - Plus besoin de créer des tailles en base de données
3. **Simplicité** - Le frontend envoie directement les valeurs souhaitées
4. **Prix direct** - Le vendeur définit son prix final sans calcul automatique

---

## Nouvelle Structure de l'API

### Endpoint: POST /vendor/stickers

**URL:** `http://localhost:3000/vendor/stickers`

**Headers:**
```
Authorization: Bearer <TOKEN_VENDEUR>
Content-Type: application/json
```

**Body (nouveau format):**
```json
{
  "designId": 123,
  "name": "Mon Sticker Personnalisé",
  "description": "Description optionnelle",
  "size": {
    "width": 10,
    "height": 15
  },
  "finish": "glossy",
  "shape": "DIE_CUT",
  "price": 2500,
  "stockQuantity": 50,
  "minimumQuantity": 1,
  "stickerType": "autocollant",
  "borderColor": "glossy-white"
}
```

### Champs Modifiés

#### `size` (Obligatoire)
**Avant:**
```json
"size": {
  "id": "medium",
  "width": 10,
  "height": 15
}
```

**Après:**
```json
"size": {
  "width": 10,
  "height": 15
}
```

- **Plus d'ID requis** - Juste les dimensions en cm
- **Validation:** width et height entre 1 et 100 cm

#### `finish` (Optionnel)
**Type:** `string` (texte libre)
**Exemples:** `"glossy"`, `"matte"`, `"transparent"`, etc.
**Par défaut:** `"glossy"`

#### `price` (Obligatoire)
**Type:** `number` (en FCFA)
**Validation:** Minimum 500 FCFA
**Le vendeur définit directement le prix final**

---

## Endpoint: GET /vendor/stickers/configurations

Retourne maintenant uniquement les configurations statiques disponibles.

**Réponse:**
```json
{
  "success": true,
  "data": {
    "shapes": [
      {
        "id": "SQUARE",
        "name": "Carré",
        "description": "Forme carrée classique"
      },
      {
        "id": "CIRCLE",
        "name": "Cercle",
        "description": "Forme ronde"
      },
      {
        "id": "RECTANGLE",
        "name": "Rectangle",
        "description": "Forme rectangulaire"
      },
      {
        "id": "DIE_CUT",
        "name": "Découpe personnalisée",
        "description": "Découpé selon la forme du design"
      }
    ],
    "stickerTypes": [
      {
        "id": "autocollant",
        "name": "Autocollant",
        "description": "Bordure fine avec effets 3D"
      },
      {
        "id": "pare-chocs",
        "name": "Pare-chocs",
        "description": "Bordure épaisse simple"
      }
    ],
    "borderColors": [
      {
        "id": "glossy-white",
        "name": "Blanc brillant",
        "description": "Bordure blanche avec effet brillant"
      },
      {
        "id": "white",
        "name": "Blanc",
        "description": "Bordure blanche simple"
      },
      {
        "id": "matte-white",
        "name": "Blanc mat",
        "description": "Bordure blanche mate"
      },
      {
        "id": "transparent",
        "name": "Transparent",
        "description": "Sans bordure"
      }
    ]
  }
}
```

**Plus de tailles ou finitions pré-définies !**

---

## Exemples de Requêtes

### Exemple 1: Sticker Classique

```bash
curl -X POST http://localhost:3000/vendor/stickers \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 123,
    "name": "Sticker Logo Entreprise",
    "description": "Sticker personnalisé avec logo",
    "size": {
      "width": 10,
      "height": 10
    },
    "finish": "glossy",
    "shape": "SQUARE",
    "price": 2000,
    "stockQuantity": 100,
    "stickerType": "autocollant",
    "borderColor": "glossy-white"
  }'
```

### Exemple 2: Sticker Rectangulaire

```bash
curl -X POST http://localhost:3000/vendor/stickers \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 456,
    "name": "Sticker Bannière",
    "size": {
      "width": 20,
      "height": 5
    },
    "shape": "RECTANGLE",
    "price": 3500,
    "stockQuantity": 50
  }'
```

### Exemple 3: Sticker Sans Bordure

```bash
curl -X POST http://localhost:3000/vendor/stickers \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 789,
    "name": "Sticker Transparent",
    "size": {
      "width": 8,
      "height": 8
    },
    "shape": "CIRCLE",
    "price": 1500,
    "stockQuantity": 200,
    "borderColor": "transparent"
  }'
```

---

## Réponses API

### Succès (201 Created)

```json
{
  "success": true,
  "message": "Sticker créé avec succès",
  "productId": 456,
  "data": {
    "id": 456,
    "vendorId": 1,
    "designId": 123,
    "name": "Mon Sticker",
    "sku": "STK-1-123-5",
    "size": {
      "width": 10,
      "height": 15
    },
    "finish": "glossy",
    "shape": "DIE_CUT",
    "basePrice": 2500,
    "finishMultiplier": 1,
    "finalPrice": 2500,
    "status": "PENDING",
    "imageUrl": "https://res.cloudinary.com/.../sticker_456.png",
    "createdAt": "2026-01-11T20:30:00.000Z"
  }
}
```

### Erreurs Possibles

#### Dimensions invalides (400)
```json
{
  "statusCode": 400,
  "message": "La largeur doit être entre 1 et 100 cm"
}
```

#### Prix invalide (400)
```json
{
  "statusCode": 400,
  "message": "Le prix minimum est de 500 FCFA"
}
```

#### Design non trouvé (404)
```json
{
  "statusCode": 404,
  "message": "Design introuvable ou non validé"
}
```

---

## Changements Base de Données

### Champs StickerProduct Utilisés

- `sizeId` - Généré automatiquement: `"{width}x{height}"`
- `widthCm` - Largeur en cm
- `heightCm` - Hauteur en cm
- `finish` - Texte libre (non lié à table)
- `basePrice` - Prix défini par vendeur
- `finishMultiplier` - Toujours 1.0
- `finalPrice` - Égal à basePrice

### Relations Supprimées

- ❌ `size: StickerSize` - Plus de relation
- ❌ `finishConfig: StickerFinish` - Plus de relation

---

## Migration Frontend

### Changements Requis

#### 1. Formulaire de Création

**Avant:**
```typescript
// Fetch sizes from API
const { data } = await api.get('/vendor/stickers/configurations');
const sizes = data.sizes; // Array of predefined sizes

// User selects a size ID
const selectedSizeId = 'medium';
```

**Après:**
```typescript
// User enters dimensions directly
const width = 10;  // cm
const height = 15; // cm

// No need to fetch sizes
```

#### 2. Payload de Création

**Avant:**
```typescript
const payload = {
  designId: 123,
  name: "Mon Sticker",
  size: {
    id: "medium",  // ID from database
    width: 10,
    height: 15
  },
  // ...
};
```

**Après:**
```typescript
const payload = {
  designId: 123,
  name: "Mon Sticker",
  size: {
    width: 10,   // Direct input
    height: 15   // Direct input
  },
  price: 2500,  // Direct price
  // ...
};
```

#### 3. Affichage des Stickers

**Avant:**
```typescript
// Response included size.name
<div>{sticker.size.name} ({sticker.size.width}x{sticker.size.height}cm)</div>
```

**Après:**
```typescript
// Response only includes dimensions
<div>{sticker.size.width}x{sticker.size.height}cm</div>
```

---

## Validation des Données

### Côté Backend

```typescript
// Dimensions
if (size.width < 1 || size.width > 100) {
  throw new BadRequestException('Largeur entre 1 et 100 cm');
}
if (size.height < 1 || size.height > 100) {
  throw new BadRequestException('Hauteur entre 1 et 100 cm');
}

// Prix
if (price < 500) {
  throw new BadRequestException('Prix minimum: 500 FCFA');
}
```

### Côté Frontend (suggéré)

```typescript
// Validation Yup/Zod
const schema = yup.object({
  size: yup.object({
    width: yup.number()
      .min(1, 'Minimum 1cm')
      .max(100, 'Maximum 100cm')
      .required('Largeur requise'),
    height: yup.number()
      .min(1, 'Minimum 1cm')
      .max(100, 'Maximum 100cm')
      .required('Hauteur requise'),
  }),
  price: yup.number()
    .min(500, 'Prix minimum: 500 FCFA')
    .required('Prix requis'),
});
```

---

## Checklist Migration Frontend

- [ ] Retirer l'appel API pour récupérer les tailles
- [ ] Modifier le formulaire pour input direct width/height
- [ ] Retirer le champ `size.id` du payload
- [ ] Ajouter un input pour le prix direct
- [ ] Mettre à jour l'affichage des stickers (pas de `size.name`)
- [ ] Mettre à jour l'affichage des finitions (texte libre, pas de `finishConfig.name`)
- [ ] Tester la création de stickers avec différentes dimensions
- [ ] Vérifier que l'image générée a les bonnes dimensions

---

## Support et Dépannage

### Erreur: "size.id is required"

**Cause:** Frontend envoie encore l'ancien format avec `size.id`

**Solution:** Retirer `id` du payload:
```typescript
// ❌ Ancien
size: { id: "medium", width: 10, height: 15 }

// ✅ Nouveau
size: { width: 10, height: 15 }
```

### Erreur: "Taille de sticker invalide"

**Cause:** Cette erreur n'existe plus ! Si vous la voyez, le backend n'a pas été mis à jour.

**Solution:** Vérifier que le code backend a bien été déployé (version 2.1+)

### Dimensions trop grandes/petites

**Validation:** 1-100 cm pour width et height

**Recommandations:**
- Petit: 5x5 cm à 10x10 cm
- Moyen: 10x10 cm à 15x15 cm
- Grand: 15x15 cm à 30x30 cm
- Très grand: 30x30 cm à 100x100 cm

---

## Compatibilité

### Version API: 2.1.0

**Endpoints modifiés:**
- POST `/vendor/stickers` - Nouveau format de payload
- GET `/vendor/stickers/configurations` - Plus de sizes/finishes
- GET `/vendor/stickers` - Réponse modifiée (pas de size.name)
- GET `/vendor/stickers/:id` - Réponse modifiée

**Rétrocompatibilité:** ❌ Non compatible avec ancienne version frontend

---

**Auteur:** Claude Sonnet 4.5
**Date:** 11 janvier 2026
**Version:** 2.1.0
