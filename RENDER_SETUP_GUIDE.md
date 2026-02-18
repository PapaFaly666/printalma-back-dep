# Guide de Configuration Render pour PrintAlma

Ce guide vous aide à configurer correctement votre application sur Render pour que PayDunya et toutes les fonctionnalités marchent.

## Problèmes actuels identifiés

1. WebSocket essaie de se connecter à `localhost` au lieu de Render
2. Le paiement PayDunya échoue (status: failed)
3. Les URLs frontend sont configurées pour localhost

## Solution : Configuration des Variables d'Environnement

---

## Étape 1 : Configuration Backend sur Render

### A. Accéder aux variables d'environnement

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Cliquez sur votre service **printalma-back-dep**
3. Allez dans l'onglet **Environment**
4. Cliquez sur **Add Environment Variable**

### B. Variables à ajouter (COPIEZ-COLLEZ depuis render-backend-env.txt)

Utilisez le fichier `render-backend-env.txt` pour copier-coller toutes les variables.

**Variables critiques :**

```bash
# Base de données (vous l'avez déjà normalement)
DATABASE_URL=postgresql://neondb_owner:npg_0sgo5NeipWTz@ep-hidden-river-aduafitn-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT
JWT_SECRET=12a99aeunv847e3e8e941jnb5612fdeb62f87fab6a54a859405c041ae14cfeod

# Cloudinary
CLOUDINARY_CLOUD_NAME=dsxab4qnu
CLOUDINARY_API_KEY=267848335846173
CLOUDINARY_API_SECRET=WLhzU3riCxujR1DXRXyMmLPUCoU

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=pfdiagne35@gmail.com
SMTP_PASS=azdebdsvilmpowld

# PayDunya LIVE (IMPORTANT!)
PAYDUNYA_MASTER_KEY=BYRJC1bN-y1Cd-zIzw-HNmm-1rxJsAYSlFV1
PAYDUNYA_PRIVATE_KEY=live_private_wFaMv8rlrXEPBMrhdLvCGkgnZrx
PAYDUNYA_PUBLIC_KEY=live_public_wSgaaAEcQw2ntO8Y4aIBHeyGwvt
PAYDUNYA_TOKEN=aoSNq1dFGdWsscRFF63O
PAYDUNYA_MODE=live

# URLs PayDunya (CRITICAL!)
PAYDUNYA_CALLBACK_URL=https://printalma-back-dep.onrender.com/paydunya/webhook
PAYDUNYA_SUCCESS_URL=https://printalma-website-dep.onrender.com/order-confirmation
PAYDUNYA_RETURN_URL=https://printalma-website-dep.onrender.com/order-confirmation
PAYDUNYA_CANCEL_URL=https://printalma-website-dep.onrender.com/order-confirmation

# Frontend URL (IMPORTANT pour CORS!)
FRONTEND_URL=https://printalma-website-dep.onrender.com

# Port (Render le définit automatiquement, mais on peut le spécifier)
PORT=3004
```

### C. Sauvegarder

Après avoir ajouté toutes les variables, le service va automatiquement redémarrer.

---

## Étape 2 : Configuration Frontend sur Render

### A. Accéder aux variables d'environnement

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Cliquez sur votre service **printalma-website-dep**
3. Allez dans l'onglet **Environment**
4. Cliquez sur **Add Environment Variable**

### B. Déterminer votre framework frontend

Vérifiez dans votre `package.json` frontend si vous utilisez :
- **Vite** → Utilisez le préfixe `VITE_`
- **Create React App** → Utilisez le préfixe `REACT_APP_`

### C. Variables à ajouter

**Pour Vite (recommandé) :**

```bash
VITE_API_URL=https://printalma-back-dep.onrender.com
VITE_WS_URL=https://printalma-back-dep.onrender.com
VITE_FRONTEND_URL=https://printalma-website-dep.onrender.com
```

**OU pour Create React App :**

```bash
REACT_APP_API_URL=https://printalma-back-dep.onrender.com
REACT_APP_WS_URL=https://printalma-back-dep.onrender.com
REACT_APP_FRONTEND_URL=https://printalma-website-dep.onrender.com
```

### D. Redéployer le frontend

**IMPORTANT :** Les variables d'environnement frontend sont compilées dans le build.

1. Après avoir ajouté les variables, allez dans **Manual Deploy**
2. Cliquez sur **Clear build cache & deploy**
3. Attendez que le build se termine (5-10 minutes)

---

## Étape 3 : Vérification

### A. Tester le backend

Ouvrez dans votre navigateur :
```
https://printalma-back-dep.onrender.com/paydunya/test-config
```

Vous devriez voir :
```json
{
  "success": true,
  "message": "PayDunya service is configured and ready",
  "data": {
    "mode": "live",
    "hasMasterKey": true,
    "hasPrivateKey": true,
    "hasToken": true
  }
}
```

### B. Tester le frontend

1. Ouvrez `https://printalma-website-dep.onrender.com`
2. Ouvrez la console du navigateur (F12)
3. Vérifiez qu'il n'y a plus d'erreurs de connexion à `localhost`
4. Le WebSocket devrait se connecter à `wss://printalma-back-dep.onrender.com`

### C. Tester un paiement

1. Créez une commande test
2. Procédez au paiement
3. Vérifiez que :
   - La page de paiement PayDunya s'ouvre
   - Après paiement, vous êtes redirigé vers `/order-confirmation`
   - Le statut de la commande se met à jour

---

## Étape 4 : Logs et Debugging

### A. Voir les logs backend

1. Sur Render Dashboard → printalma-back-dep
2. Onglet **Logs**
3. Cherchez les messages d'erreur PayDunya

### B. Voir les logs frontend

1. Dans votre navigateur sur `https://printalma-website-dep.onrender.com`
2. Ouvrez la Console (F12 → Console)
3. Cherchez les erreurs de connexion

---

## Checklist de Vérification

- [ ] Backend : Toutes les variables PayDunya ajoutées
- [ ] Backend : FRONTEND_URL configurée
- [ ] Backend : Service redémarré automatiquement
- [ ] Frontend : Variables VITE_ ou REACT_APP_ ajoutées
- [ ] Frontend : Build cache effacé et redéployé
- [ ] Test : `/paydunya/test-config` retourne success
- [ ] Test : Frontend ne se connecte plus à localhost
- [ ] Test : WebSocket se connecte à Render
- [ ] Test : Paiement PayDunya fonctionne

---

## Support et Dépannage

### Si le paiement échoue toujours :

1. Vérifiez les logs backend pour voir le statut PayDunya
2. Testez l'endpoint : `GET /paydunya/status/{token}`
3. Vérifiez que PayDunya peut atteindre votre webhook

### Si WebSocket ne se connecte pas :

1. Vérifiez que `VITE_WS_URL` (ou `REACT_APP_WS_URL`) est bien configuré
2. Vérifiez que le frontend a été reconstruit après l'ajout des variables
3. Effacez le cache du navigateur

### Si CORS bloque les requêtes :

1. Vérifiez que `FRONTEND_URL` est bien configuré dans le backend
2. Le backend autorise déjà votre frontend dans `src/main.ts:77`

---

## Contact

Si vous rencontrez des problèmes, vérifiez :
1. Les logs Render (Backend et Frontend)
2. La console du navigateur
3. Les variables d'environnement sont bien sauvegardées

**Fichiers de référence :**
- `render-backend-env.txt` - Variables backend à copier
- `render-frontend-env.txt` - Variables frontend à copier
- `test-render-config.sh` - Script de test
