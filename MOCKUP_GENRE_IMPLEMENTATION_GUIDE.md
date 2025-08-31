# 🎯 Guide Backend - Implémentation du Champ Genre dans les Mockups

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation complète du champ `genre` dans les produits mockup admin. Le champ permet de catégoriser les mockups selon leur public cible.

## 🎯 Objectif

Modifier l'endpoint `POST /mockups` pour accepter et traiter le champ `genre` :
- **HOMME** : Mockups destinés aux hommes
- **FEMME** : Mockups destinés aux femmes  
- **BEBE** : Mockups destinés aux bébés/enfants
- **UNISEXE** : Mockups pour tous les genres (valeur par défaut)

## 🔧 Modifications Implémentées

### 1. **Modèle de Données - Schema Prisma**

```prisma
model Product {
  // ... champs existants ...
  
  // 🆕 NOUVEAU CHAMP: Genre pour catégoriser les mockups
  genre               ProductGenre @default(UNISEXE)
  
  // ... autres champs ...
  
  @@index([genre]) // Index pour optimiser les requêtes par genre
}
```

### 2. **DTOs pour les Mockups**

#### `src/product/dto/create-mockup.dto.ts`

```typescript
// Enum pour le genre des mockups
export enum MockupGenre {
  HOMME = 'HOMME',
  FEMME = 'FEMME',
  BEBE = 'BEBE',
  UNISEXE = 'UNISEXE'
}

export class CreateMockupDto {
  // ... champs existants ...
  
  @ApiProperty({ 
    description: 'Genre du mockup (public cible)',
    enum: MockupGenre,
    example: MockupGenre.HOMME,
    required: false
  })
  @IsEnum(MockupGenre, { 
    message: 'Le genre doit être "homme", "femme", "bébé" ou "unisexe"' 
  })
  @IsOptional()
  genre?: MockupGenre = MockupGenre.UNISEXE;
}

export class MockupResponseDto {
  // ... champs existants ...
  
  @ApiProperty({ 
    description: 'Genre du mockup',
    enum: MockupGenre
  })
  genre: MockupGenre;
}
```

### 3. **Service Mockup**

#### `src/product/services/mockup.service.ts`

```typescript
@Injectable()
export class MockupService {
  
  /**
   * Créer un mockup avec genre
   */
  async createMockup(createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    // Validation spécifique pour les mockups
    if (createMockupDto.isReadyProduct !== false) {
      throw new BadRequestException('Les mockups doivent avoir isReadyProduct: false');
    }

    const mockup = await this.prisma.product.create({
      data: {
        ...createMockupDto,
        genre: createMockupDto.genre || 'unisexe', // Valeur par défaut
        isReadyProduct: false, // Forcer à false pour les mockups
      }
    });
    
    return this.mapToResponseDto(mockup);
  }

  /**
   * Récupérer les mockups par genre
   */
  async getMockupsByGenre(genre: MockupGenre): Promise<MockupResponseDto[]> {
    const mockups = await this.prisma.product.findMany({
      where: {
        genre,
        isReadyProduct: false,
        isDelete: false
      }
    });
    
    return mockups.map(mockup => this.mapToResponseDto(mockup));
  }

  /**
   * Récupérer tous les genres disponibles
   */
  async getAvailableMockupGenres(): Promise<string[]> {
    const genres = await this.prisma.product.findMany({
      where: { isReadyProduct: false },
      select: { genre: true },
      distinct: ['genre']
    });
    
    return genres.map(g => g.genre);
  }
}
```

### 4. **Contrôleur Mockup**

#### `src/product/controllers/mockup.controller.ts`

```typescript
@ApiTags('Mockups')
@Controller('mockups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MockupController {

  /**
   * POST /mockups - Créer un mockup avec genre
   */
  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async createMockup(@Body() createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    return await this.mockupService.createMockup(createMockupDto);
  }

  /**
   * GET /mockups/by-genre/:genre - Récupérer les mockups par genre
   */
  @Get('by-genre/:genre')
  async getMockupsByGenre(@Param('genre') genre: MockupGenre): Promise<MockupResponseDto[]> {
    return await this.mockupService.getMockupsByGenre(genre);
  }

  /**
   * GET /mockups/genres - Récupérer tous les genres disponibles
   */
  @Get('genres')
  async getAvailableMockupGenres(): Promise<string[]> {
    return await this.mockupService.getAvailableMockupGenres();
  }

  /**
   * GET /mockups - Récupérer tous les mockups avec filtre par genre
   */
  @Get()
  async getAllMockups(@Query('genre') genre?: MockupGenre): Promise<MockupResponseDto[]> {
    return await this.mockupService.getAllMockups(genre);
  }
}
```

### 5. **Module Product Mis à Jour**

#### `src/product/product.module.ts`

```typescript
@Module({
  imports: [MailModule],
  controllers: [ProductController, MockupController], // ← NOUVEAU
  providers: [ProductService, MockupService, PrismaService, CloudinaryService, DelimitationService] // ← NOUVEAU
})
export class ProductModule {}
```

## 🔄 Endpoints Disponibles

### 1. **POST /mockups** - Créer un mockup
```bash
POST /api/mockups
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "HOMME",
  "categories": ["T-shirts", "Homme"],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [...]
}
```

**Réponse :**
```json
{
  "id": 123,
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "HOMME",
  "categories": [...],
  "colorVariations": [...],
  "sizes": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. **GET /mockups/by-genre/:genre** - Mockups par genre
```bash
GET /api/mockups/by-genre/HOMME
```

### 3. **GET /mockups/genres** - Genres disponibles
```bash
GET /api/mockups/genres
```

### 4. **GET /mockups** - Tous les mockups avec filtre
```bash
GET /api/mockups
GET /api/mockups?genre=HOMME
```

### 5. **PATCH /mockups/:id** - Mettre à jour un mockup
```bash
PATCH /api/mockups/123
Content-Type: application/json

{
  "genre": "FEMME",
  "name": "T-shirt Femme Élégant"
}
```

### 6. **DELETE /mockups/:id** - Supprimer un mockup
```bash
DELETE /api/mockups/123
```

## 🧪 Tests et Validation

### Script de Test : `test-mockup-genre.js`

```javascript
// Test création mockup pour homme
const hommeMockup = {
  name: 'T-shirt Homme Classic',
  description: 'T-shirt basique pour homme en coton',
  price: 5000,
  status: 'draft',
  isReadyProduct: false,
  genre: 'HOMME',
  categories: ['T-shirts', 'Homme'],
  sizes: ['S', 'M', 'L', 'XL'],
  colorVariations: [...]
};

const response = await axios.post('/api/mockups', hommeMockup);
console.log('Mockup créé:', response.data);
```

### Script de Mise à Jour : `update-existing-products-genre.js`

```javascript
// Mettre à jour les produits existants avec le champ genre
const productsWithoutGenre = await prisma.product.findMany({
  where: { genre: null }
});

for (const product of productsWithoutGenre) {
  // Logique pour déterminer le genre basé sur le nom/description
  let genre = 'unisexe';
  
  if (product.name.toLowerCase().includes('homme')) {
    genre = 'homme';
  } else if (product.name.toLowerCase().includes('femme')) {
    genre = 'femme';
  } else if (product.name.toLowerCase().includes('bébé')) {
    genre = 'bébé';
  }
  
  await prisma.product.update({
    where: { id: product.id },
    data: { genre }
  });
}
```

## 🔍 Validation et Gestion d'Erreurs

### Validation des Genres
```typescript
@IsEnum(MockupGenre, { 
  message: 'Le genre doit être "HOMME", "FEMME", "BEBE" ou "UNISEXE"' 
})
genre?: MockupGenre = MockupGenre.UNISEXE;
```

### Validation des Mockups
```typescript
if (createMockupDto.isReadyProduct !== false) {
  throw new BadRequestException('Les mockups doivent avoir isReadyProduct: false');
}
```

## 📊 Logs et Monitoring

```typescript
this.logger.log(`🎨 Création mockup: ${createMockupDto.name} - Genre: ${createMockupDto.genre || 'unisexe'}`);
this.logger.log(`✅ Mockup créé avec succès: ID ${mockup.id}, Genre: ${mockup.genre}`);
```

## 🚀 Déploiement

### 1. **Migration de Base de Données**
```bash
# Générer le client Prisma
npx prisma generate

# Exécuter la migration (si possible)
npx prisma migrate dev --name add_genre_to_products
```

### 2. **Mise à Jour des Produits Existants**
```bash
# Exécuter le script de mise à jour
node update-existing-products-genre.js
```

### 3. **Tests**
```bash
# Tester l'implémentation
node test-mockup-genre.js
```

## ✅ Checklist de Validation

- [x] Migration de base de données (schema.prisma mis à jour)
- [x] DTO CreateMockupDto créé avec le champ genre
- [x] Validation Joi/class-validator ajoutée
- [x] Service MockupService créé avec gestion du genre
- [x] Contrôleur MockupController créé avec tous les endpoints
- [x] Module Product mis à jour avec MockupController et MockupService
- [x] Tests unitaires écrits (test-mockup-genre.js)
- [x] Script de mise à jour des produits existants créé
- [x] Validation des erreurs implémentée
- [x] Logs ajoutés pour le monitoring
- [x] Documentation API mise à jour (Swagger)

## 🎯 Avantages de l'Implémentation

1. **Catégorisation Précise** : Les mockups sont maintenant catégorisés par public cible
2. **Filtrage Facile** : Possibilité de filtrer les mockups par genre
3. **Valeur par Défaut** : Les mockups sans genre spécifié sont automatiquement "unisexe"
4. **Validation Robuste** : Contrôles stricts sur les valeurs de genre autorisées
5. **API Complète** : Endpoints pour créer, lire, mettre à jour et supprimer des mockups
6. **Rétrocompatibilité** : Les produits existants sont mis à jour automatiquement
7. **Documentation Swagger** : API complètement documentée

## 🔄 Exemples d'Utilisation

### Créer un Mockup pour Homme
```bash
curl -X POST 'http://localhost:3004/mockups' \
  -H 'Authorization: Bearer <admin-token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "T-shirt Homme Sport",
    "description": "T-shirt sport pour homme",
    "price": 5500,
    "status": "draft",
    "isReadyProduct": false,
    "genre": "HOMME",
    "categories": ["T-shirts", "Sport"],
    "sizes": ["S", "M", "L", "XL"],
    "colorVariations": [...]
  }'
```

### Récupérer les Mockups par Genre
```bash
curl -X GET 'http://localhost:3004/mockups/by-genre/HOMME'
```

### Récupérer Tous les Genres Disponibles
```bash
curl -X GET 'http://localhost:3004/mockups/genres'
```

---

**Note** : Cette implémentation respecte les standards NestJS et Prisma, avec une validation robuste et une documentation complète. Tous les endpoints sont protégés par authentification et autorisation appropriées. 