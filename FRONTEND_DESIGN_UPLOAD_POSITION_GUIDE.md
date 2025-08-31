# 🎨 Guide Frontend – Upload d’un Design & Sauvegarde de sa Position (sans 404)

> Ce document explique l’erreur « Produit introuvable » qui survient juste après l’upload d’un design, et comment la corriger pas à pas.

---

## 1. Scénario de l’erreur

1. L’utilisateur choisit un produit de base (ID `2`).
2. Il upload un nouveau design (ID `28`).
3. Le front appelle :
   ```http
   PUT /api/vendor-products/2/designs/28/position/direct
   ```
4. Le backend renvoie `404 NOT_FOUND` – « Produit introuvable ».

**Pourquoi ?** `2` est le `baseProductId`. Le backend attend le `vendorProductId` créé **après** l’upload (ex : `70`). Tant que vous n’utilisez pas ce nouvel ID, toutes les requêtes `/position/direct` échouent.

---

## 2. Cycle de vie complet à connaître

| Étape | Ce qu’il se passe côté backend | Ce que le front doit faire |
|-------|--------------------------------|---------------------------|
| a. Sélection du produit de base | rien | – |
| b. Upload du design | Retour JSON `designId = 28` | Stocker `designId` |
| c. Création du **VendorProduct** associé | L’API `POST /vendor/publish` retourne `vendorProductId` (ex : `70`) | RÉCUPÉRER cet ID et l’ajouter dans votre state `vendorProducts` |
| d. Sauvegarde position | Appeler `PUT /api/vendor-products/70/designs/28/position/direct` | OK 200 |

Tant que **(c)** n’est pas terminée, l’appel **(d)** ne peut pas réussir.

---

## 3. Implémentation en React : code snippet

```ts
// 1️⃣ Après upload, on attend la réponse publish
const publish = await api.post('/vendor/publish', { baseProductId: 2, designId: 28 });
const vpId = publish.data.vendorProductId; // ex : 70

// 2️⃣ On met à jour notre liste locale
setVendorProducts(prev => [...prev, { id: vpId, baseProductId: 2 }]);

// 3️⃣ On résout les ids
const realVpId  = resolveVendorProductId({ id: vpId }, vendorProducts);
const realDesId = 28;

// 4️⃣ On envoie la position
await saveDesignPosition(realVpId, realDesId, positioning);
```

> Si vous travaillez avec Redux ou RTK Query, déclenchez `invalidateTags` sur `vendorProducts` après publish pour forcer la refetch dans tous les composants.

---

## 4. Vérification rapide

1. **DevTools > Network** doit montrer un `PUT /api/vendor-products/70/designs/28/position/direct` 200.
2. Dans PostgreSQL :
   ```sql
   SELECT * FROM product_design_positions
   WHERE vendor_product_id = 70 AND design_id = 28;
   ```
   ➜ 1 ligne.

---

## 5. Checklist « Ça marche »

- [ ] Vous stockez bien `vendorProductId` renvoyé par `/vendor/publish`.
- [ ] Vos appels `/position/direct` utilisent cet ID et non `baseProductId`.
- [ ] Plus aucun 404 dans DevTools. 😊

---

👉 Pour plus de détails, voir également :
* `FRONTEND_FIX_404_POSITION.md` – version ultra-courte
* `FRONTEND_POSITION_ENDPOINTS_FIX_GUIDE.md` – version complète 