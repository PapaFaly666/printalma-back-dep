# Guide Frontend : Modification des tailles et catégories d'un produit admin (mockup)

## 1. Endpoint PATCH

- **URL** :
  ```
  PATCH http://localhost:3004/products/:id
  ```
- **Headers** :
  - `Authorization: Bearer <token_admin>`
  - `Content-Type: application/json`

---

## 2. Structure du payload

```json
{
  "name": "Nom du produit",
  "description": "Description du produit",
  "price": 12000,
  "stock": 12,
  "status": "PUBLISHED",
  "categories": [2, 3],      // <--- Tableau d'IDs de catégories (number)
  "sizes": [4, 5],           // <--- Tableau d'IDs de tailles (number) OU ["500ml", "250ml"] (string)
  "colorVariations": [ ... ] // (optionnel, pour modifier couleurs/images)
}
```

- **categories** : tableau d’IDs (number) des catégories sélectionnées.
- **sizes** : tableau d’IDs (number) des tailles sélectionnées (recommandé), ou tableau de noms (string) si tu n’as pas les IDs.

---

## 3. Exemple complet en JavaScript (fetch)

```js
const payload = {
  name: "Tshirt premium",
  description: "Tshirt de luxe",
  price: 12000,
  stock: 12,
  status: "PUBLISHED",
  categories: [2, 3], // IDs des catégories sélectionnées
  sizes: [4, 5],      // IDs des tailles sélectionnées
  // ... autres champs (colorVariations, etc.)
};

fetch(`http://localhost:3004/products/1`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    // Affiche le produit modifié ou gère la réponse
    console.log("Produit modifié :", data);
  })
  .catch(err => {
    // Gère l’erreur
    console.error("Erreur modification produit :", err);
  });
```

---

## 4. Où trouver les IDs de catégories et tailles ?

- **Pour les catégories** :
  - Récupère la liste via l’endpoint GET `/categories` (ou équivalent), chaque objet aura un champ `id` et `name`.
- **Pour les tailles** :
  - Récupère la liste via l’endpoint GET `/sizes` (ou équivalent), chaque objet aura un champ `id` et `sizeName`.

---

## 5. Conseils UI

- Affiche une liste de catégories et tailles (checkbox, select, etc.).
- Envoie les IDs sélectionnés dans le payload PATCH.
- Le backend accepte aussi bien les IDs (number) que les noms (string) pour les tailles.

---

**Pour un exemple de gestion des colorVariations ou d’autres champs, demande-le !** 