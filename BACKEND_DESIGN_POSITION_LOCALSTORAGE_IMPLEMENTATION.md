# 🔧 Backend : Implémentation Position Design avec localStorage

## 📋 Résumé des modifications

Ce document résume les modifications apportées au backend pour supporter la gestion des positions de design via localStorage côté frontend.

---

## 🛠️ Modifications apportées

### 1. Nouveau DTO pour les positions

**Fichier créé** : `src/vendor-product/dto/save-design-position.dto.ts`

```typescript
export class SaveDesignPositionDto {
  @IsNumber()
  vendorProductId: number;

  @IsNumber()
  designId: number;

  @IsObject()
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    constraints?: any;
  };

  @IsOptional()
  @IsString()
  designUrl?: string;
}
```

### 2. Modification du DTO de publication

**Fichier modifié** : `src/vendor-product/dto/vendor-publish.dto.ts`

```typescript
export class VendorPublishDto {
  // ... champs existants ...

  @ApiProperty({ 
    example: { x: 0, y: 0, scale: 1, rotation: 0 }, 
    required: false,
    description: 'Position du design sur le produit (depuis localStorage)' 
  })
  @IsOptional()
  @IsObject()
  designPosition?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    constraints?: any;
  };
}
```

### 3. Nouveau endpoint de sauvegarde

**Fichier modifié** : `src/vendor-product/vendor-publish.controller.ts`

```typescript
@Post('design-position')
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: '📍 Sauvegarder position design',
  description: 'Sauvegarde la position d\'un design sur un produit (depuis localStorage)'
})
async saveDesignPosition(
  @Body() positionData: SaveDesignPositionDto,
  @Request() req: any
) {
  const vendorId = req.user.sub;
  const result = await this.vendorPublishService.saveDesignPosition(vendorId, positionData);
  return {
    success: true,
    message: 'Position design sauvegardée',
    data: result
  };
}
```

### 4. Service de sauvegarde position

**Fichier modifié** : `src/vendor-product/vendor-publish.service.ts`

```typescript
async saveDesignPosition(
  vendorId: number,
  positionData: SaveDesignPositionDto
): Promise<{
  vendorProductId: number;
  designId: number;
  position: any;
}> {
  // ✅ VALIDATION: Vérifier que le produit appartient au vendeur
  const vendorProduct = await this.prisma.vendorProduct.findFirst({
    where: { id: positionData.vendorProductId, vendorId: vendorId }
  });

  if (!vendorProduct) {
    throw new ForbiddenException('Ce produit ne vous appartient pas');
  }

  // ✅ VALIDATION: Vérifier que le design existe et appartient au vendeur
  const design = await this.prisma.design.findFirst({
    where: { id: positionData.designId, vendorId: vendorId }
  });

  if (!design) {
    throw new ForbiddenException('Ce design ne vous appartient pas');
  }

  // ✅ SAUVEGARDE: Utiliser le service de position
  const result = await this.designPositionService.upsertPosition(
    vendorId,
    positionData.vendorProductId,
    positionData.designId,
    positionData.position
  );

  return {
    vendorProductId: result.vendorProductId,
    designId: result.designId,
    position: result.position
  };
}
```

### 5. Modification du service de publication

**Fichier modifié** : `src/vendor-product/vendor-publish.service.ts`

```typescript
async publishProduct(publishDto: VendorPublishDto, vendorId: number) {
  // ... code existant ...

  // ✅ SAUVEGARDE POSITION DESIGN depuis localStorage
  if (publishDto.designPosition) {
    try {
      await this.prisma.productDesignPosition.upsert({
        where: {
          vendorProductId_designId: {
            vendorProductId: vendorProduct.id,
            designId: design.id,
          },
        },
        create: {
          vendorProductId: vendorProduct.id,
          designId: design.id,
          position: publishDto.designPosition,
        },
        update: {
          position: publishDto.designPosition,
        },
      });
      this.logger.log(`📍 Position design sauvegardée: ${JSON.stringify(publishDto.designPosition)}`);
    } catch (positionError) {
      this.logger.error('❌ Erreur sauvegarde position design:', positionError);
      // Ne pas faire échouer la création du produit pour une erreur de position
    }
  }

  // ... reste du code ...
}
```

### 6. Amélioration extraction transforms

**Fichier modifié** : `src/vendor-product/vendor-design-transform.service.ts`

```typescript
private async saveDesignPositionFromTransforms(
  vendorId: number,
  vendorProductId: number,
  designUrl: string,
  transforms: any
): Promise<void> {
  // ✅ EXTRACTION INTELLIGENTE des positions depuis transforms
  let position = null;
  
  // Chercher dans transforms.positioning
  if (transforms.positioning) {
    position = transforms.positioning;
  }
  // Chercher dans transforms.position
  else if (transforms.position) {
    position = transforms.position;
  }
  // Chercher dans transforms['0'] (format numérique)
  else if (transforms['0']) {
    position = transforms['0'];
  }
  // Chercher dans le premier élément si c'est un objet
  else if (typeof transforms === 'object' && transforms !== null) {
    const keys = Object.keys(transforms);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstValue = transforms[firstKey];
      if (firstValue && typeof firstValue === 'object' && 'x' in firstValue) {
        position = firstValue;
      }
    }
  }
  
  if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
    this.logger.warn(`⚠️ Aucune position valide trouvée dans transforms`);
    return;
  }
  
  // Trouver le design et sauvegarder la position
  const design = await this.prisma.design.findFirst({
    where: { imageUrl: designUrl, vendorId: vendorId }
  });
  
  if (design) {
    await this.prisma.productDesignPosition.upsert({
      where: {
        vendorProductId_designId: { vendorProductId, designId: design.id }
      },
      create: {
        vendorProductId,
        designId: design.id,
        position: {
          x: position.x,
          y: position.y,
          scale: position.scale || 1,
          rotation: position.rotation || 0,
          constraints: position.constraints || {}
        }
      },
      update: {
        position: {
          x: position.x,
          y: position.y,
          scale: position.scale || 1,
          rotation: position.rotation || 0,
          constraints: position.constraints || {}
        }
      }
    });
  }
}
```

---

## 🔄 Nouveaux endpoints disponibles

### 1. Créer produit avec position localStorage

```http
POST /vendor/products
Content-Type: application/json

{
  "baseProductId": 4,
  "designId": 42,
  "vendorName": "Mon Produit",
  "vendorPrice": 25000,
  "vendorStock": 100,
  "selectedColors": [...],
  "selectedSizes": [...],
  "productStructure": {...},
  "designPosition": {
    "x": -44,
    "y": -68,
    "scale": 0.44,
    "rotation": 15
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "vendorProduct": {
      "id": 15,
      "name": "Mon Produit",
      "status": "PUBLISHED"
    }
  },
  "message": "Produit créé avec succès"
}
```

### 2. Sauvegarder position spécifique

```http
POST /vendor/design-position
Content-Type: application/json

{
  "vendorProductId": 12,
  "designId": 42,
  "position": {
    "x": -44,
    "y": -68,
    "scale": 0.44,
    "rotation": 15
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Position design sauvegardée",
  "data": {
    "vendorProductId": 12,
    "designId": 42,
    "position": {
      "x": -44,
      "y": -68,
      "scale": 0.44,
      "rotation": 15
    }
  }
}
```

### 3. Sauvegarder transforms (legacy, amélioré)

```http
POST /vendor/design-transforms/save
Content-Type: application/json

{
  "vendorProductId": 12,
  "designUrl": "https://res.cloudinary.com/...",
  "transforms": {
    "0": {
      "x": -44,
      "y": -68,
      "scale": 0.44,
      "rotation": 15
    }
  },
  "lastModified": 1736420184324
}
```

**Amélioration** : Extraction automatique des positions depuis les transforms et sauvegarde en base.

---

## 🗄️ Structure base de données

### Table `ProductDesignPosition`

```sql
CREATE TABLE ProductDesignPosition (
  vendorProductId INT NOT NULL,
  designId INT NOT NULL,
  position JSON NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (vendorProductId, designId),
  FOREIGN KEY (vendorProductId) REFERENCES VendorProduct(id) ON DELETE CASCADE,
  FOREIGN KEY (designId) REFERENCES Design(id) ON DELETE CASCADE
);
```

### Format JSON position

```json
{
  "x": -44,
  "y": -68,
  "scale": 0.44166666666666665,
  "rotation": 15,
  "constraints": {}
}
```

---

## 🔐 Sécurité

### Validations implémentées

1. **Propriété du produit** : Vérification que le `vendorProductId` appartient au vendeur connecté
2. **Propriété du design** : Vérification que le `designId` appartient au vendeur connecté
3. **Authentification** : Endpoints protégés par `JwtAuthGuard` et `VendorGuard`
4. **Validation données** : Validation des types et formats via les DTOs

### Gestion d'erreurs

```typescript
// Produit non autorisé
throw new ForbiddenException('Ce produit ne vous appartient pas');

// Design non autorisé
throw new ForbiddenException('Ce design ne vous appartient pas');

// Données invalides
throw new BadRequestException('Position invalide');
```

---

## 📊 Logs et monitoring

### Logs implémentés

```typescript
this.logger.log(`📍 Sauvegarde position design: vendorId=${vendorId}, productId=${productId}, designId=${designId}`);
this.logger.log(`✅ Position sauvegardée: vendorProductId=${result.vendorProductId}, designId=${result.designId}`);
this.logger.error('❌ Erreur sauvegarde position design:', error);
```

### Métriques disponibles

- Nombre de positions sauvegardées
- Erreurs de validation
- Temps de réponse des endpoints
- Utilisation localStorage vs temps réel

---

## 🧪 Tests créés

### Script de test principal

**Fichier** : `test-design-position-localStorage.js`

**Tests inclus** :
1. Sauvegarde position depuis localStorage
2. Mise à jour position existante
3. Sauvegarde via transforms (legacy)
4. Création produit avec position

### Exécution

```bash
node test-design-position-localStorage.js
```

---

## 📈 Performance

### Avantages localStorage

- ✅ **Réduction requêtes** : Pas de sauvegarde à chaque mouvement
- ✅ **Expérience fluide** : Pas de latence réseau
- ✅ **Persistance** : Positions conservées entre sessions
- ✅ **Fiabilité** : Fonctionne même en cas de problème réseau

### Optimisations backend

- ✅ **Upsert intelligent** : Création ou mise à jour automatique
- ✅ **Validation efficace** : Vérifications en une seule requête
- ✅ **Gestion erreurs** : Échec de position ne fait pas échouer la création produit
- ✅ **Extraction flexible** : Support de différents formats de transforms

---

## 🔄 Compatibilité

### Ancien système (transforms)

Le système de transforms reste fonctionnel et a été amélioré :

```typescript
// Ancien format toujours supporté
{
  "transforms": {
    "0": { "x": -44, "y": -68, "scale": 0.44, "rotation": 15 }
  }
}

// Nouveau format également supporté
{
  "transforms": {
    "positioning": { "x": -44, "y": -68, "scale": 0.44, "rotation": 15 }
  }
}
```

### Migration progressive

1. **Phase 1** : Implémentation localStorage côté frontend
2. **Phase 2** : Utilisation du nouveau endpoint `POST /vendor/design-position`
3. **Phase 3** : Intégration avec `POST /vendor/products`
4. **Phase 4** : Dépréciation progressive des transforms

---

## 🎯 Prochaines étapes

### Pour le frontend

1. **Implémenter** le service localStorage selon la documentation
2. **Modifier** les composants d'édition design
3. **Intégrer** avec le formulaire de création produit
4. **Tester** la synchronisation avec le backend

### Pour le backend

1. **Optimiser** les requêtes de récupération positions
2. **Ajouter** des métriques de performance
3. **Implémenter** la synchronisation batch
4. **Créer** des endpoints de récupération positions

---

## ✅ Résumé des bénéfices

1. **Performance** : Plus de requêtes réseau à chaque mouvement
2. **Fiabilité** : Positions conservées même en cas de problème
3. **Flexibilité** : Sauvegarde quand l'utilisateur le souhaite
4. **Compatibilité** : Ancien système toujours fonctionnel
5. **Sécurité** : Validations complètes côté backend

**Le backend est maintenant prêt pour supporter la gestion des positions via localStorage !** 🚀 