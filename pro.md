# Déprécation du statut REJECTED pour les demandes d'appel de fonds

Objectif: simplifier le workflow d'appel de fonds côté vendeur et admin. Le statut `REJECTED` est retiré: les demandes passent de `PENDING` → `APPROVED` → `PAID`. Les validations ou corrections se font avant la création de la demande côté vendeur.

## Changement fonctionnel
- Statuts conservés: `PENDING`, `APPROVED`, `PAID`
- Statut supprimé: `REJECTED`
- Champs supprimés: `rejectReason` (texte), `approvedDate` reste optionnel

## Modifs Backend à réaliser
1) Types/DTO
- FundsRequest.status: retirer `REJECTED`
- Supprimer `rejectReason?: string` des DTO (request/response)

2) Endpoints Admin
- `PATCH /admin/funds-requests/:id/process`:
  - Supprimer la branche `status === 'REJECTED'`
  - Contrat d'entrée: `status` ∈ { `APPROVED`, `PAID` } uniquement
  - Si `status === 'APPROVED'`: définir `approvedDate = now()`, `processedDate = now()`, `processedBy = adminId`, persister `adminNote` si fournie
  - Si `status === 'PAID'`: idempotence + sécurité (ne payer que si `APPROVED`), enregistrer `processedDate = now()` et journaliser l'opération de paiement

3) Filtres/Liste
- `GET /admin/funds-requests` et `GET /vendor/funds-requests`: si un filtre `status=REJECTED` est reçu, renvoyer 400 (ou l’ignorer/graceful fallback). Mettre à jour la doc d’API.

4) Migration de données
- Mettre à jour toutes les lignes `status = 'REJECTED'` vers `status = 'PENDING'` (ou `APPROVED` selon la politique choisie). Recommandation: migrer vers `PENDING` et notifier les admins.
- Supprimer la colonne `reject_reason` si créée séparément. Option: la conserver un temps en lecture seule si historique nécessaire.

5) Règles métier
- La validation des informations (numéro téléphone, méthode de paiement) doit être faite avant la création (`POST /vendor/funds-requests`) avec des erreurs 4xx explicites. Ainsi, le rejet manuel n’est plus requis.

## Contrats finaux (proposés)
FundsRequest (réponse):
```json
{
  "id": 123,
  "vendorId": 2000,
  "amount": 45000,
  "requestedAmount": 45000,
  "description": "Demande de retrait de 45 000 F",
  "paymentMethod": "WAVE",
  "phoneNumber": "+221770001234",
  "status": "PENDING" | "APPROVED" | "PAID",
  "requestDate": "2025-01-17T09:15:00Z",
  "approvedDate": "2025-01-17T10:30:00Z",
  "processedDate": "2025-01-17T10:30:00Z",
  "processedBy": 1,
  "adminNote": "Demande approuvée",
  "orderIds": [1,2],
  "availableBalance": 45000,
  "commissionRate": 0.1,
  "createdAt": "2025-01-17T09:15:00Z",
  "updatedAt": "2025-01-17T10:30:00Z"
}
```

ProcessFundsRequest (entrée admin):
```json
{
  "status": "APPROVED" | "PAID",
  "adminNote": "string (optionnel)"
}
```

## Validation côté serveur (exemples)
- POST /vendor/funds-requests: vérifier `amount >= min`, `amount <= availableBalance`, format `phoneNumber`, `paymentMethod` ∈ {WAVE, ORANGE_MONEY, BANK_TRANSFER}.
- PATCH /admin/funds-requests/:id/process:
  - APPROVED: autorisé si status actuel = PENDING
  - PAID: autorisé si status actuel = APPROVED

## Journalisation & Audit
- Conserver un journal (table events) pour anciennes transitions `REJECTED` si historique nécessaire. Le champ `reject_reason` peut être migré vers la table d’événements avant suppression.

## Synchronisation Frontend
- Les écrans `/vendeur/appel-de-fonds` et `/admin/payment-requests` n’affichent plus le rejet.
- Les filtres d’UI et les actions rapides ne proposent plus `REJECTED`.

## Plan de déploiement
1. Déployer backend avec nouveaux contrats (supporter transitoirement l’ancien filtre REJECTED → 400 ou ignoré)
2. Déployer frontend aligné (déjà prêt)
3. Lancer migration de données `REJECTED → PENDING`
4. Nettoyage colonnes/champs obsolètes après période de grâce


