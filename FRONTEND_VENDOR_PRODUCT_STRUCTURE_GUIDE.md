# Guide d'intégration Frontend : Structure Produit Vendeur (Printalma)

---

# 🛠️ GUIDE BACKEND — Correction Désorganisation Produits Vendeur

## 🎯 Objectif
Garantir que l'endpoint `/api/vendor/products` retourne les produits groupés par base produit, avec les images et couleurs bien associées, pour un affichage cohérent côté frontend (comme dans `/vendeur/sell-design`).

### 1. Structure attendue côté frontend

- **Un produit = une carte** (ex : T-shirt, Casquette, Mug)
- **Chaque carte regroupe toutes les couleurs disponibles**
- **Pour chaque couleur, une ou plusieurs images associées**
- **Les images doivent correspondre au type de produit (pas de mélange t-shirt/casquette, etc.)**
- **Les designs doivent être correctement appliqués à chaque variation/couleur**

#### Exemple de structure attendue (simplifiée)
```json
{
  "id": 101,
  "vendorName": "T-shirt Design",
  "colorVariations": [
    {
      "id": 12,
      "name": "Rouge",
      "colorCode": "#ff0000",
      "images": [
        { "url": "https://.../rouge-front.webp", ... },
        { "url": "https://.../rouge-back.webp", ... }
      ]
    },
    {
      "id": 13,
      "name": "Bleu",
      "colorCode": "#0000ff",
      "images": [
        { "url": "https://.../bleu-front.webp", ... },
        { "url": "https://.../bleu-back.webp", ... }
      ]
    }
  ],
  ...
}
```

---

### 2. Problème constaté
- Les images de couleurs/types sont parfois mélangées (ex : image de t-shirt sur une carte casquette).
- Le frontend `/vendeur/products` ne peut pas garantir l'affichage correct si la structure backend n'est pas groupée et cohérente.

---

### 3. Bonnes pratiques backend à appliquer
- **Grouper les produits par base produit** (pas un produit séparé par couleur)
- **Pour chaque produit, retourner toutes les couleurs disponibles dans un tableau `colorVariations`**
- **Pour chaque couleur, retourner un tableau `images` contenant uniquement les images de cette couleur ET de ce type de produit**
- **Vérifier que chaque image correspond bien au type de produit (ex : pas d'image de t-shirt pour une casquette)**
- **Inclure les informations de design appliqué pour chaque image/couleur**
- **Ne jamais utiliser de fallback d'une autre couleur ou d'un autre type**

---

### 4. Exemple de requête SQL de vérification
```sql
SELECT 
  p.id as product_id, p.name, p.type,
  cv.id as color_id, cv.name as color_name,
  ci.url as image_url
FROM products p
JOIN color_variations cv ON cv.product_id = p.id
JOIN color_images ci ON ci.color_variation_id = cv.id
WHERE (
  (p.type = 'tshirt' AND ci.url NOT LIKE '%tshirt%') OR
  (p.type = 'casquette' AND ci.url NOT LIKE '%casquette%')
);
-- Résultat attendu : 0 ligne (aucune image d'un autre type)
```

---

### 5. Checklist pour le backend
- [ ] Endpoint `/api/vendor/products` retourne bien la structure groupée par produit
- [ ] Chaque produit contient toutes ses couleurs dans `colorVariations`
- [ ] Chaque couleur contient uniquement ses propres images (pas d'autres couleurs, pas d'autres types)
- [ ] Les designs sont bien appliqués à chaque image/couleur
- [ ] Aucun fallback d'une autre couleur/type n'est utilisé
- [ ] Testé avec plusieurs types de produits (tshirt, casquette, mug, etc.)

---

### 6. Résultat attendu côté frontend
- L'affichage dans `/vendeur/products` est identique à celui de `/vendeur/sell-design` :
  - On peut slider entre les couleurs
  - Les images affichées correspondent toujours à la couleur et au type du produit
  - Le design est bien visible sur chaque variation

---

**Contact :** Pour toute question, voir le guide d'intégration ou contacter le frontend.

---

## 7. Exemple d'intégration côté frontend (React)

```jsx
function ProductCard({ product }) {
  const [selectedColor, setSelectedColor] = useState(product.colorVariations[0]);
  return (
    <div className="product-card">
      <h2>{product.vendorName}</h2>
      <div>
        {product.colorVariations.map(color => (
          <button key={color.id} onClick={() => setSelectedColor(color)}>{color.name}</button>
        ))}
      </div>
      <div className="images-slider">
        {selectedColor.images.map(img => (
          <img key={img.url} src={img.url} alt={selectedColor.name} />
        ))}
      </div>
      <div>Tailles : {product.selectedSizes.map(size => size.sizeName).join(', ')}</div>
      <div>Prix : {product.price} FCFA</div>
    </div>
  );
}
```

---

# (Rappel) Structure de publication d'un produit vendeur

- **Endpoint POST :** `/api/vendor/publish`
- **Endpoint GET :** `/api/vendor/products`
- **Respecter la structure groupée pour éviter toute confusion**

---

Pour toute question sur la structure ou l'intégration, contactes l'équipe backend ou réfère-toi à ce guide ! 