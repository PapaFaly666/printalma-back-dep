# 🎨 Système de Personnalisation de Produits - README

## 📋 Vue d'ensemble

Système complet de sauvegarde et gestion des personnalisations de produits côté backend.

**Statut:** ✅ Implémentation complète et fonctionnelle  
**Date:** 13 janvier 2025  
**Version:** 1.0.0

---

## 🚀 Démarrage rapide

### 1. Démarrer le serveur
```bash
npm run start:dev
```

### 2. Tester les endpoints
```bash
./test-customization.sh
```

### 3. Consulter la documentation
- **API complète:** [CUSTOMIZATION_API.md](./CUSTOMIZATION_API.md)
- **Intégration frontend:** [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
- **Résumé technique:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| [CUSTOMIZATION_API.md](./CUSTOMIZATION_API.md) | Guide complet de l'API avec exemples cURL |
| [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) | Guide d'intégration frontend React |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Résumé technique de l'implémentation |
| [FILES_CREATED.md](./FILES_CREATED.md) | Liste exhaustive des fichiers créés/modifiés |

---

## 🎯 Fonctionnalités

### ✅ Implémentées

- [x] **Sauvegarde de personnalisations** - Design éléments (texte, images)
- [x] **Support guest + utilisateur** - SessionId pour invités, userId pour connectés
- [x] **Upsert intelligent** - Pas de doublons, mise à jour automatique
- [x] **Calcul automatique du prix** - Quantité × prix produit
- [x] **API REST complète** - 6 endpoints (CRUD + liste)
- [x] **Authentification optionnelle** - Endpoints mixtes guest/user
- [x] **Relations BDD** - Product, User, Order
- [x] **Documentation exhaustive** - 4 fichiers de doc

### 🔄 Futures (optionnelles)

- [ ] Génération de mockups côté backend
- [ ] Cache Redis pour performances
- [ ] Nettoyage automatique des brouillons
- [ ] Page dashboard "Mes personnalisations"
- [ ] Export PDF des personnalisations

---

## 🛠️ Endpoints API

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/customizations` | Opt. | Sauvegarder une personnalisation |
| GET | `/customizations/:id` | Non | Récupérer par ID |
| GET | `/customizations/user/me` | Oui | Liste utilisateur connecté |
| GET | `/customizations/session/:sessionId` | Non | Liste session guest |
| PUT | `/customizations/:id` | Opt. | Mettre à jour |
| DELETE | `/customizations/:id` | Opt. | Supprimer |

**Base URL:** `http://localhost:3004`

**Swagger UI:** `http://localhost:3004/api` (quand le serveur est démarré)

---

## 📦 Exemple d'utilisation

### Créer une personnalisation (guest)

```bash
curl -X POST http://localhost:3004/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 1,
        "text": "Hello World",
        "fontSize": 24,
        "baseFontSize": 24,
        "baseWidth": 200,
        "fontFamily": "Arial",
        "color": "#000000",
        "fontWeight": "normal",
        "fontStyle": "normal",
        "textDecoration": "none",
        "textAlign": "center",
        "curve": 0
      }
    ],
    "sessionId": "guest-test-123"
  }'
```

### Récupérer les personnalisations

```bash
curl http://localhost:3004/customizations/session/guest-test-123
```

---

## 🏗️ Architecture

### Structure des fichiers
```
src/customization/
├── customization.service.ts       # Logique métier
├── customization.controller.ts    # Endpoints REST
├── customization.module.ts        # Module NestJS
└── dto/
    └── create-customization.dto.ts # Validation

src/auth/
└── optional-jwt-auth.guard.ts     # Auth optionnelle

prisma/
└── schema.prisma                  # Modèle ProductCustomization
```

### Base de données

**Table:** `product_customizations`

**Colonnes principales:**
- `id` - Clé primaire
- `user_id` - Utilisateur connecté (nullable)
- `session_id` - Session guest (nullable)
- `product_id` - Produit personnalisé
- `color_variation_id` - Couleur choisie
- `view_id` - Vue choisie (Front/Back)
- `design_elements` - JSON des éléments (texte, images)
- `size_selections` - JSON des tailles/quantités
- `total_price` - Prix calculé automatiquement
- `status` - draft, saved, ordered
- `order_id` - Lien avec commande (nullable)

**Index:** userId, sessionId, productId, status

---

## 🔐 Authentification

### Deux modes supportés

1. **Guest (invité)**
   - Pas de token JWT
   - Utilise `sessionId` généré côté frontend
   - Personnalisations liées au `sessionId`

2. **Utilisateur connecté**
   - Token JWT dans header `Authorization: Bearer TOKEN`
   - Personnalisations liées au `userId`
   - `sessionId` ignoré

---

## 🧪 Tests

### Script de test automatique
```bash
./test-customization.sh
```

### Test manuel
```bash
# 1. Créer
curl -X POST http://localhost:3004/customizations -H "Content-Type: application/json" -d '{...}'

# 2. Lister
curl http://localhost:3004/customizations/session/guest-123

# 3. Récupérer par ID
curl http://localhost:3004/customizations/1

# 4. Mettre à jour
curl -X PUT http://localhost:3004/customizations/1 -H "Content-Type: application/json" -d '{...}'

# 5. Supprimer
curl -X DELETE http://localhost:3004/customizations/1
```

---

## 🎨 Intégration Frontend

### Étape 1: Créer le service

Créer `frontend/src/services/customizationService.ts` (voir [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md))

### Étape 2: Modifier la page de personnalisation

Intégrer les appels API dans:
- `handleSave()` - Sauvegarder le design
- `handleAddToCart()` - Sauvegarder + ajouter au panier
- `useEffect()` - Charger le design existant

### Étape 3: Générer sessionId unique

```typescript
const sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
localStorage.setItem('guest-session-id', sessionId);
```

**Guide complet:** [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)

---

## 📝 Notes importantes

1. **SessionId obligatoire pour guests** - Générer côté frontend, stocker en localStorage
2. **Upsert automatique** - Une seule personnalisation draft par produit/user/session
3. **Prix calculé automatiquement** - Backend calcule: quantité × prix_produit
4. **JSON pour design elements** - Supporte texte, images, et futurs types
5. **Relations préchargées** - Les endpoints incluent product, colorVariations, images

---

## 🐛 Résolution de problèmes

### Serveur ne démarre pas
```bash
# Vérifier les dépendances
npm install

# Régénérer Prisma
npx prisma generate

# Vérifier la connexion BDD
npx prisma db push
```

### Erreurs TypeScript
```bash
npx tsc --noEmit
```

### Tests échouent
```bash
# Vérifier que le serveur tourne
lsof -ti:3004

# Démarrer le serveur
npm run start:dev
```

---

## 🔧 Commandes utiles

```bash
# Développement
npm run start:dev              # Démarrer en mode dev

# Build
npm run build                  # Compiler pour production
npm run start:prod             # Démarrer en production

# Base de données
npx prisma generate            # Régénérer le client
npx prisma db push             # Synchroniser le schéma
npx prisma studio              # Interface admin BDD

# Tests
./test-customization.sh        # Tester les endpoints
npx tsc --noEmit               # Vérifier TypeScript
```

---

## 📊 Statistiques

- **Fichiers créés:** 9
- **Fichiers modifiés:** 2
- **Lignes de code:** ~800+
- **Endpoints API:** 6
- **Documentation:** 4 fichiers
- **Table BDD:** 1 (product_customizations)
- **Index BDD:** 4

---

## 🎉 Conclusion

**Système de personnalisation 100% fonctionnel**

✅ Backend complet  
✅ API REST documentée  
✅ Support guest + utilisateur  
✅ Base de données optimisée  
✅ Guides d'intégration  
✅ Scripts de test  

**Prochaine étape:** Intégration frontend (voir [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md))

---

## 📞 Support

**Documentation:**
- [CUSTOMIZATION_API.md](./CUSTOMIZATION_API.md) - API complète
- [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) - Intégration frontend
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Résumé technique
- [FILES_CREATED.md](./FILES_CREATED.md) - Liste des fichiers

**Swagger UI:** http://localhost:3004/api

**Test rapide:** `./test-customization.sh`

---

**Développé le:** 13 janvier 2025  
**Version:** 1.0.0  
**Statut:** ✅ Production Ready
