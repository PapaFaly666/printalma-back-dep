# Guide Admin - Gestion des Paiements Orange Money & PayDunya

## Vue d'ensemble

Le système de paiement est maintenant centralisé dans la base de données, permettant à l'admin de gérer les configurations via l'interface `/admin/payment-config` sans modifier le code ou les variables d'environnement.

---

## Architecture

### Configuration dans la base de données

Les clés de paiement sont stockées dans la table `PaymentConfig` avec la structure suivante:

| Champ | Description | Exemple (Orange Money) |
|-------|-------------|----------------------|
| `provider` | Nom du provider | `ORANGE_MONEY`, `PAYDUNYA` |
| `isActive` | Active/désactive le provider | `true`/`false` |
| `activeMode` | Mode actif | `test` ou `live` |
| `testPublicKey` | Clé publique TEST | Client ID (test) |
| `testPrivateKey` | Clé privée TEST | Client Secret (test) |
| `testToken` | Token/Code TEST | Merchant Code (test) |
| `livePublicKey` | Clé publique LIVE | Client ID (production) |
| `livePrivateKey` | Clé privée LIVE | Client Secret (production) |
| `liveToken` | Token/Code LIVE | Merchant Code (production) |
| `metadata` | Données additionnelles (JSON) | URLs, config spécifique |

---

## Mapping des champs pour Orange Money

| Besoin Orange Money | Champ dans PaymentConfig |
|-------------------|------------------------|
| Client ID (Test) | `testPublicKey` |
| Client Secret (Test) | `testPrivateKey` |
| Merchant Code (Test) | `testToken` |
| Client ID (Production) | `livePublicKey` |
| Client Secret (Production) | `livePrivateKey` |
| Merchant Code (Production) | `liveToken` |

---

## Endpoints Admin (Backend)

### 1. Récupérer toutes les configurations
```http
GET /admin/payment-config
Authorization: Bearer {admin_token}
```

**Réponse:**
```json
[
  {
    "id": 1,
    "provider": "ORANGE_MONEY",
    "isActive": true,
    "activeMode": "live",
    "testPublicKey": "b0c8...****",
    "testPrivateKey": "37b8...****",
    "testToken": "5992****",
    "livePublicKey": "67e2...****",
    "livePrivateKey": "37b8...****",
    "liveToken": "PRIN****",
    "metadata": { ... },
    "createdAt": "2026-02-21T...",
    "updatedAt": "2026-02-21T..."
  },
  {
    "id": 2,
    "provider": "PAYDUNYA",
    ...
  }
]
```

### 2. Récupérer une configuration spécifique
```http
GET /admin/payment-config/ORANGE_MONEY
Authorization: Bearer {admin_token}
```

### 3. Créer une configuration
```http
POST /admin/payment-config
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "provider": "ORANGE_MONEY",
  "isActive": true,
  "mode": "live",
  "privateKey": "37b88000-6540-4a68-ad55-3ec39d4db68c",
  "token": "PRINTALMA001",
  "publicKey": "67e2b158-9073-43e3-9c17-e3aa20e432b9"
}
```

### 4. Mettre à jour une configuration
```http
PATCH /admin/payment-config/ORANGE_MONEY
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "isActive": false,
  "mode": "test",
  "privateKey": "nouveau-client-secret",
  "token": "nouveau-merchant-code"
}
```

### 5. Switcher entre TEST et LIVE
```http
POST /admin/payment-config/switch
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "provider": "ORANGE_MONEY",
  "mode": "live"
}
```

**Réponse:**
```json
{
  "message": "Basculement réussi vers le mode LIVE",
  "config": { ... },
  "previousMode": "test",
  "currentMode": "live"
}
```

### 6. Supprimer une configuration
```http
DELETE /admin/payment-config/ORANGE_MONEY
Authorization: Bearer {admin_token}
```

---

## Script d'initialisation

Un script a été créé pour initialiser la configuration Orange Money depuis les variables d'environnement:

```bash
npx ts-node scripts/init-orange-money-config.ts
```

Ce script:
- ✅ Lit les credentials depuis `.env`
- ✅ Crée ou met à jour la configuration dans la DB
- ✅ Stocke les clés dans les champs appropriés selon le mode (test/live)

---

## Interface Frontend (Recommandations)

### Page de gestion `/admin/payment-methods`

L'admin doit pouvoir:

1. **Visualiser tous les providers de paiement**
   - Liste des providers: ORANGE_MONEY, PAYDUNYA, PAYTECH, CASH_ON_DELIVERY
   - Statut (actif/inactif)
   - Mode actif (TEST/LIVE)

2. **Activer/Désactiver un provider**
   - Toggle switch pour `isActive`
   - API: `PATCH /admin/payment-config/{provider}` avec `{ "isActive": true/false }`

3. **Switcher entre TEST et LIVE**
   - Bouton "Mode TEST" / "Mode LIVE"
   - API: `POST /admin/payment-config/switch` avec `{ "provider": "ORANGE_MONEY", "mode": "live" }`

4. **Modifier les clés API**
   - Formulaire avec champs:
     - Client ID (Test)
     - Client Secret (Test)
     - Merchant Code (Test)
     - Client ID (Production)
     - Client Secret (Production)
     - Merchant Code (Production)
   - API: `PATCH /admin/payment-config/{provider}`

### Exemple de composant React

```tsx
interface PaymentMethod {
  provider: string;
  isActive: boolean;
  activeMode: 'test' | 'live';
  testPublicKey?: string;
  livePublicKey?: string;
}

function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  const toggleActive = async (provider: string, isActive: boolean) => {
    await fetch(`/admin/payment-config/${provider}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive }),
    });
    // Refresh data
  };

  const switchMode = async (provider: string, mode: 'test' | 'live') => {
    await fetch('/admin/payment-config/switch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider, mode }),
    });
    // Refresh data
  };

  return (
    <div>
      <h1>Méthodes de Paiement</h1>
      {methods.map(method => (
        <div key={method.provider}>
          <h3>{method.provider}</h3>
          <label>
            Actif:
            <input
              type="checkbox"
              checked={method.isActive}
              onChange={(e) => toggleActive(method.provider, e.target.checked)}
            />
          </label>
          <button onClick={() => switchMode(method.provider, method.activeMode === 'test' ? 'live' : 'test')}>
            Passer en mode {method.activeMode === 'test' ? 'LIVE' : 'TEST'}
          </button>
          <span>Mode actuel: {method.activeMode.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Comportement du service Orange Money

Le service Orange Money lit maintenant depuis la DB **en priorité**, avec fallback sur les variables d'environnement:

1. **Tentative de lecture depuis la DB**
   ```typescript
   const dbConfig = await paymentConfigService.getActiveConfig('ORANGE_MONEY');
   if (dbConfig && dbConfig.isActive) {
     // Utiliser clientId/clientSecret depuis la DB selon le mode actif
   }
   ```

2. **Fallback sur .env si pas de config DB**
   ```typescript
   if (!dbConfig) {
     // Utiliser ORANGE_CLIENT_ID, ORANGE_CLIENT_SECRET depuis .env
   }
   ```

3. **Logs détaillés**
   ```
   📊 Utilisation de la configuration LIVE depuis la base de données
   ```

---

## Tests

### Tester la connexion Orange Money
```bash
curl http://localhost:3004/orange-money/test-connection
```

**Réponse attendue:**
```json
{
  "success": true,
  "mode": "live",
  "source": "database",
  "tokenObtained": true
}
```

### Tester la création d'un paiement
```bash
curl -X POST http://localhost:3004/orange-money/payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 123,
    "amount": 1000,
    "customerName": "Test Client",
    "customerPhone": "221771234567",
    "orderNumber": "TEST-001"
  }'
```

---

## Résumé des changements

### Avant
- ❌ Clés hardcodées dans `.env`
- ❌ Pas de switch TEST/LIVE dynamique
- ❌ Modification du code nécessaire pour changer les clés

### Après
- ✅ Clés dans la base de données
- ✅ Switch TEST/LIVE via API admin
- ✅ Gestion centralisée de tous les providers
- ✅ Interface admin pour gérer les paiements
- ✅ Fallback automatique sur `.env` si pas de config DB

---

## Prochaines étapes

1. **Frontend**: Créer l'interface `/admin/payment-methods`
2. **Tests**: Tester le switch TEST/LIVE en production
3. **Documentation**: Former les admins à utiliser l'interface
4. **Migration**: Supprimer progressivement les clés des `.env` après validation

---

## Support

Pour toute question ou problème:
- Vérifier les logs du serveur pour les messages `📊 Utilisation de la configuration`
- Tester avec `GET /orange-money/test-connection` pour valider la config
- Vérifier que les clés sont bien stockées dans la DB via `/admin/payment-config/ORANGE_MONEY`
