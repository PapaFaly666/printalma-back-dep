# Scripts de gestion Paydunya

## 📋 Vue d'ensemble

Ces scripts permettent de gérer facilement la configuration Paydunya sans toucher au code.

## 🚀 Scripts disponibles

### 1. Basculer entre TEST et LIVE

```bash
# Voir la configuration actuelle
npx ts-node scripts/switch-paydunya-mode.ts status

# Basculer en mode TEST
npx ts-node scripts/switch-paydunya-mode.ts test

# Basculer en mode LIVE (PRODUCTION)
npx ts-node scripts/switch-paydunya-mode.ts live --confirm
```

⚠️ **IMPORTANT** : Le passage en mode LIVE nécessite l'ajout de `--confirm` pour éviter les erreurs.

### 2. Initialiser les configurations

```bash
# Créer/réinitialiser la configuration Paydunya
npx ts-node prisma/seeds/payment-config.seed.ts
```

Ce script :
- Crée la configuration TEST (active par défaut)
- Prépare les clés LIVE (prêtes à l'emploi)

## 📊 Exemple d'utilisation

### Vérifier la configuration actuelle

```bash
$ npx ts-node scripts/switch-paydunya-mode.ts status

📋 Configuration actuelle:

   Provider: paydunya
   Mode: test
   Active: true
   Public Key: test_public_kvxlzRxF...
   Dernière mise à jour: 2026-02-12T10:30:00.000Z

ℹ️  Mode TEST actif
```

### Basculer en mode LIVE pour la production

```bash
$ npx ts-node scripts/switch-paydunya-mode.ts live --confirm

🔄 Basculement vers le mode LIVE...

✅ Configuration mise à jour avec succès !
   Provider: paydunya
   Mode: live
   Active: true
   Public Key: live_public_JzyUBGQTafgp...
   Mise à jour: 2026-02-12T10:35:00.000Z

⚠️  ATTENTION: Vous êtes maintenant en mode PRODUCTION !
   Toutes les transactions seront réelles.
```

### Revenir en mode TEST

```bash
$ npx ts-node scripts/switch-paydunya-mode.ts test

🔄 Basculement vers le mode TEST...

✅ Configuration mise à jour avec succès !
   Provider: paydunya
   Mode: test
   Active: true
   Public Key: test_public_kvxlzRxF...
   Mise à jour: 2026-02-12T10:40:00.000Z

ℹ️  Mode TEST activé - Transactions sandbox uniquement
```

## 🔐 Clés configurées

### Mode TEST (par défaut)
- Private Key: `test_private_uImFqxfqokHqbqHI4PXJ24huucO`
- Public Key: `test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt`
- Token: `BuVS3uuAKsg9bYyGcT9B`
- URL API: `https://app.paydunya.com/sandbox-api/v1`

### Mode LIVE (production)
- Private Key: `live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG`
- Public Key: `live_public_JzyUBGQTafgpOPqRulSDGDVfHzz`
- Token: `lt8YNn0GPW6DTIWcCZ8f`
- URL API: `https://app.paydunya.com/api/v1`

## 🎯 Workflow recommandé

### Développement
1. Utilisez le mode TEST (configuré par défaut)
2. Testez vos paiements sur le sandbox Paydunya
3. Vérifiez les webhooks et callbacks

### Passage en production
1. Vérifiez que tout fonctionne en mode TEST
2. Basculez en mode LIVE : `npx ts-node scripts/switch-paydunya-mode.ts live --confirm`
3. Vérifiez la configuration : `npx ts-node scripts/switch-paydunya-mode.ts status`
4. Testez avec une petite transaction réelle

### Retour en développement
1. Basculez en mode TEST : `npx ts-node scripts/switch-paydunya-mode.ts test`
2. Continuez vos développements sans risque

## 📡 Alternative : API REST

Vous pouvez aussi utiliser l'API REST admin :

### Voir la configuration
```bash
curl -X GET https://api.votre-domaine.com/admin/payment-config/paydunya \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Basculer en mode LIVE
```bash
curl -X PATCH https://api.votre-domaine.com/admin/payment-config/paydunya \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "live",
    "privateKey": "live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG",
    "publicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
    "token": "lt8YNn0GPW6DTIWcCZ8f"
  }'
```

### Basculer en mode TEST
```bash
curl -X PATCH https://api.votre-domaine.com/admin/payment-config/paydunya \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "test",
    "privateKey": "test_private_uImFqxfqokHqbqHI4PXJ24huucO",
    "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
    "token": "BuVS3uuAKsg9bYyGcT9B"
  }'
```

## ✅ Vérification

Après chaque basculement, vérifiez que le frontend reçoit bien la bonne configuration :

```bash
curl https://api.votre-domaine.com/payment-config/paydunya
```

Réponse attendue en mode TEST :
```json
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
}
```

Réponse attendue en mode LIVE :
```json
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "live",
  "publicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "apiUrl": "https://app.paydunya.com/api/v1"
}
```

## 🛡️ Sécurité

- ✅ Les clés privées ne sont jamais exposées au frontend
- ✅ Seul l'admin peut modifier la configuration
- ✅ Confirmation requise pour le mode LIVE
- ✅ Logs de toutes les modifications

## 📞 Support

En cas de problème :
1. Vérifiez les logs du serveur
2. Consultez `docs/CONFIGURATION_PAIEMENT_DYNAMIQUE.md`
3. Vérifiez que la base de données est accessible
4. Testez la connexion à l'API Paydunya

---

**Dernière mise à jour** : 12 Février 2026
