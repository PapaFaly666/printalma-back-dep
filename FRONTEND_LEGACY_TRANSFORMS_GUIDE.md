# 📓 Guide Frontend : Comprendre l'endpoint `GET /vendor/design-transforms`

> **Objectif** : Expliquer pourquoi la route `GET /vendor/design-transforms/{id}?designUrl=...` renvoie `data: null` et comment l'utiliser correctement.

---

## 1. Le problème : `data: null`

Vous faites cet appel :
```http
GET /vendor/design-transforms/70?designUrl=https://res.cloudinary.com/.../design.png
```
Et vous recevez :
```json
{
  "success": true,
  "data": null
}
```

Ce n'est **pas une erreur**. C'est la réponse normale du backend lorsque **aucune transformation n'a été sauvegardée** pour le couple d'identifiants que vous avez fourni.

Le backend recherche une ligne dans la base de données qui correspond **exactement** à deux conditions :
1.  Le `productId` dans l'URL.
2.  Le `designUrl` dans les paramètres de la requête.

Si une de ces deux informations est incorrecte ou si aucune sauvegarde n'a jamais été faite, le résultat sera `null`.

---

## 2. La source de l'erreur : les paramètres

Il y a deux points cruciaux à comprendre.

### Point n°1 : `{productId}` est en réalité `vendorProductId`

C'est la confusion principale. Pour des raisons de compatibilité, la route s'appelle `/vendor/design-transforms/:productId`, mais le backend attend en réalité l'**ID du produit vendeur** (`vendorProductId`), pas l'ID du produit de base (`baseProductId`).

- `baseProductId` : L'ID du produit dans le catalogue général (ex: `2` pour "T-shirt Homme").
- `vendorProductId` : L'ID unique du produit que le vendeur a créé **à partir** du produit de base (ex: `70`).

**Solution :**
Avant de faire l'appel, vous **devez** utiliser le helper `resolveVendorProductId` pour obtenir le bon ID.

```ts
// ❌ INCORRECT - product.id est peut-être un baseProductId
const url = `/vendor/design-transforms/${product.id}?designUrl=...`;

// ✅ CORRECT
import { resolveVendorProductId } from '@/helpers/vendorIdResolvers';

const realVendorProductId = resolveVendorProductId(product, vendorProducts);
const url = `/vendor/design-transforms/${realVendorProductId}?designUrl=...`;
```

### Point n°2 : `designUrl` doit être une correspondance exacte

L'URL du design est utilisée comme une clé de recherche. La moindre différence empêchera le backend de trouver la bonne ligne.

- `http` vs `https`
- Transformations Cloudinary différentes dans l'URL
- Espaces ou caractères spéciaux non encodés

**Solution :**
Utilisez toujours le `design.imageUrl` tel que fourni par l'API et encodez-le correctement dans l'URL de la requête.

```ts
const encodedUrl = encodeURIComponent(design.imageUrl);
const url = `/vendor/design-transforms/${vpId}?designUrl=${encodedUrl}`;
```

---

## 3. Workflow complet à suivre

1.  **Récupérer les vrais IDs** :
    ```ts
    const vpId = resolveVendorProductId(product, allMyVendorProducts);
    ```
2.  **Encoder l'URL du design** :
    ```ts
    const encodedUrl = encodeURIComponent(design.imageUrl);
    ```
3.  **Construire et exécuter la requête** :
    ```ts
    const { data } = await apiClient.get(
      `/vendor/design-transforms/${vpId}?designUrl=${encodedUrl}`
    );
    ```
4.  **Gérer la réponse** :
    ```ts
    if (data.data === null) {
      // Aucune position sauvegardée, on utilise une position par défaut (centrée).
      // CE N'EST PAS UNE ERREUR.
    } else {
      // On a reçu des transformations, on les applique.
      const { positioning } = data.data.transforms;
      // ...
    }
    ```

---

## 4. ⭐ Recommandation : migrer vers les nouvelles routes

Cet endpoint `/vendor/design-transforms` est conservé pour la compatibilité.

Pour toute nouvelle fonctionnalité, veuillez utiliser les **nouveaux endpoints** qui sont plus simples et plus robustes car ils ne dépendent pas d'une URL de design.

**Nouvel Endpoint :**
```http
GET /api/vendor-products/{vendorProductId}/designs/{designId}/position/direct
```

- Utilise des **IDs numériques** (`vendorProductId`, `designId`), ce qui élimine les problèmes de `designUrl`.
- Retourne directement l'objet position.

Pour plus de détails, consultez :
- `FRONTEND_VENDOR_DESIGN_POSITION_HELP.md`
- `frontend/src/hooks/useDesignPosition.ts` (qui utilise déjà ce nouvel endpoint). 
 
 
 
 