## Frontend — Afficher la commission d’un vendeur (requests & responses)

Objectif
- Récupérer et afficher la commission d’un vendeur dans l’UI admin, avec mise à jour possible.

Principes
- Auth par cookies HttpOnly. Toujours envoyer `withCredentials: true`.
- Les endpoints commission sont protégés (ADMIN/SUPERADMIN). Gérer les 401 → redirection login.

Base API
- URL: `http://localhost:3004` (adapter via env `REACT_APP_API_URL`).

Client axios
```ts
// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

Endpoints commission (côté admin)
- GET commission d’un vendeur: `GET /admin/vendors/:vendorId/commission`
- PUT mise à jour commission: `PUT /admin/vendors/:vendorId/commission` body `{ commissionRate: number }`

Service commission
```ts
// src/services/commissionService.ts
import { api } from './api';

export type VendorCommission = {
  vendorId: number;
  commissionRate: number; // en pourcentage, ex: 40.0
  updatedAt?: string;
  updatedBy?: number;
};

export async function getVendorCommission(vendorId: number) {
  const { data } = await api.get(`/admin/vendors/${vendorId}/commission`);
  // Réponses typiques:
  // { success: true, data: { vendorId, commissionRate, updatedAt, updatedBy }, message?: string }
  return data;
}

export async function updateVendorCommission(vendorId: number, commissionRate: number) {
  const { data } = await api.put(`/admin/vendors/${vendorId}/commission`, { commissionRate });
  // Réponses typiques:
  // { success: true, data: { vendorId, commissionRate, updatedAt, updatedBy }, message: 'Commission mise à jour avec succès' }
  return data;
}
```

Exemples de requêtes (curl)
```bash
# GET
curl -X GET 'http://localhost:3004/admin/vendors/42/commission' \
  -H 'Content-Type: application/json' \
  --cookie 'access_token=...'

# PUT
curl -X PUT 'http://localhost:3004/admin/vendors/42/commission' \
  -H 'Content-Type: application/json' \
  --cookie 'access_token=...' \
  -d '{ "commissionRate": 35.5 }'
```

Réponses attendues
```json
// 200 GET
{
  "success": true,
  "data": {
    "vendorId": 42,
    "commissionRate": 40,
    "updatedAt": "2025-06-12T11:22:33.000Z",
    "updatedBy": 1
  }
}
```
```json
// 200 PUT
{
  "success": true,
  "message": "Commission mise à jour avec succès",
  "data": {
    "vendorId": 42,
    "commissionRate": 35.5,
    "updatedAt": "2025-06-12T11:25:00.000Z",
    "updatedBy": 1
  }
}
```
```json
// 401 (non authentifié)
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
```json
// 403 (rôle insuffisant)
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```
```json
// 404 (vendeur introuvable)
{
  "success": false,
  "error": "VENDOR_NOT_FOUND",
  "message": "Vendeur introuvable"
}
```
```json
// 400 (taux invalide)
{
  "success": false,
  "error": "INVALID_COMMISSION_RATE",
  "message": "Le taux de commission doit être entre 0 et 100"
}
```

Composant UI (exemple minimal React)
```tsx
// src/components/admin/commission/VendorCommissionCard.tsx
import React, { useEffect, useState } from 'react';
import { getVendorCommission, updateVendorCommission } from '../../services/commissionService';

export function VendorCommissionCard({ vendorId }: { vendorId: number }) {
  const [rate, setRate] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getVendorCommission(vendorId);
        const current = res?.data?.commissionRate;
        if (typeof current === 'number') setRate(current);
      } catch (e: any) {
        setError(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId]);

  async function onSave() {
    try {
      setLoading(true);
      setError(null);
      setSavedMsg(null);
      const numeric = typeof rate === 'string' ? Number(rate) : rate;
      if (!Number.isFinite(numeric)) throw new Error('Taux invalide');
      const res = await updateVendorCommission(vendorId, numeric as number);
      setSavedMsg(res?.message || 'Enregistré');
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && rate === '') return <div>Chargement…</div>;
  return (
    <div>
      <div>Commission actuelle (%)</div>
      <input
        type="number"
        step="0.1"
        value={rate}
        onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
        min={0}
        max={100}
      />
      <button onClick={onSave} disabled={loading}>Sauvegarder</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {savedMsg && <div style={{ color: 'green' }}>{savedMsg}</div>}
    </div>
  );
}
```

Checklist & conseils
- Toujours `withCredentials: true` pour envoyer le cookie d’auth.
- Valider côté UI que le taux est entre 0 et 100 (pas obligatoire mais recommandé).
- Gérer 401/403 proprement (rediriger login/afficher message permission).
- Journaliser les erreurs réseau dans la console pour debug.















