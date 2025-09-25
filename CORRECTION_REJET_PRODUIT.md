# ✅ CORRECTION - Problème de rejet de produit

## 🐛 **Problème identifié**

L'erreur dans `ha.md` :
```
Invalid value for argument `status`. Expected VendorProductStatus.
```

**Cause** : L'enum `VendorProductStatus` dans le schéma Prisma ne contenait pas la valeur `REJECTED`.

## 🔧 **Corrections apportées**

### 1. **Ajout de REJECTED à l'enum Prisma** (`prisma/schema.prisma:634`)

```prisma
enum VendorProductStatus {
  PUBLISHED
  DRAFT
  PENDING
  REJECTED  // ← AJOUTÉ
}
```

### 2. **Logique de rejet ajustée** (`vendor-product-validation.service.ts:538`)

```typescript
const newStatus = approved
  ? (product.postValidationAction === 'AUTO_PUBLISH' ? 'PUBLISHED' : 'DRAFT')
  : 'PENDING'; // Reste PENDING si rejeté, le rejectionReason indique le rejet
```

**Pourquoi PENDING ?** Le produit reste techniquement "en attente" mais avec `rejectionReason` rempli pour indiquer le rejet.

### 3. **Nouveaux champs de détection** (`admin-wizard-validation.controller.ts:276-290`)

```typescript
// 🆕 CHAMPS DE DÉTECTION DU REJET ET STATUT
isRejected: !!(product.rejectionReason && product.rejectionReason.trim() !== '') || product.status === 'REJECTED',
rejectionReason: product.rejectionReason || null,
rejectedAt: product.rejectionReason ? (product.updatedAt ? product.updatedAt.toISOString() : null) : null,

// 🆕 STATUT FINAL CALCULÉ
finalStatus: (() => {
  if (product.status === 'REJECTED' || (product.rejectionReason && product.rejectionReason.trim() !== '')) {
    return 'REJECTED';
  }
  if (isWizardProduct) {
    return product.adminValidated ? 'APPROVED' : 'PENDING';
  } else {
    return product.isValidated ? 'APPROVED' : 'PENDING';
  }
})(),
```

### 4. **Logique de filtrage mise à jour** (`vendor-product-validation.service.ts:360-370`)

```typescript
} else if (status === 'REJECTED') {
  // Produits rejetés: ceux avec rejectionReason ET/OU status REJECTED
  where.OR = [
    // Produits avec rejectionReason (ancienne logique)
    {
      rejectionReason: { not: null }
    },
    // Produits avec status REJECTED (nouvelle logique)
    {
      status: 'REJECTED'
    }
  ];
```

## 🎯 **Tests des endpoints**

### **Rejeter un produit WIZARD :**
```bash
curl -X 'POST' \
  'http://localhost:3004/admin/products/176/validate' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
  "approved": false,
  "rejectionReason": "Images de mauvaise qualité"
}'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Produit WIZARD rejeté avec succès",
  "productId": 176,
  "newStatus": "PENDING",
  "validatedAt": "2025-09-24T..."
}
```

### **Voir les produits rejetés :**
```bash
curl -X 'GET' \
  'http://localhost:3004/admin/products/validation?productType=WIZARD&status=REJECTED' \
  -H 'Authorization: Bearer TOKEN'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 176,
        "adminValidated": false,
        "isRejected": true,
        "rejectionReason": "Images de mauvaise qualité",
        "rejectedAt": "2025-09-24T...",
        "finalStatus": "REJECTED",
        "status": "PENDING"
      }
    ]
  }
}
```

## 📋 **Modifications des fichiers**

1. ✅ `prisma/schema.prisma` - Ajout REJECTED à l'enum
2. ✅ `src/vendor-product/vendor-product-validation.service.ts` - Logique de rejet
3. ✅ `src/vendor-product/admin-wizard-validation.controller.ts` - Nouveaux champs
4. ✅ **Base de données synchronisée** avec `npx prisma db push`

## 🎉 **Résultat**

- ✅ L'endpoint de rejet fonctionne maintenant
- ✅ Les produits rejetés sont détectables via `isRejected: true`
- ✅ Le filtrage `status=REJECTED` fonctionne
- ✅ Les champs `rejectionReason` et `rejectedAt` sont disponibles
- ✅ Le `finalStatus` calculé indique correctement 'REJECTED'

Le problème de l'erreur Prisma est maintenant résolu ! 🚀