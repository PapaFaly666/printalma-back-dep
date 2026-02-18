# Documentation PrintAlma Backend

## Navigation Rapide 🗂️

### Configuration de Paiement Paydunya

#### Pour les Développeurs Frontend 💻

1. **[Démarrage Rapide (5 min)](FRONTEND_PAYMENT_QUICKSTART.md)** ⭐
   - Intégration en 3 minutes
   - Hook React prêt à l'emploi
   - Composant admin copy-paste
   - **Commencez ici si vous voulez démarrer rapidement !**

2. **[Guide API Complet](FRONTEND_PAYMENT_CONFIG_API.md)**
   - Tous les endpoints en détail
   - Exemples de requêtes/réponses
   - Code React complet
   - Gestion des erreurs
   - Interface admin complète

3. **[Exemples Multi-Frameworks](FRONTEND_PAYMENT_EXAMPLES.md)**
   - React (TypeScript & JavaScript)
   - Vue 3 (Composition & Options API)
   - Angular
   - Next.js
   - Vanilla JavaScript

4. **[Référence Endpoints](API_ENDPOINTS_REFERENCE.md)**
   - Liste complète des endpoints
   - Exemples cURL
   - Codes de statut HTTP
   - Tests rapides

5. **[README Général](PAYMENT_CONFIG_README.md)**
   - Vue d'ensemble du système
   - Architecture
   - Workflow complet
   - FAQ
   - Troubleshooting

---

#### Pour les Développeurs Backend 🔧

1. **[Guide Implémentation Backend](CONFIGURATION_PAIEMENT_DYNAMIQUE.md)**
   - Architecture du système
   - Modèles de données
   - Services et controllers
   - Scripts de gestion

2. **[Documentation Mode TEST/LIVE](PAYDUNYA_MODES_TEST_ET_LIVE.md)**
   - Stockage des clés
   - Basculement entre modes
   - Scripts disponibles
   - Workflow de déploiement

---

### Autres Fonctionnalités

1. **[API Reference - Size & Pricing](API_REFERENCE_SIZE_PRICING.md)**
   - Gestion des tailles de produits
   - Configuration des prix
   - Endpoints disponibles

2. **[Async Image Generation](ASYNC_IMAGE_GENERATION_GUIDE.md)**
   - Génération asynchrone d'images
   - File d'attente
   - Optimisations

3. **[Frontend Client Image Upload](FRONTEND_CLIENT_IMAGE_UPLOAD_GUIDE.md)**
   - Upload d'images côté client
   - Validation
   - Intégration

4. **[Frontend Display Guide](FRONTEND_DISPLAY_GUIDE.md)**
   - Affichage des produits
   - Grilles et listes
   - Responsive design

5. **[Frontend Home Content](FRONTEND_HOME_CONTENT_GUIDE.md)**
   - Contenu dynamique de la page d'accueil
   - Bannières et sections
   - Gestion du contenu

6. **[Frontend SVG Upload](FRONTEND_SVG_UPLOAD_GUIDE.md)**
   - Upload de fichiers SVG
   - Validation
   - Traitement

7. **[Frontend Timing Guide](FRONTEND_TIMING_GUIDE.md)**
   - Gestion du timing
   - Optimisations performance
   - Best practices

8. **[Frontend Vendor Finances](FRONTEND_VENDOR_FINANCES_GUIDE.md)**
   - Interface finances vendeur
   - Rapports
   - Paiements

9. **[Home Content Initialization](HOME_CONTENT_INITIALIZATION.md)**
   - Initialisation du contenu
   - Seed data
   - Configuration

10. **[Phone Security Implementation](PHONE_SECURITY_IMPLEMENTATION.md)**
    - Sécurité téléphone
    - Vérification
    - OTP

11. **[Vendor Size Pricing](VENDOR_SIZE_PRICING_API.md)**
    - API de tarification vendeur
    - Configuration des prix
    - Gestion des tailles

12. **[Vendor Size Pricing Frontend](VENDOR_SIZE_PRICING_FRONTEND_GUIDE.md)**
    - Interface frontend pour les vendeurs
    - Configuration des prix
    - UI/UX

---

## Configuration de Paiement - Quick Links ⚡

### Endpoints Principaux

**Base URL**: `http://localhost:3004`

#### Public (Frontend)
```
GET  /payment-config/paydunya
```
→ Récupère la config active (TEST ou LIVE)

#### Admin (Auth requise)
```
POST /admin/payment-config/switch
```
→ Bascule entre TEST et LIVE

**Exemple**:
```javascript
// Frontend - Récupérer config
const config = await fetch('http://localhost:3004/payment-config/paydunya')
  .then(r => r.json());

console.log('Mode:', config.mode); // "test" ou "live"

// Admin - Basculer en LIVE
await fetch('http://localhost:3004/admin/payment-config/switch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ provider: 'paydunya', mode: 'live' })
});
```

---

### Scripts Backend Disponibles

```bash
# Tester la configuration
npx ts-node scripts/test-payment-config.ts

# Voir l'état actuel
npx ts-node scripts/switch-paydunya-mode.ts status

# Basculer en mode TEST
npx ts-node scripts/switch-paydunya-mode.ts test

# Basculer en mode LIVE (confirmation requise)
npx ts-node scripts/switch-paydunya-mode.ts live --confirm

# Initialiser la configuration
npx ts-node prisma/seeds/payment-config.seed.ts
```

---

## Guides par Cas d'Usage 📋

### Je veux... intégrer Paydunya dans mon frontend
→ [Démarrage Rapide](FRONTEND_PAYMENT_QUICKSTART.md)

### Je veux... voir tous les endpoints disponibles
→ [Référence Endpoints](API_ENDPOINTS_REFERENCE.md)

### Je veux... des exemples pour mon framework (React, Vue, Angular...)
→ [Exemples Multi-Frameworks](FRONTEND_PAYMENT_EXAMPLES.md)

### Je veux... comprendre l'architecture du système
→ [README Général](PAYMENT_CONFIG_README.md)

### Je veux... gérer le mode TEST/LIVE depuis le backend
→ [Documentation Mode TEST/LIVE](PAYDUNYA_MODES_TEST_ET_LIVE.md)

### Je veux... une référence complète de l'API
→ [Guide API Complet](FRONTEND_PAYMENT_CONFIG_API.md)

---

## Architecture Globale 🏗️

```
┌──────────────────────────────────────────────┐
│         PostgreSQL (Neon Cloud)              │
│  ┌────────────────────────────────────────┐  │
│  │  PaymentConfig Table                   │  │
│  │  - provider: "paydunya"                │  │
│  │  - activeMode: "test" | "live"         │  │
│  │  - testPublicKey, testPrivateKey       │  │
│  │  - livePublicKey, livePrivateKey       │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│      NestJS Backend (localhost:3004)         │
│  ┌────────────────────────────────────────┐  │
│  │  PaymentConfigService                  │  │
│  │  - Récupère config selon activeMode    │  │
│  │  - Sélectionne les bonnes clés         │  │
│  │  - Bascule entre TEST/LIVE             │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  PaydunyaService                       │  │
│  │  - Utilise les clés appropriées        │  │
│  │  - Crée les factures de paiement       │  │
│  │  - Vérifie les paiements               │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│              API REST                        │
│                                              │
│  Public:                                     │
│  GET /payment-config/paydunya                │
│                                              │
│  Admin:                                      │
│  POST /admin/payment-config/switch           │
│  GET  /admin/payment-config/paydunya         │
│  PATCH /admin/payment-config/paydunya        │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│           Frontend Application               │
│  - React / Vue / Angular / Next.js           │
│  - Récupère config active                    │
│  - Affiche mode TEST/LIVE                    │
│  - Admin bascule entre modes                 │
└──────────────────────────────────────────────┘
```

---

## Checklist d'Intégration ✅

### Frontend Developer

- [ ] Lire le [Démarrage Rapide](FRONTEND_PAYMENT_QUICKSTART.md)
- [ ] Créer un hook `usePaydunyaConfig`
- [ ] Récupérer la config au chargement de l'app
- [ ] Afficher un indicateur de mode (TEST/LIVE)
- [ ] Créer un composant admin de basculement
- [ ] Ajouter une confirmation avant paiement en mode LIVE
- [ ] Tester en mode TEST
- [ ] Vérifier le basculement TEST ↔ LIVE

### Backend Developer

- [ ] Vérifier que la config est en base de données
- [ ] Tester le script `test-payment-config.ts`
- [ ] Tester le script `switch-paydunya-mode.ts`
- [ ] Vérifier les endpoints API
- [ ] Documenter pour l'équipe frontend

---

## Support et Contribution 🆘

### Questions Fréquentes

**Q: Comment savoir si je suis en mode TEST ou LIVE ?**
→ Appelez `GET /payment-config/paydunya` et vérifiez le champ `mode`

**Q: Comment basculer entre TEST et LIVE ?**
→ Utilisez `POST /admin/payment-config/switch` ou le script backend

**Q: Les clés privées sont-elles exposées ?**
→ Non, seules les données publiques sont retournées au frontend

**Q: Puis-je tester sans dépenser d'argent ?**
→ Oui, utilisez le mode TEST qui utilise le sandbox Paydunya

### Problèmes Courants

**Erreur: "Configuration non disponible"**
→ Exécutez: `npx ts-node prisma/seeds/payment-config.seed.ts`

**Erreur: "Unauthorized" (401)**
→ Vérifiez votre token JWT dans le header Authorization

**Erreur: "Forbidden" (403)**
→ Vérifiez que votre utilisateur a le rôle ADMIN

---

## Versions 📅

**Version actuelle**: 2.0.0
**Date**: 12 Février 2026

### Changelog

**v2.0.0** - Configuration dynamique complète
- ✅ Système de config dynamique
- ✅ Basculement TEST/LIVE instantané
- ✅ Documentation frontend complète
- ✅ Scripts de gestion

**v1.0.0** - Version initiale
- Clés hardcodées

---

## Liens Rapides 🔗

- [Démarrage Rapide Frontend](FRONTEND_PAYMENT_QUICKSTART.md)
- [API Reference](API_ENDPOINTS_REFERENCE.md)
- [Exemples Code](FRONTEND_PAYMENT_EXAMPLES.md)
- [FAQ & Troubleshooting](PAYMENT_CONFIG_README.md#faq)

---

**Équipe**: PrintAlma Backend
**Base URL**: http://localhost:3004
**Support**: Consultez la documentation ou créez une issue
