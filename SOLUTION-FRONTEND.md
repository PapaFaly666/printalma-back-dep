# 🚨 SOLUTION : Configurer le Frontend sur Render

## Problème identifié :

Votre frontend utilise encore `localhost` au lieu des URLs Render !

Preuve dans vos logs :
```
WebSocket connection to 'wss://localhost:3004/' failed
```

## ✅ Solution en 3 étapes :

### ÉTAPE 1 : Configurer les variables sur Render Frontend

1. **Allez sur Render Dashboard**
   - https://dashboard.render.com
   - Cliquez sur **printalma-website-dep** (votre service frontend)

2. **Cliquez sur Environment** (dans la barre latérale gauche)

3. **Ajoutez ces 3 variables** (cliquez sur "Add Environment Variable") :

```bash
VITE_API_URL=https://printalma-back-dep.onrender.com
VITE_WS_URL=printalma-back-dep.onrender.com
VITE_FRONTEND_URL=https://printalma-website-dep.onrender.com
```

**⚠️ IMPORTANT :**
- `VITE_WS_URL` ne contient PAS `https://` ni `wss://` - juste le hostname !
- Votre code frontend construit automatiquement le protocole `wss://` ou `ws://`
- Si votre frontend utilise Create React App au lieu de Vite, remplacez `VITE_` par `REACT_APP_`

4. **Cliquez sur "Save Changes"**

---

### ÉTAPE 2 : Rebuild le frontend (OBLIGATOIRE !)

**⚠️ TRÈS IMPORTANT :**

Les variables d'environnement frontend sont **compilées dans le build**. Un simple redémarrage ne suffit pas !

1. Allez dans l'onglet **"Manual Deploy"**
2. Cliquez sur **"Clear build cache & deploy"**
3. ⏰ **ATTENDEZ 10-15 minutes** que le build se termine

**Ne passez PAS à l'étape 3 avant que le build soit terminé !**

---

### ÉTAPE 3 : Vérifier que ça marche

1. **Ouvrez votre site** : https://printalma-website-dep.onrender.com

2. **Ouvrez la Console du navigateur** :
   - Appuyez sur **F12**
   - Allez dans l'onglet **Console**

3. **Vérifiez qu'il n'y a PLUS cette erreur** :
   ```
   WebSocket connection to 'wss://localhost:3004/' failed  ❌
   ```

4. **Vous devriez voir** :
   ```
   WebSocket connected to wss://printalma-back-dep.onrender.com  ✅
   ```

5. **Testez un paiement** depuis votre interface :
   - Ajoutez un produit au panier
   - Passez une commande
   - Cliquez sur "Payer"
   - Vous devriez être redirigé vers PayDunya
   - Après paiement, retour sur order-confirmation

---

## 🔍 Comment vérifier que les variables sont bien prises en compte ?

### Méthode 1 : Console du navigateur

Ouvrez la console (F12) et tapez :

```javascript
console.log(import.meta.env.VITE_API_URL)
// Doit afficher : https://printalma-back-dep.onrender.com
```

**OU si Create React App :**

```javascript
console.log(process.env.REACT_APP_API_URL)
```

### Méthode 2 : Network tab

1. F12 → Onglet **Network**
2. Créez une commande
3. Vérifiez que les requêtes vont vers :
   - ✅ `https://printalma-back-dep.onrender.com/...`
   - ❌ PAS `http://localhost:3004/...`

---

## 📊 Résumé du problème :

| Ce qui marche | Ce qui ne marche pas |
|---------------|---------------------|
| ✅ Backend configuré | ❌ Frontend pas configuré |
| ✅ PayDunya fonctionne | ❌ Frontend utilise localhost |
| ✅ URL directe PayDunya marche | ❌ Interface frontend ne marche pas |
| ✅ Test curl marche | ❌ Variables d'environnement manquantes |

---

## ⚠️ Points importants :

1. **Les variables frontend sont compilées** dans le build
   - Vous DEVEZ rebuild après les avoir ajoutées
   - Un simple redémarrage ne suffit PAS

2. **Le build prend du temps**
   - 10-15 minutes en moyenne
   - Soyez patient !

3. **Effacez le cache du navigateur**
   - Après le rebuild, faites Ctrl+Shift+R
   - Pour être sûr d'avoir la nouvelle version

---

## 🎯 Checklist finale :

- [ ] Variables ajoutées sur Render Frontend
- [ ] "Clear build cache & deploy" lancé
- [ ] Attendu 10-15 minutes (build terminé)
- [ ] Site rafraîchi (Ctrl+Shift+R)
- [ ] Console ne montre plus "localhost"
- [ ] WebSocket se connecte à Render
- [ ] Paiement depuis l'interface fonctionne

---

## 🚀 Après avoir fait ces 3 étapes :

Votre interface fonctionnera exactement comme l'URL directe PayDunya !

Le flux sera :
1. Utilisateur clique sur "Payer" sur votre site
2. Votre frontend appelle votre backend Render
3. Votre backend crée la facture PayDunya
4. L'utilisateur est redirigé vers PayDunya
5. Après paiement, retour sur order-confirmation
6. Le webhook met à jour la commande

---

## ❓ Questions fréquentes :

**Q : Pourquoi ça marche avec l'URL directe mais pas depuis mon site ?**
R : Parce que l'URL directe bypass votre frontend. Votre frontend essaie d'appeler localhost qui n'existe pas sur Render.

**Q : J'ai ajouté les variables mais ça ne marche toujours pas ?**
R : Avez-vous fait "Clear build cache & deploy" ? Les variables ne sont prises en compte qu'après un rebuild complet.

**Q : Combien de temps doit durer le build ?**
R : Entre 5 et 15 minutes selon la taille de votre projet.

**Q : Est-ce que je dois aussi rebuild le backend ?**
R : Non, le backend redémarre automatiquement quand vous ajoutez des variables. Seul le frontend nécessite un rebuild manuel.
