# Système de Galerie Vendeur - Documentation

## Vue d'ensemble

Le système de galerie vendeur permet aux vendeurs de créer des portfolios visuels avec **exactement 5 images** par galerie. Chaque galerie peut être publiée, archivée ou mise en brouillon.

---

## Modèles de Données

### VendorGallery
```prisma
model VendorGallery {
  id          Int            @id @default(autoincrement())
  vendorId    Int            @map("vendor_id")
  title       String         @db.VarChar(100)
  description String?        @db.VarChar(500)
  status      GalleryStatus  @default(DRAFT)
  isPublished Boolean        @default(false) @map("is_published")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")
  deletedAt   DateTime?      @map("deleted_at")
  vendor      User           @relation("VendorGalleries", fields: [vendorId], references: [id], onDelete: Cascade)
  images      GalleryImage[]
}
```

### GalleryImage
```prisma
model GalleryImage {
  id            Int           @id @default(autoincrement())
  galleryId     Int           @map("gallery_id")
  imageUrl      String        @map("image_url") @db.VarChar(500)
  imagePath     String        @map("image_path") @db.VarChar(500)
  publicId      String        @map("public_id") @db.VarChar(255)
  caption       String?       @db.VarChar(200)
  orderPosition Int           @map("order_position")
  fileSize      Int           @map("file_size")
  mimeType      String        @map("mime_type") @db.VarChar(50)
  width         Int?
  height        Int?
  createdAt     DateTime      @default(now()) @map("created_at")
  gallery       VendorGallery @relation(fields: [galleryId], references: [id], onDelete: Cascade)
}
```

---

## API Endpoints

### Endpoints Vendeur (Protégés)

Tous ces endpoints nécessitent l'authentification JWT et le rôle VENDEUR.

#### 1. Créer une galerie
```http
POST /vendor/galleries
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "title": "Ma Collection Printemps 2024",
  "description": "Collection inspirée par les couleurs du printemps",
  "captions": [
    { "caption": "Design floral" },
    { "caption": "Motif abstrait" },
    { "caption": "Style minimaliste" },
    { "caption": "Couleurs vives" },
    { "caption": "Géométrie moderne" }
  ],
  "images": [image1.jpg, image2.jpg, image3.jpg, image4.jpg, image5.jpg]
}
```

**Validation:**
- Exactement 5 images requises
- Formats acceptés: JPEG, PNG, WebP
- Taille max par image: 5MB
- Titre: 3-100 caractères
- Description: max 500 caractères (optionnel)
- Légendes: max 200 caractères (optionnel)

**Réponse:**
```json
{
  "success": true,
  "message": "Galerie créée avec succès",
  "data": {
    "id": 1,
    "vendorId": 5,
    "title": "Ma Collection Printemps 2024",
    "description": "Collection inspirée par les couleurs du printemps",
    "status": "DRAFT",
    "isPublished": false,
    "createdAt": "2024-12-07T10:00:00.000Z",
    "updatedAt": "2024-12-07T10:00:00.000Z",
    "images": [
      {
        "id": 1,
        "imageUrl": "https://res.cloudinary.com/.../image1.webp",
        "publicId": "galleries/vendor_5/gallery-123456789.webp",
        "caption": "Design floral",
        "orderPosition": 1,
        "fileSize": 245678,
        "mimeType": "image/webp",
        "width": 1200,
        "height": 800,
        "createdAt": "2024-12-07T10:00:00.000Z"
      },
      // ... 4 autres images
    ]
  }
}
```

#### 2. Récupérer les galeries du vendeur
```http
GET /vendor/galleries?page=1&limit=10&status=PUBLISHED
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Numéro de page (défaut: 1)
- `limit` (optional): Nombre de résultats par page (défaut: 10)
- `status` (optional): Filtrer par statut (DRAFT, PUBLISHED, ARCHIVED)

**Réponse:**
```json
{
  "success": true,
  "data": {
    "galleries": [
      {
        "id": 1,
        "vendorId": 5,
        "title": "Ma Collection Printemps 2024",
        "status": "PUBLISHED",
        "isPublished": true,
        "images_count": 5,
        "images": [...],
        "createdAt": "2024-12-07T10:00:00.000Z",
        "updatedAt": "2024-12-07T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### 3. Récupérer une galerie spécifique
```http
GET /vendor/galleries/:id
Authorization: Bearer {token}
```

#### 4. Mettre à jour une galerie
```http
PUT /vendor/galleries/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Nouveau titre",
  "description": "Nouvelle description",
  "status": "PUBLISHED"
}
```

**Champs modifiables:**
- `title` (optional): Nouveau titre
- `description` (optional): Nouvelle description
- `status` (optional): Nouveau statut (DRAFT, PUBLISHED, ARCHIVED)
- `is_published` (optional): État de publication (true/false)

#### 5. Supprimer une galerie
```http
DELETE /vendor/galleries/:id
Authorization: Bearer {token}
```

Supprime la galerie (soft delete) et toutes les images associées sur Cloudinary.

#### 6. Publier/Dépublier une galerie
```http
PATCH /vendor/galleries/:id/publish
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_published": true
}
```

**Validation:**
- La galerie doit contenir exactement 5 images pour être publiée

---

### Endpoints Publics

Ces endpoints sont accessibles sans authentification.

#### 1. Récupérer les galeries publiées
```http
GET /public/galleries?page=1&limit=12&vendorId=5
```

**Query Parameters:**
- `page` (optional): Numéro de page (défaut: 1)
- `limit` (optional): Nombre de résultats par page (défaut: 12)
- `vendorId` (optional): Filtrer par vendeur

#### 2. Récupérer une galerie publiée
```http
GET /public/galleries/:id
```

---

## Contraintes et Validations

### Contraintes strictes
- **5 images exactement** par galerie (pas moins, pas plus)
- **Formats autorisés**: JPEG, JPG, PNG, WebP
- **Taille max**: 5MB par image
- **Upload**: Les images sont optimisées et converties en WebP sur Cloudinary

### Longueurs de champs
- **Titre**: 3-100 caractères (requis)
- **Description**: max 500 caractères (optionnel)
- **Légende**: max 200 caractères par image (optionnel)

### Statuts disponibles
- `DRAFT`: Brouillon (par défaut)
- `PUBLISHED`: Publié et visible
- `ARCHIVED`: Archivé (non visible publiquement)

---

## Structure des Dossiers

```
src/vendor-gallery/
├── dto/
│   ├── create-gallery.dto.ts       # DTO pour la création
│   ├── update-gallery.dto.ts       # DTO pour la mise à jour
│   ├── gallery-response.dto.ts     # DTOs de réponse
│   └── toggle-publish.dto.ts       # DTO pour publier/dépublier
├── vendor-gallery.controller.ts    # Contrôleur vendeur (protégé)
├── public-gallery.controller.ts    # Contrôleur public
├── vendor-gallery.service.ts       # Service métier
├── vendor-gallery.module.ts        # Module NestJS
└── README.md                       # Documentation
```

---

## Optimisations Implémentées

1. **Optimisation des images**: Conversion automatique en WebP avec Sharp
2. **Upload Cloudinary**: Stockage cloud avec URLs optimisées
3. **Pagination**: Toutes les listes sont paginées
4. **Soft Delete**: Les galeries supprimées sont conservées avec `deletedAt`
5. **Index de base de données**: Sur vendorId, status, createdAt pour performances

---

## Exemple d'utilisation (Frontend)

### Créer une galerie avec FormData
```typescript
const formData = new FormData();
formData.append('title', 'Ma Collection Printemps 2024');
formData.append('description', 'Collection inspirée par les couleurs du printemps');

// Ajouter les 5 images
files.forEach((file) => {
  formData.append('images', file);
});

// Ajouter les légendes (optionnel)
const captions = [
  { caption: 'Design floral' },
  { caption: 'Motif abstrait' },
  { caption: 'Style minimaliste' },
  { caption: 'Couleurs vives' },
  { caption: 'Géométrie moderne' }
];
formData.append('captions', JSON.stringify(captions));

const response = await fetch('/vendor/galleries', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

## Sécurité

### Authentification et Autorisation
- JWT requis pour tous les endpoints vendeur
- Guard `VendorGuard` pour vérifier le rôle VENDEUR
- Vérification que le vendeur possède bien la galerie avant modification/suppression

### Validation des uploads
- Vérification du type MIME
- Limite de taille de fichier
- Nombre exact d'images validé
- Nettoyage automatique en cas d'erreur

### Protection contre les abus
- Validation stricte des DTOs avec class-validator
- Sanitization des entrées
- Limite de taille des textes

---

## Codes d'erreur

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Validation échouée (nombre d'images incorrect, format invalide, etc.) |
| 401 | Unauthorized | Token JWT manquant ou invalide |
| 403 | Forbidden | L'utilisateur n'a pas le rôle VENDEUR ou n'est pas propriétaire |
| 404 | Not Found | Galerie non trouvée |
| 500 | Internal Server Error | Erreur serveur (upload, base de données, etc.) |

---

## Tests recommandés

### Tests unitaires
- ✅ Validation des DTOs
- ✅ Logique métier du service
- ✅ Gestion des erreurs

### Tests d'intégration
- ✅ Création de galerie avec 5 images
- ✅ Rejet si nombre d'images != 5
- ✅ Upload et stockage Cloudinary
- ✅ Suppression avec nettoyage des images
- ✅ Publication/Dépublication
- ✅ Pagination

### Tests end-to-end
- ✅ Workflow complet: création → modification → publication → suppression
- ✅ Accès public aux galeries publiées
- ✅ Protection des galeries privées

---

## Maintenance

### Nettoyage Cloudinary
Les images sont automatiquement supprimées de Cloudinary lors de la suppression d'une galerie.

### Monitoring
- Logger les erreurs d'upload
- Tracer les créations/suppressions de galeries
- Surveiller l'espace de stockage Cloudinary

---

**Auteur**: PrintAlma Dev Team
**Date**: 2024-12-07
**Version**: 1.0.0
