# 🗂️ Guide – Choisir le bon ID pour `/vendor/design-transforms/:id`

> **Public :** Équipe Front-end ✨
>
> **Objectif :** Éviter les erreurs 403 et les boucles infinies en utilisant **toujours** l’ID du *VendorProduct* (et non l’AdminProduct) dans les appels API *design-transforms*.

---

## 1 · Contexte rapide

| Terme | Table BDD | Champ clé | Exemple |
|-------|-----------|-----------|---------|
| **AdminProduct** (produit "catalogue") | `product` | `id`          | 14, 15, 16 |
| **VendorProduct** (copie du produit pour un vendeur) | `vendorProduct` | `id` | 409, 410, 411, 412 |
| Lien entre les deux | `vendorProduct.baseProductId` |  | (ex : 409 → 14) |

Le **backend** attend `:id = vendorProduct.id`.
Si on envoie l’ID 14, 15, 16 → le vendeur n’a pas accès ⇒ 403.

---

## 2 · Règle d’or

```text
/v1/vendor/design-transforms/:vendorProductId[?designUrl=...]
```

📌 **Toujours :**
1. Prendre `product.vendorProduct?.id` si présent (cas d’architecture V2 préservée).
2. Sinon `product.vendorProductId` (champ à plat dans certaines réponses).
3. Sinon `product.id` **seulement** si le `status ∈ {DRAFT, PENDING, PUBLISHED}` (c’est déjà un VendorProduct).

Jamais :
* `product.baseProductId`
* `product.id` quand le `status === null` (AdminProduct brut)

---

## 3 · Exemples de code

### 3-1 Service `designTransforms.ts`
```ts
export async function loadDesignTransforms(product: Product, designUrl?: string) {
  const vendorProductId =
    product.vendorProduct?.id ??
    product.vendorProductId ??
    (['DRAFT', 'PENDING', 'PUBLISHED'].includes(product.status) ? product.id : undefined);

  if (!vendorProductId) {
    // mode conception admin → travailler en localStorage uniquement
    return { transforms: [], conception: true };
  }

  return api.get(`/vendor/design-transforms/${vendorProductId}`, {
    params: designUrl ? { designUrl } : {},
  });
}
```

### 3-2 Log de vérification (dev)
```ts
console.log('➡️  design-transforms call', {
  adminId: product.baseProductId,
  vendorId: vendorProductId,
  originalId: product.id,
});
```

---

## 4 · Cas « Mode conception » (AdminProduct uniquement)

* **Pas** d’appel backend.
* Stocker les transformations dans `localStorage` : `design-transforms-{adminId}`.
* Quand le vendeur clique *"Valider / Publier"*, créer d'abord le VendorProduct (endpoint `/vendor/products`) puis pousser les transforms.

---

## 5 · Check-list de migration

☑️ Rechercher tous les `design-transforms/` dans le front.  
☑️ Vérifier l'ID passé : doit correspondre à l'une des colonnes **id** du tableau `vendorProduct`.  
☑️ Tester :
1. Produit existant (id = 412).  
2. Produit en conception (Admin = 14 → vendor = 409 après création).  
3. Pas de `?designUrl=undefined` dans le Network tab.

---

## 6 · FAQ express

**Q : Pourquoi mon appel est encore 403 ?**  
A : Regarde le log *🎯 GET /vendor/design-transforms/...* dans NestJS : si l'ID < 400, tu envoies sûrement l'AdminProduct.

**Q : Dois-je passer `designUrl` à chaque fois ?**  
A : Oui, sauf au tout premier chargement où l'URL n'est pas encore connue → ne mets **pas** la chaîne "undefined".

**Q : Comment distinguer Admin / Vendor dans les données ?**  
A : 1) présence de `vendorProductId` ou `vendorProduct` ; 2) `status` différent de `null` ⇒ déjà un VendorProduct.

---

👩‍💻 **Contact back-end :** #api-design 🛠️

💡 Mots-clés : *design-transforms*, `VendorProduct`, `AdminProduct`, 403, `designUrl=undefined` 