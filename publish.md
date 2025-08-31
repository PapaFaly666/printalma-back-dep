# 🚨 PROMPT BACKEND URGENT - Endpoint Publication Produit Vendeur

## 📋 CONTEXTE

Le frontend PrintAlma appelle l'endpoint suivant qui retourne une erreur **404 (Not Found)** :

```
PATCH http://localhost:3004/vendor/products/122/publish
```

**Erreur actuelle :** `404 (Not Found)`

**Impact :** Les vendeurs ne peuvent pas publier leurs produits depuis l'interface.

---

## 🎯 TÂCHE À IMPLÉMENTER

### **Endpoint Requis :**
```
PATCH /vendor/products/:id/publish
```

### **Fonctionnalité :**
Changer le statut d'un produit vendeur de `DRAFT` ou `PENDING` vers `PUBLISHED`

---

## 🔧 IMPLÉMENTATION REQUISE

### **1. Créer/Modifier `routes/vendor.js`**

```javascript
// routes/vendor.js
const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticateVendor } = require('../middleware/auth');

// ✅ AJOUTER CETTE ROUTE
router.patch('/products/:id/publish', authenticateVendor, vendorController.publishProduct);

// ... autres routes existantes ...

module.exports = router;
```

### **2. Créer/Modifier `controllers/vendorController.js`**

```javascript
// controllers/vendorController.js
const VendorProduct = require('../models/VendorProduct');

/**
 * 🚀 PUBLICATION D'UN PRODUIT VENDEUR
 * PATCH /vendor/products/:id/publish
 */
exports.publishProduct = async (req, res) => {
  try {
    console.log('🚀 === PUBLICATION PRODUIT VENDEUR ===');
    
    const { id } = req.params;
    const vendorId = req.user.id; // Récupéré du middleware d'authentification
    
    console.log('📋 Paramètres:', { productId: id, vendorId });
    
    // Validation des paramètres
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de produit invalide'
      });
    }
    
    const productId = Number(id);
    
    // Récupération du produit
    const product = await VendorProduct.findOne({
      where: {
        id: productId,
        vendorId: vendorId
      }
    });
    
    if (!product) {
      console.log('❌ Produit non trouvé:', { productId, vendorId });
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé ou accès refusé'
      });
    }
    
    console.log('📦 Produit trouvé:', {
      id: product.id,
      status: product.status,
      vendorId: product.vendorId
    });
    
    // Vérification du statut actuel
    if (product.status === 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        message: 'Le produit est déjà publié'
      });
    }
    
    if (product.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de publier un produit rejeté'
      });
    }
    
    // Mise à jour du statut
    const previousStatus = product.status;
    const newStatus = 'PUBLISHED';
    
    await product.update({
      status: newStatus,
      publishedAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Statut mis à jour:', {
      productId,
      previousStatus,
      newStatus,
      publishedAt: product.publishedAt
    });
    
    // Réponse de succès
    res.json({
      success: true,
      message: 'Produit publié avec succès',
      product: {
        id: product.id,
        name: product.vendorName,
        status: product.status,
        publishedAt: product.publishedAt
      },
      previousStatus,
      newStatus
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la publication:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur technique'
    });
  }
};
```

### **3. Modifier `app.js` ou `server.js`**

```javascript
// app.js ou server.js
const vendorRoutes = require('./routes/vendor');

// ✅ AJOUTER CETTE LIGNE
app.use('/vendor', vendorRoutes);

console.log('✅ Routes vendeur configurées sur /vendor');
```

---

## 📁 FICHIERS À CRÉER/MODIFIER

- [ ] **`routes/vendor.js`** - Ajouter la route PATCH
- [ ] **`controllers/vendorController.js`** - Ajouter la fonction publishProduct
- [ ] **`app.js` ou `server.js`** - Ajouter app.use('/vendor', vendorRoutes)

---

## 🔐 AUTHENTIFICATION

L'endpoint utilise le middleware `authenticateVendor` qui :
- Vérifie le token JWT dans le header `Authorization: Bearer <token>`
- Vérifie que l'utilisateur a le rôle `VENDOR`
- Ajoute `req.user` avec les informations de l'utilisateur

---

## 🧪 TEST RAPIDE

### **Après implémentation, tester avec :**

```bash
# Test simple avec curl
curl -X PATCH \
  http://localhost:3004/vendor/products/122/publish \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

### **Résultat attendu :**
```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "product": {
    "id": 122,
    "name": "Nom du Produit",
    "status": "PUBLISHED",
    "publishedAt": "2024-01-15T10:30:00.000Z"
  },
  "previousStatus": "DRAFT",
  "newStatus": "PUBLISHED"
}
```

---

## 🚨 POINTS CRITIQUES

1. **Route exacte :** `/vendor/products/:id/publish` (pas `/api/vendor/...`)
2. **Méthode HTTP :** `PATCH` (pas PUT ou POST)
3. **Authentification :** Middleware `authenticateVendor` obligatoire
4. **Validation :** Vérifier que le produit appartient au vendeur connecté
5. **Statuts :** Seuls `DRAFT` et `PENDING` peuvent devenir `PUBLISHED`

---

## ✅ VÉRIFICATION FINALE

Après implémentation :
- [ ] L'endpoint répond (plus d'erreur 404)
- [ ] L'authentification fonctionne
- [ ] Le statut du produit passe à `PUBLISHED`
- [ ] Le frontend peut publier les produits

---

## 📞 SUPPORT

**Fichiers de référence créés :**
- `GUIDE_BACKEND_ENDPOINT_PUBLISH_VENDOR_PRODUCT.md` - Guide complet
- `GUIDE_DEMARRAGE_RAPIDE_BACKEND.md` - Implémentation en 5 minutes
- `test-publish-endpoint.cjs` - Script de test automatisé

**Temps estimé :** 10-15 minutes

**Priorité :** 🔴 URGENTE - Bloque la publication des produits vendeur

---

## 🎯 RÉSULTAT ATTENDU

**AVANT :** `PATCH /vendor/products/122/publish` → 404 (Not Found)

**APRÈS :** `PATCH /vendor/products/122/publish` → 200 OK + Produit publié

---

**L'équipe backend doit implémenter cet endpoint pour résoudre l'erreur 404 et permettre la publication des produits vendeur depuis le frontend.**
