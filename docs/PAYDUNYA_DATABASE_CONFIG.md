# Configuration PayDunya en Base de Données

## 📖 Vue d'ensemble

Le système PayDunya utilise maintenant une **configuration stockée en base de données** au lieu des variables d'environnement. Cela permet :

- ✅ Modification des clés API sans redémarrage du serveur
- ✅ Gestion centralisée via l'interface admin
- ✅ Basculement facile entre TEST et LIVE
- ✅ Historique et audit des changements
- ✅ Fallback sur les variables d'environnement si aucune config en BDD

## 🗄️ Structure de la Configuration

Chaque provider de paiement (PayDunya, PayTech, etc.) a **UN SEUL** enregistrement dans la table `payment_configs` qui contient :

- **Clés TEST** : Master Key, Private Key, Token, Public Key
- **Clés LIVE** : Master Key, Private Key, Token, Public Key
- **Mode actif** : `test` ou `live`
- **État** : Actif ou inactif

```prisma
model PaymentConfig {
  id         Int     @id @default(autoincrement())
  provider   String  @unique  // 'paydunya'
  isActive   Boolean @default(true)
  activeMode String  @default("test")  // 'test' | 'live'

  // Clés TEST
  testMasterKey   String?
  testPrivateKey  String?
  testToken       String?
  testPublicKey   String?

  // Clés LIVE
  liveMasterKey   String?
  livePrivateKey  String?
  liveToken       String?
  livePublicKey   String?

  webhookSecret   String?
  metadata        Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🚀 Scripts Disponibles

### 1. Configuration Initiale

```bash
# Créer/mettre à jour la configuration PayDunya
npx ts-node scripts/setup-paydunya-config.ts
```

Ce script :
- Récupère les clés depuis `.env`
- Insère/met à jour la configuration en BDD
- Configure le mode TEST par défaut
- Affiche un résumé de la configuration

### 2. Vérifier la Configuration

```bash
# Afficher la configuration actuelle
npx ts-node scripts/check-paydunya-config.ts
```

Affiche :
- L'état de la configuration
- Les clés (masquées) pour TEST et LIVE
- Le mode actif
- Les clés manquantes éventuelles

### 3. Basculer entre TEST et LIVE

```bash
# Voir le statut actuel
npx ts-node scripts/switch-paydunya-mode.ts status

# Basculer en mode TEST
npx ts-node scripts/switch-paydunya-mode.ts test

# Basculer en mode LIVE (requiert confirmation)
npx ts-node scripts/switch-paydunya-mode.ts live --confirm
```

⚠️ **ATTENTION** : Le passage en mode LIVE nécessite une confirmation car toutes les transactions seront **RÉELLES et FACTURÉES**.

## 🔄 Comment le Système Fonctionne

### Ordre de Priorité

Le `PaydunyaService` charge les clés dans cet ordre :

1. **Base de données** (priorité) via `PaymentConfigService`
2. **Variables d'environnement** (fallback)

```typescript
// Dans PaydunyaService
private async getAxiosInstance(): Promise<AxiosInstance> {
  // 1. Essayer de récupérer depuis la BDD
  const dbConfig = await this.paymentConfigService.getActiveConfig('paydunya');

  if (dbConfig && dbConfig.isActive) {
    // Utiliser la configuration de la BDD
    mode = dbConfig.activeMode;  // 'test' ou 'live'

    if (mode === 'test') {
      masterKey = dbConfig.testMasterKey;
      privateKey = dbConfig.testPrivateKey;
      token = dbConfig.testToken;
    } else {
      masterKey = dbConfig.liveMasterKey;
      privateKey = dbConfig.livePrivateKey;
      token = dbConfig.liveToken;
    }
  } else {
    // 2. Fallback sur les variables d'environnement
    masterKey = process.env.PAYDUNYA_MASTER_KEY;
    privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    token = process.env.PAYDUNYA_TOKEN;
  }

  // ... créer l'instance axios avec les clés
}
```

### Chargement Dynamique

Les clés sont chargées **à chaque requête**, ce qui signifie :

- ✅ Pas besoin de redémarrer le serveur après un changement de mode
- ✅ Basculement instantané entre TEST et LIVE
- ✅ Mises à jour des clés prises en compte immédiatement

## 📝 Configuration Actuelle

Voici l'état actuel de votre configuration :

```
✅ Configuration PayDunya ACTIVE

Mode actif: TEST 🧪
État:       ✅ Actif
API URL:    https://app.paydunya.com/sandbox-api/v1

Modes disponibles:
  ✅ TEST  (ACTIF)  - Toutes les clés configurées
  ✅ LIVE           - Toutes les clés configurées
```

## 🛠️ Gestion via l'API Admin

Des endpoints API sont disponibles pour gérer la configuration :

```bash
# Récupérer la configuration
GET /api/payment-config/paydunya

# Mettre à jour la configuration
PATCH /api/payment-config/paydunya
{
  "mode": "test",
  "privateKey": "test_private_...",
  "token": "...",
  "publicKey": "test_public_..."
}

# Basculer le mode
POST /api/payment-config/paydunya/switch-mode
{
  "mode": "live"
}
```

## 🔐 Sécurité

- Les clés sont **masquées** dans les logs et réponses API
- Seuls les **4 premiers et 4 derniers caractères** sont visibles
- Les clés complètes ne sont jamais exposées au frontend
- Seule la **Public Key** du mode actif est accessible publiquement

## 📚 Migration depuis .env

Si vous utilisez actuellement les variables d'environnement :

1. **Exécutez le script de setup** :
   ```bash
   npx ts-node scripts/setup-paydunya-config.ts
   ```

2. **Vérifiez la configuration** :
   ```bash
   npx ts-node scripts/check-paydunya-config.ts
   ```

3. **Redémarrez le serveur** (une seule fois) :
   ```bash
   npm run start:dev
   ```

4. **Les futures modifications** se feront sans redémarrage !

## 🎯 Avantages

### Avant (variables d'environnement)
- ❌ Redémarrage requis pour chaque changement
- ❌ Pas d'historique des modifications
- ❌ Basculement TEST/LIVE compliqué
- ❌ Pas d'interface de gestion

### Après (base de données)
- ✅ Modifications sans redémarrage
- ✅ Audit trail automatique
- ✅ Basculement TEST/LIVE en 1 commande
- ✅ Interface admin disponible

## 📖 Références

- **Service** : `src/payment-config/payment-config.service.ts`
- **PaydunyaService** : `src/paydunya/paydunya.service.ts`
- **Scripts** : `scripts/setup-paydunya-config.ts`, `scripts/check-paydunya-config.ts`, `scripts/switch-paydunya-mode.ts`
- **Documentation PayDunya** : https://developers.paydunya.com/doc/FR/introduction
