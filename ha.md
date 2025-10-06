# Guide Backend - Gestion des Types de Vendeurs

## Vue d'ensemble

Ce document explique comment implémenter la gestion des types de vendeurs dans le backend NestJS. Le système permet aux administrateurs de créer, modifier et supprimer dynamiquement des types de vendeurs personnalisés.

## 1. Schéma de Base de Données (Prisma)

### Table `VendorType`

```prisma
model VendorType {
  id          Int      @id @default(autoincrement())
  label       String   @unique // Nom du type (ex: "Designer", "Photographe")
  description String   // Description du type
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relation avec les vendeurs
  users       User[]   @relation("UserVendorType")

  @@map("vendor_types")
}
```

### Modification de la table `User`

```prisma
model User {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  firstName       String
  lastName        String
  password        String
  role            UserRole  @default(VENDEUR)

  // Ancienne colonne (à migrer/supprimer progressivement)
  vendeur_type    String?   // DESIGNER | INFLUENCEUR | ARTISTE

  // Nouvelle colonne (relation avec VendorType)
  vendorTypeId    Int?
  vendorType      VendorType? @relation("UserVendorType", fields: [vendorTypeId], references: [id])

  status          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("users")
}
```

## 2. DTOs (Data Transfer Objects)

### `create-vendor-type.dto.ts`

```typescript
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVendorTypeDto {
  @ApiProperty({
    description: 'Nom du type de vendeur',
    example: 'Photographe',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  label: string;

  @ApiProperty({
    description: 'Description du type de vendeur',
    example: 'Spécialiste de la photographie professionnelle',
    minLength: 5,
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  description: string;
}
```

### `update-vendor-type.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateVendorTypeDto } from './create-vendor-type.dto';

export class UpdateVendorTypeDto extends PartialType(CreateVendorTypeDto) {}
```

### `vendor-type-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class VendorTypeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Photographe' })
  label: string;

  @ApiProperty({ example: 'Spécialiste de la photographie professionnelle' })
  description: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 5, description: 'Nombre de vendeurs utilisant ce type' })
  userCount?: number;
}
```

## 3. Service VendorType

### `vendor-type.service.ts`

```typescript
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { UpdateVendorTypeDto } from './dto/update-vendor-type.dto';

@Injectable()
export class VendorTypeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau type de vendeur
   */
  async create(createVendorTypeDto: CreateVendorTypeDto) {
    const { label, description } = createVendorTypeDto;

    // Vérifier si le type existe déjà
    const existing = await this.prisma.vendorType.findUnique({
      where: { label },
    });

    if (existing) {
      throw new ConflictException(
        `Le type de vendeur "${label}" existe déjà`,
      );
    }

    // Créer le type
    const vendorType = await this.prisma.vendorType.create({
      data: {
        label,
        description,
      },
    });

    return {
      message: 'Type de vendeur créé avec succès',
      vendorType,
    };
  }

  /**
   * Récupérer tous les types de vendeurs
   */
  async findAll() {
    const vendorTypes = await this.prisma.vendorType.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        label: 'asc',
      },
    });

    return vendorTypes.map((type) => ({
      id: type.id,
      label: type.label,
      description: type.description,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
      userCount: type._count.users,
    }));
  }

  /**
   * Récupérer un type de vendeur par ID
   */
  async findOne(id: number) {
    const vendorType = await this.prisma.vendorType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!vendorType) {
      throw new NotFoundException(`Type de vendeur #${id} introuvable`);
    }

    return {
      id: vendorType.id,
      label: vendorType.label,
      description: vendorType.description,
      createdAt: vendorType.createdAt,
      updatedAt: vendorType.updatedAt,
      userCount: vendorType._count.users,
    };
  }

  /**
   * Mettre à jour un type de vendeur
   */
  async update(id: number, updateVendorTypeDto: UpdateVendorTypeDto) {
    // Vérifier si le type existe
    await this.findOne(id);

    // Si on modifie le label, vérifier l'unicité
    if (updateVendorTypeDto.label) {
      const existing = await this.prisma.vendorType.findFirst({
        where: {
          label: updateVendorTypeDto.label,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Le type de vendeur "${updateVendorTypeDto.label}" existe déjà`,
        );
      }
    }

    // Mettre à jour
    const vendorType = await this.prisma.vendorType.update({
      where: { id },
      data: updateVendorTypeDto,
    });

    return {
      message: 'Type de vendeur modifié avec succès',
      vendorType,
    };
  }

  /**
   * Supprimer un type de vendeur
   */
  async remove(id: number) {
    // Vérifier si le type existe
    const vendorType = await this.findOne(id);

    // Vérifier si des utilisateurs utilisent ce type
    if (vendorType.userCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce type car ${vendorType.userCount} vendeur(s) l'utilisent actuellement`,
      );
    }

    // Supprimer
    await this.prisma.vendorType.delete({
      where: { id },
    });

    return {
      message: 'Type de vendeur supprimé avec succès',
    };
  }

  /**
   * Vérifier si un type existe par label
   */
  async checkExists(label: string): Promise<boolean> {
    const count = await this.prisma.vendorType.count({
      where: { label },
    });
    return count > 0;
  }
}
```

## 4. Controller VendorType

### `vendor-type.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VendorTypeService } from './vendor-type.service';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { UpdateVendorTypeDto } from './dto/update-vendor-type.dto';
import { VendorTypeResponseDto } from './dto/vendor-type-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Vendor Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor-types')
export class VendorTypeController {
  constructor(private readonly vendorTypeService: VendorTypeService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Créer un nouveau type de vendeur' })
  @ApiResponse({
    status: 201,
    description: 'Type de vendeur créé avec succès',
    type: VendorTypeResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Le type existe déjà' })
  create(@Body() createVendorTypeDto: CreateVendorTypeDto) {
    return this.vendorTypeService.create(createVendorTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les types de vendeurs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des types de vendeurs',
    type: [VendorTypeResponseDto],
  })
  findAll() {
    return this.vendorTypeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un type de vendeur par ID' })
  @ApiResponse({
    status: 200,
    description: 'Type de vendeur trouvé',
    type: VendorTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Type introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorTypeService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Modifier un type de vendeur' })
  @ApiResponse({
    status: 200,
    description: 'Type de vendeur modifié avec succès',
    type: VendorTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Type introuvable' })
  @ApiResponse({ status: 409, description: 'Le nouveau nom existe déjà' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorTypeDto: UpdateVendorTypeDto,
  ) {
    return this.vendorTypeService.update(id, updateVendorTypeDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Supprimer un type de vendeur' })
  @ApiResponse({ status: 200, description: 'Type de vendeur supprimé' })
  @ApiResponse({ status: 404, description: 'Type introuvable' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer car utilisé par des vendeurs',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorTypeService.remove(id);
  }
}
```

## 5. Module VendorType

### `vendor-type.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { VendorTypeService } from './vendor-type.service';
import { VendorTypeController } from './vendor-type.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VendorTypeController],
  providers: [VendorTypeService],
  exports: [VendorTypeService],
})
export class VendorTypeModule {}
```

## 6. Endpoints API

### Base URL
```
/api/vendor-types
```

### Liste des endpoints

#### 1. Créer un type de vendeur
```http
POST /api/vendor-types
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Photographe",
  "description": "Spécialiste de la photographie professionnelle"
}
```

**Réponse (201):**
```json
{
  "message": "Type de vendeur créé avec succès",
  "vendorType": {
    "id": 1,
    "label": "Photographe",
    "description": "Spécialiste de la photographie professionnelle",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Récupérer tous les types
```http
GET /api/vendor-types
Authorization: Bearer {token}
```

**Réponse (200):**
```json
[
  {
    "id": 1,
    "label": "Photographe",
    "description": "Spécialiste de la photographie professionnelle",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "userCount": 5
  },
  {
    "id": 2,
    "label": "Streamer",
    "description": "Créateur de contenu en direct",
    "createdAt": "2024-01-16T14:20:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z",
    "userCount": 3
  }
]
```

#### 3. Récupérer un type par ID
```http
GET /api/vendor-types/1
Authorization: Bearer {token}
```

**Réponse (200):**
```json
{
  "id": 1,
  "label": "Photographe",
  "description": "Spécialiste de la photographie professionnelle",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "userCount": 5
}
```

#### 4. Modifier un type
```http
PATCH /api/vendor-types/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Photographe Pro",
  "description": "Photographe professionnel certifié"
}
```

**Réponse (200):**
```json
{
  "message": "Type de vendeur modifié avec succès",
  "vendorType": {
    "id": 1,
    "label": "Photographe Pro",
    "description": "Photographe professionnel certifié",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### 5. Supprimer un type
```http
DELETE /api/vendor-types/1
Authorization: Bearer {token}
```

**Réponse (200):**
```json
{
  "message": "Type de vendeur supprimé avec succès"
}
```

**Erreur (400) - Type utilisé:**
```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer ce type car 5 vendeur(s) l'utilisent actuellement",
  "error": "Bad Request"
}
```

## 7. Migration de données

### Script de migration (optionnel)

Si vous avez des vendeurs existants avec l'ancien système (DESIGNER, INFLUENCEUR, ARTISTE), créez un script de migration :

```typescript
// scripts/migrate-vendor-types.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateVendorTypes() {
  console.log('🔄 Migration des types de vendeurs...');

  // Créer les types de base
  const types = [
    { label: 'Designer', description: 'Création de designs personnalisés' },
    { label: 'Influenceur', description: 'Promotion sur réseaux sociaux' },
    { label: 'Artiste', description: 'Créations artistiques originales' },
  ];

  for (const type of types) {
    const vendorType = await prisma.vendorType.upsert({
      where: { label: type.label },
      update: {},
      create: type,
    });
    console.log(`✅ Type créé: ${vendorType.label} (ID: ${vendorType.id})`);
  }

  // Migrer les utilisateurs existants
  const users = await prisma.user.findMany({
    where: {
      vendeur_type: { not: null },
      vendorTypeId: null,
    },
  });

  console.log(`\n📊 ${users.length} utilisateurs à migrer`);

  for (const user of users) {
    const vendorType = await prisma.vendorType.findUnique({
      where: { label: user.vendeur_type },
    });

    if (vendorType) {
      await prisma.user.update({
        where: { id: user.id },
        data: { vendorTypeId: vendorType.id },
      });
      console.log(`✅ Migré: ${user.email} → ${vendorType.label}`);
    }
  }

  console.log('\n✨ Migration terminée !');
}

migrateVendorTypes()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Exécution:**
```bash
npx ts-node scripts/migrate-vendor-types.ts
```

## 8. Tests

### vendor-type.service.spec.ts (exemple)

```typescript
describe('VendorTypeService', () => {
  let service: VendorTypeService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorTypeService, PrismaService],
    }).compile();

    service = module.get<VendorTypeService>(VendorTypeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('devrait créer un nouveau type de vendeur', async () => {
      const dto = {
        label: 'Photographe',
        description: 'Spécialiste photo',
      };

      const result = await service.create(dto);

      expect(result.message).toBe('Type de vendeur créé avec succès');
      expect(result.vendorType.label).toBe(dto.label);
    });

    it('devrait échouer si le type existe déjà', async () => {
      const dto = {
        label: 'Photographe',
        description: 'Spécialiste photo',
      };

      await service.create(dto);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('devrait échouer si le type est utilisé', async () => {
      // Créer un type avec des utilisateurs
      const type = await service.create({
        label: 'Test',
        description: 'Test',
      });

      await prisma.user.create({
        data: {
          email: 'test@test.com',
          password: 'password',
          firstName: 'Test',
          lastName: 'User',
          vendorTypeId: type.vendorType.id,
        },
      });

      await expect(service.remove(type.vendorType.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
```

## 9. Validation et Sécurité

### Règles de validation
- **label**: 2-50 caractères, unique, obligatoire
- **description**: 5-200 caractères, obligatoire
- Seuls ADMIN et SUPERADMIN peuvent créer/modifier/supprimer
- Impossible de supprimer un type utilisé par des vendeurs

### Protection
- JWT Guard pour l'authentification
- Roles Guard pour l'autorisation
- Validation des DTOs avec class-validator
- Gestion des erreurs avec exceptions NestJS

## 10. Checklist d'implémentation

### Backend
- [ ] Créer la table `vendor_types` dans Prisma
- [ ] Ajouter `vendorTypeId` dans la table `users`
- [ ] Exécuter les migrations: `npx prisma migrate dev`
- [ ] Créer le module `vendor-type`
- [ ] Implémenter le service avec CRUD complet
- [ ] Créer le controller avec guards
- [ ] Ajouter les DTOs avec validation
- [ ] Tester tous les endpoints
- [ ] (Optionnel) Migrer les données existantes

### Frontend
- [ ] Créer le service API pour les types de vendeurs
- [ ] Remplacer localStorage par les appels API
- [ ] Mettre à jour les hooks pour charger depuis le backend
- [ ] Gérer les erreurs et afficher les toasts
- [ ] Synchroniser avec la création de vendeurs

## 11. Exemples d'utilisation

### Créer un type
```bash
curl -X POST http://localhost:3004/api/vendor-types \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Développeur",
    "description": "Développeur de logiciels et applications"
  }'
```

### Lister les types
```bash
curl -X GET http://localhost:3004/api/vendor-types \
  -H "Authorization: Bearer {token}"
```

### Modifier un type
```bash
curl -X PATCH http://localhost:3004/api/vendor-types/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Développeur full-stack expérimenté"
  }'
```

### Supprimer un type
```bash
curl -X DELETE http://localhost:3004/api/vendor-types/1 \
  -H "Authorization: Bearer {token}"
```

---

## Résumé

✅ **Table vendorTypes** avec relation vers users
✅ **CRUD complet** pour gérer les types
✅ **Validation** stricte des données
✅ **Sécurité** avec guards et rôles
✅ **Protection** contre suppression de types utilisés
✅ **Endpoints RESTful** clairs et documentés
✅ **Migration** optionnelle pour données existantes

Le système permet une gestion flexible et sécurisée des types de vendeurs, entièrement contrôlée par les administrateurs via l'interface frontend.
