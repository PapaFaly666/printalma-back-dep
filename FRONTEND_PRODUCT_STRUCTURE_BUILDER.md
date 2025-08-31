# 🏗️ `productStructure.adminProduct` – Guide de construction complet

> Version rapide — 08 / 07 / 2025
>
> Sans la clé **`productStructure.adminProduct`**, l’API `/vendor/products` renvoie :
>
> ```json
> {
>   "statusCode": 400,
>   "error": "Structure admin requise",
>   "message": "productStructure.adminProduct manquant (Architecture v2)",
>   "architecture": "v2_admin_preserved"
> }
> ```
>
> Ce guide explique comment récupérer le produit *admin* (baseProduct) et générer l’objet `productStructure` attendu.

---

## 1. Rappel du schéma attendu côté backend

```jsonc
productStructure: {
  adminProduct: {
    id: 2,
    name: "T-shirt Unisexe",
    description: "Coupe classique…",
    price: 12000,
    images: {
      colorVariations: [
        {
          id: 11,
          name: "Blanc",
          colorCode: "#FFFFFF",
          images: [
            { id: 101, url: "https://…/front.png", viewType: "front" },
            { id: 102, url: "https://…/back.png",  viewType: "back" }
          ]
        },
        // … autres couleurs
      ]
    }
  },
  designApplication: {
    scale: 0.6,            // 📐 échelle appliquée par défaut côté front
    positioning: "CENTER"  // (optionnel) valeur par défaut backend
  }
}
```

*Le backend utilise `images.colorVariations` pour créer les références d’images « admin_reference ». Envoyer uniquement l’`id` **ne suffit pas**.*

---

## 2. Fonction utilitaire `buildProductStructure`

```ts
// utils/buildProductStructure.ts
import { api } from '../services/apiClient';

export async function buildProductStructure(baseProductId: number) {
  // 1️⃣ Récupérer le produit admin complet
  const { data } = await api.get(`/products/${baseProductId}`, {
    withCredentials: true,
  });

  const { id, name, description, price, colorVariations } = data;

  // 2️⃣ Formater la structure attendue
  return {
    adminProduct: {
      id,
      name,
      description,
      price,
      images: {
        colorVariations: colorVariations.map((cv: any) => ({
          id: cv.id,
          name: cv.name,
          colorCode: cv.colorCode,
          images: cv.images.map((img: any) => ({
            id: img.id,
            url: img.url,
            viewType: img.view,
          })),
        })),
      },
    },
    designApplication: {
      scale: 0.6, // valeur par défaut (à ajuster si besoin)
      positioning: 'CENTER',
    },
  } as const;
}
```

### Points clés
1. **Images complètes** : on transmet directement `colorVariations` et leurs images. Pas besoin de convertir en Base64.
2. **Pas de `/api`** : le GET sʼeffectue sur `/products/{id}` (endpoint public admin).
3. **Offload au backend** : vous pouvez simplifier en ne gardant que `id` / `colorVariations.id`, mais vous **devez** conserver la structure imbriquée.

---

## 3. Intégration dans `getOrCreateVendorProduct`

```ts
import { buildProductStructure } from './buildProductStructure';

// ... existing code ...
const payload = {
  baseProductId,
  designId,
  productStructure: await buildProductStructure(baseProductId),
  vendorName: 'Mon produit',
  vendorPrice: 19900,
  selectedColors: [],
  selectedSizes: [],
};
await api.post('/vendor/products', payload, { withCredentials: true });
```

---

## 4. Vérifications

- [ ] Le `payload.productStructure.adminProduct` contient bien `images.colorVariations`.
- [ ] La requête `/vendor/products` retourne **201**.
- [ ] La réponse fournit `productId` → utiliser cet ID pour les appels `/position/direct`.

---

## 5. FAQ « Ça continue à 400 »

**Q :** *Puis-je envoyer uniquement les IDs des images ?*  
**R :** Non. Le backend crée des références dʼimages immédiatement. Il lui faut toutes les URLs pour copier métadonnées.

**Q :** *Je nʼai pas besoin des images côté front. Pourquoi les renvoyer ?*  
**R :** Cʼest temporaire ; une future version exposera un endpoint `/public/base-products/{id}/compact` que le backend comprendra. En attendant, envoyez la structure complète.

**Q :** *Comment réduire la payload ?*  
**R :** compressez les URLs ou transmettez-les telles quelles ; le backend ne copie que les champs nécessaires.

---

> ℹ️ Une fois ce builder en place, lʼerreur **400 Structure admin requise** disparaît et le workflow *Design ➜ Produit ➜ Position* fonctionne sans fallback legacy. 