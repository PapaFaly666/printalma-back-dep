# ✅ Configuration Paydunya - TEST et LIVE

## 🎯 Ce qui a été fait

Les **deux configurations** Paydunya (TEST et LIVE) sont maintenant **stockées en base de données** ! L'admin peut basculer entre les deux modes **en une seule commande**, sans jamais toucher au code.

---

## 📊 État actuel en base de données

```
┌──────────────────────────────────────────────────────────┐
│  TABLE: payment_configs                                  │
├──────────────────────────────────────────────────────────┤
│  ID │ Provider │ Mode │ État     │ Public Key         │
├─────┼──────────┼──────┼──────────┼────────────────────┤
│  1  │ paydunya │ test │ ✅ ACTIF │ test_public_kvx... │
│  2  │ paydunya │ live │ ❌ Inactif│ live_public_JzyU...│
└──────────────────────────────────────────────────────────┘
```

**Clés stockées** :

### MODE TEST (actif)
```
Private Key: test_private_uImFqxfqokHqbqHI4PXJ24huucO
Public Key:  test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt
Token:       BuVS3uuAKsg9bYyGcT9B
API URL:     https://app.paydunya.com/sandbox-api/v1
```

### MODE LIVE (prêt, mais inactif)
```
Private Key: live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG
Public Key:  live_public_JzyUBGQTafgpOPqRulSDGDVfHzz
Token:       lt8YNn0GPW6DTIWcCZ8f
API URL:     https://app.paydunya.com/api/v1
```

---

## 🔄 Basculer entre TEST et LIVE

### Méthode 1 : Script (Recommandé)

```bash
# Voir l'état actuel
npx ts-node scripts/switch-paydunya-mode.ts status

# Basculer en mode LIVE (Production)
npx ts-node scripts/switch-paydunya-mode.ts live --confirm

# Revenir en mode TEST
npx ts-node scripts/switch-paydunya-mode.ts test
```

**Exemple de sortie** :

```
📋 Configuration Paydunya:

❌ Mode LIVE - Inactif
   Public Key:  live_public_JzyUBGQTafgpOPqRul...
   Mis à jour:  Thu Feb 12 2026 10:15:09 GMT+0000

✅ Mode TEST - ACTIF
   Public Key:  test_public_kvxlzRxFxoS2gFO3Fh...
   Mis à jour:  Thu Feb 12 2026 10:15:09 GMT+0000
   API URL:     https://app.paydunya.com/sandbox-api/v1

✅ Mode TEST ACTIF - Environnement sandbox
```

### Méthode 2 : API REST

#### Basculer vers LIVE

```bash
curl -X POST https://votre-api.com/admin/payment-config/switch \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paydunya",
    "mode": "live"
  }'
```

**Réponse** :
```json
{
  "message": "Basculement réussi vers le mode LIVE",
  "config": {
    "id": 2,
    "provider": "paydunya",
    "isActive": true,
    "mode": "live",
    "publicKey": "live_public_JzyU...",
    "privateKey": "live...TG",
    "token": "lt8Y...8f"
  },
  "previousMode": "test",
  "currentMode": "live"
}
```

#### Basculer vers TEST

```bash
curl -X POST https://votre-api.com/admin/payment-config/switch \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paydunya",
    "mode": "test"
  }'
```

---

## 🎨 Interface Admin

Vous pouvez créer une interface admin simple avec ces endpoints :

```jsx
function PaydunyaConfigAdmin() {
  const [configs, setConfigs] = useState([]);
  const [activeMode, setActiveMode] = useState('test');

  // Récupérer les configs
  useEffect(() => {
    fetch('/admin/payment-config/paydunya', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setConfigs(data);
        const active = data.find(c => c.isActive);
        setActiveMode(active?.mode || 'test');
      });
  }, []);

  // Basculer de mode
  const switchMode = async (mode) => {
    const confirmed = window.confirm(
      `Basculer en mode ${mode.toUpperCase()} ?` +
      (mode === 'live' ? '\n\n⚠️ ATTENTION: Transactions RÉELLES !' : '')
    );

    if (!confirmed) return;

    await fetch('/admin/payment-config/switch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider: 'paydunya', mode })
    });

    // Recharger
    window.location.reload();
  };

  return (
    <div className="paydunya-config">
      <h2>Configuration Paydunya</h2>

      <div className="current-mode">
        <label>Mode actuel :</label>
        <span className={`badge ${activeMode === 'test' ? 'blue' : 'red'}`}>
          {activeMode === 'test' ? '🧪 TEST (Sandbox)' : '🚀 LIVE (Production)'}
        </span>
      </div>

      <div className="configs-list">
        {configs.map(config => (
          <div key={config.mode} className="config-card">
            <div className="config-header">
              <h3>Mode {config.mode.toUpperCase()}</h3>
              {config.isActive && <span className="active-badge">✅ ACTIF</span>}
            </div>

            <div className="config-details">
              <p><strong>Public Key:</strong> <code>{config.publicKey}</code></p>
              <p><strong>API URL:</strong> {config.metadata.apiUrl}</p>
            </div>

            {!config.isActive && (
              <button
                onClick={() => switchMode(config.mode)}
                className={config.mode === 'live' ? 'btn-danger' : 'btn-primary'}
              >
                Activer le mode {config.mode.toUpperCase()}
              </button>
            )}
          </div>
        ))}
      </div>

      {activeMode === 'live' && (
        <div className="alert alert-danger">
          ⚠️ <strong>MODE PRODUCTION ACTIF</strong><br/>
          Toutes les transactions sont réelles et seront facturées.
        </div>
      )}
    </div>
  );
}
```

---

## 📡 Endpoints API disponibles

### Admin (Protection ADMIN/SUPERADMIN)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/admin/payment-config` | GET | Lister toutes les configs |
| `/admin/payment-config/:provider` | GET | Récupérer les configs d'un provider (TEST + LIVE) |
| `/admin/payment-config/:provider/:mode` | GET | Récupérer une config spécifique |
| `/admin/payment-config/switch` | POST | **Basculer entre TEST et LIVE** |
| `/admin/payment-config/:provider/:mode` | PATCH | Mettre à jour une config |
| `/admin/payment-config/:provider/:mode` | DELETE | Supprimer une config |

### Public (Frontend)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/payment-config/paydunya` | GET | Récupérer la config **active** (TEST ou LIVE) |

Le frontend reçoit **automatiquement** la bonne config selon le mode actif !

---

## 🔒 Comment ça marche ?

### 1. Deux entrées en BDD

Au lieu d'avoir **une seule** entrée qu'on modifie à chaque fois, on a maintenant **deux entrées distinctes** :

- `paydunya + test` → Config TEST
- `paydunya + live` → Config LIVE

La contrainte UNIQUE est sur la **combinaison** `(provider, mode)`.

### 2. Une seule config active à la fois

Quand vous basculez :

1. ✅ Toutes les configs Paydunya sont **désactivées**
2. ✅ La config du mode choisi est **activée**
3. ✅ Le frontend reçoit automatiquement la nouvelle config

### 3. Aucune modification de code

Les clés ne sont **jamais** modifiées, on change juste **laquelle est active**.

---

## 🎯 Workflow de déploiement

### Développement
```bash
# Mode TEST actif par défaut
npx ts-node scripts/switch-paydunya-mode.ts status

# Développer et tester avec Paydunya Sandbox
```

### Mise en production
```bash
# 1. Vérifier que tout fonctionne en TEST
npm run build
npm run test

# 2. Basculer en LIVE
npx ts-node scripts/switch-paydunya-mode.ts live --confirm

# 3. Vérifier
npx ts-node scripts/test-payment-config.ts

# 4. Le frontend reçoit automatiquement la config LIVE !
curl https://votre-api.com/payment-config/paydunya
```

### Rollback si problème
```bash
# Revenir en TEST immédiatement
npx ts-node scripts/switch-paydunya-mode.ts test
```

---

## ✅ Avantages de cette approche

| Avant | Maintenant |
|-------|------------|
| ❌ Modifier les clés à chaque basculement | ✅ Juste activer/désactiver |
| ❌ Risque d'erreur de saisie | ✅ Clés pré-configurées et testées |
| ❌ Besoin de copier/coller les clés | ✅ Tout est déjà en base |
| ❌ Historique perdu | ✅ Les deux configs toujours présentes |
| ❌ Basculement = stress | ✅ Basculement = 1 commande |

---

## 🧪 Tests

```bash
# Tester la config actuelle
npx ts-node scripts/test-payment-config.ts

# Voir les deux configs
npx ts-node scripts/switch-paydunya-mode.ts status

# Basculer vers LIVE
npx ts-node scripts/switch-paydunya-mode.ts live --confirm

# Vérifier
npx ts-node scripts/test-payment-config.ts

# Revenir en TEST
npx ts-node scripts/switch-paydunya-mode.ts test
```

---

## 📚 Documentation

- **Guide Frontend** : `docs/FRONTEND_PAYDUNYA_INTEGRATION.md`
- **Quick Start Frontend** : `docs/FRONTEND_PAYDUNYA_QUICKSTART.md`
- **Configuration complète** : `docs/CONFIGURATION_PAIEMENT_DYNAMIQUE.md`
- **Guide scripts** : `scripts/README.md`

---

## 🎉 Résumé

**Ce qui a changé** :

1. ✅ **Deux configs** en base (TEST + LIVE)
2. ✅ **Une seule active** à la fois
3. ✅ **Basculement instantané** via script ou API
4. ✅ **Frontend automatique** - reçoit toujours la bonne config
5. ✅ **Zéro modification de code** pour basculer

**Commande magique** :

```bash
# Passer en production
npx ts-node scripts/switch-paydunya-mode.ts live --confirm

# C'est tout ! ✨
```

---

**Date** : 12 Février 2026
**Version** : 2.0.0
**Statut** : ✅ **Opérationnel avec modes TEST et LIVE**
