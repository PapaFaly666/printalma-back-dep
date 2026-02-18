# 🚨 Solution: Erreur Paiement PayDunya en Production

## Problème Identifié
Votre configuration utilise le **mode LIVE** mais avec des URLs `localhost` qui ne fonctionnent pas en production.

PayDunya ne peut pas :
- ❌ Notifier votre backend (`callback_url` pointe vers webhook.site)
- ❌ Rediriger vos clients (URLs `localhost` non accessibles)

---

## ✅ Solution Rapide (Développement)

### Basculer en mode TEST

Si vous êtes encore en développement, passez en mode TEST :

```bash
npx ts-node scripts/switch-paydunya-mode.ts test
```

Le mode TEST fonctionne avec des URLs localhost.

---

## 🚀 Solution Production

### Option 1: Utiliser ngrok (Temporaire)

**ngrok** expose votre localhost sur internet avec une URL publique.

#### Étape 1: Installer ngrok
```bash
# Télécharger depuis https://ngrok.com/download
# Ou installer via snap:
sudo snap install ngrok
```

#### Étape 2: Créer un compte ngrok gratuit
1. Allez sur https://ngrok.com/signup
2. Récupérez votre authtoken
3. Configurez ngrok:
```bash
ngrok config add-authtoken VOTRE_TOKEN
```

#### Étape 3: Lancer ngrok pour le backend (port 3004)
```bash
# Dans un terminal séparé
ngrok http 3004
```

Vous obtiendrez une URL comme: `https://abc123.ngrok.io`

#### Étape 4: Lancer ngrok pour le frontend (port 5174)
```bash
# Dans un autre terminal
ngrok http 5174
```

Vous obtiendrez une URL comme: `https://xyz789.ngrok.io`

#### Étape 5: Mettre à jour le .env
```bash
# Remplacez dans .env avec vos URLs ngrok:
PAYDUNYA_CALLBACK_URL="https://abc123.ngrok.io/paydunya/webhook"
FRONTEND_URL="https://xyz789.ngrok.io"
PAYDUNYA_SUCCESS_URL="https://xyz789.ngrok.io/order-confirmation"
PAYDUNYA_RETURN_URL="https://xyz789.ngrok.io/order-confirmation"
PAYDUNYA_CANCEL_URL="https://xyz789.ngrok.io/order-confirmation"
```

#### Étape 6: Redémarrer le backend
```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run start:dev
```

#### ⚠️ Limitations de ngrok
- Les URLs changent à chaque redémarrage (version gratuite)
- Limite de connexions simultanées
- Bon pour les tests, pas pour la production finale

---

### Option 2: Déployer sur un serveur (Production finale)

#### Services de déploiement recommandés:

**Backend (NestJS):**
- [Railway](https://railway.app) - Gratuit pour commencer
- [Render](https://render.com) - Gratuit avec limitations
- [Heroku](https://heroku.com) - Plan gratuit disponible
- [DigitalOcean](https://digitalocean.com) - À partir de $5/mois
- VPS avec votre propre domaine

**Frontend (React/Vue):**
- [Vercel](https://vercel.com) - Gratuit
- [Netlify](https://netlify.com) - Gratuit
- [Cloudflare Pages](https://pages.cloudflare.com) - Gratuit

#### Exemple avec Railway (Backend):

1. **Créer un compte sur railway.app**

2. **Déployer le backend:**
```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init

# Déployer
railway up
```

3. **Configurer les variables d'environnement sur Railway:**
   - Copier toutes les variables du `.env`
   - Mettre à jour `FRONTEND_URL` avec votre URL Vercel/Netlify
   - Mettre à jour `PAYDUNYA_CALLBACK_URL` avec votre URL Railway

4. **Récupérer l'URL du backend:**
   - Railway génère une URL comme: `https://votre-app.up.railway.app`

#### Exemple avec Vercel (Frontend):

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod

# Configurer les variables d'environnement
# VITE_API_URL=https://votre-app.up.railway.app
```

#### Mettre à jour le .env final:
```bash
# Backend (Railway URL)
PAYDUNYA_CALLBACK_URL="https://votre-app.up.railway.app/paydunya/webhook"

# Frontend (Vercel URL)
FRONTEND_URL="https://votre-app.vercel.app"
PAYDUNYA_SUCCESS_URL="https://votre-app.vercel.app/order-confirmation"
PAYDUNYA_RETURN_URL="https://votre-app.vercel.app/order-confirmation"
PAYDUNYA_CANCEL_URL="https://votre-app.vercel.app/order-confirmation"
```

---

## 🧪 Tester la configuration

Après avoir mis à jour les URLs:

```bash
# 1. Vérifier la configuration
npx ts-node scripts/test-payment-config.ts

# 2. Tester la connexion PayDunya
npx ts-node scripts/test-invoice-creation.ts

# 3. Créer une commande de test via l'API
# (utilisez Postman ou curl)
```

---

## 🔍 Vérifier les URLs actives

```bash
# Voir la configuration actuelle
npx ts-node scripts/switch-paydunya-mode.ts status

# Tester les endpoints
curl https://votre-backend-url/paydunya/test-config
curl https://votre-backend-url/paydunya/network-test
```

---

## 📊 Suivi des Paiements

### Webhook Debugging

Pour débugger les webhooks PayDunya pendant le développement:

1. **Utiliser webhook.site** (temporaire)
   - Aller sur https://webhook.site
   - Copier votre URL unique
   - Mettre dans `PAYDUNYA_CALLBACK_URL`
   - Observer les requêtes en temps réel

2. **Utiliser ngrok** (recommandé)
   - Plus fiable que webhook.site
   - Permet de recevoir les callbacks sur votre serveur local
   - Meilleur pour le debugging

### Logs en temps réel

```bash
# Surveiller les logs du backend
tail -f logs/application.log | grep -i paydunya

# Ou dans le terminal où tourne le serveur
# Les logs PayDunya sont préfixés avec 💳 📤 📥
```

---

## 🆘 Support

En cas de problème:

1. Vérifier les logs: `/logs/application.log`
2. Tester la configuration: `npx ts-node scripts/test-payment-config.ts`
3. Vérifier le mode: `npx ts-node scripts/switch-paydunya-mode.ts status`
4. Consulter la documentation: `/docs/PAYDUNYA_*.md`

---

## ✅ Checklist de Production

Avant de passer en LIVE:

- [ ] Backend déployé avec URL publique HTTPS
- [ ] Frontend déployé avec URL publique HTTPS
- [ ] Toutes les URLs dans `.env` sont publiques (pas de localhost)
- [ ] `PAYDUNYA_CALLBACK_URL` pointe vers votre API (/paydunya/webhook)
- [ ] Mode LIVE activé avec les bonnes clés
- [ ] Test de paiement réussi en mode TEST
- [ ] Test de paiement réussi en mode LIVE (petit montant)
- [ ] Webhooks reçus correctement
- [ ] Emails de confirmation envoyés
- [ ] Commandes mises à jour automatiquement

---

**Date:** 18 Février 2026
**Status:** ✅ Problème identifié - Solution documentée
