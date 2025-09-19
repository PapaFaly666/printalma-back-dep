# Guide Frontend - Gestion Auto-Désactivation Compte Vendeur

## 🎯 Objectif
Permettre aux vendeurs de désactiver/réactiver leur propre compte depuis leur interface d'administration avec les comportements suivants :

### ✅ **Compte désactivé**
- Le vendeur garde **accès COMPLET** à son panel d'administration
- Peut **afficher, gérer, ajouter** tous ses produits et designs
- Peut **créer de nouveaux produits/designs** sans restriction
- **Seuls les clients** ne voient plus ses produits (côté public masqué)

### ✅ **Compte réactivé**
- Les produits redeviennent **visibles aux clients** immédiatement
- Aucune perte de données ou fonctionnalités

## 🛠️ Components React

### 1. Hook personnalisé pour gérer le statut vendeur

```typescript
// hooks/useVendorStatus.ts
import { useState, useCallback } from 'react';
import { apiCall } from '../utils/apiUtils';
import { toast } from 'react-toastify';

interface VendorStatusState {
  isActive: boolean;
  isLoading: boolean;
}

export const useVendorStatus = (initialStatus: boolean = true) => {
  const [state, setState] = useState<VendorStatusState>({
    isActive: initialStatus,
    isLoading: false
  });

  const toggleStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await apiCall({
        endpoint: '/vendor-products/vendor/toggle-status',
        method: 'PUT',
        requiresAuth: true
      });

      if (response.success) {
        setState(prev => ({
          isActive: response.data.newStatus,
          isLoading: false
        }));

        toast.success(
          response.data.newStatus
            ? '✅ Compte réactivé - Vos produits sont maintenant visibles'
            : '⚠️ Compte désactivé - Vos produits sont masqués aux clients'
        );

        return response.data;
      }
    } catch (error) {
      console.error('Erreur toggle status:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Erreur lors du changement de statut');
      throw error;
    }
  }, []);

  return {
    isActive: state.isActive,
    isLoading: state.isLoading,
    toggleStatus
  };
};
```

### 2. Composant de contrôle du statut

```typescript
// components/VendorStatusToggle.tsx
import React from 'react';
import { Switch, FormControlLabel, Box, Typography, Paper, Alert } from '@mui/material';
import { useVendorStatus } from '../hooks/useVendorStatus';

interface VendorStatusToggleProps {
  initialStatus: boolean;
  className?: string;
}

export const VendorStatusToggle: React.FC<VendorStatusToggleProps> = ({
  initialStatus,
  className
}) => {
  const { isActive, isLoading, toggleStatus } = useVendorStatus(initialStatus);

  const handleToggle = async () => {
    try {
      await toggleStatus();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  return (
    <Paper elevation={2} className={`p-4 ${className}`}>
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography variant="h6" component="h3">
          Statut de votre compte
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={handleToggle}
              disabled={isLoading}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1" fontWeight="medium">
                {isActive ? 'Compte actif' : 'Compte désactivé'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {isActive
                  ? 'Vos produits sont visibles par les clients'
                  : 'Vos produits sont masqués aux clients'
                }
              </Typography>
            </Box>
          }
        />

        {!isActive && (
          <Alert severity="warning" variant="outlined">
            <Typography variant="body2">
              Votre compte est désactivé. Vous gardez accès à votre panel d'administration
              mais vos produits ne sont plus visibles par les clients.
            </Typography>
          </Alert>
        )}

        {isActive && (
          <Alert severity="success" variant="outlined">
            <Typography variant="body2">
              Votre compte est actif. Vos produits sont visibles par les clients.
            </Typography>
          </Alert>
        )}
      </Box>
    </Paper>
  );
};
```

### 3. Composant d'information sur l'impact

```typescript
// components/VendorStatusInfo.tsx
import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { CheckCircle, Cancel, Info } from '@mui/icons-material';

export const VendorStatusInfo: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <Info color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
        Impact de la désactivation
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Comprendre les effets de la désactivation de votre compte :
      </Typography>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
        <Box>
          <Typography variant="subtitle2" color="success.main" gutterBottom>
            <CheckCircle fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Vous gardez l'accès à :
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Votre panel d'administration" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Gestion de vos produits" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vos designs et créations" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Ajout de nouveaux produits" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Statistiques et rapports" />
            </ListItem>
          </List>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="error.main" gutterBottom>
            <Cancel fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Les clients ne voient plus :
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Vos produits dans le catalogue" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vos designs dans les recherches" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Votre boutique publique" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vos meilleures ventes" />
            </ListItem>
          </List>
        </Box>
      </Box>
    </Box>
  );
};
```

### 4. Page de gestion du compte vendeur

```typescript
// pages/VendorAccountSettings.tsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Skeleton
} from '@mui/material';
import { VendorStatusToggle } from '../components/VendorStatusToggle';
import { VendorStatusInfo } from '../components/VendorStatusInfo';
import { apiCall } from '../utils/apiUtils';

export const VendorAccountSettings: React.FC = () => {
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const response = await apiCall({
          endpoint: '/vendor-products/vendor/profile',
          method: 'GET',
          requiresAuth: true
        });

        if (response.success) {
          setVendorData(response.data);
        }
      } catch (error) {
        console.error('Erreur chargement profil vendeur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Skeleton variant="rectangular" height={200} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Paramètres du compte
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <VendorStatusToggle
              initialStatus={vendorData?.status || false}
              className="mb-4"
            />
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={1} className="p-4">
              <VendorStatusInfo />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
```

## 🔧 Services et Utilitaires

### 1. Service API pour la gestion du statut

```typescript
// services/vendorStatusService.ts
import { apiCall } from '../utils/apiUtils';

export interface VendorStatusResponse {
  success: boolean;
  data: {
    vendorId: number;
    oldStatus: boolean;
    newStatus: boolean;
    message: string;
  };
}

export const vendorStatusService = {
  async toggleStatus(): Promise<VendorStatusResponse> {
    return await apiCall({
      endpoint: '/vendor-products/vendor/toggle-status',
      method: 'PUT',
      requiresAuth: true
    });
  },

  async getStatus(): Promise<{ status: boolean }> {
    const response = await apiCall({
      endpoint: '/vendor-products/vendor/profile',
      method: 'GET',
      requiresAuth: true
    });

    return { status: response.data.status };
  }
};
```

### 2. Context pour la gestion globale du statut

```typescript
// contexts/VendorStatusContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { vendorStatusService } from '../services/vendorStatusService';

interface VendorStatusContextType {
  isActive: boolean;
  setIsActive: (status: boolean) => void;
  refreshStatus: () => Promise<void>;
}

const VendorStatusContext = createContext<VendorStatusContextType | undefined>(undefined);

export const useVendorStatusContext = () => {
  const context = useContext(VendorStatusContext);
  if (!context) {
    throw new Error('useVendorStatusContext must be used within VendorStatusProvider');
  }
  return context;
};

interface VendorStatusProviderProps {
  children: ReactNode;
}

export const VendorStatusProvider: React.FC<VendorStatusProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(true);

  const refreshStatus = async () => {
    try {
      const { status } = await vendorStatusService.getStatus();
      setIsActive(status);
    } catch (error) {
      console.error('Erreur refresh status:', error);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <VendorStatusContext.Provider value={{ isActive, setIsActive, refreshStatus }}>
      {children}
    </VendorStatusContext.Provider>
  );
};
```

## 🚀 Intégration dans l'application

### 1. Dans le router principal

```typescript
// Router.tsx
import { VendorAccountSettings } from './pages/VendorAccountSettings';

// Ajouter la route
<Route path="/vendor/account-settings" component={VendorAccountSettings} />
```

### 2. Dans le menu de navigation vendeur

```typescript
// components/VendorNavigation.tsx
import { Settings } from '@mui/icons-material';

// Ajouter l'item de menu
<MenuItem component={Link} to="/vendor/account-settings">
  <ListItemIcon>
    <Settings />
  </ListItemIcon>
  <ListItemText primary="Paramètres du compte" />
</MenuItem>
```

### 3. Wrapper avec le provider

```typescript
// App.tsx
import { VendorStatusProvider } from './contexts/VendorStatusContext';

function App() {
  return (
    <VendorStatusProvider>
      {/* Rest of your app */}
    </VendorStatusProvider>
  );
}
```

## 📱 Responsive Design

Les composants sont conçus pour être responsives avec Material-UI :

- **Mobile** : Switch et information empilés verticalement
- **Tablet/Desktop** : Disposition en grille avec informations côte à côte
- **Feedback visuel** : Alerts contextuelles selon le statut

## 🎨 Personnalisation

### Thème et couleurs

```typescript
// styles/vendorStatusTheme.ts
export const vendorStatusTheme = {
  active: {
    color: '#4caf50',
    background: '#e8f5e8'
  },
  inactive: {
    color: '#ff9800',
    background: '#fff3e0'
  }
};
```

## ✅ Checklist d'implémentation

- [ ] Implémenter le hook `useVendorStatus`
- [ ] Créer le composant `VendorStatusToggle`
- [ ] Ajouter le composant d'information `VendorStatusInfo`
- [ ] Créer la page de paramètres compléte
- [ ] Intégrer le service API
- [ ] Ajouter le context global si nécessaire
- [ ] Tester les différents états (actif/inactif)
- [ ] Vérifier la responsivité mobile
- [ ] Valider les messages de feedback utilisateur

Ce guide fournit une implémentation complète pour permettre aux vendeurs de gérer leur statut d'activation de manière autonome.

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
