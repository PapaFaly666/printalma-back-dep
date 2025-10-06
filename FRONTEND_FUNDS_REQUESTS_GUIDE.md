# Guide Frontend — Demandes d’appel de fonds (flow auto-approval)

Ce document explique comment le frontend doit intégrer les demandes d’appel de fonds après les changements backend:
- Création: auto-approbation immédiate si le solde est suffisant
- Admin: plus de rejet; seuls les statuts APPROVED et PAID sont utilisés

## Endpoints utiles

- Vendeur
  - POST `/vendor/funds-requests` — créer une demande
  - GET `/vendor/funds-requests` — lister les demandes (pagination/filtre)
  - GET `/vendor/funds-requests/:id` — détail d’une demande
  - GET `/vendor/earnings` — récupérer les gains (disponible, en attente, etc.)

- Admin (référence affichage back-office)
  - GET `/admin/funds-requests` — lister toutes les demandes
  - GET `/admin/funds-requests/statistics` — stats
  - GET `/admin/funds-requests/:id` — détail d’une demande
  - PATCH `/admin/funds-requests/:id/process` — marquer APPROVED/PAID (REJECTED désactivé)

Tous les endpoints nécessitent l’authentification (Bearer JWT ou cookies de session, selon l’app).

## Création d’une demande (vendeur)

Requête:
```http
POST /vendor/funds-requests
Authorization: Bearer <JWT>
Content-Type: application/json
```

Corps:
```json
{
  "amount": 50000,
  "description": "Retrait partiel",
  "paymentMethod": "WAVE",
  "phoneNumber": "+221770000000",
  "orderIds": [123, 456]
}
```

Réponse (succès):
```json
{
  "success": true,
  "message": "Demande créée avec succès",
  "data": {
    "id": 42,
    "vendorId": 7,
    "amount": 50000,
    "requestedAmount": 50000,
    "description": "Retrait partiel",
    "paymentMethod": "WAVE",
    "phoneNumber": "+221770000000",
    "status": "APPROVED",
    "adminNote": null,
    "rejectReason": null,
    "processedBy": null,
    "processedByUser": null,
    "processedAt": null,
    "availableBalance": 120000,
    "commissionRate": 0.1,
    "requestDate": "2025-09-22T11:30:00.000Z",
    "createdAt": "2025-09-22T11:30:00.000Z",
    "updatedAt": "2025-09-22T11:30:00.000Z"
  }
}
```

Remarques importantes:
- Si le solde disponible est insuffisant, le backend renvoie 400 avec un message clair.
- Si suffisant, la demande est immédiatement en `APPROVED`. Le vendeur n’a pas d’action supplémentaire.

## États et transitions (simplifiés)

- `APPROVED` (à la création si solde suffisant)
- `PAID` (après paiement par l’admin)

Le statut `REJECTED` n’est plus utilisé. Toute tentative de rejet côté admin est bloquée.

## UI vendeur — recommandations

- Écran “Mes gains”:
  - Afficher: `availableAmount`, `pendingAmount`, `totalEarnings` (GET `/vendor/earnings`).
  - Bouton “Demander un retrait” désactivé si `availableAmount <= 0`.

- Modal “Demande de retrait”:
  - Form: `amount`, `paymentMethod`, `phoneNumber`, `description`.
  - Valider que `amount <= availableAmount` avant POST.
  - Après succès: afficher un message confirmant que la demande est “approuvée” et visible dans l’historique.

- Liste des demandes (GET `/vendor/funds-requests`):
  - Colonnes: Date, Montant, Méthode, Statut, Note admin (optionnel).
  - Badges statut: `APPROVED` (bleu) → `PAID` (vert).

- Détail d’une demande:
  - Afficher toutes les métadonnées utiles: `amount`, `paymentMethod`, `status`, `processedAt`, `processedByUser` (si disponible), etc.

## Exemples de code (frontend)

Récupérer les gains:
```ts
async function fetchEarnings() {
  const res = await fetch(`${API_URL}/vendor/earnings`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erreur chargement gains');
  return res.json();
}
```

Créer une demande:
```ts
async function createFundsRequest(payload: {
  amount: number;
  description?: string;
  paymentMethod: 'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER';
  phoneNumber: string;
  orderIds?: number[];
}) {
  const res = await fetch(`${API_URL}/vendor/funds-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur création demande');
  return data;
}
```

Lister les demandes (pagination):
```ts
async function listFundsRequests(params: { page?: number; limit?: number; status?: 'APPROVED' | 'PAID' }) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.status) qs.set('status', params.status);

  const res = await fetch(`${API_URL}/vendor/funds-requests?${qs.toString()}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur chargement demandes');
  return data;
}
```

## Messages d’erreur à gérer côté UI

- Solde insuffisant à la création: afficher le message backend, ex: “Solde insuffisant. Disponible: 40 000 FCFA, Demandé: 50 000 FCFA”.
- Erreurs réseau: fallback et toasts génériques.

## Bonnes pratiques UX

- Pré-remplir `phoneNumber` avec le numéro enregistré si dispo.
- Conserver la dernière `paymentMethod` utilisée.
- Afficher un loader et désactiver le bouton pendant la requête.
- Après succès, rafraîchir la liste des demandes et les `earnings`.

---

Pour toute divergence, vérifier le code backend dans `src/vendor-funds/` et le schéma Prisma `prisma/schema.prisma` (modèle `VendorFundsRequest`).
















