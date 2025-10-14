# 🧩 Guide Frontend — Gestion Catégories, Réaffectation et Suppression Sécurisée

Ce guide explique comment intégrer côté frontend les nouveaux endpoints backend pour:
- Visualiser l'usage d'une catégorie avant suppression
- Réaffecter en masse les produits (mockups) d'une catégorie vers une autre
- Lister les variations d’une catégorie (enfants directs)
- Mettre à jour les catégories d’un produit (catégorie, sous-catégorie, variation)

Les endpoints décrits ci-dessous sont déjà disponibles dans le backend.

---

## 📡 Endpoints

### 1) Obtenir l’usage d’une catégorie
- Method/Route: `GET /categories/admin/:id/usage`
- Réponse succès:
```json
{
  "success": true,
  "data": {
    "categoryId": 12,
    "productsWithCategory": 25,
    "productsWithSubCategory": 8,
    "subcategoriesCount": 4,
    "variationsCount": 6
  }
}
```

### 2) Réaffecter les produits avant suppression
- Method/Route: `POST /categories/admin/:id/reassign`
- Body:
```json
{
  "targetCategoryId": 34,
  "reassignType": "category|subcategory|both",
  "reassignVariations": "keep|null|map",
  "variationMap": [{ "from": 10, "to": 55 }]
}
```
- Réponse succès:
```json
{ "success": true, "data": { "updated": 33 } }
```

Notes d’implémentation:
- `reassignType` détermine si on déplace uniquement les liens à la catégorie elle‑même, ses sous‑catégories directes, ou les deux.
- `reassignVariations` est prévu pour des extensions ultérieures. Aujourd’hui, la réaffectation agit principalement sur la relation produit↔catégorie; mappez vos variations selon votre logique UI si besoin.

### 3) Lister les variations d’une catégorie
- Method/Route: `GET /categories/admin/:id/variations`
- Réponse succès:
```json
{ "success": true, "data": [ { "id": 1, "name": "Col V" } ] }
```

### 4) Mettre à jour les catégories d’un produit
- Method/Route: `PATCH /products/admin/:id/category`
- Body:
```json
{ "categoryId": 12, "subCategoryId": 45, "variationId": 78 }
```
- Règles côté backend:
  - Si `subCategoryId` est fourni, il doit être enfant de `categoryId`.
  - Si `variationId` est fourni, il doit être enfant de `subCategoryId` (si présent) ou enfant direct de `categoryId`.
- Erreurs possibles:
  - `400 { code: "InvalidHierarchy" }`
  - `400 { code: "InvalidTarget" }`

---

## 🧭 UX recommandée

### Écran de gestion des catégories (Admin)
1. Lister les catégories (arbre) avec actions: Editer, Supprimer.
2. Au clic sur « Supprimer »:
   - Appeler `GET /categories/admin/:id/usage`.
   - Si `productsWithCategory + productsWithSubCategory > 0`:
     - Afficher un modal « Catégorie utilisée » avec:
       - Compteurs d’usage
       - Sélecteur de catégorie cible (`targetCategoryId`)
       - Options `reassignType`: `category` | `subcategory` | `both`
       - Option avancée: `reassignVariations` (laisser par défaut `keep`)
       - Bouton « Réaffecter » qui appelle `POST /categories/admin/:id/reassign`
     - Une fois la réaffectation réussie, réessayer la suppression.
   - Sinon (usage = 0):
     - Appeler `DELETE /categories/admin/:id` (ou `DELETE /categories/admin/:id` si vous exposez ce chemin côté admin uniquement).

### Écran de détail produit (Admin)
1. Ajouter un panneau « Catégories du produit » avec 3 sélecteurs dépendants:
   - Catégorie (niveau 0)
   - Sous‑catégorie (niveau 1) → chargée quand catégorie choisie
   - Variation (niveau 2) → chargée quand sous‑catégorie choisie (ou catégorie si variation enfant direct)
2. Au clic « Enregistrer »:
   - Appeler `PATCH /products/admin/:id/category` avec les 3 IDs (ou `null` si non utilisé).
   - Gérer les erreurs `InvalidHierarchy` et `InvalidTarget` (toast + réinitialiser le sélecteur concerné).

---

## 🔌 Exemples de code (TypeScript/React)

### Fetch utils
```ts
async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as T;
}
```

### Usage catégorie pour confirmation de suppression
```ts
type CategoryUsage = {
  success: true;
  data: {
    categoryId: number;
    productsWithCategory: number;
    productsWithSubCategory: number;
    subcategoriesCount: number;
    variationsCount: number;
  };
};

export async function fetchCategoryUsage(id: number) {
  return api<CategoryUsage>(`/categories/admin/${id}/usage`);
}
```

### Réaffectation en masse
```ts
export async function reassignCategory(
  id: number,
  payload: {
    targetCategoryId: number;
    reassignType: 'category' | 'subcategory' | 'both';
    reassignVariations?: 'keep' | 'null' | 'map';
    variationMap?: Array<{ from: number; to: number }>;
  }
) {
  return api<{ success: true; data: { updated: number } }>(
    `/categories/admin/${id}/reassign`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}
```

### Lister variations d’une catégorie (pour sélecteurs dépendants)
```ts
export async function fetchCategoryVariations(categoryId: number) {
  return api<{ success: true; data: Array<{ id: number; name: string }> }>(
    `/categories/admin/${categoryId}/variations`
  );
}
```

### Mettre à jour les catégories d’un produit
```ts
export async function updateProductCategories(
  productId: number,
  payload: { categoryId?: number | null; subCategoryId?: number | null; variationId?: number | null }
) {
  return api(`/products/admin/${productId}/category`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
```

---

## 🧪 Logique UI — Pseudo-code

### Suppression catégorie avec assisté de réaffectation
```ts
async function onDeleteCategory(id: number) {
  const usage = await fetchCategoryUsage(id);
  const totalUse = usage.data.productsWithCategory + usage.data.productsWithSubCategory;
  if (totalUse > 0) {
    openReassignModal({ categoryId: id, usage: usage.data });
    return;
  }
  await api(`/categories/admin/${id}`, { method: 'DELETE' });
  refreshList();
}
```

### Validation hiérarchique côté UI (optionnel)
```ts
function validateHierarchy({ categoryId, subCategoryId, variationId }, tree) {
  // Vérifier que subCategory.parentId === categoryId
  // Vérifier que variation.parentId === subCategoryId (ou categoryId si pas de subCategory)
  return true; // ou lancer une erreur pour bloquer le submit
}
```

---

## 🚨 Gestion d’erreurs (à afficher en toast/modal)
- 409 `CategoryInUse` lors d’une suppression: afficher un assistant de réaffectation
- 400 `InvalidHierarchy` lors d’un PATCH produit: indiquer que la sous‑catégorie/variation ne correspond pas
- 400 `InvalidTarget`: catégorie cible introuvable (vérifier sélection)

---

## 📓 Bonnes pratiques
- Rafraîchir la liste après réaffectation puis suppression
- Pré-remplir `reassignType` selon le contexte (ex: si la catégorie a des sous‑catégories utilisées, proposer `both`)
- Ajouter un résumé d’impact dans le modal (N produits seront déplacés)

---

## ✅ Checklist d’intégration
- [ ] Bouton supprimer appelle `/categories/admin/:id/usage` puis modal si nécessaire
- [ ] Modal de réaffectation appelle `/categories/admin/:id/reassign`
- [ ] Après succès, suppression `/categories/admin/:id`
- [ ] Formulaire produit: 3 sélecteurs dépendants et sauvegarde via `PATCH /products/admin/:id/category`



