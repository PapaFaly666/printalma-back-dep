# Guide Backend - Auto-validation des Produits Vendeur

## 📋 Objectif
Implémenter l'auto-validation automatique des VendorProducts lorsque leurs designs associés sont validés par un administrateur.

## 🎯 Règle Métier Principale
**Quand un design est validé → tous les VendorProducts utilisant ce design doivent automatiquement avoir `isValidated = true`**

---

## 🔧 Endpoints à Implémenter

### 1. **Auto-validation spécifique par design** ⭐ PRIORITÉ
```
POST /api/admin/designs/{designId}/auto-validate-products
```

**Description :** Met automatiquement `isValidated = true` pour tous les VendorProducts utilisant le design spécifié.

**Paramètres :**
- `designId` (path parameter) : ID du design qui vient d'être validé

**Logique Backend :**
```sql
-- Exemple de logique SQL
UPDATE vendor_products 
SET isValidated = true, 
    validatedAt = NOW(), 
    validatedBy = -1  -- Indique une validation automatique
WHERE designId = {designId} 
AND isValidated = false;
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Produits auto-validés avec succès",
  "data": {
    "updatedProducts": [
      {
        "id": 123,
        "name": "T-shirt Logo Rouge",
        "isValidated": true,
        "vendorId": 45
      },
      {
        "id": 124,
        "name": "Mug Personnalisé",
        "isValidated": true,
        "vendorId": 45
      }
    ]
  }
}
```

### 2. **Auto-validation globale**
```
POST /api/admin/vendor-products/auto-validate
```

**Description :** Auto-valide tous les VendorProducts où tous les designs associés sont validés.

**Logique Backend :**
```sql
-- Exemple de logique SQL
UPDATE vendor_products 
SET isValidated = true, 
    validatedAt = NOW(), 
    validatedBy = -1
WHERE id IN (
  SELECT vp.id 
  FROM vendor_products vp
  JOIN designs d ON vp.designId = d.id
  WHERE d.isPublished = true
  AND vp.isValidated = false
);
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Auto-validation globale terminée",
  "data": {
    "updated": [
      {
        "id": 123,
        "name": "T-shirt Logo Rouge",
        "vendorId": 45,
        "isValidated": true,
        "validatedAt": "2025-01-15T10:30:00Z",
        "validatedBy": -1
      }
    ]
  }
}
```

### 3. **Statistiques d'auto-validation**
```
GET /api/admin/stats/auto-validation
```

**Description :** Retourne les statistiques de l'auto-validation.

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "autoValidated": 45,      // Produits auto-validés (validatedBy = -1)
    "manualValidated": 23,    // Produits validés manuellement (validatedBy > 0)
    "pending": 12,            // Produits en attente de validation
    "totalValidated": 68      // Total des produits validés
  }
}
```

---

## 🔄 Intégration avec le Workflow Existant

### **Dans l'endpoint de validation des designs**
```
PUT /api/designs/{designId}/validate
```

**Ajouter cette logique après la validation du design :**
```javascript
// Après avoir validé le design avec succès
if (validationAction === 'VALIDATE') {
  // Auto-valider tous les VendorProducts utilisant ce design
  const updatedProducts = await autoValidateProductsForDesign(designId);
  
  return {
    success: true,
    message: "Design validé avec succès",
    data: {
      design: updatedDesign,
      // Inclure les résultats de l'auto-validation
      autoValidation: {
        updatedProducts: updatedProducts,
        count: updatedProducts.length
      }
    }
  };
}
```

---

## 🗄️ Structure de Base de Données

### **Table VendorProducts**
Assurez-vous que la table contient :
```sql
- id (PRIMARY KEY)
- name VARCHAR
- vendorId INT (FK vers users)
- designId INT (FK vers designs) 
- isValidated BOOLEAN DEFAULT false
- validatedAt TIMESTAMP NULL
- validatedBy INT NULL  -- -1 pour auto-validation, >0 pour validation manuelle
```

### **Relations importantes :**
- `VendorProduct.designId → Design.id`
- `Design.isPublished = true` (design validé)

---

## 🎯 Cas d'Usage Frontend

### **Scénario 1 : Validation d'un design**
1. Admin valide un design dans l'interface
2. Frontend appelle `PUT /api/designs/{designId}/validate`
3. Backend valide le design ET auto-valide les VendorProducts associés
4. Frontend affiche : "✅ Design validé + X produits auto-validés"

### **Scénario 2 : Auto-validation manuelle**
1. Admin clique sur "Auto-valider tous les produits éligibles"
2. Frontend appelle `POST /api/admin/vendor-products/auto-validate`
3. Backend scan tous les produits et auto-valide les éligibles
4. Frontend affiche le résultat

---

## ⚡ Points d'Attention

### **Performance**
- Ajouter des index sur `designId` et `isValidated` dans la table VendorProducts
- Limiter les requêtes avec LIMIT si nécessaire

### **Sécurité**
- Vérifier que l'utilisateur est admin avant d'autoriser l'auto-validation
- Logs d'audit pour tracer les auto-validations

### **Validation**
- Vérifier que le design existe avant d'auto-valider
- S'assurer que `validatedBy = -1` pour différencier auto-validation vs validation manuelle

### **Gestion d'Erreurs**
```json
// Erreur 404 si design non trouvé
{
  "success": false,
  "message": "Design non trouvé",
  "error": "DESIGN_NOT_FOUND"
}

// Erreur 403 si pas admin
{
  "success": false,
  "message": "Accès non autorisé",
  "error": "ACCESS_DENIED"
}
```

---

## 🧪 Tests Recommandés

1. **Test fonctionnel :** Valider un design → vérifier que les VendorProducts sont auto-validés
2. **Test edge case :** Design sans VendorProducts associés
3. **Test performance :** Auto-validation avec beaucoup de produits
4. **Test sécurité :** Tentative d'auto-validation par un non-admin

---

## 🚀 Ordre de Priorité d'Implémentation

1. **URGENT :** `POST /api/admin/designs/{designId}/auto-validate-products`
2. **IMPORTANT :** Intégration dans `PUT /api/designs/{designId}/validate`  
3. **MOYEN :** `POST /api/admin/vendor-products/auto-validate`
4. **BONUS :** `GET /api/admin/stats/auto-validation`

---

*Le frontend est déjà prêt et attend ces endpoints pour fonctionner automatiquement.* ✨