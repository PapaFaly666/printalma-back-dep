# 🚀 Migration Express vers les endpoints **V2** – Produits & Positions

> Remplace **immédiatement** toutes les occurrences de `/vendor/publish` et `/vendor/products/by-base` par les nouvelles routes V2.
>
> Date : 08 juillet 2025

---

## 1. Pourquoi ça 404 ❓

| Ancien appel | Statut | Raison |
|--------------|--------|--------|
| `POST /vendor/publish` | 404 | Endpoint **supprimé**. La publication de produit se fait maintenant via `/vendor/products` (architecture V2). |
| `GET /vendor/products/by-base?baseProductId=2` | 400/404 | Route **jamais implémentée** en V2. Il faut utiliser la liste `/vendor/products` puis filtrer côté client. |
| `PUT /api/vendor-products/2/designs/28/position/direct` | 404 | LʼID `2` est un **baseProductId**. Le backend attend un **vendorProductId** (ex `70`). |

---

## 2. Nouveau workflow "Design ➜ Produit ➜ Position"

| Étape | Verbe | Endpoint V2 | Retour clé |
|-------|-------|-------------|------------|
| 1 | POST | `/vendor/designs` | `designId` |
| 2 | POST | `/vendor/products` | `productId` (≙ `vendorProductId`) |
| 3 | PUT | `/api/vendor-products/{productId}/designs/{designId}/position/direct` | 200 |

Notes :
* Les routes `POST /vendor/designs` et `POST /vendor/products` **n'ont pas** le préfixe `/api`.
* Le backend V2 **préserve** la structure admin ; fournissez le blob `productStructure` comme vous le faisiez avec `/vendor/publish`.

---

## 3. Patch de code minimal

### 3.1 `utils/getOrCreateVendorProduct.ts`

```ts
// ... existing code ...
export async function getOrCreateVendorProduct(baseProductId: number, designId: number) {
  // 1️⃣ Chercher côté backend sʼil existe déjà
  const { data } = await api.get('/vendor/products', {
    params: { limit: 1000 }, // récupère tous les produits du vendeur
    withCredentials: true
  });

  const existing = (data?.data?.products || []).find((p: any) =>
    p.adminProduct.id === baseProductId &&
    p.designApplication.designId === designId
  );
  if (existing) return existing.id;

  // 2️⃣ Sinon, le créer via le nouvel endpoint V2
  const payload = {
    baseProductId,
    designId,
    // ➡️ Réutilisez votre objet productStructure existant
    productStructure: buildProductStructure(baseProductId),
    vendorName: 'Mon produit',
    vendorPrice: 19900,
    selectedColors: [],
    selectedSizes: []
  };
  const pub = await api.post('/vendor/products', payload, { withCredentials: true });
  return pub.data.productId;
}
```

### 3.2 `DesignPositionManager`

```ts
// ... existing code ...
const vpId = resolveVendorProductId(product, store.vendorProducts);

if (!vpId) {
  const newVpId = await getOrCreateVendorProduct(product.id, design.id);
  addVendorProduct({ id: newVpId, baseProductId: product.id });
  return saveDesignPosition(newVpId, design.id, pos); // retry avec le bon ID
}
```

---

## 4. Nettoyage des appels legacy

❌  Supprimez :
* Tous les `api.post('/vendor/publish', …)`
* Tous les `api.get('/vendor/products/by-base', …)`

✅  Remplacez par :
* `api.post('/vendor/products', …)`
* `api.get('/vendor/products', { params: { limit: 1000 }})` (puis filtrage JS)

---

## 5. Vérification rapide

1. Ouvrez lʼonglet Réseau.
2. Créez/chargez un design, publiez un produit.
3. Vous devez voir :
   * `POST /vendor/designs` → 201
   * `POST /vendor/products` → 201 **productId = 70**
   * `PUT /api/vendor-products/70/designs/28/position/direct` → 200
4. Aucune requête `/vendor/publish` ni `/vendor/products/by-base`.

Si tout est vert ✅, le 404 « Produit introuvable » a disparu ! 🎉

---

## 6. Checklist finale

- [ ] Vous stockez bien `productId` (vendorProductId) après lʼappel `/vendor/products`.
- [ ] Vos URL de position utilisent **toujours** ce `productId`.
- [ ] Plus aucun appel legacy dans votre codebase.

---

### FAQ rapide

*Q : Faut-il toujours envoyer `productStructure` ?*
R : Oui. Le backend V2 préserve la structure admin. Envoyez le même objet quʼavant, sans modification.

*Q : Comment filtrer par `baseProductId` si je ne connais pas `productId` ?*
R : Récupérez la liste `/vendor/products` (limit large) et faites un `find` sur `adminProduct.id` côté client.

*Q : Le préfixe `/api` est-il requis ?*
R : Non pour les routes vendeurs (`/vendor/...`). Oui pour les routes de position (`/api/vendor-products/...`).

---

> **TL;DR :** Change simplement `/vendor/publish` → `/vendor/products` et tout roule 🍀 