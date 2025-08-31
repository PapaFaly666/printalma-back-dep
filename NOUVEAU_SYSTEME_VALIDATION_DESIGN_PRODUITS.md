# Nouveau Système de Validation Design → VendorProduct

## 📋 Résumé des Modifications

### Problème Initial
Vous vouliez que les statuts des produits vendeur (VendorProduct) reflètent directement l'état de validation du design associé :
- Si le design est validé par l'admin → produits "VALIDATED" 
- Si le design n'est pas encore validé → produits "PENDING"

### Solution Implémentée

## 🔧 Modifications du Schéma de Base de Données

### 1. Enum `PublicationStatus` Étendu
```prisma
enum PublicationStatus {
  PUBLISHED    // Ancien statut conservé
  DRAFT        // Ancien statut conservé  
  PENDING      // ✅ NOUVEAU: En attente de validation du design
  VALIDATED    // ✅ NOUVEAU: Design validé par l'admin
}
```

### 2. Relation VendorProduct ↔ Design
Le modèle `VendorProduct` a déjà le champ `designId` qui le lie au design utilisé.

## 🎯 Workflow Automatisé

### 1. Création d'un Design
```typescript
// Design créé → statut: isDraft = true
const design = await designService.createDesign(vendorId, designData, file);
```

### 2. Soumission pour Validation
```typescript
// Vendeur soumet le design pour validation
await designService.submitForValidation(designId, vendorId);

// 🆕 AUTOMATIQUE: Tous les VendorProducts liés passent en PENDING
await prisma.vendorProduct.updateMany({
  where: { designId },
  data: { 
    status: PublicationStatus.PENDING,
    submittedForValidationAt: new Date()
  }
});
```

### 3. Validation par l'Admin
```typescript
// Admin approuve le design
await designService.validateDesign(designId, adminId, true);

// 🆕 AUTOMATIQUE: Tous les VendorProducts liés passent en VALIDATED
await prisma.vendorProduct.updateMany({
  where: { designId },
  data: { 
    status: PublicationStatus.VALIDATED,
    isValidated: true,
    validatedAt: new Date(),
    validatedBy: adminId
  }
});
```

### 4. Rejet par l'Admin
```typescript
// Admin rejette le design
await designService.validateDesign(designId, adminId, false, "Raison du rejet");

// 🆕 AUTOMATIQUE: Tous les VendorProducts liés repassent en DRAFT
await prisma.vendorProduct.updateMany({
  where: { designId },
  data: { 
    status: PublicationStatus.DRAFT,
    isValidated: false,
    rejectionReason: "Raison du rejet"
  }
});
```

## 📊 Logique de Création de Produits

### Nouveau Produit avec Design Existant
```typescript
// Vérification du statut du design avant création
const design = await prisma.design.findUnique({ where: { id: designId } });

if (!design.isValidated) {
  // Design non validé → produit en PENDING
  productStatus = PublicationStatus.PENDING;
} else {
  // Design validé → produit en VALIDATED
  productStatus = PublicationStatus.VALIDATED;
}
```

### Nouveau Produit avec Nouveau Design
```typescript
// Design nouveau (upload direct) → toujours en attente
productStatus = PublicationStatus.PENDING;
needsValidation = true;
```

## 🔄 États des Statuts

| Statut VendorProduct | Signification | Condition |
|---------------------|---------------|-----------|
| `DRAFT` | Brouillon | Design rejeté par admin |
| `PENDING` | En attente | Design soumis mais pas encore validé |
| `VALIDATED` | Validé | Design approuvé par admin |
| `PUBLISHED` | Publié | Ancien statut (conservé pour compatibilité) |

## 📁 Fichiers Modifiés

### 1. `prisma/schema.prisma`
```diff
enum PublicationStatus {
  PUBLISHED
  DRAFT
+ PENDING      // En attente de validation du design
+ VALIDATED    // Design validé par l'admin
}
```

### 2. `src/design/design.service.ts`
- ✅ Méthode `submitForValidation()` : Met les VendorProducts en PENDING
- ✅ Méthode `validateDesign()` : Met les VendorProducts en VALIDATED ou DRAFT

### 3. `src/vendor-product/vendor-publish.service.ts`
- ✅ Méthode `publishProduct()` : Détermine le statut selon la validation du design
- ✅ Logique mise à jour : VALIDATED au lieu de PUBLISHED, PENDING au lieu de DRAFT

## 🎉 Avantages du Système

### 1. Synchronisation Automatique
- ✅ Un design validé → tous les produits qui l'utilisent deviennent automatiquement VALIDATED
- ✅ Un design rejeté → tous les produits repassent en DRAFT pour révision

### 2. Workflow Transparent
- ✅ Les vendeurs voient clairement l'état : "En attente de validation design"
- ✅ Les admins valident une seule fois le design, tous les produits suivent

### 3. Gestion Cohérente
- ✅ Impossible d'avoir des produits "validés" avec un design "non validé"
- ✅ Statuts toujours cohérents entre Design et VendorProduct

## 🔍 Vérification du Système

### Endpoints Disponibles
```
POST /api/designs/:id/submit-for-validation    # Vendeur soumet design
GET  /api/designs/admin/pending                # Admin voit designs en attente  
POST /api/designs/:id/validate                 # Admin valide/rejette design
GET  /api/vendor/products                      # Voir statuts des produits
```

### Statuts à Vérifier
1. Créer un design → `isDraft: true`
2. Soumettre pour validation → `isPending: true`
3. Créer produit avec ce design → `status: "PENDING"`
4. Admin valide design → `isValidated: true` 
5. Vérifier produit → `status: "VALIDATED"`

## 🚀 Prochaines Étapes

### Pour le Frontend
1. **Affichage des Statuts**
   ```jsx
   function ProductStatusBadge({ product }) {
     switch(product.status) {
       case 'PENDING': return <Badge color="yellow">⏳ En attente validation</Badge>;
       case 'VALIDATED': return <Badge color="green">✅ Validé</Badge>;
       case 'DRAFT': return <Badge color="gray">📝 Brouillon</Badge>;
     }
   }
   ```

2. **Notifications en Temps Réel**
   ```javascript
   // WebSocket pour notifier la validation
   socket.on('design.validated', (payload) => {
     // Rafraîchir la liste des produits
     refetchProducts();
   });
   ```

### Pour l'Admin
1. **Dashboard de Validation**
   - Liste des designs en attente avec nb de produits impactés
   - Validation en un clic avec effet sur tous les produits liés

### Pour le Vendeur  
1. **Interface de Suivi**
   - Voir le statut du design et des produits associés
   - Notification email quand design validé/rejeté

## 💡 Exemple Complet

```typescript
// 1. Vendeur crée un design
const design = await createDesign(vendorId, designData);
// → design.isDraft = true

// 2. Vendeur soumet pour validation  
await submitForValidation(design.id, vendorId);
// → design.isPending = true

// 3. Vendeur crée des produits avec ce design
const product1 = await createProduct({ designId: design.id, ... });
const product2 = await createProduct({ designId: design.id, ... });
// → product1.status = "PENDING", product2.status = "PENDING"

// 4. Admin valide le design
await validateDesign(design.id, adminId, true);
// → design.isValidated = true
// → product1.status = "VALIDATED", product2.status = "VALIDATED" (automatique)

// 5. Les produits sont maintenant disponibles à la vente !
```

## ✅ Résultat Final

**Avant** : Statuts incohérents, validation manuelle de chaque produit
**Après** : Synchronisation automatique, validation centralisée par design

🎯 **Mission accomplie** : Les statuts des VendorProducts reflètent directement l'état de validation du design associé ! 