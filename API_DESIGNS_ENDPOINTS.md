# 🖼️ API Designs – Documentation Complète

> Dernière mise à jour : {{DATE}}

## 🔑 Authentification
Toutes les routes Design sont protégées par le `JwtAuthGuard`. Le frontend doit :
1. S'authentifier via `POST /api/auth/login` afin d'obtenir un **JWT**.
2. Envoyer le token dans l'en-tête :
   ```http
   Authorization: Bearer <TOKEN>
   ```
   ou dans un cookie `auth_token`, `jwt`, `authToken` ou `access_token`.

---

## 🌍 Base URL
```
http(s)://<HOST>:3004/api
```

> Pour les exemples, on utilise `http://localhost:3004/api`.

---

## 📑 Table récapitulative
| Méthode | Endpoint | Description | Auth | Body / Params |
|---------|----------|-------------|------|---------------|
| POST    | `/designs` | Créer un design (upload fichier + métadonnées) | ✅ | `multipart/form-data` |
| GET     | `/designs` | Lister les designs du vendeur (pagination + filtres) | ✅ | Query params |
| GET     | `/designs/:id` | Détails d'un design | ✅ | — |
| PUT     | `/designs/:id` | Mettre à jour les métadonnées | ✅ | JSON |
| PATCH   | `/designs/:id/publish` | Publier / dé-publier | ✅ | `{ isPublished: boolean }` |
| PATCH   | `/designs/:id/like` | Like / Unlike (bonus) | ✅ | — |
| DELETE  | `/designs/:id` | Supprimer (si non utilisé) | ✅ | — |
| GET     | `/designs/stats/overview` | Statistiques globales | ✅ | — |

---

## 1️⃣ Créer un design – `POST /designs`
### Headers
```
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data
```

### Form-Data Fields
| Champ | Type | Obligatoire | Détails |
|-------|------|-------------|---------|
| `file` | File | oui | PNG, JPG, JPEG, SVG – max 10 MB |
| `name` | string | oui | ≥ 3 caractères |
| `description` | string | non | 0-1000 caractères |
| `price` | number | oui | ≥ 100 FCFA |
| `category` | string | oui | `logo`, `pattern`, `illustration`, `typography`, `abstract` |
| `tags` | string | non | Liste séparée par virgule |

### Réponse `201`
```json
{
  "success": true,
  "message": "Design créé avec succès",
  "data": {
    "id": 12,
    "name": "Logo Moderne",
    "price": 2500,
    "category": "logo",
    "imageUrl": "https://res.cloudinary.com/.../designs/12/xxx.png",
    "thumbnailUrl": "https://res.cloudinary.com/.../designs/12/thumbnails/xxx.png",
    "isDraft": true,
    "createdAt": "2025-06-23T12:34:56.000Z"
  }
}
```

### Exemple curl
```bash
curl -X POST http://localhost:3004/api/designs \ 
  -H "Authorization: Bearer $TOKEN" \ 
  -F "file=@logo.png" \ 
  -F "name=Logo Moderne" \ 
  -F "description=Un logo épuré" \ 
  -F "price=2500" \ 
  -F "category=logo" \ 
  -F "tags=moderne,entreprise"
```

---

## 2️⃣ Lister les designs – `GET /designs`
### Query Params
| Nom | Type | Défaut | Description |
|-----|------|--------|-------------|
| `page` | number | `1` | Numéro de page |
| `limit` | number | `20` | Éléments par page (≤ 100) |
| `category` | enum | — | Filtrer par catégorie |
| `status` | enum | `all` | `published`, `pending`, `draft`, `all` |
| `search` | string | — | Recherche (name, description, tags) |
| `sortBy` | string | `createdAt` | `price`, `views`, `likes`, `earnings` |
| `sortOrder` | string | `desc` | `asc` ou `desc` |

### Réponse `200`
```json
{
  "success": true,
  "data": {
    "designs": [ { /* … */ } ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 55,
      "itemsPerPage": 20
    },
    "stats": {
      "total": 55,
      "published": 30,
      "pending": 5,
      "draft": 20,
      "totalEarnings": 200000,
      "totalViews": 1234,
      "totalLikes": 456
    }
  }
}
```

---

## 3️⃣ Détails d'un design – `GET /designs/:id`
Réponse `200` : même structure qu'un design dans la liste mais complète.

---

## 4️⃣ Modifier un design – `PUT /designs/:id`
Body JSON (tous facultatifs) :
```json
{
  "name": "Nouveau Nom",
  "description": "…",
  "price": 3500,
  "category": "pattern",
  "tags": "geometric,art"
}
```
Réponse `200` avec l'objet design à jour.

---

## 5️⃣ Publier / Dépublier – `PATCH /designs/:id/publish`
Body JSON :
```json
{ "isPublished": true }
```
Réponse `200` avec le design mis à jour.

---

## 6️⃣ Like / Unlike – `PATCH /designs/:id/like`
(Ajuste `likes` ; implementation simplifiée pour MVP.)

---

## 7️⃣ Supprimer – `DELETE /designs/:id`
Supprime si `usageCount === 0`. Réponse `200` :
```json
{ "success": true, "message": "Design supprimé avec succès" }
```

---

## 8️⃣ Stats overview – `GET /designs/stats/overview`
Renvoie uniquement l'objet `stats` présenté ci-dessus.

---

## 📦 Formats & limitations
* Fichiers : **PNG / JPG / JPEG / SVG**
* Taille max : **10 MB**
* Prix min : **100 FCFA**
* Nom min : **3 caractères**

---

## 📝 Changelog
| Date | Version | Notes |
|------|---------|-------|
| 2025-06-23 | 1.0 | Version initiale | 