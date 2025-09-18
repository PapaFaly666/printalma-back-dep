# Guide Frontend - Membre depuis & Derniere connexion

Ce guide explique comment recuperer et afficher "Membre depuis" et "Derniere connexion" pour le compte vendeur.

---

## Endpoint
- URL: `GET /vendor/stats`
- Auth: Cookie JWT (role vendeur)

Exemple d'appel:
```ts
const res = await fetch(`${API_BASE}/vendor/stats`, { credentials: 'include' });
const { success, data } = await res.json();
```

---

## Champs renvoyes pertinents
La reponse contient 4 champs dedies aux dates de compte:
- `memberSince` (string | null): date ISO brute de creation du compte (User.created_at).
- `lastLoginAt` (string | null): date ISO brute de derniere connexion (User.last_login_at).
- `memberSinceFormatted` (string | null): date formatee cote backend, format `YYYY-MM-DD HH:mm`.
- `lastLoginAtFormatted` (string | null): date formatee cote backend, format `YYYY-MM-DD HH:mm`.

Exemple (extrait de la reponse 200):
```json
{
  "success": true,
  "data": {
    "totalProducts": 12,
    "publishedProducts": 5,
    "draftProducts": 4,
    "pendingProducts": 3,
    "totalValue": 125000,
    "averagePrice": 10416.67,
    "totalDesigns": 9,
    "publishedDesigns": 3,
    "draftDesigns": 2,
    "pendingDesigns": 4,
    "validatedDesigns": 3,
    "memberSince": "2024-05-12T09:31:00.000Z",
    "lastLoginAt": "2025-09-18T14:05:00.000Z",
    "memberSinceFormatted": "2024-05-12 09:31",
    "lastLoginAtFormatted": "2025-09-18 14:05",
    "architecture": "v2_preserved_admin"
  }
}
```

---

## Affichage recommande cote frontend
Deux options:

1) Utiliser les champs formates par le backend (recommande)
```tsx
// React/TS
<Text>Membre depuis: {data.memberSinceFormatted ?? '—'}</Text>
<Text>Derniere connexion: {data.lastLoginAtFormatted ?? '—'}</Text>
```

2) Formater cote frontend (si vous preferez gerer la locale)
```ts
function formatIsoToFr(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} a ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const membreDepuis = formatIsoToFr(data.memberSince) ?? '—';
const derniereConnexion = formatIsoToFr(data.lastLoginAt) ?? '—';
```

---

## Etats vides & accessibilite
- Si l'utilisateur ne s'est jamais connecte, `lastLoginAt` peut etre `null` -> afficher `—`.
- Utiliser des `aria-label` explicites pour lecteurs d'ecran.

---

## Notes
- Les champs sont disponibles depuis l'ajout de `memberSince*` et `lastLoginAt*` dans `/vendor/stats`.
- Format backend actuel: `YYYY-MM-DD HH:mm`. D'autres formats peuvent etre ajoutes sur demande.
