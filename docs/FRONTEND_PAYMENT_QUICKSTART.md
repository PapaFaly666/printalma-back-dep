# Démarrage Rapide - Frontend Payment Config

## En 3 Minutes ⚡

### 1. Récupérer la Configuration Paydunya

**Endpoint**: `GET http://localhost:3004/payment-config/paydunya`

```javascript
// Simple fetch
const config = await fetch('http://localhost:3004/payment-config/paydunya')
  .then(res => res.json());

console.log(config);
// {
//   "provider": "paydunya",
//   "mode": "test",              // "test" ou "live"
//   "publicKey": "test_public_...",
//   "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
// }
```

**C'est tout !** Vous avez maintenant:
- ✅ Le mode actif (TEST ou LIVE)
- ✅ La clé publique appropriée
- ✅ L'URL de l'API correcte

---

## React Hook Complet 🎣

Copiez-collez ce hook dans votre projet:

```typescript
// hooks/usePaydunyaConfig.ts
import { useState, useEffect } from 'react';

export function usePaydunyaConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3004/payment-config/paydunya')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur config:', err);
        setLoading(false);
      });
  }, []);

  return { config, loading };
}
```

**Utilisation**:
```typescript
function MyComponent() {
  const { config, loading } = usePaydunyaConfig();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <p>Mode: {config.mode}</p>
      <p>Public Key: {config.publicKey}</p>
    </div>
  );
}
```

---

## Admin - Basculer entre TEST et LIVE 🔄

**Endpoint**: `POST http://localhost:3004/admin/payment-config/switch`

```javascript
async function switchToLive() {
  const token = localStorage.getItem('authToken');

  const response = await fetch('http://localhost:3004/admin/payment-config/switch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: 'paydunya',
      mode: 'live'  // 'test' ou 'live'
    })
  });

  const result = await response.json();
  console.log('Basculement réussi:', result);
}
```

---

## Composant Admin Complet 🎛️

```typescript
import { useState, useEffect } from 'react';

export function PaymentModeSwitch() {
  const [currentMode, setCurrentMode] = useState('test');
  const [loading, setLoading] = useState(false);

  // Charger le mode actuel
  useEffect(() => {
    fetch('http://localhost:3004/payment-config/paydunya')
      .then(res => res.json())
      .then(data => setCurrentMode(data.mode));
  }, []);

  // Basculer de mode
  async function switchMode(newMode) {
    if (newMode === 'live' && !confirm('⚠️ Passer en PRODUCTION ?')) {
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      await fetch('http://localhost:3004/admin/payment-config/switch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider: 'paydunya', mode: newMode })
      });

      setCurrentMode(newMode);
      alert(`✅ Basculement réussi vers ${newMode.toUpperCase()}`);
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px', border: '2px solid #ddd', borderRadius: '8px' }}>
      <h2>Configuration Paydunya</h2>

      <div style={{
        padding: '10px',
        marginBottom: '15px',
        backgroundColor: currentMode === 'test' ? '#d1ecf1' : '#fff3cd',
        borderRadius: '4px'
      }}>
        <strong>Mode actuel:</strong> {currentMode === 'test' ? '🧪 TEST' : '🚀 LIVE'}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => switchMode('test')}
          disabled={currentMode === 'test' || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentMode === 'test' ? 'not-allowed' : 'pointer',
            opacity: currentMode === 'test' ? 0.5 : 1
          }}
        >
          {loading ? 'Basculement...' : 'Mode TEST'}
        </button>

        <button
          onClick={() => switchMode('live')}
          disabled={currentMode === 'live' || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentMode === 'live' ? 'not-allowed' : 'pointer',
            opacity: currentMode === 'live' ? 0.5 : 1
          }}
        >
          {loading ? 'Basculement...' : 'Mode LIVE'}
        </button>
      </div>

      {currentMode === 'live' && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px'
        }}>
          ⚠️ <strong>ATTENTION:</strong> Mode PRODUCTION actif - Paiements réels
        </div>
      )}
    </div>
  );
}
```

---

## Axios Configuration 🔧

Si vous utilisez Axios:

```javascript
import axios from 'axios';

// Instance Axios pour votre API
const api = axios.create({
  baseURL: 'http://localhost:3004'
});

// Ajouter le token automatiquement
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Récupérer la config
const config = await api.get('/payment-config/paydunya');

// Basculer de mode (admin)
await api.post('/admin/payment-config/switch', {
  provider: 'paydunya',
  mode: 'live'
});
```

---

## Indicateur de Mode Visuel 🎨

Ajoutez cet indicateur dans votre layout:

```typescript
function ModeIndicator() {
  const [mode, setMode] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3004/payment-config/paydunya')
      .then(res => res.json())
      .then(data => setMode(data.mode));
  }, []);

  if (!mode) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      padding: '8px 16px',
      backgroundColor: mode === 'test' ? '#17a2b8' : '#dc3545',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 9999
    }}>
      {mode === 'test' ? '🧪 MODE TEST' : '🚀 MODE LIVE'}
    </div>
  );
}
```

---

## Validation avant Paiement 💳

```javascript
async function createPayment(amount) {
  // 1. Récupérer le mode actuel
  const config = await fetch('http://localhost:3004/payment-config/paydunya')
    .then(res => res.json());

  // 2. Avertir si mode LIVE
  if (config.mode === 'live') {
    const confirmed = confirm(
      `⚠️ PAIEMENT RÉEL de ${amount} FCFA\n\nConfirmer la transaction ?`
    );
    if (!confirmed) return;
  }

  // 3. Créer le paiement
  const response = await fetch('http://localhost:3004/paydunya/create-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoice: {
        total_amount: amount,
        description: 'Achat produit'
      },
      customer: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    })
  });

  const result = await response.json();

  // 4. Rediriger vers Paydunya
  window.location.href = result.response_url;
}
```

---

## Tests 🧪

### Tester la Connexion

```javascript
// Test simple
fetch('http://localhost:3004/payment-config/paydunya')
  .then(res => res.json())
  .then(config => {
    console.log('✅ Config récupérée:', config);
    console.log('Mode:', config.mode);
    console.log('Public Key:', config.publicKey);
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
  });
```

### Vérifier l'Authentification (Admin)

```javascript
const token = 'votre_token_jwt';

fetch('http://localhost:3004/admin/payment-config/paydunya', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Authentifié:', data);
  })
  .catch(err => {
    console.error('❌ Erreur auth:', err);
  });
```

---

## Gestion d'Erreurs Basique ⚠️

```javascript
async function getPaydunyaConfig() {
  try {
    const response = await fetch('http://localhost:3004/payment-config/paydunya');

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const config = await response.json();
    return config;

  } catch (error) {
    console.error('Erreur:', error);

    // Afficher un message à l'utilisateur
    alert('Impossible de charger la configuration de paiement. Réessayez.');

    return null;
  }
}
```

---

## Points Importants ⚡

### Endpoints Principaux

| Endpoint | Type | Auth | Description |
|----------|------|------|-------------|
| `/payment-config/paydunya` | GET | Non | Config active (public) |
| `/admin/payment-config/switch` | POST | Oui | Basculer TEST/LIVE |
| `/admin/payment-config/paydunya` | GET | Oui | Détails complets |

### Réponse Typique

```json
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
}
```

### Basculer de Mode

```json
POST /admin/payment-config/switch
{
  "provider": "paydunya",
  "mode": "live"
}
```

---

## Checklist Intégration ✅

- [ ] Hook `usePaydunyaConfig` créé
- [ ] Configuration récupérée au chargement de l'app
- [ ] Indicateur de mode visible (TEST/LIVE)
- [ ] Composant admin de basculement créé
- [ ] Validation avant paiement en mode LIVE
- [ ] Gestion d'erreurs implémentée
- [ ] Tests effectués

---

## Prochaines Étapes 🚀

1. **En développement**: Utilisez le mode TEST
   ```bash
   npx ts-node scripts/switch-paydunya-mode.ts test
   ```

2. **Pour tester**: Utilisez le sandbox Paydunya
   - Les paiements sont simulés
   - Aucun argent réel

3. **En production**: Basculez en mode LIVE
   ```bash
   npx ts-node scripts/switch-paydunya-mode.ts live --confirm
   ```

4. **Monitoring**: Vérifiez régulièrement le mode actif
   ```bash
   npx ts-node scripts/switch-paydunya-mode.ts status
   ```

---

## Support 📞

- Documentation complète: `docs/FRONTEND_PAYMENT_CONFIG_API.md`
- Exemples backend: `src/paydunya/paydunya.service.ts`
- Scripts de test: `scripts/test-payment-config.ts`

**URL de base**: `http://localhost:3004`
**Date**: 12 Février 2026
