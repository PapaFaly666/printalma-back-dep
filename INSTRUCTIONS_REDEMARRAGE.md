# 🔄 INSTRUCTIONS POUR REDÉMARRER LE SERVEUR CORRECTEMENT

## ⚠️ PROBLÈME IDENTIFIÉ

Votre serveur utilise les **anciennes variables .env en cache**. Le fichier .env est correct mais le serveur ne l'a pas rechargé.

## ✅ SOLUTION: Redémarrage complet

### Étape 1: Tuer TOUS les processus Node.js

```bash
# Tuez le serveur actuel
pkill -9 node

# Ou plus ciblé:
ps aux | grep nest
# Puis tuez le PID du processus nest
kill -9 <PID>
```

### Étape 2: Vérifier qu'aucun processus ne tourne

```bash
# Vérifiez qu'il n'y a plus de processus
ps aux | grep node | grep -v grep

# Si rien ne s'affiche, c'est bon
```

### Étape 3: Redémarrer proprement

```bash
# Dans le dossier du projet
cd /home/pfdev/Bureau/PrintalmaProject/printalma-back-dep

# Redémarrer
npm run start:dev
```

### Étape 4: Vérifier les logs au démarrage

Cherchez dans les logs:
```
[PaydunyaService] Using PayDunya configuration from database
```

Vous devriez voir que le mode est **live**.

## 🧪 TEST APRÈS REDÉMARRAGE

Une fois le serveur redémarré, créez une **NOUVELLE commande** et vérifiez dans les logs:

1. **Token généré** : doit être sans préfixe `test_`
2. **URL générée** : `https://paydunya.com/checkout/invoice/{TOKEN}`
3. **Mode** : `live (from database)`

## 📝 Configuration actuelle validée

✅ **Base de données:**
- Provider: PAYDUNYA
- Mode: live
- Clés LIVE configurées

✅ **Fichier .env:**
- PAYDUNYA_MODE="live"
- PAYDUNYA_PRIVATE_KEY="live_private_wFaMv8rlrXEPBMrhdLvCGkgnZrx"
- PAYDUNYA_TOKEN="aoSNq1dFGdWsscRFF63O"
- PAYDUNYA_CALLBACK_URL="https://webhook.site/f6e65778-b5b6-4050-9dfe-2e6ec6f84b69"

## 🎯 Après le redémarrage

Le serveur utilisera **la configuration BDD en priorité** (qui est correcte: mode LIVE).

Testez en créant une commande et le lien devrait fonctionner parfaitement!
