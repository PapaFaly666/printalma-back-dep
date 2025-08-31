# 🌟 Frontend Guide – Cascade Validation Design → Produits

> Version : Juin 2025  |  Auteur : Backend Team

---

## 1️⃣ Contexte
Lorsque l'admin **valide** un design, tous les produits qui utilisent ce design sont mis à jour automatiquement par le backend :

| Statut initial du produit | `forcedStatus` (envoyé à la création) | Nouveau statut après validation admin | Clé `isValidated` |
|---------------------------|----------------------------------------|----------------------------------------|-------------------|
| `PENDING`                | `"PENDING"`                           | `PUBLISHED`                           | `true`            |
| `DRAFT`                  | `"DRAFT"`                             | `DRAFT` (reste brouillon)              | `true`            |

Ces champs sont désormais renvoyés par l'API et **doivent** être pris en compte par le front pour l'affichage des badges, boutons d'action et filtres.

---

## 2️⃣ Nouvelles propriétés dans les réponses API
### 2.1 `GET /api/vendor/products` (liste)
Chaque objet produit contient :
```jsonc
{
  "id": 42,
  "status": "DRAFT",           // PUBLISHED / PENDING / DRAFT
  "forcedStatus": "DRAFT",     // ↔️ intention initiale du vendeur
  "isValidated": true,          // ✅ design validé ?
  "designValidationStatus": "VALIDATED", // PENDING / VALIDATED / REJECTED
  ...
}
```

### 2.2 `GET /api/vendor/products/:id` (détail)
Mêmes clés + autres métadonnées.

> ⚠️ Ces attributs n'existaient pas avant. Vérifiez vos typings (`interface VendorProduct`) et mettez à jour vos composants.

---

## 3️⃣ Création / Publication d'un produit
Lors de l'appel **POST `/api/vendor/products`** vous pouvez envoyer :
```jsonc
{
  "forcedStatus": "PENDING" // ou "DRAFT" (par défaut si absent)
}
```
* **PENDING** : le vendeur souhaite que le produit soit automatiquement publié lorsque le design sera validé.
* **DRAFT** : le produit restera brouillon; le vendeur déclenchera manuellement l'endpoint **PUT `/api/vendor/products/:id/publish`**.

Backend stocke la valeur dans `forcedStatus` et applique la cascade après validation admin.

---

## 4️⃣ Comportement UI recommandé
1. **Badge Validation** – Affichez :
   * 🟡 `PENDING` (design pas encore validé)
   * ✅ `VALIDATED`
   * ❌ `REJECTED`
2. **Bouton « Publier maintenant »**
   * Visible **uniquement** si : `status === 'DRAFT' && isValidated === true`.
3. **Badge Statut Produit**
   * `PUBLISHED` : vert
   * `PENDING` : orange (attente admin)
   * `DRAFT` : gris
4. **Filtre Liste**
   * Ajoutez un filtre « Prêt à publier » : `status === 'DRAFT' && isValidated === true`.

---

## 5️⃣ Exemple React (SWR)
```tsx
export interface VendorProduct {
  id: number;
  status: 'PUBLISHED' | 'PENDING' | 'DRAFT';
  forcedStatus: 'PENDING' | 'DRAFT';
  isValidated: boolean;
  designValidationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  // ... autres champs
}

const { data } = useSWR<VendorProduct[]>("/api/vendor/products", fetcher);

return (
  <>
    {data?.map(prod => (
      <ProductCard key={prod.id} {...prod}>
        {prod.status === 'DRAFT' && prod.isValidated && (
          <button onClick={() => publishProduct(prod.id)}>🚀 Publier</button>
        )}
      </ProductCard>
    ))}
  </>
);
```

---

## 6️⃣ Gestion des états transitoires
* Pendant le refresh après cascade (websocket ou polling), votre UI peut voir :
  * `status: "PENDING", isValidated: false` → design pas encore traité.
  * `status: "DRAFT", isValidated: true`   → prêt à publier manuellement.
  * `status: "PUBLISHED"`                   → déjà en ligne.

Affichez un **skeleton** ou un toast lorsque l'état change.

---

## 7️⃣ WebSocket (optionnel)
Si vous utilisez le service WS déjà en place :
* Événement `design.validated` → rechargez designs + produits.
* Payload contient `affectedProducts` (nombre mis à jour).

---

## 8️⃣ Checklist Frontend
- [ ] Mettre à jour les interfaces TypeScript pour inclure `forcedStatus`, `isValidated`, `designValidationStatus`.
- [ ] Adapter les cartes produits / tableaux.
- [ ] Gérer le cas « Prêt à publier ».
- [ ] Tester :
  * Produit créé avec `forcedStatus: 'PENDING'` → auto‐publication après validation.
  * Produit créé avec `forcedStatus: 'DRAFT'`  → bouton publier dispo après validation.
  * Design rejeté → badge rouge + message.
- [ ] (Optionnel) Brancher WebSocket pour maj temps réel.

---

## 9️⃣ Ressources Backend
* Endpoint cascade : `PUT /api/designs/:id/validate`
* Publication manuelle : `PUT /api/vendor/products/:id/publish`
* Publication en masse : `PUT /api/vendor/designs/:designId/publish-products`

---

🎉 **Voilà !** Le frontend est maintenant prêt pour la nouvelle logique de cascade validation. Bon dev 🚀 