# Checklist Rapide - Configuration Render

## Suivez ces étapes dans l'ordre :

### ✅ ÉTAPE 1 : Backend (15 minutes)

1. **Aller sur Render**
   - https://dashboard.render.com
   - Cliquez sur **printalma-back-dep**

2. **Configurer les variables**
   - Cliquez sur **Environment** (dans la barre latérale)
   - Ouvrez le fichier `render-backend-env.txt`
   - Copiez-collez TOUTES les variables une par une
   - Cliquez sur **Save Changes**

3. **Attendre le redémarrage**
   - Le service va redémarrer automatiquement
   - Attendez 2-3 minutes

4. **Vérifier**
   - Ouvrez : https://printalma-back-dep.onrender.com/paydunya/test-config
   - Vous devez voir `"success": true`

---

### ✅ ÉTAPE 2 : Frontend (20 minutes)

1. **Aller sur Render**
   - https://dashboard.render.com
   - Cliquez sur **printalma-website-dep**

2. **Configurer les variables**
   - Cliquez sur **Environment**
   - Ouvrez le fichier `render-frontend-env.txt`
   - Copiez les variables **VITE_** (ou **REACT_APP_** selon votre framework)
   - Cliquez sur **Save Changes**

3. **IMPORTANT : Rebuild**
   - Allez dans l'onglet **Manual Deploy**
   - Cliquez sur **Clear build cache & deploy**
   - ⏰ **ATTENDEZ 10-15 minutes** que le build se termine

4. **Vérifier**
   - Ouvrez : https://printalma-website-dep.onrender.com
   - Ouvrez la Console (F12)
   - Vérifiez qu'il n'y a plus d'erreurs avec "localhost"
   - Le WebSocket doit se connecter à Render, pas localhost

---

### ✅ ÉTAPE 3 : Test de Paiement (5 minutes)

1. **Créer une commande test**
   - Allez sur votre site : https://printalma-website-dep.onrender.com
   - Ajoutez un produit au panier
   - Passez une commande

2. **Tester le paiement**
   - Cliquez sur "Payer"
   - Vous devriez être redirigé vers PayDunya
   - **ATTENTION** : Mode LIVE = Vrai paiement !

3. **Vérifier après paiement**
   - Après avoir payé, vous devriez être redirigé vers `/order-confirmation`
   - Le statut de la commande doit se mettre à jour

---

## 🚨 Problèmes Courants

### Le backend ne démarre pas
→ Vérifiez les logs : Dashboard → printalma-back-dep → Logs
→ Vérifiez que `DATABASE_URL` est correcte

### Le frontend affiche toujours "localhost"
→ Vous avez oublié de faire "Clear build cache & deploy"
→ Rebuild le frontend complètement

### Le paiement échoue
→ Vérifiez que les variables `PAYDUNYA_CALLBACK_URL` etc. sont correctes
→ Testez : https://printalma-back-dep.onrender.com/paydunya/test-config

### WebSocket ne se connecte pas
→ Vérifiez que `VITE_WS_URL` est bien configuré
→ Effacez le cache du navigateur (Ctrl+Shift+R)

---

## 📞 Support

Si ça ne marche toujours pas après avoir tout suivi :

1. **Vérifiez les logs backend**
   - Render Dashboard → printalma-back-dep → Logs
   - Cherchez les erreurs PayDunya

2. **Vérifiez la console frontend**
   - Sur votre site, F12 → Console
   - Cherchez les erreurs de connexion

3. **Testez avec le script**
   ```bash
   bash test-render-config.sh
   ```

---

## ⏱️ Temps Total Estimé : 40 minutes

- Backend : 15 min
- Frontend : 20 min (build inclus)
- Tests : 5 min

---

## ✅ Quand c'est bon

Vous saurez que tout marche quand :

✅ https://printalma-back-dep.onrender.com/paydunya/test-config retourne `success: true`
✅ Le frontend ne tente plus de se connecter à localhost
✅ Le WebSocket se connecte à wss://printalma-back-dep.onrender.com
✅ Un paiement test fonctionne et redirige correctement

---

**Bon courage ! 🚀**
