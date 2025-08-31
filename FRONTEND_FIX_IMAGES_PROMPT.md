# Prompt : Correction de l’affichage des images de produits vendeurs

Objectif : garantir qu’un produit vendeur affiche uniquement ses propres images et couleurs, sans mélange (T-shirt affichant des images de casquette, etc.).

Contexte backend (mai 2025)
• Les endpoints `/vendor/products` et `/vendor/products/grouped` renvoient désormais des structures filtrées :
  – `colorVariations`: tableau par couleur (id, name, colorCode, images[])
  – `images.colorImages`: tableau **plat** des images validées uniquement (même contenu que `colorVariations.flatMap`)
  – `images.colorImagesArray` (endpoint grouped) idem
  – Toutes les URLs primaires (`primaryImageUrl`) pointent sur la première image validée.

Plan de correction frontend (React/TypeScript)
1. Service API
```ts
// services/vendorProductService.ts
import axios from 'axios';
export async function fetchVendorProducts() {
  const { data } = await axios.get('/vendor/products');
  return data.data.products as VendorProduct[];
}
```

2. Types
```ts
export interface VendorProduct {
  id: number;
  vendorName: string;
  price: number;
  images: {
    colorImages: ValidatedImage[];   // ✅ tableau filtré
    defaultImages: DefaultImage[];
    primaryImageUrl: string | null;
  };
  colorVariations: ColorVariation[]; // pour l’aperçu par couleur
}

export interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  images: ValidatedImage[];
}

export interface ValidatedImage {
  id: number;
  url: string;
  colorName: string;
  colorCode: string;
  width?: number;
  height?: number;
}
```

3. Hook d’usage
```ts
import { useEffect, useState } from 'react';
import { fetchVendorProducts } from '../services/vendorProductService';

export function useVendorProducts() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const prod = await fetchVendorProducts();
      setProducts(prod);
      setLoading(false);
    })();
  }, []);

  return { products, loading };
}
```

4. Composant `ProductCard`
```tsx
interface Props { product: VendorProduct; }

export const ProductCard: React.FC<Props> = ({ product }) => {
  const primary = product.images.primaryImageUrl ?? '/placeholder.png';
  return (
    <div className="card">
      <img src={primary} alt={product.vendorName} />
      <h3>{product.vendorName}</h3>
      <p>{product.price / 100} €</p>
      <ColorSwatches variations={product.colorVariations} />
    </div>
  );
};
```

5. `ColorSwatches`
```tsx
interface Props { variations: ColorVariation[]; }
export const ColorSwatches: React.FC<Props> = ({ variations }) => (
  <div className="swatches">
    {variations.map(v => (
      <button key={v.id} title={v.name} style={{backgroundColor: v.colorCode}} />
    ))}
  </div>
);
```

6. Garanties anti-mélange
• Utiliser uniquement `colorVariations` ou `images.colorImages` pour l’affichage.
• Ne jamais boucler sur `product.images.colorImagesArray` non filtré issu d’anciennes versions.
• Quand l’utilisateur sélectionne une couleur, afficher `variation.images` correspondante.

Exemple de sélection couleur
```tsx
function ProductViewer({ product }: { product: VendorProduct }) {
  const [currentColor, setCurrentColor] = useState(product.colorVariations[0]);
  return (
    <>
      <ColorSwatches variations={product.colorVariations} />
      <Gallery images={currentColor.images} />
    </>
  );
}
```

Conclusion
Ce prompt décrit les nouvelles structures renvoyées par le backend et montre comment corriger les composants React/TS pour éviter tout mélange d’images. Copiez/collez les extraits dans vos fichiers frontend ou utilisez-les comme base pour adapter vos propres composants. 