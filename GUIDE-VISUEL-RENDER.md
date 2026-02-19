# 📸 Guide Visuel : Configurer Render Frontend

## 🎯 Objectif : Faire marcher les paiements depuis votre interface

---

## 📋 ÉTAPE 1 : Aller sur Render Dashboard

```
1. Ouvrez votre navigateur
2. Allez sur : https://dashboard.render.com
3. Connectez-vous avec vos identifiants
```

Vous verrez vos services :
```
┌─────────────────────────────────────┐
│  My Services                        │
├─────────────────────────────────────┤
│  📦 printalma-back-dep   (Backend)  │
│  🌐 printalma-website-dep (Frontend)│
└─────────────────────────────────────┘
```

**Cliquez sur : printalma-website-dep** (le frontend)

---

## 📋 ÉTAPE 2 : Aller dans Environment

Dans la barre latérale gauche, vous verrez :

```
┌──────────────┐
│ Dashboard    │
│ Events       │
│ Logs         │
│ Shell        │
│ Metrics      │
│ ✅ Environment │  ← CLIQUEZ ICI !
│ Settings     │
│ Manual Deploy│
└──────────────┘
```

---

## 📋 ÉTAPE 3 : Ajouter les variables

Vous verrez une page avec :

```
┌─────────────────────────────────────────┐
│  Environment Variables                  │
├─────────────────────────────────────────┤
│                                         │
│  [+ Add Environment Variable]  ← CLIQUEZ│
│                                         │
│  Existing variables:                    │
│  (peut-être vide ou avec quelques vars) │
└─────────────────────────────────────────┘
```

**Cliquez sur "+ Add Environment Variable"**

Un formulaire apparaît :

```
┌─────────────────────────────────────┐
│  Key:   [_________________]         │
│  Value: [_________________]         │
│                                     │
│  [Cancel]  [Add]                    │
└─────────────────────────────────────┘
```

### Ajoutez ces 3 variables UNE PAR UNE :

**Variable 1 :**
```
Key:   VITE_API_URL
Value: https://printalma-back-dep.onrender.com
```
Cliquez sur **Add**

**Variable 2 :**
```
Key:   VITE_WS_URL
Value: printalma-back-dep.onrender.com
```
⚠️ **ATTENTION : Pas de https:// ni wss:// ici !**
Cliquez sur **Add**

**Variable 3 :**
```
Key:   VITE_FRONTEND_URL
Value: https://printalma-website-dep.onrender.com
```
Cliquez sur **Add**

Après avoir ajouté les 3 variables, vous verrez :

```
┌─────────────────────────────────────────────────────────┐
│  Environment Variables                                  │
├─────────────────────────────────────────────────────────┤
│  VITE_API_URL = https://printalma-back-dep.onrender.com │
│  VITE_WS_URL = https://printalma-back-dep.onrender.com  │
│  VITE_FRONTEND_URL = https://printalma-website-dep...   │
├─────────────────────────────────────────────────────────┤
│  [Save Changes]  ← CLIQUEZ ICI MAINTENANT !             │
└─────────────────────────────────────────────────────────┘
```

**Cliquez sur "Save Changes"** en bas de la page

---

## 📋 ÉTAPE 4 : Rebuild le Frontend (CRUCIAL !)

⚠️ **NE SAUTEZ PAS CETTE ÉTAPE !**

Après avoir sauvegardé les variables, allez dans **Manual Deploy** :

```
┌──────────────┐
│ Dashboard    │
│ Events       │
│ Logs         │
│ Shell        │
│ Metrics      │
│ Environment  │
│ Settings     │
│ ✅ Manual Deploy│  ← CLIQUEZ ICI !
└──────────────┘
```

Vous verrez :

```
┌─────────────────────────────────────────────────┐
│  Manual Deploy                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Clear build cache & deploy]  ← CLIQUEZ ICI ! │
│                                                 │
│  OU                                             │
│                                                 │
│  [Deploy latest commit]                         │
└─────────────────────────────────────────────────┘
```

**Cliquez sur "Clear build cache & deploy"**

⏰ **Un build va commencer. Cela prend 10-15 minutes !**

Vous verrez :

```
┌─────────────────────────────────────────┐
│  🔄 Build in Progress...                │
│                                         │
│  ==> Installing dependencies            │
│  ==> npm install                        │
│  ==> Building application               │
│  ==> npm run build                      │
│                                         │
│  ⏰ This may take 10-15 minutes...      │
└─────────────────────────────────────────┘
```

**ATTENDEZ que le build se termine !**

Quand c'est fini, vous verrez :

```
┌─────────────────────────────────────────┐
│  ✅ Live                                 │
│                                         │
│  Your service is live at:               │
│  https://printalma-website-dep.render...│
└─────────────────────────────────────────┘
```

---

## 📋 ÉTAPE 5 : Vérifier que ça marche

### 1. Ouvrez votre site

Allez sur : https://printalma-website-dep.onrender.com

### 2. Ouvrez la Console (F12)

Appuyez sur **F12** sur votre clavier

Vous verrez :

```
┌─────────────────────────────────────────────┐
│  Elements  Console  Network  Application  │
│            ↑↑↑↑↑↑↑                          │
│            CLIQUEZ ICI                      │
├─────────────────────────────────────────────┤
│  > [API] 📤 GET /products                   │
│  > [API] ✅ 200 /products                   │
│  > 🔌 WebSocket connecting...               │
│  > ✅ WebSocket connected to wss://printa...│
│    ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑            │
│    SI VOUS VOYEZ ÇA = ✅ C'EST BON !        │
└─────────────────────────────────────────────┘
```

### ❌ Si vous voyez encore "localhost" :

```
┌─────────────────────────────────────────────┐
│  Console                                    │
├─────────────────────────────────────────────┤
│  ❌ WebSocket connection to 'wss://localhost│
│     :3004/' failed                          │
│    ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑                      │
│    SI VOUS VOYEZ ÇA = ❌ PAS BON           │
└─────────────────────────────────────────────┘
```

**Solutions :**
1. Vérifiez que vous avez bien ajouté les variables
2. Vérifiez que vous avez fait "Clear build cache & deploy"
3. Attendez que le build soit TERMINÉ
4. Rafraîchissez la page (Ctrl + Shift + R)

### 3. Testez un paiement

```
1. Ajoutez un produit au panier
2. Allez au checkout
3. Cliquez sur "Payer avec PayDunya"
4. Vous devriez être redirigé vers PayDunya
5. Effectuez le paiement
6. Vous revenez sur order-confirmation
```

---

## ✅ Checklist Finale

Cochez chaque étape au fur et à mesure :

```
[ ] 1. Allé sur Render Dashboard
[ ] 2. Cliqué sur printalma-website-dep
[ ] 3. Cliqué sur Environment
[ ] 4. Ajouté VITE_API_URL
[ ] 5. Ajouté VITE_WS_URL
[ ] 6. Ajouté VITE_FRONTEND_URL
[ ] 7. Cliqué sur "Save Changes"
[ ] 8. Allé dans Manual Deploy
[ ] 9. Cliqué sur "Clear build cache & deploy"
[ ] 10. Attendu 10-15 minutes (build terminé)
[ ] 11. Ouvert le site
[ ] 12. Ouvert la Console (F12)
[ ] 13. Vérifié : pas de "localhost" dans les erreurs
[ ] 14. Vérifié : WebSocket connecté à Render
[ ] 15. Testé un paiement
[ ] 16. ✅ ÇA MARCHE !
```

---

## 🎉 Quand c'est bon

Vous saurez que tout marche quand :

✅ Console : Pas d'erreur "localhost"
✅ Console : "WebSocket connected to wss://printalma-back-dep.onrender.com"
✅ Paiement : Redirection vers PayDunya fonctionne
✅ Paiement : Retour sur order-confirmation fonctionne
✅ Paiement : Commande mise à jour dans la base de données

---

## 💡 Astuce : Comment savoir si le build est terminé ?

Dans l'onglet "Logs", le dernier message sera :

```
✅ Build successful
✅ Starting service...
✅ Service is live
```

---

## 📞 Besoin d'aide ?

Si vous bloquez à une étape, dites-moi exactement :
1. À quelle étape vous êtes (numéro)
2. Ce que vous voyez à l'écran
3. Le message d'erreur si il y en a un

Je vous aiderai à débloquer la situation !
