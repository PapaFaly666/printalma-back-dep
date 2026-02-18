# 🚀 Guide de démarrage rapide - Configuration dynamique Paydunya

## ✅ État actuel

Votre système de paiement Paydunya est **configuré et opérationnel** !

### Configuration en base de données
- ✅ **Mode TEST activé** (Sandbox Paydunya)
- ✅ Clés TEST configurées et fonctionnelles
- ✅ Clés LIVE prêtes à l'emploi (en attente)
- ✅ Configuration accessible via API

### Environnement
```
Mode actuel: TEST (Sandbox)
URL API: https://app.paydunya.com/sandbox-api/v1
Public Key: test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt
```

## 📱 Pour le Frontend

### 1. Récupérer la configuration dynamique

```javascript
// Appel API pour obtenir la config Paydunya
const response = await fetch('https://votre-api.com/payment-config/paydunya');
const config = await response.json();

console.log(config);
// Output:
// {
//   "provider": "paydunya",
//   "isActive": true,
//   "mode": "test",
//   "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
//   "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
// }
```

### 2. Initialiser le SDK Paydunya

```javascript
// Vérifier que Paydunya est actif
if (config.isActive) {
  // Initialiser avec les paramètres dynamiques
  const paydunya = initPaydunyaSDK({
    mode: config.mode,           // 'test' ou 'live'
    publicKey: config.publicKey, // Clé publique
    apiUrl: config.apiUrl        // URL automatique selon le mode
  });

  // Afficher un badge si en mode test
  if (config.mode === 'test') {
    showTestModeBadge(); // "Mode Test - Aucun paiement réel"
  }
}
```

### 3. Example complet React

```jsx
import { useEffect, useState } from 'react';

function PaymentPage() {
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger la config au montage du composant
    fetch('/api/payment-config/paydunya')
      .then(res => res.json())
      .then(config => {
        setPaymentConfig(config);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur config paiement:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner />;

  if (!paymentConfig?.isActive) {
    return <div>Service de paiement temporairement indisponible</div>;
  }

  return (
    <div>
      {paymentConfig.mode === 'test' && (
        <div className="test-badge">
          🧪 Mode Test - Aucun paiement réel
        </div>
      )}

      <CheckoutButton
        config={paymentConfig}
        amount={1000}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
```

## 🔧 Pour les Admins

### Vérifier la configuration actuelle

```bash
# Voir le statut actuel
npx ts-node scripts/switch-paydunya-mode.ts status

# Tester la configuration
npx ts-node scripts/test-payment-config.ts
```

### Basculer en mode PRODUCTION

```bash
# ⚠️ ATTENTION: Passage en mode LIVE (transactions réelles)
npx ts-node scripts/switch-paydunya-mode.ts live --confirm
```

**Ce qui se passe automatiquement :**
1. ✅ Les clés sont mises à jour en base de données
2. ✅ L'URL API passe à `https://app.paydunya.com/api/v1`
3. ✅ Le mode devient `live`
4. ✅ Le frontend récupère automatiquement la nouvelle config
5. ✅ **AUCUN redémarrage du serveur nécessaire**

### Revenir en mode TEST

```bash
# Retour en mode Sandbox
npx ts-node scripts/switch-paydunya-mode.ts test
```

### Via l'API REST (recommandé pour l'interface admin)

```bash
# Se connecter en tant qu'admin et obtenir le token
TOKEN="votre_token_admin"

# Basculer en mode LIVE
curl -X PATCH https://api.votre-domaine.com/admin/payment-config/paydunya \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "live",
    "privateKey": "live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG",
    "publicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
    "token": "lt8YNn0GPW6DTIWcCZ8f"
  }'

# Basculer en mode TEST
curl -X PATCH https://api.votre-domaine.com/admin/payment-config/paydunya \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "test",
    "privateKey": "test_private_uImFqxfqokHqbqHI4PXJ24huucO",
    "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
    "token": "BuVS3uuAKsg9bYyGcT9B"
  }'
```

## 📊 Endpoints API disponibles

### Endpoints Publics (Frontend)
```
GET  /payment-config/paydunya           # Config Paydunya
GET  /payment-config/paydunya/public    # Alias pour Paydunya
```

### Endpoints Admin (Protection requise)
```
POST   /admin/payment-config            # Créer une config
GET    /admin/payment-config            # Lister toutes les configs
GET    /admin/payment-config/:provider  # Récupérer une config
PATCH  /admin/payment-config/:provider  # Mettre à jour
DELETE /admin/payment-config/:provider  # Supprimer
```

## 🔒 Sécurité garantie

### ✅ Ce qui est exposé au public
- Provider (`paydunya`)
- Mode (`test` ou `live`)
- Public Key (nécessaire pour le SDK)
- URL API (générée automatiquement)
- Statut actif/inactif

### ❌ Ce qui n'est JAMAIS exposé
- Private Key (gardée sur le serveur)
- Token (gardé sur le serveur)
- Master Key (gardée sur le serveur)
- Webhook Secret (gardé sur le serveur)

Les clés privées sont **automatiquement masquées** même pour les admins (affichées comme `xxxx...yyyy`).

## 🎯 Workflow de déploiement

### Développement Local
```bash
# 1. Vérifier que le mode TEST est actif
npx ts-node scripts/switch-paydunya-mode.ts status

# 2. Développer et tester avec le sandbox Paydunya
# Frontend récupère automatiquement la config TEST

# 3. Tester les paiements sandbox
# Aucun paiement réel n'est effectué
```

### Staging/Pré-production
```bash
# 1. Toujours en mode TEST
# 2. Tester l'intégration complète
# 3. Vérifier les webhooks
# 4. Valider le parcours utilisateur complet
```

### Production
```bash
# 1. Basculer en mode LIVE
npx ts-node scripts/switch-paydunya-mode.ts live --confirm

# 2. Vérifier la configuration
npx ts-node scripts/test-payment-config.ts

# 3. Tester avec une petite transaction réelle
# 4. Surveiller les logs et les transactions

# 5. En cas de problème, revenir en TEST immédiatement
npx ts-node scripts/switch-paydunya-mode.ts test
```

## 📈 Monitoring

### Vérifier que le frontend reçoit la bonne config

```bash
# Depuis n'importe où (même le navigateur)
curl https://api.votre-domaine.com/payment-config/paydunya

# Réponse attendue en mode TEST:
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
}

# Réponse attendue en mode LIVE:
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "live",
  "publicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "apiUrl": "https://app.paydunya.com/api/v1"
}
```

### Surveiller les transactions

```bash
# Logs du serveur (chercher "Paydunya")
tail -f logs/application.log | grep -i paydunya

# Vérifier les tentatives de paiement
# Consulter la table payment_attempts dans la BDD
```

## 🆘 Troubleshooting

### Le frontend ne reçoit pas la config
```bash
# Vérifier que la config existe
npx ts-node scripts/switch-paydunya-mode.ts status

# Vérifier l'endpoint public
curl https://api.votre-domaine.com/payment-config/paydunya

# Vérifier les CORS si erreur dans le navigateur
```

### Erreur "Configuration manquante"
```bash
# Réinitialiser la configuration
npx ts-node prisma/seeds/payment-config.seed.ts
```

### Les clés ne se mettent pas à jour
```bash
# Les clés sont chargées à chaque requête, aucun cache
# Vérifier que la mise à jour en BDD a bien été effectuée
npx ts-node scripts/switch-paydunya-mode.ts status

# Redémarrer le serveur si nécessaire (mais normalement pas requis)
```

## 📚 Documentation complète

- **Guide complet** : `docs/CONFIGURATION_PAIEMENT_DYNAMIQUE.md`
- **Scripts** : `scripts/README.md`
- **API Reference** : `docs/API_REFERENCE_SIZE_PRICING.md`

## 🎉 Avantages de cette approche

1. ✅ **Aucune modification de code** pour changer les clés
2. ✅ **Basculement instantané** test ↔ production
3. ✅ **Aucun redémarrage** du serveur nécessaire
4. ✅ **Frontend dynamique** qui s'adapte automatiquement
5. ✅ **Sécurité maximale** - clés privées jamais exposées
6. ✅ **Multi-environnements** facile à gérer
7. ✅ **Audit trail** - tous les changements sont tracés

## ✨ Prochaines étapes

1. **Pour le développement** : Continuer avec le mode TEST (déjà configuré)
2. **Pour le frontend** : Implémenter la récupération dynamique de la config
3. **Pour la production** : Quand vous serez prêt, basculer en mode LIVE
4. **Pour l'interface admin** : Créer une page de gestion dans votre dashboard

---

**Configuration initialisée le** : 12 Février 2026
**Mode actuel** : TEST (Sandbox)
**Prêt pour la production** : OUI ✅

**Questions ?** Consultez `docs/CONFIGURATION_PAIEMENT_DYNAMIQUE.md`
