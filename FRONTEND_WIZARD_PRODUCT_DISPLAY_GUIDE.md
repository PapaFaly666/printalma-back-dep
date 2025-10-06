# Guide d'affichage Frontend — Wizard Product (sans design)

Ce guide explique comment afficher un produit « wizard » créé via `POST /vendor/wizard-products`.

## 1) Données renvoyées par l'endpoint

Réponse de succès (extrait pertinent):

```json
{
  "success": true,
  "message": "Produit wizard créé avec succès",
  "data": {
    "id": 134,
    "vendorId": 7,
    "name": "sweat-baayFall-noir (2)",
    "description": "Texte description vendeur",
    "price": 12000,
    "status": "PUBLISHED",
    "productType": "WIZARD",
    "baseProduct": { "id": 34, "name": "Polo", "price": 6000 },
    "baseImage": { "id": 355, "url": "https://.../wizard-base-....jpg", "isMain": true, "orderIndex": 0 },
    "images": [
      { "id": 355, "url": "https://.../wizard-base-....jpg", "isMain": true,  "orderIndex": 0 },
      { "id": 356, "url": "https://.../wizard-detail-1.jpg",  "isMain": false },
      { "id": 357, "url": "https://.../wizard-detail-2.jpg",  "isMain": false }
    ],
    "selectedColors": [ { "id": 33, "name": "Rouge", "colorCode": "#ec0909" } ],
    "selectedSizes": [ { "id": 157, "sizeName": "500ml" } ],
    "calculations": {
      "basePrice": 6000,
      "vendorProfit": 6000,
      "expectedRevenue": 4200,
      "platformCommission": 1800,
      "marginPercentage": "100.00"
    },
    "createdAt": "2025-09-22T11:55:40.540Z",
    "updatedAt": "2025-09-22T11:55:40.540Z"
  }
}
```

Points clés frontend:
- `data.baseImage.url` est l'image à afficher par défaut sur la carte.
- `data.images` contient 1 image de base (isMain=true) + N images détail (isMain=false).
- `data.baseProduct` permet d'afficher le produit de base (mockup) et éventuellement charger des visuels mockup.

Pour les visuels mockup (optionnels), utilisez les docs produits: voir `BACKEND_PRODUCT_GET_RESPONSE_DOCUMENTATION.md` (ex: GET d'un `Product` par id pour récupérer ses images/variations si nécessaire).

## 2) Carte produit (liste)

But: afficher une carte avec l'image principale (baseImage), le nom et le prix vendeur.

```tsx
// props.product = response.data (objet wizard product)
function WizardProductCard({ product }: { product: any }) {
  const mainUrl = product.baseImage?.url || product.images?.find((i: any) => i.isMain)?.url;
  return (
    <div className="card">
      <img src={mainUrl} alt={product.name} className="card-cover" />
      <div className="card-body">
        <div className="card-title">{product.name}</div>
        <div className="card-price">{product.price.toLocaleString()} FCFA</div>
        <div className="card-meta">
          <span>{product.selectedColors?.length || 0} couleurs</span>
          <span>{product.selectedSizes?.length || 0} tailles</span>
        </div>
      </div>
    </div>
  );
}
```

Recommandations UI:
- Fallback image: si `baseImage` manquante, utiliser la 1ère `images[0]`.
- Afficher un badge `WIZARD`.
- Afficher `status` (PUBLISHED/DRAFT).

## 3) Vue détail (modal/page)

But: afficher un carrousel avec toutes les images wizard (+ option de voir un visuel mockup du `baseProduct`).

```tsx
function WizardProductDetail({ product }: { product: any }) {
  const images = product.images || [];
  const baseImage = product.baseImage; // à afficher en premier
  const ordered = baseImage
    ? [baseImage, ...images.filter((i: any) => !i.isMain)]
    : images;

  return (
    <div className="product-detail">
      <div className="gallery">
        {ordered.map((img: any, idx: number) => (
          <img key={img.id || idx} src={img.url} alt={`${product.name}-${idx}`} />
        ))}
      </div>

      <aside className="meta">
        <h2>{product.name}</h2>
        <div className="price">{product.price.toLocaleString()} FCFA</div>
        <p>{product.description}</p>

        <div className="chips">
          <div>
            Couleurs:
            {product.selectedColors?.map((c: any) => (
              <span key={c.id} className="chip" style={{ background: c.colorCode }}>
                {c.name}
              </span>
            ))}
          </div>
          <div>
            Tailles:
            {product.selectedSizes?.map((s: any) => (
              <span key={s.id} className="chip">{s.sizeName}</span>
            ))}
          </div>
        </div>

        <div className="calc">
          <div>Prix de base: {product.calculations?.basePrice?.toLocaleString()} FCFA</div>
          <div>Profit: {product.calculations?.vendorProfit?.toLocaleString()} FCFA</div>
          <div>Commission: {product.calculations?.platformCommission?.toLocaleString()} FCFA</div>
          <div>Marge: {product.calculations?.marginPercentage}%</div>
        </div>

        {/* Optionnel: bouton pour afficher une image mockup du produit de base */}
        {/* Voir section 4 */}
      </aside>
    </div>
  );
}
```

## 4) Afficher une image mockup (optionnel)

Si vous souhaitez afficher une image mockup du `baseProduct` (different des images wizard uploadées), vous pouvez:
- Appeler un endpoint produits pour `baseProduct.id` (voir la doc `BACKEND_PRODUCT_GET_RESPONSE_DOCUMENTATION.md`).
- Choisir une image de `colorVariations[0].images[0].url` par exemple, ou une image avec `view = "Front"`.

```ts
async function fetchMockupPreview(baseProductId: number) {
  // Exemple: GET /products/:id (adapter à votre frontend)
  const res = await fetch(`${API_URL}/products/${baseProductId}`);
  const product = await res.json();
  const firstColor = product.colorVariations?.[0];
  const mockupUrl = firstColor?.images?.[0]?.url || null;
  return mockupUrl;
}
```

Affichage dans la vue détail (en plus du carrousel wizard):

```tsx
const [mockupUrl, setMockupUrl] = useState<string | null>(null);
useEffect(() => {
  fetchMockupPreview(product.baseProduct.id).then(setMockupUrl);
}, [product.baseProduct.id]);

{mockupUrl && (
  <div className="mockup-preview">
    <h3>Mockup (base product)</h3>
    <img src={mockupUrl} alt={`mockup-${product.baseProduct.name}`} />
  </div>
)}
```

## 5) États de chargement et erreurs

- Pendant la création: spinner sur le bouton "Publier".
- En cas d'erreur (marge insuffisante, etc.), afficher le message d'erreur retourné par l'API.
- Si `images` est vide: afficher un placeholder indiquant que le vendeur doit uploader une image.

## 6) Récap UI rapide

- Carte: utiliser `data.baseImage.url` (priorité) pour l'aperçu.
- Détail: carrousel = image de base puis les `detailImages`.
- Infos à montrer: `name`, `price`, `status`, `selectedColors`, `selectedSizes`, `calculations`.
- Optionnel: affichage d'un visuel mockup récupéré via l'id `baseProduct.id`.

---

Pour toute divergence de structure, se référer à:
- `FRONTEND_WIZARD_PRODUCT_FIX.md` (payload/contrat)
- `BACKEND_PRODUCT_GET_RESPONSE_DOCUMENTATION.md` (données produits/mockups)
















