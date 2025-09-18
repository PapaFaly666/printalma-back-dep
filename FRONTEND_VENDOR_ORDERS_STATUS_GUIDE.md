## Guide Frontend — Changement de statut des commandes vendeur

Ce guide explique comment le frontend doit appeler l'API pour mettre à jour le statut d'une commande côté vendeur, les transitions autorisées, les payloads attendus et la gestion d'erreurs.

### Endpoint
- **Méthode**: `PATCH`
- **URL**: `/vendor/orders/{orderId}/status`
- **Headers**:
  - `Authorization: Bearer <token>` (utilisateur avec rôle `VENDEUR`)
  - `Content-Type: application/json`

### Body (DTO)
```json
{
  "status": "CONFIRMED",
  "notes": "Optionnel, texte libre"
}
```

- `status` est requis, en MAJUSCULES, et doit appartenir aux valeurs: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REJECTED`.
- `notes` est optionnel (`string`).

### Transitions autorisées
Le backend impose un graphe de transitions que le vendeur peut effectuer:

- `PENDING` → `CONFIRMED`
- `CONFIRMED` → `PROCESSING`
- `PROCESSING` → `SHIPPED`
- `SHIPPED` → (aucune)
- `DELIVERED` → (aucune)
- `CANCELLED` → (aucune)
- `REJECTED` → (aucune)

Si une transition non listée est tentée, l'API renverra `400 Bad Request` avec un message explicite, par ex.: `Transition de statut non autorisée: CURRENT → NEW`.

### Réponse attendue (succès)
```json
{
  "success": true,
  "message": "Statut de commande mis à jour",
  "data": {
    // Commande complète mise à jour (objet commande)
  }
}
```

### Exemples d'appel

Axios:
```ts
import axios from 'axios';

type VendorStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export async function updateOrderStatus(
  orderId: number,
  status: VendorStatus,
  notes?: string
) {
  const token = /* récupérer le token */ '';
  const url = `http://localhost:3004/vendor/orders/${orderId}/status`;

  const res = await axios.patch(
    url,
    { status, notes },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data; // { success, message, data }
}
```

Fetch:
```ts
export async function updateOrderStatusFetch(
  orderId: number,
  status: string,
  notes?: string
) {
  const token = /* récupérer le token */ '';
  const res = await fetch(`http://localhost:3004/vendor/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: status.toUpperCase(), notes }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Erreur mise à jour statut');
  }
  return data;
}
```

### Conseil UI: lister uniquement les statuts atteignables
Pour éviter les erreurs 400, proposez dynamiquement les statuts suivants selon le statut courant:

```ts
const transitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED'],
  CONFIRMED: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: [],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

export function getAllowedNextStatuses(current: string): string[] {
  return transitions[current?.toUpperCase()] ?? [];
}
```

Exemple: dans un composant, un `Select` rempli via `getAllowedNextStatuses(order.status)`.

### Gestion d'erreurs côté frontend
- **400 Bad Request**:
  - Statut invalide (non dans l'énum)
  - Transition non autorisée (voir transitions)
  - Payload invalide
- **401/403**: Token manquant/expiré, rôle non autorisé (`VENDEUR` requis)
- **404**: Commande introuvable ou non accessible par ce vendeur
- **500**: Erreur serveur

Affichez le message retourné par l'API (`data.message`) pour l'utilisateur, et logguez l'erreur technique pour le debug.

### Notes de compat
- L'ID de commande dans l'URL doit être numérique: la route `GET /vendor/orders/:orderId` a été restreinte aux IDs numériques; `statistics` est désormais servi par `GET /vendor/orders/statistics` sans conflit.

### Checklist d'intégration rapide
- [ ] Récupérer et injecter le `Bearer <token>`
- [ ] Construire un sélecteur de statuts basé sur `getAllowedNextStatuses`
- [ ] Envoyer `status` en MAJUSCULES, `notes` optionnel
- [ ] Gérer et afficher les erreurs (400/401/403/404/500)
- [ ] Rafraîchir la vue après succès (recharger commande ou liste)



