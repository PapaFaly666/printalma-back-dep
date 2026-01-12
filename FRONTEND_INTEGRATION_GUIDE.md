# Guide d'Intégration Frontend - Génération de Stickers Côté Backend

> **Version:** 2.0.0  
> **Date:** 11 janvier 2026  
> **Backend:** NestJS + Sharp (tous les effets sont générés côté serveur)

---

## 📋 Résumé

Le backend génère **maintenant TOUT** les effets visuels des stickers (bordures, ombres, glossy) directement sur l'image avec Sharp. Le frontend n'a plus besoin d'appliquer des CSS.

### Avantages

| Avant (CSS Frontend) | Maintenant (Sharp Backend) |
|---------------------|----------------------------|
| Lourd pour le navigateur (plusieurs layers) | Traitement serveur unique |
| Incohérent selon navigateurs | Identique partout |
| Pas optimisé pour CDN | Images optimisées Cloudinary |
| CSS complexe à maintenir | Logique centralisée |

---

## 🔌 API Endpoints

### 1. Créer un Sticker

```http
POST /api/vendor/stickers
Authorization: Bearer {token}
Content-Type: application/json
```

#### Corps de la Requête

```typescript
{
  // Design source (obligatoire)
  "designId": 123,

  // Informations de base (obligatoire)
  "name": "Sticker Logo Entreprise",
  "description": "Sticker personnalisé haute qualité",

  // Taille en cm (obligatoire)
  "size": {
    "width": 10,   // Largeur en cm (1-100)
    "height": 10   // Hauteur en cm (1-100)
  },

  // Configuration (obligatoire)
  "shape": "SQUARE",        // SQUARE | CIRCLE | RECTANGLE | DIE_CUT
  "finish": "glossy",       // glossy | matte (utilisé pour référence)

  // Type de sticker (optionnel - défaut: "autocollant")
  "stickerType": "autocollant",  // "autocollant" | "pare-chocs"

  // Couleur de bordure (optionnel - défaut: "glossy-white")
  "borderColor": "glossy-white", // "glossy-white" | "white" | "matte-white" | "transparent"

  // Prix et stock (obligatoire)
  "price": 2500,              // Prix en FCFA (min: 500)
  "stockQuantity": 100,       // Quantité en stock

  // Quantité minimum (optionnel - défaut: 1)
  "minimumQuantity": 1
}
```

#### Réponse

```typescript
{
  "success": true,
  "message": "Sticker créé avec succès",
  "productId": 456,
  "data": {
    "id": 456,
    "name": "Sticker Logo Entreprise",
    "sku": "STK-1-123-1",
    "imageUrl": "https://res.cloudinary.com/.../sticker_456_...",  // ← IMAGE GÉNÉRÉE
    "designId": 123,
    "size": {
      "width": 10,
      "height": 10
    },
    "finish": "glossy",
    "shape": "SQUARE",
    "basePrice": 2500,
    "finalPrice": 2500,
    "status": "PENDING",
    "createdAt": "2026-01-11T10:30:00.000Z"
  }
}
```

### 2. Lister les Stickers du Vendeur

```http
GET /api/vendor/stickers?page=1&limit=20&status=PUBLISHED
Authorization: Bearer {token}
```

#### Réponse

```typescript
{
  "success": true,
  "data": {
    "stickers": [
      {
        "id": 456,
        "name": "Sticker Logo Entreprise",
        "designPreview": "https://res.cloudinary.com/.../design_123.jpg",
        "stickerImage": "https://res.cloudinary.com/.../sticker_456.png",  // ← IMAGE GÉNÉRÉE
        "size": "10x10cm",
        "finish": "glossy",
        "price": 2500,
        "status": "PUBLISHED",
        "saleCount": 15,
        "viewCount": 150,
        "createdAt": "2026-01-11T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20
    }
  }
}
```

### 3. Obtenir les Configurations Disponibles

```http
GET /api/vendor/stickers/configurations
```

#### Réponse

```typescript
{
  "success": true,
  "data": {
    "shapes": [
      { "id": "SQUARE", "name": "Carré", "description": "Forme carrée classique" },
      { "id": "CIRCLE", "name": "Cercle", "description": "Forme ronde" },
      { "id": "RECTANGLE", "name": "Rectangle", "description": "Forme rectangulaire" },
      { "id": "DIE_CUT", "name": "Découpe personnalisée", "description": "Découpé selon la forme du design" }
    ],
    "stickerTypes": [
      { "id": "autocollant", "name": "Autocollant", "description": "Bordure fine avec effets 3D" },
      { "id": "pare-chocs", "name": "Pare-chocs", "description": "Bordure épaisse simple" }
    ],
    "borderColors": [
      { "id": "glossy-white", "name": "Blanc brillant", "description": "Bordure blanche avec effet brillant" },
      { "id": "white", "name": "Blanc", "description": "Bordure blanche simple" },
      { "id": "matte-white", "name": "Blanc mat", "description": "Bordure blanche mate" },
      { "id": "transparent", "name": "Transparent", "description": "Sans bordure" }
    ]
  }
}
```

---

## 🎨 Types de Stickers et Effets Appliqués

### Autocollant (stickerType: "autocollant")

Bordure cartoon avec effets 3D:

| borderColor | Effets Appliqués |
|-------------|-----------------|
| **glossy-white** | - Bordure blanche 16px (16 layers)<br>- Contour gris foncé interne<br>- Ombre portée 3D (3 layers)<br>- Effet glossy complet (glow 3 layers)<br>- Saturation cartoon (+10%) |
| **white** | - Bordure blanche 12px (16 layers)<br>- Contour gris foncé interne<br>- Ombre portée 3D (3 layers)<br>- Saturation cartoon (+10%) |
| **matte-white** | - Bordure blanche 12px (16 layers)<br>- Contour gris foncé interne<br>- Ombre portée 3D (3 layers)<br>- Pas de glow, finition mate |
| **transparent** | - Pas de bordure<br>- Pas d'ombre<br>- Image originale redimensionnée |

### Pare-chocs (stickerType: "pare-chocs")

Bordure épaisse simple pour véhicule:

| borderColor | Effets Appliqués |
|-------------|-----------------|
| **Tous** | - Bordure blanche 40px (simple)<br>- Pas d'ombre portée<br>- Pas d'effet glossy |

---

## 🚀 Intégration React

### 1. Supprimer les Composants CSS Obsolètes

```bash
# Supprimer le composant de preview avec CSS
rm src/components/vendor/StickerPreviewWithBorders.tsx
```

### 2. Simplifier StickerCard

**Avant (avec CSS):**

```tsx
// ❌ À SUPPRIMER - CSS effects complexes
const StickerCard = ({ sticker }) => {
  const [useCSSEffects] = useState(true);

  const cardStyle = useCSSEffects ? {
    filter: `
      drop-shadow(1px 0 0 white)
      drop-shadow(-1px 0 0 white)
      ... // 20+ lignes de CSS
    `
  } : {};

  return (
    <div className="...">
      <img
        src={sticker.designPreview}
        style={cardStyle}
      />
    </div>
  );
};
```

**Maintenant (simplifié):**

```tsx
// ✅ NOUVEAU - Affichage direct de l'image générée
import { Sticker } from '@/types/sticker';

interface StickerCardProps {
  sticker: Sticker;
  onDelete?: (id: number) => void;
  onView?: (imageUrl: string) => void;
}

export const StickerCard: React.FC<StickerCardProps> = ({
  sticker,
  onDelete,
  onView
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-lg transition-all overflow-hidden">
      {/* Image du sticker générée par le backend */}
      <div className="relative aspect-square bg-gray-100 p-4 flex items-center justify-center">
        <img
          src={sticker.stickerImage || sticker.designPreview}
          alt={sticker.name}
          className="max-w-full max-h-full object-contain"
          // ❌ PLUS DE CSS FILTERS - L'image contient déjà tous les effets
        />
      </div>

      {/* Informations du sticker */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">
          {sticker.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">{sticker.size}</span>
          <span className="font-bold text-primary">
            {sticker.price} FCFA
          </span>
        </div>
        <div className="flex gap-2 mt-3">
          {onView && (
            <button
              onClick={() => onView(sticker.stickerImage)}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Voir
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(sticker.id)}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 3. Simplifier VendorStickersList

**Avant (avec toggle CSS/Serveur):**

```tsx
// ❌ À SUPPRIMER - Toggle inutile
const VendorStickersList = () => {
  const [useCSSEffects, setUseCSSEffects] = useState(true);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2>Mes Stickers</h2>
        {/* Toggle à supprimer */}
        <button onClick={() => setUseCSSEffects(!useCSSEffects)}>
          {useCSSEffects ? 'CSS' : 'Serveur'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {stickers.map(sticker => (
          <StickerCard
            key={sticker.id}
            sticker={sticker}
            useCSSEffects={useCSSEffects}  // ❌ Plus nécessaire
          />
        ))}
      </div>
    </div>
  );
};
```

**Maintenant (simplifié):**

```tsx
// ✅ NOUVEAU - Plus de toggle
import { useEffect, useState } from 'react';
import { StickerCard } from './StickerCard';
import { api } from '@/lib/api';

export const VendorStickersList = () => {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStickers();
  }, []);

  const loadStickers = async () => {
    try {
      const response = await api.get('/vendor/stickers?page=1&limit=20');
      setStickers(response.data.data.stickers);
    } catch (error) {
      console.error('Erreur chargement stickers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce sticker ?')) return;

    try {
      await api.delete(`/vendor/stickers/${id}`);
      setStickers(stickers.filter(s => s.id !== id));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Mes Autocollants
            <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm">
              {stickers.length}
            </span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Stickers générés avec bordures cartoon
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/vendeur/stickers/create'}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Créer un autocollant
        </button>
      </div>

      {/* Grille de stickers - PAS de prop useCSSEffects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stickers.map((sticker) => (
          <StickerCard
            key={sticker.id}
            sticker={sticker}
            onDelete={handleDelete}
            onView={(imageUrl) => window.open(imageUrl, '_blank')}
          />
        ))}
      </div>

      {stickers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun sticker créé</p>
          <button
            onClick={() => window.location.href = '/vendeur/stickers/create'}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Créer mon premier sticker
          </button>
        </div>
      )}
    </div>
  );
};
```

### 4. Types TypeScript

```typescript
// src/types/sticker.ts

export interface StickerSize {
  width: number;  // en cm
  height: number; // en cm
}

export interface Sticker {
  id: number;
  name: string;
  sku: string;
  size: string; // "10x10cm"
  finish: string;
  shape: 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT';
  price: number;
  status: 'PENDING' | 'PUBLISHED' | 'DRAFT';
  saleCount: number;
  viewCount: number;
  designPreview: string;   // URL du design original
  stickerImage: string;    // ← URL de l'image générée par le backend
  createdAt: string;
}

export interface CreateStickerRequest {
  designId: number;
  name: string;
  description?: string;
  size: StickerSize;
  shape: 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT';
  finish: string;
  stickerType?: 'autocollant' | 'pare-chocs';
  borderColor?: 'glossy-white' | 'white' | 'matte-white' | 'transparent';
  price: number;
  stockQuantity: number;
  minimumQuantity?: number;
}

export interface StickerConfiguration {
  shapes: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  stickerTypes: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  borderColors: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}
```

---

## 📦 Checklist de Migration Frontend

### À Supprimer

- [ ] Supprimer `StickerPreviewWithBorders.tsx`
- [ ] Supprimer le state `useCSSEffects` dans `VendorStickersList.tsx`
- [ ] Supprimer le toggle CSS/Serveur dans l'UI
- [ ] Supprimer tous les CSS filters (drop-shadow, brightness, etc.) sur les images de stickers

### À Modifier

- [ ] `StickerCard.tsx`: Afficher directement `sticker.stickerImage` sans CSS
- [ ] `VendorStickersList.tsx`: Supprimer le toggle et la prop `useCSSEffects`
- [ ] Formulaire de création: Ajouter les champs `stickerType` et `borderColor`
- [ ] Mettre à jour les types TypeScript

### À Ajouter

- [ ] Sélecteur de `stickerType` (autocollant / pare-chocs)
- [ ] Sélecteur de `borderColor` (glossy-white / white / matte-white / transparent)
- [ ] Afficher un message de "Génération en cours..." pendant la création

---

## 🧪 Tests

### Test de Création

```bash
# Via curl
curl -X POST http://localhost:3004/vendor/stickers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 1,
    "name": "Test Sticker",
    "size": {"width": 10, "height": 10},
    "shape": "CIRCLE",
    "finish": "glossy",
    "stickerType": "autocollant",
    "borderColor": "glossy-white",
    "price": 2500,
    "stockQuantity": 100
  }'
```

### Vérification Visuelle

L'image retournée dans `imageUrl` doit avoir:
- ✅ Bordure blanche épaisse visible
- ✅ Contour gris foncé interne
- ✅ Ombre portée réaliste
- ✅ Effet glossy (si borderColor = "glossy-white")
- ✅ Couleurs saturées (effet cartoon)

---

## 🎯 Points Clés

1. **Plus de CSS côté frontend** - Tous les effets sont dans l'image
2. **Utiliser `stickerImage`** - C'est l'image finale générée avec tous les effets
3. **`designPreview`** - C'est juste l'aperçu du design original (sans effets)
4. **Temps de génération** - 2-12 secondes selon la taille (afficher un loader)
5. **Format PNG** - Transparence préservée pour les effets

---

## 📞 Support

Pour toute question sur l'intégration:
- Backend API: `/api/vendor/stickers`
- Documentation: `FRONTEND_INTEGRATION_GUIDE.md`
- Issues: Créer une issue sur le repository
