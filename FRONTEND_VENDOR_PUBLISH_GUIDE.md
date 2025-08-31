# Guide d'appel `POST /vendor/publish` (v1)

Cette page explique pas à pas comment envoyer les données au backend pour publier un **Vendor Product**.

## 1. Rappel des règles métier

| Champ            | Obligatoire | Contraintes |
|------------------|-------------|-------------|
| `baseProductId`  | ✔︎          | doit exister dans la base admin |
| `designUrl`      | ✔︎          | URL **https** du design (déjà uploadé) |
| `price`          | ✔︎          | **> base.price** |
| `sizes`          | ✔︎          | Tableau (≥1) d'IDs appartenant au produit de base |
| `colors`         | ✔︎          | Tableau (≥1) d'IDs appartenant au produit de base |
| `mockup` / `mockupUrl` | ✖︎    | Image mock-up finale (fichier ou URL) |

Erreurs possibles (HTTP 400/404) :
```
PRICE_BELOW_MINIMUM         price <= base.price
MISSING_VARIANTS            sizes ou colors vide
SIZE_NOT_IN_BASE:<id>       id de taille hors produit base
COLOR_NOT_IN_BASE:<id>      id de couleur hors produit base
BASE_PRODUCT_NOT_FOUND      produit base inexistant
```

## 2. Authentification

Le backend lit le JWT dans **un cookie** `auth_token` ou dans le header `Authorization: Bearer …`.
Ajoutez toujours `withCredentials: true` dans vos appels Axios/fetch si vous utilisez le cookie.

## 3. Deux formats possibles

### 3.1. JSON pur
`Content-Type: application/json`
```json
POST /vendor/publish
{
  "baseProductId": 260,
  "designUrl": "https://res.cloudinary.com/mycloud/image/upload/v123/design.png",
  "price": 18000,
  "sizes": [361, 362],
  "colors": [274],
  "mockupUrl": null
}
```

### 3.2. Multipart (upload mock-up)
`Content-Type: multipart/form-data`

Deux variantes sont acceptées :

1. **Avec champ `metadata` + fichier** – _recommandé_ :
   * `metadata` = string JSON (même payload que ci-dessus **sans** `mockupUrl`)
   * `mockup`   = fichier PNG/JPEG (≤2 Mo)

   Exemple `curl` :
   ```bash
   curl -X POST http://localhost:3004/vendor/publish \
        -H "Cookie: auth_token=$TOKEN" \
        -F "metadata={\"baseProductId\":260,\"price\":18000,\"sizes\":[361],\"colors\":[274]};type=application/json" \
        -F "mockup=@/tmp/mockup.png;type=image/png"
   ```

2. **Sans `metadata`, champs simples + fichier** – _toléré_ :
   * Chaque valeur arrive en **string** dans `req.body`; le backend les convertit (ex : `sizes` peut être `"361,362"`).

   FormData côté front :
   ```ts
   const form = new FormData();
   form.append('baseProductId', String(baseProductId));
   form.append('designUrl', designUrl);
   form.append('price', String(price));
   form.append('sizes', selectedSizeIds.join(','));      // «361,362»
   form.append('colors', selectedColorIds.join(','));    // «274»
   form.append('mockup', fileInput.files[0]);
   axios.post('/vendor/publish', form, { withCredentials: true });
   ```

## 4. Exemples de code (Axios)

### 4.1. JSON
```ts
import axios from 'axios';

export async function publishProductJson(payload) {
  const { data } = await axios.post('http://localhost:3004/vendor/publish', payload, {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
}
```

### 4.2. Multipart
```ts
import axios from 'axios';

export async function publishProductMultipart({ baseProductId, designUrl, price, sizes, colors, mockupFile }) {
  const form = new FormData();
  // variante «metadata» + fichier
  const metadata = JSON.stringify({ baseProductId, designUrl, price, sizes, colors });
  form.append('metadata', metadata);
  if (mockupFile) form.append('mockup', mockupFile);

  const { data } = await axios.post('http://localhost:3004/vendor/publish', form, {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
```

## 5. Réponse `201`
```json
{
  "success": true,
  "data": {
    "id": 987,
    "vendorId": 42,
    "baseProductId": 260,
    "price": 18000,
    "status": "DRAFT",
    "designUrl": "https://…",
    "mockupUrl": null,
    "sizes": [361, 362],
    "colors": [274],
    "createdAt": "2025-06-18T12:34:56.000Z"
  }
}
```

## 6. Debug : lire le message d'erreur
Le backend renvoie systématiquement un JSON contenant :
```json
{ "statusCode": 400, "message": "PRICE_BELOW_MINIMUM", "error": "Bad Request" }
```
Affichez `error.response.data.message` dans Axios pour guider l'utilisateur.

---
_Màj : 18 juin 2025_ 