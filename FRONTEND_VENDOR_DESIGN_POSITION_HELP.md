# 🖼️ Guide Frontend — Intégration des Positions de Design par Produit

> Version : 1.0 — 2025-07-05  
> **Public :** Développeurs Frontend React / Mobile  
> **PR Back-end associée :** _Vendor Design Position Isolation_

---

## 1. Problème résolu

1. Les positions de design étaient partagées entre tous les produits ➜ un seul déplacement pouvait « écraser » les autres.
2. Des IDs erronés (`baseProductId`, `designId = 1`) provoquaient des `404/403` et un positionnement `null` (design centré).
3. Le back-end expose désormais **une table dédiée** (`productDesignPos
ition`) _et_ des **routes REST isolées**.
4. Ce guide explique comment consommer ces nouvelles routes côté Front.

---

## 2. TL;DR (en 3 étapes)

```ts
// 1️⃣ Résoudre les vrais IDs
import { resolveVendorProductId, resolveVendorDesignId } from '@/helpers/vendorIdResolvers';

const vpId  = resolveVendorProductId(product,   vendorProducts);
const desId = resolveVendorDesignId (design ,   vendorDesigns);

// 2️⃣ Lire la position enregistrée
const { data } = await api.get(`/api/vendor-products/${vpId}/designs/${desId}/position/direct`);
const position = data.data ?? null; // { x, y, scale?, rotation? }

// 3️⃣ Sauvegarder la position
await api.put(`/api/vendor-products/${vpId}/designs/${desId}/position/direct`, position);
```

Et c’est tout ! Le design restera à la bonne place après rafraîchissement. 🎉

---

## 3. Résolution des IDs

| Helper | Quand l’utiliser ? | Retourne | Fallback internes |
|--------|-------------------|----------|-------------------|
| `resolveVendorProductId(product, vendorProducts)` | Avant tout appel réseau lié au produit | `vendorProductId \| null` | • Match direct par `id`  
• Match par `baseProductId` |
| `resolveVendorDesignId(design, vendorDesigns)` | Avant tout appel réseau lié au design | `designId \| null` | • Match direct par `id`  
• Match par `imageUrl`  
• Retour unique si 1 seul design |

> Si l’une des deux fonctions retourne `null`, affichez un warning et skippez l’appel ; le **Position Debugger** (ou l’utilisateur) pourra corriger.

---

## 4. API détaillée

| Action | Méthode & Path | Body | Réponse `200` |
|--------|----------------|------|---------------|
| **Sauvegarder / Upserter** | `PUT /api/vendor-products/{vpId}/designs/{designId}/position/direct` | `{ x, y, scale?, rotation?, constraints? }` | `{ success: true, message: 'Position sauvegardée' }` |
| **Lire** | `GET /api/vendor-products/{vpId}/designs/{designId}/position/direct` | — | `{ success: true, data: { x, y, … } \| null }` |

### 4.1. Interface `Position`
```ts
export interface Position {
  x: number;          // px (ou % si adaptive)
  y: number;
  scale?: number;     // 1 par défaut
  rotation?: number;  // 0 par défaut
  constraints?: {
    adaptive?: boolean;  // true : position relative
    [key: string]: any;  // extension future
  };
}
```

---

## 5. Intégration UI

```tsx
const pos = position ?? { x: 0, y: 0, scale: 1, rotation: 0 };

<img
  src={designUrl}
  style={{
    position: 'absolute',
    left: `${pos.x}px`,
    top:  `${pos.y}px`,
    transform: `scale(${pos.scale}) rotate(${pos.rotation}deg)`
  }}
/>
```

* Pas de `translate(-50%,-50%)` ➜ sinon recentrage injustifié.  
* Si `position === null` ➜ laissez l’aperçu centré par défaut.

---

## 6. Tests rapides

1. Dans **Sell Design**, déplacez le design ➜ `PUT` 200.
2. Rechargez la page produit ➜ `GET` doit renvoyer la position exacte.
3. Dans la DB :
   ```sql
   SELECT * FROM product_design_positions WHERE vendor_product_id = <vpId> AND design_id = <desId>;
   ```
   La ligne doit exister.

---

## 7. Checklist finale

- [ ] Helpers `vendorIdResolvers.ts` importés et utilisés ✅
- [ ] Hooks & services réseau migrés vers `/position/direct` ✅
- [ ] UI applique `x/y/scale/rotation` sans translation centré ✅
- [ ] Tests manuels OK (positions préservées après F5) ✅

---

## 8. FAQ & Dépannage

| Problème | Piste de résolution |
|----------|--------------------|
| `403 Forbidden` | Le produit ou le design n’appartient pas au vendeur connecté. Vérifiez l’auth et l’ID du vendeur. |
| `404 Not Found` | IDs erronés. Vérifiez `vpId` / `designId` après résolution. |
| Position toujours centrée | Assurez-vous que la position reçue n’est pas `null` et qu’aucun `translate(-50%, -50%)` n’est appliqué. |

---
👩‍💻 **Contact back-end :** @backend-dev  
🧑‍🎨 **Contact front-end :** @frontend-dev  
🏷️ **Issue liée :** FRONT-1234 