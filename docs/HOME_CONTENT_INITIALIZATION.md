# Guide d'Initialisation - Contenu Page d'Accueil

## 📋 Vue d'ensemble

Ce guide explique comment initialiser le contenu de la page d'accueil lorsque la base de données est vide. Cette opération ne doit être effectuée **qu'une seule fois** lors de la première mise en service.

---

## ⚠️ IMPORTANT

L'initialisation crée **17 items** (6 + 5 + 6) qui ne pourront plus être ni ajoutés ni supprimés par la suite. Seuls le **nom** et l'**image** pourront être modifiés.

---

## 🔍 Vérifier si l'initialisation est nécessaire

### Endpoint de vérification

**GET /api/admin/content**

Si la réponse contient les 17 items, l'initialisation est **déjà faite**. Ne la refaites pas !

```typescript
// Vérifier si l'initialisation est nécessaire
const checkInitialization = async () => {
  const response = await fetch('https://api.printalma.com/api/admin/content', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  const totalItems = data.designs.length + data.influencers.length + data.merchandising.length;

  if (totalItems === 17) {
    console.log('✅ Le contenu est déjà initialisé');
    return true; // Déjà initialisé
  }

  console.log('⚠️ Le contenu n\'est pas initialisé');
  return false; // Non initialisé
};
```

**Réponse si non initialisé:**
```json
{
  "designs": [],
  "influencers": [],
  "merchandising": []
}
```

---

## 🚀 Initialiser le contenu

### Endpoint d'initialisation

**POST /api/admin/content/initialize**

**Authentification:** Requise (Admin/Superadmin uniquement)

**Response:**
```json
{
  "success": true,
  "message": "Contenu initialisé avec succès",
  "count": 17
}
```

### Implémentation React

```typescript
import React, { useState, useEffect } from 'react';

export const InitializeContentPage: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    checkIfInitialized();
  }, []);

  const checkIfInitialized = async () => {
    try {
      const response = await fetch('https://api.printalma.com/api/admin/content', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      const totalItems = data.designs.length + data.influencers.length + data.merchandising.length;

      setIsInitialized(totalItems === 17);
    } catch (err) {
      console.error('Erreur vérification:', err);
    }
  };

  const handleInitialize = async () => {
    if (!confirm('⚠️ ATTENTION: Cette opération va créer 17 items qui ne pourront plus être supprimés. Continuer?')) {
      return;
    }

    setInitializing(true);
    setError(null);

    try {
      const response = await fetch('https://api.printalma.com/api/admin/content/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'initialisation');
      }

      const result = await response.json();
      alert('✅ ' + result.message);
      setIsInitialized(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      alert('❌ Erreur: ' + errorMsg);
    } finally {
      setInitializing(false);
    }
  };

  if (isInitialized === null) {
    return <div>Vérification de l'état d'initialisation...</div>;
  }

  if (isInitialized) {
    return (
      <div className="initialized-message">
        <h1>✅ Déjà initialisé</h1>
        <p>Le contenu de la page d'accueil est déjà configuré avec 17 items.</p>
        <a href="/admin/content">Aller à la page de gestion</a>
      </div>
    );
  }

  return (
    <div className="initialize-page">
      <h1>Initialisation du Contenu Page d'Accueil</h1>

      <div className="warning-banner">
        <h2>⚠️ ATTENTION</h2>
        <p>Cette opération va créer <strong>17 items</strong> dans la base de données:</p>
        <ul>
          <li><strong>6 items</strong> - Designs Exclusifs</li>
          <li><strong>5 items</strong> - Influenceurs Partenaires</li>
          <li><strong>6 items</strong> - Merchandising Musical</li>
        </ul>
        <p>Cette opération <strong>ne peut être effectuée qu'une seule fois</strong>.</p>
        <p>Après création, vous pourrez uniquement modifier le <strong>nom</strong> et l'<strong>image</strong> de chaque item.</p>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      <div className="actions">
        <button
          onClick={handleInitialize}
          disabled={initializing}
          className="initialize-button"
        >
          {initializing ? 'Initialisation en cours...' : '🚀 Initialiser le contenu'}
        </button>
      </div>

      <div className="info-section">
        <h3>Contenu qui sera créé:</h3>

        <div className="preview-section">
          <h4>Designs Exclusifs (6 items)</h4>
          <ol>
            <li>Pap Musa</li>
            <li>Ceeneer</li>
            <li>K & C</li>
            <li>Breadwinner</li>
            <li>Meissa Biguey</li>
            <li>DAD</li>
          </ol>
        </div>

        <div className="preview-section">
          <h4>Influenceurs Partenaires (5 items)</h4>
          <ol>
            <li>Ebu Jomlong</li>
            <li>Dip Poundou Guiss</li>
            <li>Massamba Amadeus</li>
            <li>Amina Abed</li>
            <li>Mut Cash</li>
          </ol>
        </div>

        <div className="preview-section">
          <h4>Merchandising Musical (6 items)</h4>
          <ol>
            <li>Bathie Drizzy</li>
            <li>Latzo Dozé</li>
            <li>Jaaw Ketchup</li>
            <li>Dudu FDV</li>
            <li>Adja Everywhere</li>
            <li>Pape Sidy Fall</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
```

---

## 📝 Données créées par défaut

### Designs Exclusifs (6 items)

| Order | Nom | Image URL par défaut |
|-------|-----|---------------------|
| 0 | Pap Musa | Cloudinary URL |
| 1 | Ceeneer | Cloudinary URL |
| 2 | K & C | Cloudinary URL |
| 3 | Breadwinner | Cloudinary URL |
| 4 | Meissa Biguey | Cloudinary URL |
| 5 | DAD | Cloudinary URL |

### Influenceurs Partenaires (5 items)

| Order | Nom | Image URL par défaut |
|-------|-----|---------------------|
| 0 | Ebu Jomlong | Unsplash URL |
| 1 | Dip Poundou Guiss | Unsplash URL |
| 2 | Massamba Amadeus | Unsplash URL |
| 3 | Amina Abed | Unsplash URL |
| 4 | Mut Cash | Unsplash URL |

### Merchandising Musical (6 items)

| Order | Nom | Image URL par défaut |
|-------|-----|---------------------|
| 0 | Bathie Drizzy | Bing URL |
| 1 | Latzo Dozé | Bing URL |
| 2 | Jaaw Ketchup | Bing URL |
| 3 | Dudu FDV | Bing URL |
| 4 | Adja Everywhere | Bing URL |
| 5 | Pape Sidy Fall | Bing URL |

---

## 🔐 Gestion des permissions

Seuls les utilisateurs avec les rôles **ADMIN** ou **SUPERADMIN** peuvent initialiser le contenu.

### Vérification des permissions

```typescript
const checkPermissions = async () => {
  const token = localStorage.getItem('token');

  // Décoder le token JWT pour vérifier le rôle
  const payload = JSON.parse(atob(token.split('.')[1]));
  const role = payload.role;

  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    alert('❌ Vous n\'avez pas les permissions nécessaires');
    return false;
  }

  return true;
};
```

---

## 🛡️ Protection contre la ré-initialisation

Le backend empêche la ré-initialisation si des données existent déjà:

```typescript
// Si la table contient déjà des items
if (existingCount > 0) {
  throw new BadRequestException('Le contenu existe déjà');
}
```

### Réponse si déjà initialisé:

```json
{
  "statusCode": 400,
  "message": "Le contenu existe déjà",
  "error": "Bad Request"
}
```

---

## 🔄 Workflow complet d'initialisation

```
1. Admin accède à la page d'administration
   ↓
2. Frontend vérifie: GET /admin/content
   ↓
3. Si vide → Afficher le bouton "Initialiser"
   ↓
4. Admin confirme l'initialisation
   ↓
5. Frontend appelle: POST /admin/content/initialize
   ↓
6. Backend crée 17 items avec IDs uniques
   ↓
7. Frontend redirige vers la page de gestion
   ↓
8. Admin peut maintenant modifier nom + image
```

---

## 💡 Composant complet avec vérification automatique

```typescript
import React, { useState, useEffect } from 'react';

interface InitState {
  isInitialized: boolean | null;
  loading: boolean;
  error: string | null;
}

export const HomeContentSetup: React.FC = () => {
  const [state, setState] = useState<InitState>({
    isInitialized: null,
    loading: true,
    error: null
  });

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      const response = await fetch('https://api.printalma.com/api/admin/content', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      const totalItems = data.designs.length + data.influencers.length + data.merchandising.length;

      setState({
        isInitialized: totalItems === 17,
        loading: false,
        error: null
      });
    } catch (err) {
      setState({
        isInitialized: null,
        loading: false,
        error: 'Erreur lors de la vérification'
      });
    }
  };

  const handleInitialize = async () => {
    const confirmation = `
      ⚠️ INITIALISATION DU CONTENU ⚠️

      Cette opération va créer 17 items permanents:
      - 6 Designs Exclusifs
      - 5 Influenceurs Partenaires
      - 6 Merchandising Musical

      Après création, vous pourrez uniquement modifier:
      ✓ Le nom de chaque item
      ✓ L'image de chaque item

      Vous ne pourrez PAS:
      ✗ Ajouter de nouveaux items
      ✗ Supprimer des items existants

      Continuer?
    `;

    if (!confirm(confirmation)) {
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch('https://api.printalma.com/api/admin/content/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.message?.includes('existe déjà')) {
          throw new Error('Le contenu est déjà initialisé!');
        }

        throw new Error(errorData.message || 'Erreur d\'initialisation');
      }

      const result = await response.json();

      setState({
        isInitialized: true,
        loading: false,
        error: null
      });

      alert('✅ ' + result.message);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setState({
        ...state,
        loading: false,
        error: errorMsg
      });
      alert('❌ Erreur: ' + errorMsg);
    }
  };

  // État de chargement
  if (state.loading) {
    return (
      <div className="setup-loading">
        <div className="spinner"></div>
        <p>Vérification de l'état d'initialisation...</p>
      </div>
    );
  }

  // Erreur de vérification
  if (state.error && state.isInitialized === null) {
    return (
      <div className="setup-error">
        <h2>❌ Erreur</h2>
        <p>{state.error}</p>
        <button onClick={checkInitializationStatus}>Réessayer</button>
      </div>
    );
  }

  // Déjà initialisé
  if (state.isInitialized) {
    return (
      <div className="setup-done">
        <div className="success-icon">✅</div>
        <h1>Contenu déjà initialisé</h1>
        <p>Les 17 items sont créés et prêts à être modifiés.</p>
        <button onClick={() => window.location.href = '/admin/content'}>
          Gérer le contenu
        </button>
      </div>
    );
  }

  // Non initialisé - Afficher le bouton d'initialisation
  return (
    <div className="setup-init">
      <h1>⚙️ Initialisation du Contenu</h1>

      <div className="setup-info">
        <h2>Informations importantes</h2>

        <div className="info-box warning">
          <h3>⚠️ Opération irréversible</h3>
          <p>Cette opération ne peut être effectuée qu'UNE SEULE FOIS.</p>
        </div>

        <div className="info-box details">
          <h3>📋 Ce qui sera créé:</h3>
          <div className="items-preview">
            <div className="section-preview">
              <h4>🎨 Designs Exclusifs</h4>
              <p className="count">6 items</p>
              <ul>
                <li>Pap Musa, Ceeneer, K & C</li>
                <li>Breadwinner, Meissa Biguey, DAD</li>
              </ul>
            </div>

            <div className="section-preview">
              <h4>👥 Influenceurs Partenaires</h4>
              <p className="count">5 items</p>
              <ul>
                <li>Ebu Jomlong, Dip Poundou Guiss</li>
                <li>Massamba Amadeus, Amina Abed, Mut Cash</li>
              </ul>
            </div>

            <div className="section-preview">
              <h4>🎵 Merchandising Musical</h4>
              <p className="count">6 items</p>
              <ul>
                <li>Bathie Drizzy, Latzo Dozé, Jaaw Ketchup</li>
                <li>Dudu FDV, Adja Everywhere, Pape Sidy Fall</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="info-box after">
          <h3>✏️ Après l'initialisation</h3>
          <p>Vous pourrez modifier pour chaque item:</p>
          <ul>
            <li>✅ Le nom</li>
            <li>✅ L'image (via upload Cloudinary)</li>
          </ul>
          <p>Vous ne pourrez PAS:</p>
          <ul>
            <li>❌ Ajouter de nouveaux items</li>
            <li>❌ Supprimer des items existants</li>
          </ul>
        </div>
      </div>

      <button
        onClick={handleInitialize}
        className="init-button"
      >
        🚀 Initialiser le contenu
      </button>
    </div>
  );
};
```

---

## 📨 Styles CSS recommandés

```css
.setup-loading,
.setup-error,
.setup-done,
.setup-init {
  max-width: 800px;
  margin: 40px auto;
  padding: 30px;
  text-align: center;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.setup-info {
  text-align: left;
  margin: 30px 0;
}

.info-box {
  padding: 20px;
  margin: 20px 0;
  border-radius: 8px;
}

.info-box.warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.info-box.details {
  background: #e7f5ff;
  border-left: 4px solid #0d6efd;
}

.info-box.after {
  background: #d1e7dd;
  border-left: 4px solid #198754;
}

.items-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.section-preview {
  background: white;
  padding: 15px;
  border-radius: 6px;
}

.section-preview h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.section-preview .count {
  font-weight: bold;
  color: #666;
  margin-bottom: 10px;
}

.init-button {
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
}

.init-button:hover {
  background: #0b5ed7;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 20px;
}
```

---

## 🧪 Tests

```typescript
// Test de l'initialisation
describe('Home Content Initialization', () => {
  it('should detect non-initialized content', async () => {
    const response = await fetch('/api/admin/content');
    const data = await response.json();

    const total = data.designs.length + data.influencers.length + data.merchandising.length;

    if (total === 0) {
      console.log('✅ Non initialisé détecté');
    }
  });

  it('should initialize content', async () => {
    const response = await fetch('/api/admin/content/initialize', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.count).toBe(17);
  });

  it('should prevent double initialization', async () => {
    const response = await fetch('/api/admin/content/initialize', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect(response.status).toBe(400);
  });
});
```

---

## 📋 Checklist d'initialisation

Avant de mettre en production:

- [ ] Vérifier que l'utilisateur a les droits (ADMIN/SUPERADMIN)
- [ ] Confirmer que la table `home_content` est vide
- [ ] Afficher un message d'avertissement clair
- [ ] Demander une confirmation explicite
- [ ] Gérer les erreurs correctement
- [ ] Rediriger vers la page de gestion après succès
- [ ] Empêcher la ré-initialisation

---

**Version:** 1.0.0
**Date:** 2026-02-06
**Pour:** Équipe Frontend

## ⚠️ RAPPEL

L'initialisation crée **17 items permanents**. Cette opération:
- Ne peut être effectuée **qu'une seule fois**
- Crée des **IDs uniques** générés par le backend
- Permet ensuite uniquement de modifier **nom** et **image**
