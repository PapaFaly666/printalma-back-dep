# Guide Frontend — Desactivation / Reactivation du compte vendeur

Objectif: permettre au vendeur de desactiver et reactiver son compte facilement, avec un flux UX clair et des appels API copies-colles.

---

## 1) Endpoints
- Desactiver le compte: `POST /auth/vendor/deactivate`
- Reactiver le compte: `POST /auth/vendor/reactivate`
- Authentification: Cookie JWT requis (vendeur connecte)

Exemples d'appel:
```bash
# curl (desactiver)
curl -X POST -b "auth_token=..." ${API_BASE}/auth/vendor/deactivate

# curl (reactiver)
curl -X POST -b "auth_token=..." ${API_BASE}/auth/vendor/reactivate
```

```ts
// fetch (desactiver)
await fetch(`${API_BASE}/auth/vendor/deactivate`, {
  method: 'POST',
  credentials: 'include'
});

// fetch (reactiver)
await fetch(`${API_BASE}/auth/vendor/reactivate`, {
  method: 'POST',
  credentials: 'include'
});

// axios (optionnel)
import axios from 'axios';
axios.post(`${API_BASE}/auth/vendor/deactivate`, {}, { withCredentials: true });
axios.post(`${API_BASE}/auth/vendor/reactivate`, {}, { withCredentials: true });
```

---

## 2) Reponses attendues (200)
```json
{
  "success": true,
  "message": "Compte vendeur desactive",
  "data": { "id": 123, "status": false }
}
```
```json
{
  "success": true,
  "message": "Compte vendeur reactive",
  "data": { "id": 123, "status": true }
}
```

Erreurs possibles (a afficher proprement):
- 401: non authentifie (rediriger vers login)
- 403: token invalide ou non vendeur (afficher un message + rediriger)

---

## 3) Comportement cote plateforme (automatique cote backend)
- Un vendeur desactive peut toujours se connecter, mais:
  - Ses publications et contenus publics sont masques (filtrage serveur `vendor.status = true`).
  - Les actions protegees par `VendorGuard` peuvent etre restreintes si necessaire (afficher un bandeau d’avertissement cote UI).

---

## 4) Recommandations UI/UX
- Remplacer le bouton "Supprimer mon compte" par:
  - Bouton principal: "Desactiver mon compte"
  - Confirmation modale (texte clair des consequences)
- Apres desactivation:
  - Afficher un bandeau: "Votre compte est desactive. Certaines fonctionnalites sont indisponibles."
  - Proposer un bouton: "Reactiver mon compte"
- Etats vides:
  - Masquer creation/edition de contenus si non souhaite lorsque le compte est desactive
  - Gerer les erreurs 403/401 par un message amical

Texte suggere (modale de confirmation):
- Titre: "Desactiver mon compte"
- Corps: "Votre boutique et vos publications seront temporairement invisibles au public. Vous pourrez re-activer votre compte a tout moment. Continuer ?"
- CTA: "Oui, desactiver" / "Annuler"

---

## 5) Exemple React/TS (pret a copier)
```tsx
function AccountStatus({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<boolean | null>(null);

  const refresh = async () => {
    // Le profil renvoie status (bool)
    const res = await fetch(`${apiBase}/auth/profile`, { credentials: 'include' });
    if (!res.ok) return setStatus(null);
    const data = await res.json();
    setStatus(data?.status ?? data?.user?.status ?? null);
  };

  useEffect(() => { refresh(); }, []);

  const deactivate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/vendor/deactivate`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        // afficher message erreur
      }
    } finally {
      await refresh();
      setLoading(false);
    }
  };

  const reactivate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/vendor/reactivate`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        // afficher message erreur
      }
    } finally {
      await refresh();
      setLoading(false);
    }
  };

  return (
    <div>
      {status === false && (
        <div role="status">Votre compte est desactive. Certaines fonctionnalites sont indisponibles.</div>
      )}

      {status ? (
        <button disabled={loading} onClick={deactivate}>Desactiver mon compte</button>
      ) : (
        <button disabled={loading} onClick={reactivate}>Reactiver mon compte</button>
      )}
    </div>
  );
}
```

---

## 6) Integration sur la page /vendeur/account
- Au chargement, appeler `/auth/profile` pour recuperer `status` et afficher l’etat.
- Si `status=false`, afficher un bandeau d’avertissement + bouton "Reactiver mon compte".
- Remplacer l’action de suppression par desactivation.
- Option: desactiver (disabled) certains formulaires tant que le compte est desactive.

---

## 7) Notes
- Les publications cote public sont automatiquement masquées pour les vendeurs desactives.
- Garder `credentials: 'include'` pour envoyer le cookie JWT.
