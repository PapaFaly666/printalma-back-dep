# ✅ Guide de Test – Correction ForcedStatus et Cascade Validation

> **Problème résolu** : Les produits créés avec "Mettre en brouillon" (`forcedStatus: "DRAFT"`) passaient incorrectement en `status: "PUBLISHED"` après validation du design.

---

## 🔧 Corrections apportées

### 1. **Ajout champ `forcedStatus` dans Prisma**
```prisma
model VendorProduct {
  // ... autres champs ...
  status        PublicationStatus  @default(DRAFT)
  forcedStatus  PublicationStatus  @default(DRAFT)  // 🆕 NOUVEAU
  // ... autres champs ...
}
```

### 2. **Correction de `submitForValidation`**
```ts
// ❌ AVANT (incorrect)
await this.prisma.vendorProduct.updateMany({
  where: { designId: id },
  data: { status: PublicationStatus.PENDING }  // Tous en PENDING !
});

// ✅ APRÈS (correct)
// Produits PENDING → passent en PENDING
await this.prisma.vendorProduct.updateMany({
  where: { designId: id, forcedStatus: PublicationStatus.PENDING },
  data: { status: PublicationStatus.PENDING }
});

// Produits DRAFT → restent DRAFT
await this.prisma.vendorProduct.updateMany({
  where: { designId: id, forcedStatus: PublicationStatus.DRAFT },
  data: { submittedForValidationAt: new Date() }  // Pas de changement de status
});
```

### 3. **Correction de la cascade validation**
```ts
if (isApproved) {
  // Produits avec forcedStatus = PENDING → passent en PUBLISHED
  await this.prisma.vendorProduct.updateMany({
    where: { designId: id, forcedStatus: PublicationStatus.PENDING },
    data: { status: PublicationStatus.PUBLISHED, isValidated: true }
  });

  // 🚀 Produits avec forcedStatus = DRAFT → restent DRAFT, juste validés
  await this.prisma.vendorProduct.updateMany({
    where: { designId: id, forcedStatus: PublicationStatus.DRAFT },
    data: { isValidated: true }  // PAS de changement de status !
  });
}
```

---

## 🧪 Plan de test

### **Test 1 : Création produit "Mettre en brouillon"**
1. Créer un design
2. Créer un produit avec `forcedStatus: "DRAFT"`
3. **Vérifier DB** :
   ```sql
   SELECT id, status, forced_status, is_validated 
   FROM vendor_products WHERE design_id = [design_id];
   ```
   **Attendu** : `status = DRAFT, forced_status = DRAFT, is_validated = false`

### **Test 2 : Soumission design pour validation**  
1. Appeler `POST /api/designs/:id/submit-for-validation`
2. **Vérifier DB** :
   **Attendu** : `status = DRAFT` (inchangé), `submitted_for_validation_at` mis à jour

### **Test 3 : Validation design par admin**
1. Appeler `PUT /api/designs/:id/validate` avec `action: "VALIDATE"`
2. **Vérifier DB** :
   **Attendu** : `status = DRAFT, is_validated = true`

### **Test 4 : Frontend affichage**
1. Appeler `GET /api/vendor/products`
2. **Vérifier réponse** :
   ```json
   {
     "id": 80,
     "status": "DRAFT",
     "forcedStatus": "DRAFT", 
     "isValidated": true,
     "designValidationStatus": "VALIDATED"
   }
   ```

---

## 🎯 Résultat attendu côté frontend
Après validation design, pour un produit créé avec "Mettre en brouillon" :

| Champ backend | Valeur | Frontend affiche |
|---------------|--------|------------------|
| `status` | `"DRAFT"` | Badge "Brouillon" |
| `isValidated` | `true` | ✅ Indicateur validé |
| `designValidationStatus` | `"VALIDATED"` | Design approuvé |
| **Bouton** | - | **"Publier maintenant" visible** |

---

## 📝 Commandes de test rapide

```bash
# 1. Vérifier un produit spécifique
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/vendor/products/$PRODUCT_ID

# 2. Créer produit brouillon
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"forcedStatus": "DRAFT", ...}' \
  http://localhost:3004/api/vendor/sell-design

# 3. Valider design
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "VALIDATE"}' \
  http://localhost:3004/api/designs/$DESIGN_ID/validate
```

---

## ✅ Checklist validation

- [ ] Client Prisma régénéré (`npx prisma generate`)
- [ ] Base de données mise à jour (`npx prisma db push`)
- [ ] Compilation TypeScript sans erreur (`npx tsc --noEmit`)
- [ ] Test création produit brouillon
- [ ] Test validation design → statut produit correct
- [ ] Frontend affiche bouton "Publier" pour brouillons validés

🎉 **La correction respecte maintenant l'intention initiale du vendeur : brouillon → brouillon validé → publication manuelle !** 