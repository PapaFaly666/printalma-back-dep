# Documentation Complète - Configuration de Paiement Dynamique

## Vue d'Ensemble 🎯

Ce système permet de gérer les configurations de paiement Paydunya de manière **complètement dynamique**, sans jamais toucher au code. L'admin peut basculer entre les modes TEST (sandbox) et LIVE (production) via une simple API.

### Architecture

```
┌─────────────────────────────────────────────┐
│         Base de Données PostgreSQL          │
│  ┌────────────────────────────────────────┐ │
│  │  Table: payment_configs                │ │
│  │  ─────────────────────────────────────  │ │
│  │  provider: "paydunya"                  │ │
│  │  activeMode: "test" ou "live"          │ │
│  │                                        │ │
│  │  Clés TEST:                            │ │
│  │  - testPublicKey                       │ │
│  │  - testPrivateKey                      │ │
│  │  - testToken                           │ │
│  │                                        │ │
│  │  Clés LIVE:                            │ │
│  │  - livePublicKey                       │ │
│  │  - livePrivateKey                      │ │
│  │  - liveToken                           │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Backend NestJS (Port 3004)           │
│  ┌────────────────────────────────────────┐ │
│  │  Service: PaymentConfigService         │ │
│  │  - Récupère config selon activeMode    │ │
│  │  - Sélectionne les bonnes clés         │ │
│  │  - Bascule entre TEST/LIVE             │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │   API REST Endpoints   │
        └───────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              Frontend                       │
│  - Récupère config active (GET)             │
│  - Admin bascule TEST/LIVE (POST)           │
│  - Utilise les clés appropriées             │
└─────────────────────────────────────────────┘
```

---

## Documentation Disponible 📚

### 1. Guide Complet API (Détaillé)
**Fichier**: `FRONTEND_PAYMENT_CONFIG_API.md`

Contient:
- ✅ Tous les endpoints en détail
- ✅ Exemples de requêtes/réponses
- ✅ Code React complet
- ✅ Gestion des erreurs
- ✅ Interface admin complète
- ✅ Bonnes pratiques

👉 **Pour**: Développeurs frontend qui veulent tous les détails

---

### 2. Guide Démarrage Rapide (QuickStart)
**Fichier**: `FRONTEND_PAYMENT_QUICKSTART.md`

Contient:
- ✅ Intégration en 3 minutes
- ✅ Hook React prêt à l'emploi
- ✅ Composant admin copy-paste
- ✅ Validation avant paiement
- ✅ Tests simples

👉 **Pour**: Développeurs qui veulent démarrer rapidement

---

### 3. Exemples Multi-Frameworks
**Fichier**: `FRONTEND_PAYMENT_EXAMPLES.md`

Contient:
- ✅ React + TypeScript
- ✅ React + JavaScript
- ✅ Vue 3 Composition API
- ✅ Vue 3 Options API
- ✅ Angular
- ✅ Next.js
- ✅ Vanilla JavaScript

👉 **Pour**: Développeurs utilisant différents frameworks

---

## Endpoints Principaux 🔌

### Base URL
```
http://localhost:3004
```

### Endpoint Public (Frontend)

#### Récupérer la Configuration Active
```http
GET /payment-config/paydunya
```

**Réponse**:
```json
{
  "provider": "paydunya",
  "mode": "test",
  "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
}
```

---

### Endpoints Admin (Auth Requise)

#### Basculer entre TEST et LIVE
```http
POST /admin/payment-config/switch
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "paydunya",
  "mode": "live"
}
```

#### Récupérer les Détails Complets
```http
GET /admin/payment-config/paydunya
Authorization: Bearer <token>
```

---

## Exemples Rapides 🚀

### JavaScript Vanilla

```javascript
// Récupérer la config
const response = await fetch('http://localhost:3004/payment-config/paydunya');
const config = await response.json();

console.log('Mode:', config.mode);
console.log('Public Key:', config.publicKey);
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

function usePaydunyaConfig() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3004/payment-config/paydunya')
      .then(res => res.json())
      .then(setConfig);
  }, []);

  return config;
}

// Usage
function MyComponent() {
  const config = usePaydunyaConfig();

  return <div>Mode: {config?.mode}</div>;
}
```

### Basculer de Mode (Admin)

```javascript
async function switchToLive(authToken) {
  await fetch('http://localhost:3004/admin/payment-config/switch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: 'paydunya',
      mode: 'live'
    })
  });

  alert('✅ Basculement réussi vers LIVE');
}
```

---

## Scripts Backend Disponibles 🛠️

### Tester la Configuration

```bash
npx ts-node scripts/test-payment-config.ts
```

Affiche:
- ✅ Mode actuel (TEST ou LIVE)
- ✅ Clés configurées
- ✅ URL de l'API
- ✅ Disponibilité des deux modes
- ✅ Tests de cohérence

---

### Basculer entre TEST et LIVE

```bash
# Afficher l'état actuel
npx ts-node scripts/switch-paydunya-mode.ts status

# Basculer en mode TEST
npx ts-node scripts/switch-paydunya-mode.ts test

# Basculer en mode LIVE (confirmation requise)
npx ts-node scripts/switch-paydunya-mode.ts live --confirm
```

---

### Initialiser la Configuration

```bash
npx ts-node prisma/seeds/payment-config.seed.ts
```

Crée/met à jour la configuration avec:
- ✅ Clés TEST configurées
- ✅ Clés LIVE configurées
- ✅ Mode TEST activé par défaut

---

## Workflow Complet 🔄

### 1. Développement (Mode TEST)

```bash
# Backend - Vérifier le mode
npx ts-node scripts/switch-paydunya-mode.ts status
# ✅ Mode TEST ACTIF

# Frontend - Récupérer la config
GET http://localhost:3004/payment-config/paydunya
# Retourne: { mode: "test", publicKey: "test_...", ... }

# Développer et tester avec le sandbox Paydunya
# ✅ Paiements simulés, pas d'argent réel
```

---

### 2. Mise en Production (Mode LIVE)

```bash
# Backend - Basculer en LIVE
npx ts-node scripts/switch-paydunya-mode.ts live --confirm

# ⚠️ ATTENTION: Vous allez passer en mode PRODUCTION !
#    Toutes les transactions seront réelles et facturées.
#
# ✅ Basculement réussi vers LIVE

# Frontend - La config est automatiquement mise à jour
GET http://localhost:3004/payment-config/paydunya
# Retourne: { mode: "live", publicKey: "live_...", ... }

# ✅ Paiements réels activés
```

---

### 3. Retour en TEST

```bash
# Backend - Revenir en TEST
npx ts-node scripts/switch-paydunya-mode.ts test

# ✅ Mode TEST activé - Environnement sécurisé

# Frontend - Config automatiquement mise à jour
# Retourne: { mode: "test", ... }
```

---

## Sécurité 🔒

### Données Exposées au Frontend (Public)

✅ **Exposées** (sans danger):
- `provider` - Nom du provider ("paydunya")
- `mode` - Mode actif ("test" ou "live")
- `publicKey` - Clé publique (safe)
- `apiUrl` - URL de l'API Paydunya

❌ **JAMAIS exposées** au frontend:
- `privateKey` - Clé privée (sensible)
- `token` - Token d'authentification (sensible)
- `masterKey` - Clé maître (sensible)
- `webhookSecret` - Secret webhook (sensible)

### Authentification Admin

Tous les endpoints admin (`/admin/*`) requièrent:
- ✅ Token JWT valide
- ✅ Rôle ADMIN ou SUPERADMIN

Sans authentification:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Cas d'Usage 💼

### 1. Site E-commerce

```typescript
// Au checkout
async function processPayment(amount: number) {
  // 1. Récupérer la config
  const config = await fetch('http://localhost:3004/payment-config/paydunya')
    .then(r => r.json());

  // 2. Avertir si mode LIVE
  if (config.mode === 'live') {
    if (!confirm(`Payer ${amount} FCFA (paiement réel) ?`)) return;
  }

  // 3. Créer la facture via votre backend
  const invoice = await createInvoice({ amount, config });

  // 4. Rediriger vers Paydunya
  window.location.href = invoice.response_url;
}
```

---

### 2. Dashboard Admin

```typescript
// Composant de gestion
function AdminDashboard() {
  const [mode, setMode] = useState('test');

  return (
    <div>
      <h2>Configuration Paiement</h2>
      <p>Mode actuel: {mode === 'test' ? '🧪 TEST' : '🚀 LIVE'}</p>

      <button onClick={() => switchMode('test')}>
        Activer TEST
      </button>
      <button onClick={() => switchMode('live')}>
        Activer LIVE
      </button>

      {mode === 'live' && (
        <div className="alert">
          ⚠️ Mode PRODUCTION - Paiements réels actifs
        </div>
      )}
    </div>
  );
}
```

---

### 3. Indicateur Visuel Permanent

```typescript
// Dans le layout principal
function App() {
  const config = usePaydunyaConfig();

  return (
    <div>
      {/* Indicateur permanent en haut à droite */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        padding: '8px 16px',
        backgroundColor: config?.mode === 'test' ? '#17a2b8' : '#dc3545',
        color: 'white',
        zIndex: 9999
      }}>
        {config?.mode === 'test' ? '🧪 TEST' : '🚀 LIVE'}
      </div>

      {/* Votre application */}
      <YourApp />
    </div>
  );
}
```

---

## Checklist Frontend ✅

Pour intégrer la configuration de paiement:

- [ ] Installer les dépendances (fetch/axios)
- [ ] Créer un hook `usePaydunyaConfig`
- [ ] Récupérer la config au chargement de l'app
- [ ] Afficher un indicateur de mode (TEST/LIVE)
- [ ] Créer un composant admin de basculement
- [ ] Ajouter une confirmation avant paiement en mode LIVE
- [ ] Gérer les erreurs (config non disponible)
- [ ] Tester en mode TEST avec le sandbox Paydunya
- [ ] Vérifier le basculement TEST ↔ LIVE
- [ ] Tester les paiements en mode TEST
- [ ] Documenter pour l'équipe

---

## FAQ ❓

### Q: Comment savoir si je suis en mode TEST ou LIVE ?

**R**: Appelez `GET /payment-config/paydunya` et vérifiez le champ `mode`.

```javascript
const config = await fetch('http://localhost:3004/payment-config/paydunya')
  .then(r => r.json());

if (config.mode === 'live') {
  console.log('⚠️ MODE PRODUCTION - Paiements réels');
} else {
  console.log('✅ MODE TEST - Paiements simulés');
}
```

---

### Q: Comment basculer entre TEST et LIVE ?

**R**: Via le script backend ou l'API admin.

**Script**:
```bash
npx ts-node scripts/switch-paydunya-mode.ts live --confirm
```

**API** (nécessite auth):
```javascript
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

### Q: Les clés privées sont-elles exposées au frontend ?

**R**: Non ! Le endpoint public (`/payment-config/paydunya`) ne retourne que:
- Mode actif
- Clé publique
- URL API

Les clés privées restent sur le backend et ne sont jamais envoyées au frontend.

---

### Q: Que se passe-t-il si je bascule de mode pendant qu'un paiement est en cours ?

**R**: Le paiement en cours continuera avec le mode qui était actif au moment de sa création. Les nouveaux paiements utiliseront le nouveau mode.

---

### Q: Comment tester les paiements sans dépenser d'argent ?

**R**: Utilisez le mode TEST ! Le sandbox Paydunya permet de simuler des paiements sans argent réel.

```bash
# Vérifier que vous êtes en mode TEST
npx ts-node scripts/switch-paydunya-mode.ts status
# ✅ Mode TEST ACTIF - Environnement sandbox
```

---

### Q: Puis-je avoir plusieurs providers (Paydunya, PayTech, etc.) ?

**R**: Oui ! Le système est conçu pour supporter plusieurs providers. Chaque provider a sa propre configuration avec ses clés TEST et LIVE.

---

## Support et Problèmes 🆘

### Erreur: "Configuration non disponible"

**Cause**: Aucune configuration Paydunya en base de données.

**Solution**:
```bash
npx ts-node prisma/seeds/payment-config.seed.ts
```

---

### Erreur: "Unauthorized" (401)

**Cause**: Token JWT manquant ou invalide pour les endpoints admin.

**Solution**: Vérifiez que vous envoyez le header Authorization:
```javascript
headers: {
  'Authorization': `Bearer ${validToken}`
}
```

---

### Erreur: "Forbidden" (403)

**Cause**: Rôle insuffisant (ADMIN requis).

**Solution**: Vérifiez que votre utilisateur a le rôle ADMIN ou SUPERADMIN.

---

### La config ne se met pas à jour

**Cause**: Cache frontend ou mémorisation.

**Solution**: Utilisez `cache: 'no-store'` ou rafraîchissez après le basculement:
```javascript
const config = await fetch('http://localhost:3004/payment-config/paydunya', {
  cache: 'no-store'
}).then(r => r.json());
```

---

## Ressources 📖

### Documentation
- Guide API complet: `FRONTEND_PAYMENT_CONFIG_API.md`
- Guide rapide: `FRONTEND_PAYMENT_QUICKSTART.md`
- Exemples frameworks: `FRONTEND_PAYMENT_EXAMPLES.md`

### Scripts Backend
- Test: `scripts/test-payment-config.ts`
- Basculement: `scripts/switch-paydunya-mode.ts`
- Seed: `prisma/seeds/payment-config.seed.ts`

### Code Source
- Service: `src/payment-config/payment-config.service.ts`
- Controller: `src/payment-config/payment-config.controller.ts`
- Paydunya: `src/paydunya/paydunya.service.ts`

---

## Version et Historique 📅

**Version**: 2.0.0
**Date**: 12 Février 2026
**Auteur**: PrintAlma Backend Team

### Changelog

**v2.0.0** (12 Février 2026)
- ✅ Système de configuration dynamique complet
- ✅ Stockage unique avec clés TEST et LIVE
- ✅ Basculement instantané via API
- ✅ Documentation frontend complète
- ✅ Scripts de gestion

**v1.0.0** (Initial)
- Clés hardcodées dans le code
- Modification de code pour changer de mode

---

**Pour toute question**: Consultez la documentation ou les scripts de test.

**Base URL**: `http://localhost:3004`
