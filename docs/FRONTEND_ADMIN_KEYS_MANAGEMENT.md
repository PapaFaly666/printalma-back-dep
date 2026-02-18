# Guide Frontend - Gestion des Clés Paydunya (Interface Admin)

## URL de Base
```
http://localhost:3004
```

---

## Table des Matières
1. [Afficher les Clés Existantes](#afficher-les-clés-existantes)
2. [Ajouter/Modifier les Clés TEST](#ajoutermodifier-les-clés-test)
3. [Ajouter/Modifier les Clés LIVE](#ajoutermodifier-les-clés-live)
4. [Basculer entre TEST et LIVE](#basculer-entre-test-et-live)
5. [Interface Complète](#interface-complète)
6. [Validation des Formulaires](#validation-des-formulaires)

---

## Afficher les Clés Existantes

### Endpoint
```http
GET /admin/payment-config/paydunya
Authorization: Bearer <token>
```

### Réponse Complète
```json
{
  "id": 1,
  "provider": "paydunya",
  "isActive": true,
  "activeMode": "test",

  "testPublicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "testPrivateKey": "test...ucO",
  "testToken": "BuVS...9B",
  "testMasterKey": null,

  "livePublicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "livePrivateKey": "live...TG",
  "liveToken": "lt8Y...8f",
  "liveMasterKey": null,

  "webhookSecret": null,
  "metadata": {},
  "createdAt": "2026-02-12T10:34:12.000Z",
  "updatedAt": "2026-02-12T14:57:13.000Z"
}
```

### Code Frontend

```typescript
// Récupérer les clés existantes
async function fetchPaymentKeys(authToken: string) {
  try {
    const response = await fetch('http://localhost:3004/admin/payment-config/paydunya', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Impossible de récupérer les clés');
    }

    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}
```

### Composant d'Affichage React

```typescript
import { useState, useEffect } from 'react';

function KeysDisplay({ authToken }: { authToken: string }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3004/admin/payment-config/paydunya', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Chargement...</div>;
  if (!config) return <div>Aucune configuration trouvée</div>;

  return (
    <div className="keys-display">
      <h2>Configuration Paydunya</h2>

      {/* Mode actif */}
      <div className="current-mode">
        <strong>Mode actif:</strong>
        <span className={config.activeMode === 'test' ? 'badge-test' : 'badge-live'}>
          {config.activeMode === 'test' ? '🧪 TEST' : '🚀 LIVE'}
        </span>
      </div>

      {/* Clés TEST */}
      <div className="keys-section">
        <h3>🧪 Clés TEST (Sandbox)</h3>
        <div className="key-item">
          <label>Public Key:</label>
          <input type="text" value={config.testPublicKey || ''} readOnly />
        </div>
        <div className="key-item">
          <label>Private Key:</label>
          <input type="password" value={config.testPrivateKey || ''} readOnly />
        </div>
        <div className="key-item">
          <label>Token:</label>
          <input type="password" value={config.testToken || ''} readOnly />
        </div>
        <div className="key-item">
          <label>Master Key:</label>
          <input type="password" value={config.testMasterKey || 'Non définie'} readOnly />
        </div>
      </div>

      {/* Clés LIVE */}
      <div className="keys-section">
        <h3>🚀 Clés LIVE (Production)</h3>
        <div className="key-item">
          <label>Public Key:</label>
          <input type="text" value={config.livePublicKey || ''} readOnly />
        </div>
        <div className="key-item">
          <label>Private Key:</label>
          <input type="password" value={config.livePrivateKey || ''} readOnly />
        </div>
        <div className="key-item">
          <label>Token:</label>
          <input type="password" value={config.liveToken || ''} readOnly />
        </div>
        <div className="key-item">
          <label>Master Key:</label>
          <input type="password" value={config.liveMasterKey || 'Non définie'} readOnly />
        </div>
      </div>

      {/* Webhook Secret */}
      <div className="keys-section">
        <h3>🔒 Webhook Secret</h3>
        <div className="key-item">
          <label>Secret:</label>
          <input type="password" value={config.webhookSecret || 'Non défini'} readOnly />
        </div>
      </div>

      {/* Dates */}
      <div className="metadata">
        <p><strong>Créé le:</strong> {new Date(config.createdAt).toLocaleString('fr-FR')}</p>
        <p><strong>Modifié le:</strong> {new Date(config.updatedAt).toLocaleString('fr-FR')}</p>
      </div>
    </div>
  );
}
```

---

## Ajouter/Modifier les Clés TEST

### Endpoint
```http
PATCH /admin/payment-config/paydunya
Authorization: Bearer <token>
Content-Type: application/json
```

### Body (Clés TEST)
```json
{
  "mode": "test",
  "publicKey": "test_public_NOUVELLE_CLE",
  "privateKey": "test_private_NOUVELLE_CLE",
  "token": "NOUVEAU_TOKEN_TEST",
  "masterKey": null
}
```

### Réponse
```json
{
  "id": 1,
  "provider": "paydunya",
  "isActive": true,
  "activeMode": "test",
  "testPublicKey": "test_public_NOUVELLE_CLE",
  "testPrivateKey": "test...CLE",
  "testToken": "NOUV...EST",
  "testMasterKey": null,
  "livePublicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "livePrivateKey": "live...TG",
  "liveToken": "lt8Y...8f",
  "liveMasterKey": null,
  "createdAt": "2026-02-12T10:34:12.000Z",
  "updatedAt": "2026-02-12T15:30:45.000Z"
}
```

### Formulaire React

```typescript
function TestKeysForm({ authToken, onSuccess }: { authToken: string, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    publicKey: '',
    privateKey: '',
    token: '',
    masterKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3004/admin/payment-config/paydunya', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'test',
          publicKey: formData.publicKey,
          privateKey: formData.privateKey,
          token: formData.token,
          masterKey: formData.masterKey || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      alert('✅ Clés TEST mises à jour avec succès');
      setFormData({ publicKey: '', privateKey: '', token: '', masterKey: '' });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      alert('❌ Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="keys-form">
      <h3>🧪 Modifier les Clés TEST</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label>Public Key *</label>
        <input
          type="text"
          value={formData.publicKey}
          onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
          placeholder="test_public_..."
          required
        />
      </div>

      <div className="form-group">
        <label>Private Key *</label>
        <input
          type="text"
          value={formData.privateKey}
          onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
          placeholder="test_private_..."
          required
        />
      </div>

      <div className="form-group">
        <label>Token *</label>
        <input
          type="text"
          value={formData.token}
          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          placeholder="Token TEST"
          required
        />
      </div>

      <div className="form-group">
        <label>Master Key (optionnel)</label>
        <input
          type="text"
          value={formData.masterKey}
          onChange={(e) => setFormData({ ...formData, masterKey: e.target.value })}
          placeholder="Master Key (optionnel)"
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Enregistrement...' : 'Enregistrer les Clés TEST'}
      </button>
    </form>
  );
}
```

---

## Ajouter/Modifier les Clés LIVE

### Endpoint
```http
PATCH /admin/payment-config/paydunya
Authorization: Bearer <token>
Content-Type: application/json
```

### Body (Clés LIVE)
```json
{
  "mode": "live",
  "publicKey": "live_public_NOUVELLE_CLE",
  "privateKey": "live_private_NOUVELLE_CLE",
  "token": "NOUVEAU_TOKEN_LIVE",
  "masterKey": null
}
```

### Réponse
```json
{
  "id": 1,
  "provider": "paydunya",
  "isActive": true,
  "activeMode": "test",
  "testPublicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "testPrivateKey": "test...ucO",
  "testToken": "BuVS...9B",
  "testMasterKey": null,
  "livePublicKey": "live_public_NOUVELLE_CLE",
  "livePrivateKey": "live...CLE",
  "liveToken": "NOUV...IVE",
  "liveMasterKey": null,
  "createdAt": "2026-02-12T10:34:12.000Z",
  "updatedAt": "2026-02-12T15:32:10.000Z"
}
```

### Formulaire React

```typescript
function LiveKeysForm({ authToken, onSuccess }: { authToken: string, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    publicKey: '',
    privateKey: '',
    token: '',
    masterKey: ''
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Confirmation pour clés LIVE
    const confirmed = confirm(
      '⚠️ ATTENTION: Vous allez modifier les clés de PRODUCTION !\n\n' +
      'Ces clés sont utilisées pour les paiements RÉELS.\n\n' +
      'Confirmer ?'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3004/admin/payment-config/paydunya', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'live',
          publicKey: formData.publicKey,
          privateKey: formData.privateKey,
          token: formData.token,
          masterKey: formData.masterKey || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      alert('✅ Clés LIVE mises à jour avec succès');
      setFormData({ publicKey: '', privateKey: '', token: '', masterKey: '' });
      onSuccess();
    } catch (err: any) {
      alert('❌ Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="keys-form">
      <h3>🚀 Modifier les Clés LIVE (PRODUCTION)</h3>

      <div className="alert alert-warning">
        ⚠️ <strong>ATTENTION:</strong> Ces clés sont utilisées pour les paiements réels
      </div>

      <div className="form-group">
        <label>Public Key *</label>
        <input
          type="text"
          value={formData.publicKey}
          onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
          placeholder="live_public_..."
          required
        />
      </div>

      <div className="form-group">
        <label>Private Key *</label>
        <input
          type="text"
          value={formData.privateKey}
          onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
          placeholder="live_private_..."
          required
        />
      </div>

      <div className="form-group">
        <label>Token *</label>
        <input
          type="text"
          value={formData.token}
          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          placeholder="Token LIVE"
          required
        />
      </div>

      <div className="form-group">
        <label>Master Key (optionnel)</label>
        <input
          type="text"
          value={formData.masterKey}
          onChange={(e) => setFormData({ ...formData, masterKey: e.target.value })}
          placeholder="Master Key (optionnel)"
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-danger">
        {loading ? 'Enregistrement...' : 'Enregistrer les Clés LIVE'}
      </button>
    </form>
  );
}
```

---

## Basculer entre TEST et LIVE

### Endpoint
```http
POST /admin/payment-config/switch
Authorization: Bearer <token>
Content-Type: application/json
```

### Body (Basculer vers LIVE)
```json
{
  "provider": "paydunya",
  "mode": "live"
}
```

### Body (Basculer vers TEST)
```json
{
  "provider": "paydunya",
  "mode": "test"
}
```

### Réponse
```json
{
  "message": "Basculement réussi vers le mode LIVE",
  "config": {
    "id": 1,
    "provider": "paydunya",
    "activeMode": "live",
    ...
  },
  "previousMode": "test",
  "currentMode": "live"
}
```

### Composant de Basculement

```typescript
function ModeSwitcher({ authToken, currentMode, onSwitch }: {
  authToken: string,
  currentMode: 'test' | 'live',
  onSwitch: () => void
}) {
  const [loading, setLoading] = useState(false);

  async function switchMode(mode: 'test' | 'live') {
    // Confirmation pour LIVE
    if (mode === 'live') {
      const confirmed = confirm(
        '⚠️ ATTENTION: Basculer en mode PRODUCTION ?\n\n' +
        'Toutes les transactions seront RÉELLES et FACTURÉES !\n\n' +
        'Confirmer ?'
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3004/admin/payment-config/switch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'paydunya',
          mode
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      alert(`✅ ${result.message}`);
      onSwitch();
    } catch (err: any) {
      alert(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mode-switcher">
      <h3>Basculer de Mode</h3>

      <div className="current-mode-display">
        <strong>Mode actuel:</strong>
        <span className={currentMode === 'test' ? 'badge-test' : 'badge-live'}>
          {currentMode === 'test' ? '🧪 TEST' : '🚀 LIVE'}
        </span>
      </div>

      <div className="buttons">
        <button
          onClick={() => switchMode('test')}
          disabled={currentMode === 'test' || loading}
          className="btn btn-primary"
        >
          {loading ? 'Basculement...' : '🧪 Activer TEST'}
        </button>

        <button
          onClick={() => switchMode('live')}
          disabled={currentMode === 'live' || loading}
          className="btn btn-danger"
        >
          {loading ? 'Basculement...' : '🚀 Activer LIVE'}
        </button>
      </div>

      {currentMode === 'live' && (
        <div className="alert alert-danger">
          ⚠️ <strong>MODE PRODUCTION ACTIF</strong><br />
          Toutes les transactions sont RÉELLES et seront facturées
        </div>
      )}
    </div>
  );
}
```

---

## Interface Complète

### Composant Principal

```typescript
import { useState, useEffect } from 'react';

function PaymentConfigAdmin({ authToken }: { authToken: string }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'view' | 'edit-test' | 'edit-live' | 'switch'>('view');

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3004/admin/payment-config/paydunya', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!config) {
    return (
      <div className="no-config">
        <p>Aucune configuration trouvée</p>
        <p>Contactez l'équipe backend pour initialiser la configuration</p>
      </div>
    );
  }

  return (
    <div className="payment-config-admin">
      <h1>Configuration Paydunya</h1>

      {/* Mode actuel */}
      <div className={`current-mode ${config.activeMode}`}>
        <h2>
          Mode actuel: {config.activeMode === 'test' ? '🧪 TEST (Sandbox)' : '🚀 LIVE (Production)'}
        </h2>
        {config.activeMode === 'live' && (
          <div className="alert alert-danger">
            ⚠️ <strong>ATTENTION:</strong> Mode PRODUCTION actif - Paiements réels
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'view' ? 'active' : ''}
          onClick={() => setActiveTab('view')}
        >
          👁️ Voir les Clés
        </button>
        <button
          className={activeTab === 'edit-test' ? 'active' : ''}
          onClick={() => setActiveTab('edit-test')}
        >
          🧪 Modifier TEST
        </button>
        <button
          className={activeTab === 'edit-live' ? 'active' : ''}
          onClick={() => setActiveTab('edit-live')}
        >
          🚀 Modifier LIVE
        </button>
        <button
          className={activeTab === 'switch' ? 'active' : ''}
          onClick={() => setActiveTab('switch')}
        >
          🔄 Basculer Mode
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'view' && (
          <KeysDisplay authToken={authToken} />
        )}

        {activeTab === 'edit-test' && (
          <TestKeysForm authToken={authToken} onSuccess={fetchConfig} />
        )}

        {activeTab === 'edit-live' && (
          <LiveKeysForm authToken={authToken} onSuccess={fetchConfig} />
        )}

        {activeTab === 'switch' && (
          <ModeSwitcher
            authToken={authToken}
            currentMode={config.activeMode}
            onSwitch={fetchConfig}
          />
        )}
      </div>
    </div>
  );
}

export default PaymentConfigAdmin;
```

---

## Validation des Formulaires

### Validation des Clés

```typescript
function validatePaydunyaKeys(data: {
  publicKey: string;
  privateKey: string;
  token: string;
  mode: 'test' | 'live';
}) {
  const errors: string[] = [];

  // Validation Public Key
  if (!data.publicKey) {
    errors.push('La clé publique est requise');
  } else {
    const expectedPrefix = data.mode === 'test' ? 'test_public_' : 'live_public_';
    if (!data.publicKey.startsWith(expectedPrefix)) {
      errors.push(`La clé publique doit commencer par "${expectedPrefix}"`);
    }
  }

  // Validation Private Key
  if (!data.privateKey) {
    errors.push('La clé privée est requise');
  } else {
    const expectedPrefix = data.mode === 'test' ? 'test_private_' : 'live_private_';
    if (!data.privateKey.startsWith(expectedPrefix)) {
      errors.push(`La clé privée doit commencer par "${expectedPrefix}"`);
    }
  }

  // Validation Token
  if (!data.token) {
    errors.push('Le token est requis');
  } else if (data.token.length < 10) {
    errors.push('Le token doit contenir au moins 10 caractères');
  }

  return errors;
}

// Usage dans le formulaire
function TestKeysForm({ authToken, onSuccess }: Props) {
  const [formData, setFormData] = useState({ ... });
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Valider
    const validationErrors = validatePaydunyaKeys({
      ...formData,
      mode: 'test'
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Soumettre...
  }

  return (
    <form onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div className="alert alert-danger">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {/* ... reste du formulaire */}
    </form>
  );
}
```

---

## CSS Suggéré

```css
/* Container principal */
.payment-config-admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Mode actuel */
.current-mode {
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.current-mode.test {
  background-color: #d1ecf1;
  border: 2px solid #0c5460;
}

.current-mode.live {
  background-color: #fff3cd;
  border: 2px solid #856404;
}

/* Badges */
.badge-test {
  background-color: #17a2b8;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: bold;
  margin-left: 10px;
}

.badge-live {
  background-color: #dc3545;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: bold;
  margin-left: 10px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #dee2e6;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #495057;
  border-bottom: 3px solid transparent;
}

.tabs button.active {
  color: #007bff;
  border-bottom-color: #007bff;
  font-weight: bold;
}

.tabs button:hover {
  background-color: #f8f9fa;
}

/* Sections de clés */
.keys-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.keys-section h3 {
  margin-bottom: 15px;
  color: #495057;
}

.key-item {
  margin-bottom: 15px;
}

.key-item label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #495057;
}

.key-item input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: monospace;
}

.key-item input:read-only {
  background-color: #e9ecef;
}

/* Formulaires */
.keys-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

/* Boutons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

/* Alertes */
.alert {
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

/* Mode Switcher */
.mode-switcher {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.mode-switcher .buttons {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.mode-switcher .buttons button {
  flex: 1;
}

.current-mode-display {
  margin-bottom: 20px;
  font-size: 18px;
}

.current-mode-display strong {
  margin-right: 10px;
}

/* Métadonnées */
.metadata {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 20px;
}

.metadata p {
  margin: 5px 0;
  color: #6c757d;
}

/* Loading */
.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #6c757d;
}

/* No config */
.no-config {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.no-config p {
  margin: 10px 0;
  color: #6c757d;
}
```

---

## Résumé des Endpoints

| Endpoint | Méthode | Description | Body |
|----------|---------|-------------|------|
| `/admin/payment-config/paydunya` | GET | Récupérer toutes les clés | - |
| `/admin/payment-config/paydunya` | PATCH | Modifier clés TEST | `{ mode: "test", publicKey, privateKey, token }` |
| `/admin/payment-config/paydunya` | PATCH | Modifier clés LIVE | `{ mode: "live", publicKey, privateKey, token }` |
| `/admin/payment-config/switch` | POST | Basculer TEST/LIVE | `{ provider: "paydunya", mode: "live" }` |

---

## Checklist d'Implémentation

- [ ] Créer le composant `KeysDisplay` pour afficher les clés
- [ ] Créer le composant `TestKeysForm` pour modifier les clés TEST
- [ ] Créer le composant `LiveKeysForm` pour modifier les clés LIVE
- [ ] Créer le composant `ModeSwitcher` pour basculer les modes
- [ ] Créer le composant principal `PaymentConfigAdmin` avec tabs
- [ ] Ajouter la validation des formulaires
- [ ] Ajouter les confirmations pour les actions critiques
- [ ] Styliser avec le CSS fourni
- [ ] Tester toutes les fonctionnalités
- [ ] Gérer les erreurs et les états de chargement

---

**Base URL**: http://localhost:3004
**Auth**: Bearer Token requis pour tous les endpoints admin
**Date**: 12 Février 2026
