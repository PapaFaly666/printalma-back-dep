# ↔️ Migration des **Transformations** (Legacy) vers **Positions Directes** (V2)

> 08/07/2025 – Pour tous les développeurs front
>
> Vous constatez que la table **`VendorDesignTransform`** (ou `ProductDesignTransform`) reste vide depuis la mise à jour V2 ? C’est normal : **l’architecture V2** n’utilise plus cette table. Les transformations sont désormais stockées dans **`ProductDesignPosition`** via les endpoints `/position/direct`.

---

## 1. Quelle différence ?

| V1 (legacy) | V2 (actuel) |
|-------------|-------------|
| Table : `VendorDesignTransform` | Table : `ProductDesignPosition` |
| Endpoint : `POST /vendor/design-transforms/save` **(supprimé)** | Endpoints : `GET/PUT /api/vendor-products/{vpId}/designs/{designId}/position/direct` |
| Payload : `{ designUrl, transforms }` | Payload : `{ x, y, scale, rotation, constraints? }` |
| Sémantique : transforme le design + fusion mockups | Sémantique : enregistre la position du design (apposition) |

---

## 2. Pourquoi la colonne `transforms` est vide ?

1. Le frontend appelle encore l’ancienne route `/vendor/design-transforms/save` qui **404** silencieusement ou renvoie `success: false`.  
2. La nouvelle route `/position/direct` est peut-être appelée **avant** dʼavoir le bon `vendorProductId` ou `designId`.  
3. Vous n’appelez pas `save()` après avoir déplacé/redimensionné l’image dans l’éditeur.

---

## 3. Correctif rapide (si vous avez déjà le patch “Position Directe”)

1. Vérifiez que **`useDesignPosition.save()`** est appelé au `dragend` ou au clic *Valider*.
2. Ouvrez l’onglet Réseau : vous devez voir un **`PUT /api/vendor-products/{vpId}/designs/{designId}/position/direct`** → 200.
3. Vérifiez en base : table `ProductDesignPosition` doit contenir `(vendor_product_id, design_id)` avec votre payload JSON.

---

## 4. Mise à jour du code (si vous utilisez encore l’ancien manager)

### 4.1 Supprimez le legacy
* `api.post('/vendor/design-transforms/save', …)` → **à supprimer**.
* Hooks / services liés : `useDesignTransforms.ts`, `designTransformManager.ts` → migrez vers `useDesignPosition`.

### 4.2 Exemple de migration

```diff
- await api.post('/vendor/design-transforms/save', {
-   vendorProductId: vpId,
-   designId,
-   transforms: currentTransforms
- });
+ await api.put(`/api/vendor-products/${vpId}/designs/${designId}/position/direct`, {
+   x: pos.x,
+   y: pos.y,
+   scale: pos.scale,
+   rotation: pos.rotation,
+   constraints: { adaptive: true, area: 'design-placement' }
+ });
```

### 4.3 Lecture des positions
```ts
const { data } = await api.get(`/api/vendor-products/${vpId}/designs/${designId}/position/direct`);
const position = data?.data; // peut être null
```

---

## 5. Vérifications après migration

- [ ] Requête **PUT** visible dans lʼonglet Réseau → 200.
- [ ] En base, `ProductDesignPosition` contient une ligne avec votre `(vendor_product_id, design_id)`.
- [ ] L’overlay affiche le design au bon endroit après rafraîchissement.
- [ ] Plus aucun appel `/vendor/design-transforms/save`.

---

## 6. FAQ

**Q : Dois-je toujours stocker le `designUrl` en base64 ?**  
**R :** Non, le backend V2 conserve le Cloudinary URL du design. Vous n’avez rien à envoyer côté front.

**Q : Comment gérer plusieurs designs sur un même produit ?**  
**R :** `ProductDesignPosition` est clé composite ↔ vous pouvez enregistrer **une position par design**.

**Q : J’ai encore besoin d’effets (skew, flip) ?**  
**R :** Ces effets doivent être appliqués côté client (CSS) ou dans les mockups générés. Pour l’instant le backend stocke uniquement `x, y, scale, rotation`.

---

Une fois ces étapes appliquées, le backend n’écrira plus jamais dans `VendorDesignTransform`, et vos positions seront visibles dans `ProductDesignPosition`. 🍀 