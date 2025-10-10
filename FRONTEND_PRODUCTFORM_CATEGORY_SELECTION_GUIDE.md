## 🎛️ Guide Frontend — Sélection Catégorie / Sous‑catégorie / Variation (ProductFormMain)

Objectif: implémenter la sélection hiérarchique à 3 niveaux dans `src/components/product-form/ProductFormMain.tsx` et sauvegarder sur le produit.

### APIs à utiliser
- GET `categories/admin/:id/children` → sous‑catégories directes d’une catégorie
- GET `categories/admin/:id/variations` → variations de la catégorie ou de la sous‑catégorie
- PATCH `products/admin/:id/category` → sauvegarde des 3 IDs sur le produit

Réponses types:
```json
// children / variations
{ "success": true, "data": [ { "id": 45, "name": "T-Shirts" } ] }

// patch
{ "success": true, "data": { "id": 123 } }
```

Erreurs possibles (à afficher en toast):
- 400 `{ code: "InvalidHierarchy" }`
- 400 `{ code: "InvalidTarget" }`

---

### Modèle d’état recommandé (React)
```ts
type CategoryOption = { id: number; name: string };

type CategoryState = {
  categoryId: number | null;
  subCategoryId: number | null;
  variationId: number | null;
  subCategories: CategoryOption[];
  variations: CategoryOption[];
  loading: boolean;
  error?: string;
};
```

---

### Helpers d’API (fetch)
```ts
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as T;
}

export function getChildren(categoryId: number) {
  return api<{ success: true; data: CategoryOption[] }>(`/categories/admin/${categoryId}/children`);
}

export function getVariations(id: number) {
  return api<{ success: true; data: CategoryOption[] }>(`/categories/admin/${id}/variations`);
}

export function patchProductCategories(
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

### Flux UI (pseudo‑code minimal)
```ts
// 1) Au choix d’une catégorie de niveau 0
async function onSelectCategory(categoryId: number | null) {
  setState(s => ({ ...s, categoryId, subCategoryId: null, variationId: null, loading: true }));
  if (!categoryId) return setState(s => ({ ...s, subCategories: [], variations: [], loading: false }));

  try {
    const [children, variations] = await Promise.all([
      getChildren(categoryId),
      getVariations(categoryId),
    ]);
    setState(s => ({
      ...s,
      subCategories: children.data,
      variations: variations.data,
      loading: false,
    }));
  } catch (e: any) {
    setState(s => ({ ...s, loading: false, error: e?.message || 'Erreur chargement catégories' }));
  }
}

// 2) Au choix d’une sous‑catégorie (niveau 1)
async function onSelectSubCategory(subCategoryId: number | null) {
  setState(s => ({ ...s, subCategoryId, variationId: null, loading: true }));
  if (!subCategoryId) {
    // Revenir aux variations du niveau catégorie
    if (state.categoryId) {
      const v = await getVariations(state.categoryId);
      return setState(s => ({ ...s, variations: v.data, loading: false }));
    }
    return setState(s => ({ ...s, variations: [], loading: false }));
  }

  try {
    const v = await getVariations(subCategoryId);
    setState(s => ({ ...s, variations: v.data, loading: false }));
  } catch (e: any) {
    setState(s => ({ ...s, loading: false, error: e?.message || 'Erreur chargement variations' }));
  }
}
```

---

### Sauvegarde (submit)
```ts
async function onSubmit(productId: number) {
  try {
    await patchProductCategories(productId, {
      categoryId: state.categoryId,
      subCategoryId: state.subCategoryId,
      variationId: state.variationId,
    });
    toast.success('Catégories enregistrées');
  } catch (e: any) {
    if (e?.code === 'InvalidHierarchy') {
      toast.error('Incohérence hiérarchique: vérifiez vos sélections');
      // Optionnel: reset variation
      setState(s => ({ ...s, variationId: null }));
    } else if (e?.code === 'InvalidTarget') {
      toast.error('Sélection invalide: catégorie/variation introuvable');
    } else {
      toast.error('Erreur lors de la sauvegarde');
    }
  }
}
```

---

### Composants (esquisse)
```tsx
<Select
  label="Catégorie"
  value={state.categoryId}
  onChange={onSelectCategory}
  options={rootCategories}
  placeholder="Choisir une catégorie"
/>

<Select
  label="Sous‑catégorie"
  value={state.subCategoryId}
  onChange={onSelectSubCategory}
  options={state.subCategories}
  disabled={!state.categoryId || state.subCategories.length === 0}
  placeholder="Choisir une sous‑catégorie"
/>

<Select
  label="Variation"
  value={state.variationId}
  onChange={(v) => setState(s => ({ ...s, variationId: v }))}
  options={state.variations}
  disabled={!state.categoryId || state.variations.length === 0}
  placeholder="Choisir une variation"
/>
```

---

### Edge cases / UX
- Si la sous‑catégorie est désélectionnée, recharger les variations du niveau catégorie.
- Désactiver les sélecteurs descendants quand le parent est vide.
- Nettoyer `variationId` dès que `categoryId` ou `subCategoryId` change.
- Afficher un skeleton/spinner pendant `loading`.

---

### Checklist
- [ ] Chargement enfants et variations au changement de catégorie
- [ ] Chargement variations au changement de sous‑catégorie
- [ ] Désactivation logique des champs
- [ ] PATCH avec 3 IDs, gestion `InvalidHierarchy` et `InvalidTarget`
- [ ] Toasts d’erreur et succès


