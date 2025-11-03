# Module Designers - PrintAlma Backend

## 📝 Description

Ce module gère les designers (créateurs) qui apparaissent sur la page d'accueil du site PrintAlma. Il permet de créer, modifier, supprimer et afficher les designers, ainsi que de gérer leur mise en vedette (featured).

## 🏗️ Architecture

```
src/designer/
├── dto/
│   ├── create-designer.dto.ts      # DTO pour créer un designer
│   ├── update-designer.dto.ts      # DTO pour modifier un designer
│   └── update-featured-designers.dto.ts  # DTO pour mettre à jour les featured
├── designer.controller.ts          # Contrôleur REST
├── designer.service.ts             # Logique métier
├── designer.module.ts              # Module NestJS
└── README.md                       # Ce fichier
```

## 🔗 Endpoints

### Publics (sans authentification)

#### `GET /designers/health`
Health check du service.

**Réponse:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-31T12:00:00.000Z"
}
```

#### `GET /designers/featured`
Récupère les designers en vedette (6 designers maximum).

**Réponse:**
```json
[
  {
    "id": 1,
    "name": "Pap Musa",
    "displayName": "Pap Musa",
    "bio": "Artiste spécialisé dans les motifs traditionnels africains",
    "avatarUrl": "https://res.cloudinary.com/...",
    "isActive": true,
    "sortOrder": 1,
    "featuredOrder": 1,
    "isFeatured": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "creator": {
      "id": 1,
      "firstName": "Papa Faly",
      "lastName": "Diagne"
    }
  }
]
```

### Admin (authentification requise)

#### `GET /designers/admin`
Liste tous les designers avec pagination.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Réponse:**
```json
{
  "designers": [...],
  "total": 6
}
```

#### `POST /designers/admin`
Créer un nouveau designer.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Body (FormData):**
```
name: string (requis, min 2, max 255)
displayName: string (optionnel, max 255)
bio: string (optionnel, max 1000)
avatar: File (optionnel, image)
isActive: boolean (optionnel, défaut true)
sortOrder: number (optionnel, auto-incrémenté)
```

**Réponse:** Designer créé (201)

#### `PUT /designers/admin/:id`
Modifier un designer existant.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Body (FormData):**
```
name: string (optionnel)
displayName: string (optionnel)
bio: string (optionnel)
avatar: File (optionnel)
removeAvatar: boolean (optionnel, pour supprimer l'avatar)
isActive: boolean (optionnel)
sortOrder: number (optionnel)
isFeatured: boolean (optionnel)
featuredOrder: number (optionnel)
```

**Réponse:** Designer modifié (200)

#### `DELETE /designers/admin/:id`
Supprimer un designer.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Réponse:** 204 No Content

#### `PUT /designers/featured/update`
Mettre à jour les designers en vedette.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "designerIds": ["1", "2", "3", "4", "5", "6"]
}
```

**Validation:**
- Exactement 6 designers requis
- Tous les IDs doivent exister
- Tous les designers doivent être actifs

**Réponse:** Tableau des designers mis à jour (200)

## 🔒 Authentification & Autorisation

### Guards utilisés
- `JwtAuthGuard`: Vérifie la validité du token JWT
- `RolesGuard`: Vérifie les rôles de l'utilisateur

### Rôles autorisés
- `ADMIN`
- `SUPERADMIN`

## 🎨 Upload d'images

### Configuration Cloudinary
- **Dossier**: `designers`
- **Transformation**: 400x400px, crop fill, gravity face
- **Format**: Auto (optimisation automatique)
- **Qualité**: Auto good

### Limitations
- Taille maximale: 2MB (configuré dans multer)
- Formats acceptés: jpg, jpeg, png, gif, webp

## 🗄️ Base de données

### Modèle Prisma
```prisma
model Designer {
  id             Int      @id @default(autoincrement())
  name           String
  displayName    String?
  bio            String?
  avatarUrl      String?
  avatarPublicId String?
  isActive       Boolean  @default(true)
  sortOrder      Int      @default(0)
  featuredOrder  Int?
  isFeatured     Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      Int
  creator        User     @relation(fields: [createdBy], references: [id])
}
```

### Index
- `isActive`: Pour filtrer les designers actifs
- `isFeatured`: Pour récupérer les designers en vedette
- `sortOrder`: Pour le tri
- `featuredOrder`: Pour l'ordre d'affichage en vedette

## 📦 Dépendances

### Modules externes
- `@nestjs/common`
- `@nestjs/platform-express`
- `class-validator`
- `class-transformer`

### Modules internes
- `PrismaService`: Accès à la base de données
- `CloudinaryModule`: Upload et gestion des images
- `AuthModule`: Authentification et autorisation

## 🧪 Tests

### Script de test
Un script bash est disponible pour tester tous les endpoints:

```bash
./test-designers-api.sh YOUR_JWT_TOKEN
```

### Tests manuels avec curl

```bash
# Health check
curl http://localhost:3004/designers/health

# Liste featured (public)
curl http://localhost:3004/designers/featured

# Liste complète (admin)
curl -H "Authorization: Bearer TOKEN" http://localhost:3004/designers/admin

# Créer un designer
curl -X POST http://localhost:3004/designers/admin \
  -H "Authorization: Bearer TOKEN" \
  -F "name=Test" \
  -F "bio=Test bio"
```

## 🌱 Seed des données

Un script de seed est disponible pour créer 6 designers initiaux:

```bash
npx ts-node prisma/seed-designers.ts
```

## 🔧 Configuration

### Variables d'environnement
Les variables Cloudinary sont déjà configurées dans le service.

### Multer (upload de fichiers)
La configuration multer peut être ajustée dans le contrôleur si nécessaire.

## 📊 Validation métier

### Règles de validation
1. **Création**:
   - Le nom est requis (min 2 caractères)
   - Le sortOrder est auto-incrémenté si non fourni
   - L'avatar est optionnel

2. **Mise à jour**:
   - Tous les champs sont optionnels
   - L'ancien avatar est supprimé si un nouveau est uploadé
   - `removeAvatar` permet de supprimer l'avatar existant

3. **Featured**:
   - Exactement 6 designers requis
   - Les designers doivent exister et être actifs
   - Transaction atomique pour garantir la cohérence

4. **Suppression**:
   - L'avatar est supprimé de Cloudinary
   - Le designer est définitivement supprimé (hard delete)

## 🐛 Gestion des erreurs

### Codes HTTP
- `200 OK`: Opération réussie
- `201 Created`: Designer créé
- `204 No Content`: Designer supprimé
- `400 Bad Request`: Validation échouée
- `401 Unauthorized`: Token JWT invalide
- `403 Forbidden`: Rôle insuffisant
- `404 Not Found`: Designer inexistant

### Messages d'erreur
Tous les messages d'erreur sont en français et explicites:
- "Designer #X non trouvé"
- "Exactement 6 designers doivent être sélectionnés"
- "Les designers suivants sont inactifs: ..."

## 🚀 Améliorations futures

1. **Pagination**: Ajouter la pagination pour la liste admin
2. **Recherche**: Implémenter la recherche par nom/bio
3. **Statistiques**: Ajouter des statistiques d'utilisation
4. **Cache**: Mettre en cache les designers featured
5. **Soft delete**: Option de soft delete au lieu de hard delete
6. **Historique**: Tracer les modifications (audit log)

## 📝 Notes

- Les designers en vedette sont limités à 6 pour correspondre au design du frontend
- Le `sortOrder` est utilisé pour l'ordre général, `featuredOrder` pour l'ordre en vedette
- L'upload d'avatar est géré par Cloudinary avec transformations automatiques
- Les transactions Prisma garantissent la cohérence des données featured
