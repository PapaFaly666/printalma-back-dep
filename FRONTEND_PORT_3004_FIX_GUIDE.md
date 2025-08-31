# 🔧 Guide Frontend - Correction Port 3004

## 🚨 **Problème Identifié**

Le frontend utilise le **port 3004** mais avec le mauvais endpoint :

### **❌ URL Actuelle (Erreur 404)**
```
GET http://localhost:3004/api/products?isReadyProduct=true
```

### **✅ URL Correcte (Fonctionne)**
```
GET http://localhost:3004/products?isReadyProduct=true
```

## 🔍 **Diagnostic Complet**

### **Port 3004 - Serveur Actif**
- ✅ `GET /products?isReadyProduct=true` → **6 produits prêts**
- ✅ `GET /products?forVendorDesign=true` → **4 mockups avec délimitations**
- ❌ `GET /api/products?isReadyProduct=true` → **404** (pas de préfixe `/api`)

### **Port 5174 - Backend NestJS**
- ✅ `GET /api/products?isReadyProduct=true` → **6 produits prêts**
- ✅ `GET /api/products?forVendorDesign=true` → **4 mockups avec délimitations**
- ❌ `GET /products?isReadyProduct=true` → **0 produits** (préfixe `/api` requis)

## 🎯 **Solutions**

### **Option 1: Corriger le Frontend (Recommandée)**

#### **1.1. Trouver le fichier de configuration API**
```bash
# Chercher les fichiers de configuration
find . -name "*.ts" -o -name "*.js" | grep -E "(api|config|service)"
```

#### **1.2. Corriger l'URL de base**
```typescript
// ❌ Avant
const API_BASE = 'http://localhost:3004/api';

// ✅ Après
const API_BASE = 'http://localhost:3004';
```

#### **1.3. Corriger les endpoints**
```typescript
// ❌ Avant
const response = await fetch(`${API_BASE}/products?isReadyProduct=true`);

// ✅ Après
const response = await fetch(`${API_BASE}/products?isReadyProduct=true`);
```

### **Option 2: Configurer un Proxy**

#### **2.1. Dans le frontend (vite.config.js ou package.json)**
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
}
```

#### **2.2. Ou dans package.json**
```json
{
  "proxy": "http://localhost:3004"
}
```

### **Option 3: Changer le Port du Backend**

#### **3.1. Modifier le port dans main.ts**
```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3004); // Changer de 5174 à 3004
}
```

## 🔧 **Fichiers à Modifier**

### **1. apiHelpers.ts**
```typescript
// ❌ Avant
const API_BASE = 'http://localhost:3004/api';

// ✅ Après
const API_BASE = 'http://localhost:3004';
```

### **2. ReadyProductsPage.tsx**
```typescript
// ❌ Avant
const fetchReadyProducts = async () => {
  const response = await fetch(`${API_BASE}/products?isReadyProduct=true`);
};

// ✅ Après
const fetchReadyProducts = async () => {
  const response = await fetch(`${API_BASE}/products?isReadyProduct=true`);
};
```

### **3. Autres fichiers utilisant l'API**
```typescript
// Chercher et remplacer toutes les occurrences
// De: http://localhost:3004/api/
// Vers: http://localhost:3004/
```

## 🧪 **Tests de Validation**

### **Test 1: Vérifier l'endpoint corrigé**
```bash
curl "http://localhost:3004/products?isReadyProduct=true"
```

### **Test 2: Vérifier les mockups avec délimitations**
```bash
curl "http://localhost:3004/products?forVendorDesign=true"
```

### **Test 3: Test complet avec le script**
```bash
node test-product-filtering-port.js
```

## 📋 **Checklist de Correction**

- [ ] **Identifier le fichier de configuration API** (apiHelpers.ts, config.ts, etc.)
- [ ] **Changer l'URL de base** de `/api` vers `/`
- [ ] **Vérifier tous les endpoints** dans le frontend
- [ ] **Tester les endpoints** après modification
- [ ] **Vérifier que les produits prêts** s'affichent correctement
- [ ] **Vérifier que les mockups avec délimitations** s'affichent correctement

## 🎯 **Endpoints Corrects pour le Frontend**

### **Produits Prêts**
```
GET http://localhost:3004/products?isReadyProduct=true
```

### **Mockups avec Délimitations (pour /sell-design)**
```
GET http://localhost:3004/products?forVendorDesign=true
```

### **Mockups avec Délimitations (alternative)**
```
GET http://localhost:3004/products?isReadyProduct=false&hasDelimitations=true
```

### **Recherche de Produits**
```
GET http://localhost:3004/products?search=tshirt&isReadyProduct=true
```

### **Filtrage par Catégorie**
```
GET http://localhost:3004/products?category=tshirt&isReadyProduct=true
```

## 🚀 **Résultat Attendu**

Après correction, le frontend devrait :

1. ✅ **Afficher les produits prêts** dans `/ready-products`
2. ✅ **Afficher les mockups avec délimitations** dans `/sell-design`
3. ✅ **Filtrer correctement** selon les paramètres
4. ✅ **Ne plus avoir d'erreur 404**

## 🔍 **Debug et Monitoring**

### **Logs Frontend**
```javascript
console.log('🔍 Frontend - URL:', `${API_BASE}/products?isReadyProduct=true`);
console.log('🔍 Frontend - Response:', response.data);
```

### **Logs Backend**
```javascript
console.log('🔍 Backend - Request received:', req.url);
console.log('🔍 Backend - Query params:', req.query);
```

Le problème est maintenant identifié et la solution est claire ! 🎉 