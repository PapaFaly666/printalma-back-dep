# 🖼️ Guide Frontend – Intégration du Système de Sauvegarde des Transformations de Design

> Dernière mise à jour : 2025-05-20
>
> Ce document explique comment le frontend **enregistre** et **restaure automatiquement** les ajustements (position, échelle, …) appliqués par le vendeur sur un design, via les nouveaux endpoints backend introduits dans `VendorDesignTransformController`.

---

## 1. Vue d'ensemble du flux

1. Le vendeur bouge/scale son design sur la zone de délimitation.
2. Un **hook React** (`useDesignTransforms`, voir § 4) capture les changements.
3. Après *debounce* (1 s), un **appel POST** `/vendor/design-transforms` sauvegarde l'état.
4. Au rechargement de la page :
   1. le frontend appelle **GET** `/vendor/design-transforms/:productId?designUrl=` pour récupérer la dernière sauvegarde ;
   2. les positions/échelles sont restaurées avant l'affichage.
5. Si l'API échoue, un **fallback localStorage** prend le relais (synchronisation ultérieure quand la connexion revient).

Schema :
```
UI ➜ useDesignTransforms ➜ debounce ➜ POST save
        ▲                              │
        │                              ▼
   initial render ◀───────── GET load ──── backend
```

---

## 2. Rappel des endpoints

| Méthode | URL | Payload / Query | Description |
|---------|-----|-----------------|-------------|
| `POST`  | `/vendor/design-transforms` | `{ productId, designUrl, transforms, lastModified }` | Sauvegarde / met à jour la transformation. |
| `GET`   | `/vendor/design-transforms/:productId?designUrl=` | – | Retourne la dernière transformation ou `null`. |

### 2.1 Structure `transforms`
```json
{
  "0": { "x": 25.5, "y": 30.2, "scale": 0.8 },
  "1": { "x": -10,  "y": 15.5, "scale": 1.2 }
}
```
Chaque clé correspond à l'index de la délimitation dans `productImage.delimitations`.

---

## 3. Exemple d'appels avec Axios

```ts
import axios from 'axios';

export async function saveDesignTransforms(payload: SaveTransformsPayload) {
  await axios.post('/vendor/design-transforms', payload, { withCredentials: true });
}

export async function loadDesignTransforms(productId: number, designUrl: string) {
  const { data } = await axios.get(`/vendor/design-transforms/${productId}`, {
    params: { designUrl },
    withCredentials: true,
  });
  return data?.data ?? null;
}
```
Types :
```ts
export interface Transform {
  x: number;
  y: number;
  scale: number;
}
export interface SaveTransformsPayload {
  productId: number;
  designUrl: string;
  transforms: Record<number, Transform>;
  lastModified: number; // ms epoch
}
```

---

## 4. Hook `useDesignTransforms`

```ts
import { useEffect, useRef, useCallback } from 'react';
import { saveDesignTransforms, loadDesignTransforms } from '@/services/designTransforms';

export function useDesignTransforms({
  productId,
  designUrl,
  initialTransforms,
  onRestore,
  getCurrentTransforms,
}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<number>(Date.now());

  /* 🔄 Restauration au premier rendu */
  useEffect(() => {
    async function restore() {
      try {
        const res = await loadDesignTransforms(productId, designUrl);
        if (res) {
          onRestore(res.transforms);
          lastSavedRef.current = res.lastModified;
        }
      } catch {
        // Fallback : lecture localStorage
        const local = localStorage.getItem(`transforms:${productId}:${designUrl}`);
        if (local) onRestore(JSON.parse(local));
      }
    }
    restore();
  }, [productId, designUrl]);

  /* 💾 Sauvegarde (avec debounce 1 s) */
  const scheduleSave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const transforms = getCurrentTransforms();
      const payload = {
        productId,
        designUrl,
        transforms,
        lastModified: Date.now(),
      };
      try {
        await saveDesignTransforms(payload);
      } catch {
        // Fallback localStorage si offline
        localStorage.setItem(`transforms:${productId}:${designUrl}`,
          JSON.stringify(transforms));
      }
    }, 1000);
  }, [productId, designUrl, getCurrentTransforms]);

  return { scheduleSave };
}
```

### 4.1 Utilisation dans un composant
```tsx
const { scheduleSave } = useDesignTransforms({
  productId: vendorProduct.id,
  designUrl: vendorProduct.designApplication.designUrl,
  onRestore: setTransformsFromBackend,
  getCurrentTransforms: () => currentTransforms,
});

// Dans le handler de drag/zoom
function onManipulationEnd() {
  scheduleSave();
}
```

---

## 5. Intégration dans `ProductImageWithDesign`

1. Après que l'utilisateur déplace ou redimensionne le design :
   ```ts
   // onMouseUp / onTouchEnd
   updateTransforms(index, newTransform);
   scheduleSave();
   ```

---

## 6. UX : indicateurs visuels

* « 📥 Restauration… » pendant l'appel GET
* « 💾 Sauvegarde… » pendant le debounce / appel POST
* Toast « ✅ Modifications enregistrées » en succès ou « ⚠️ Enregistré en local (hors-ligne) » en échec réseau.

---

## 7. Scénarios hors-ligne & conflits

| Cas | Comportement |
|-----|--------------|
| API indisponible | Sauvegarde localStorage, tentative de resync toutes les 30 s. |
| Conflit horodatage (`lastModified`) | Le backend écrase toujours si le `lastModified` reçu est **plus récent**. |

---

## 8. Tests manuels rapides

1. Ouvrir deux onglets sur le même produit.
2. Déplacer le design dans l'onglet A, attendre toast « ✅ ».
3. Rafraîchir l'onglet B ⇒ la position doit être identique.
4. Couper Internet, déplacer, vérifier toast offline.
5. Reconnecter ⇒ observe le POST automatique et la synchro.

---

## 9. Check-list d'intégration

- [ ] Appel GET au montage du composant.
- [ ] Hook `useDesignTransforms` branché aux handlers de manipulation.
- [ ] Debounce 1 s (modifiable via env var `REACT_APP_TRANSFORM_DEBOUNCE_MS`).
- [ ] Toasts / loader.
- [ ] Tests hors-ligne + multi-onglets.

👉 Une fois ces étapes suivies, les vendeurs bénéficieront d'une **expérience continue** : leurs ajustements restent sauvegardés même en cas de refresh, changement d'onglet ou de connexion ! 🍀 

## 2.2 Exemples complets de requêtes & réponses

### POST /vendor/design-transforms (200)
```json
{
  "success": true,
  "message": "Transformations sauvegardées",
  "data": {
    "id": 42,
    "lastModified": "2025-01-02T14:32:11.987Z"
  }
}
```

### GET /vendor/design-transforms/351?designUrl=https://res.cloudinary.com/app/design.png (200)
```json
{
  "success": true,
  "data": {
    "productId": 351,
    "designUrl": "https://res.cloudinary.com/app/design.png",
    "transforms": {
      "0": {
        "x": 25,
        "y": 30,
        "scale": 0.8
      }
    },
    "lastModified": 1672531200000
  }
}
```

### 403 – Accès interdit
```json
{
  "statusCode": 403,
  "message": "Accès refusé à ce produit",
  "error": "Forbidden"
}
```

### 400 – Paramètres manquants (GET)
```json
{
  "statusCode": 400,
  "message": "Parameter designUrl requis",
  "error": "Bad Request"
}
```

> ℹ️ Le backend fonctionne sur **port 3004** avec routes directes `/vendor/design-transforms`. Si vous développez sur Vite (port 5174), configurez votre proxy pour rediriger vers `http://localhost:3004`.