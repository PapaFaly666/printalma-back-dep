# 🔍 Guide Frontend – Obtenir le `vendorProductId` (et dire adieu au 404)

> Si vous voyez encore `vendorProductId non résolu – position non sauvegardée`, c’est ce guide qu’il vous faut.

---

## 1. Rappel des rôles d’ID

| Nom | D’où vient-il ? | Exemple | À utiliser pour… |
|-----|----------------|---------|------------------|
| `baseProductId` | Catalogue admin (produit de base) | `2` | Création / publication initiale |
| `vendorProductId` | Produit **du vendeur** créé à partir du produit de base | `70` | Toutes les routes `/api/vendor-products/...` |

Le backend n’acceptera **jamais** un `baseProductId` sur les endpoints `/api/vendor-products/*`.

---

## 2. Comment obtenir le `vendorProductId` ?

### 2.1 Vous partez d’un objet `product` issu du backend

```ts
import { resolveVendorProductId } from '@/helpers/vendorIdResolvers';

const vpId = resolveVendorProductId(product, vendorProducts);
```

* `product` : celui que vous manipulez dans votre page (vient souvent du store ou des props).
* `vendorProducts` : tableau de **tous** vos `vendorProduct` (souvent récupéré via `/vendor/products`).

### 2.2 Aucune entrée dans `vendorProducts` ?

C’est normal **juste après un upload** : le produit vendeur n’est pas encore créé.

1. Appelez `/vendor/publish` (ou l’endpoint qui crée le produit).  
   Il retourne :
   ```json
   { "vendorProductId": 70, "status": "DRAFT" }
   ```
2. Poussez cette ligne dans votre store :
   ```ts
   dispatch(addVendorProduct({ id: 70, baseProductId: 2 }));
   ```
3. **Ensuite seulement**, résolvez l’ID et appelez `/position/direct`.

---

## 3. Intégration dans `DesignPositionManager`

```ts
// utils/designPositionManager.ts
export async function saveDesignPos(product, design, pos) {
  const vpId = resolveVendorProductId(product, store.vendorProducts);
  const desId = resolveVendorDesignId(design, store.vendorDesigns);

  if (!vpId || !desId) {
    console.warn('vendorProductId non résolu ➜ on skip');
    return;
  }
  await saveDesignPosition(vpId, desId, pos);
}
```

* Avantage : aucun appel réseau ne part tant que les IDs ne sont pas prêts.

---

## 4. Exemple complet (upload → publish → position)

```ts
async function handleUpload(baseProductId: number, file: File) {
  // 1. Upload du design → reçoit designId
  const up = await api.uploadDesign(file);
  const designId = up.data.designId;

  // 2. Création du produit vendeur
  const pub = await api.post('/vendor/publish', { baseProductId, designId });
  const vendorProductId = pub.data.vendorProductId;

  // 3. Ajout dans le store
  addVendorProduct({ id: vendorProductId, baseProductId });

  // 4. Position par défaut (exemple)
  await saveDesignPosition(vendorProductId, designId, { x:0, y:0, scale:1, rotation:0 });
}
```

---

## 5. Checklist développeur

- [ ] Votre store contient **au moins** `{ id: vendorProductId, baseProductId }` pour chaque produit affiché.
- [ ] Tous vos hooks / services utilisent `resolveVendorProductId` avant de frapper `/api/vendor-products/*`.
- [ ] Plus aucune trace de `productId=2` dans l’onglet Réseau.
- [ ] Les PUT/GET `/position/direct` répondent 200.

---

## 6. Aller plus loin

Consultez également :
* `FRONTEND_DESIGN_UPLOAD_POSITION_GUIDE.md` – cas complet upload → position.
* `FRONTEND_POSITION_ENDPOINTS_FIX_GUIDE.md` – tout le panorama des endpoints.

Une fois ces guides appliqués, tous les `vendorProductId` seront résolus et les 404 deviendront de l’histoire ancienne. 🚀 