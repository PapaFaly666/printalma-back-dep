# Exemples Frontend - Tous Frameworks

## URL de Base
```
http://localhost:3004
```

---

## Table des Matières
1. [React + TypeScript](#react--typescript)
2. [React + JavaScript](#react--javascript)
3. [Vue 3 Composition API](#vue-3-composition-api)
4. [Vue 3 Options API](#vue-3-options-api)
5. [Angular](#angular)
6. [Next.js](#nextjs)
7. [Vanilla JavaScript](#vanilla-javascript)

---

## React + TypeScript

### Service de Configuration

```typescript
// services/paymentConfigService.ts
const API_URL = 'http://localhost:3004';

export interface PaydunyaConfig {
  provider: string;
  isActive: boolean;
  mode: 'test' | 'live';
  publicKey: string;
  apiUrl: string;
}

export class PaymentConfigService {
  static async getPaydunyaConfig(): Promise<PaydunyaConfig> {
    const response = await fetch(`${API_URL}/payment-config/paydunya`);
    if (!response.ok) {
      throw new Error('Configuration non disponible');
    }
    return response.json();
  }

  static async switchMode(mode: 'test' | 'live', token: string): Promise<any> {
    const response = await fetch(`${API_URL}/admin/payment-config/switch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider: 'paydunya', mode })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }
}
```

### Hook Personnalisé

```typescript
// hooks/usePaydunyaConfig.ts
import { useState, useEffect } from 'react';
import { PaymentConfigService, PaydunyaConfig } from '../services/paymentConfigService';

export function usePaydunyaConfig() {
  const [config, setConfig] = useState<PaydunyaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PaymentConfigService.getPaydunyaConfig();
      setConfig(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { config, loading, error, refetch };
}
```

### Composant d'Affichage

```typescript
// components/PaymentModeIndicator.tsx
import React from 'react';
import { usePaydunyaConfig } from '../hooks/usePaydunyaConfig';

export const PaymentModeIndicator: React.FC = () => {
  const { config, loading, error } = usePaydunyaConfig();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="error">Erreur: {error.message}</div>;
  if (!config) return null;

  return (
    <div className={`mode-indicator ${config.mode}`}>
      <span className="icon">
        {config.mode === 'test' ? '🧪' : '🚀'}
      </span>
      <span className="label">
        {config.mode === 'test' ? 'Mode TEST' : 'Mode PRODUCTION'}
      </span>
      {config.mode === 'live' && (
        <span className="warning">⚠️ Paiements réels</span>
      )}
    </div>
  );
};
```

### Composant Admin

```typescript
// components/AdminPaymentSwitch.tsx
import React, { useState } from 'react';
import { PaymentConfigService } from '../services/paymentConfigService';
import { usePaydunyaConfig } from '../hooks/usePaydunyaConfig';

interface Props {
  authToken: string;
}

export const AdminPaymentSwitch: React.FC<Props> = ({ authToken }) => {
  const { config, loading, refetch } = usePaydunyaConfig();
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (mode: 'test' | 'live') => {
    if (mode === 'live') {
      const confirmed = window.confirm(
        '⚠️ ATTENTION: Basculer en mode PRODUCTION ?\n\n' +
        'Toutes les transactions seront RÉELLES et FACTURÉES !'
      );
      if (!confirmed) return;
    }

    setSwitching(true);
    try {
      await PaymentConfigService.switchMode(mode, authToken);
      alert(`✅ Basculement réussi vers ${mode.toUpperCase()}`);
      await refetch();
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setSwitching(false);
    }
  };

  if (loading || !config) return <div>Chargement...</div>;

  return (
    <div className="admin-payment-switch">
      <h2>Configuration Paydunya</h2>

      <div className={`current-mode ${config.mode}`}>
        <h3>
          Mode actuel: {config.mode === 'test' ? '🧪 TEST' : '🚀 LIVE'}
        </h3>
        {config.mode === 'live' && (
          <div className="alert alert-danger">
            ⚠️ MODE PRODUCTION ACTIF - Paiements réels
          </div>
        )}
      </div>

      <div className="buttons">
        <button
          onClick={() => handleSwitch('test')}
          disabled={config.mode === 'test' || switching}
          className="btn btn-primary"
        >
          {switching ? 'Basculement...' : 'Activer TEST'}
        </button>

        <button
          onClick={() => handleSwitch('live')}
          disabled={config.mode === 'live' || switching}
          className="btn btn-danger"
        >
          {switching ? 'Basculement...' : 'Activer LIVE'}
        </button>
      </div>

      <div className="config-info">
        <p><strong>Public Key:</strong> {config.publicKey}</p>
        <p><strong>API URL:</strong> {config.apiUrl}</p>
      </div>
    </div>
  );
};
```

---

## React + JavaScript

### Hook Simple

```javascript
// hooks/usePaydunyaConfig.js
import { useState, useEffect } from 'react';

export function usePaydunyaConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3004/payment-config/paydunya')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur:', err);
        setLoading(false);
      });
  }, []);

  return { config, loading };
}
```

### Composant Simple

```javascript
// components/PaymentMode.jsx
import React from 'react';
import { usePaydunyaConfig } from '../hooks/usePaydunyaConfig';

export function PaymentMode() {
  const { config, loading } = usePaydunyaConfig();

  if (loading) return <div>Chargement...</div>;
  if (!config) return null;

  return (
    <div style={{
      padding: '10px',
      backgroundColor: config.mode === 'test' ? '#d1ecf1' : '#fff3cd',
      borderRadius: '4px'
    }}>
      {config.mode === 'test' ? '🧪 Mode TEST' : '🚀 Mode LIVE'}
    </div>
  );
}
```

---

## Vue 3 Composition API

### Composable

```typescript
// composables/usePaydunyaConfig.ts
import { ref, onMounted } from 'vue';

export function usePaydunyaConfig() {
  const config = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const fetchConfig = async () => {
    loading.value = true;
    try {
      const response = await fetch('http://localhost:3004/payment-config/paydunya');
      config.value = await response.json();
      error.value = null;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchConfig();
  });

  return { config, loading, error, refetch: fetchConfig };
}
```

### Composant d'Affichage

```vue
<!-- components/PaymentModeIndicator.vue -->
<template>
  <div v-if="loading">Chargement...</div>
  <div v-else-if="error" class="error">Erreur: {{ error }}</div>
  <div v-else-if="config" :class="['mode-indicator', config.mode]">
    <span class="icon">{{ config.mode === 'test' ? '🧪' : '🚀' }}</span>
    <span class="label">
      {{ config.mode === 'test' ? 'Mode TEST' : 'Mode PRODUCTION' }}
    </span>
    <span v-if="config.mode === 'live'" class="warning">
      ⚠️ Paiements réels
    </span>
  </div>
</template>

<script setup lang="ts">
import { usePaydunyaConfig } from '../composables/usePaydunyaConfig';

const { config, loading, error } = usePaydunyaConfig();
</script>

<style scoped>
.mode-indicator {
  padding: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-indicator.test {
  background-color: #d1ecf1;
  border: 1px solid #0c5460;
}

.mode-indicator.live {
  background-color: #fff3cd;
  border: 1px solid #856404;
}

.warning {
  color: #721c24;
  font-weight: bold;
}
</style>
```

### Composant Admin

```vue
<!-- components/AdminPaymentSwitch.vue -->
<template>
  <div class="admin-payment-switch">
    <h2>Configuration Paydunya</h2>

    <div v-if="loading">Chargement...</div>
    <div v-else-if="config">
      <div :class="['current-mode', config.mode]">
        <h3>Mode actuel: {{ config.mode === 'test' ? '🧪 TEST' : '🚀 LIVE' }}</h3>
        <div v-if="config.mode === 'live'" class="alert alert-danger">
          ⚠️ MODE PRODUCTION ACTIF - Paiements réels
        </div>
      </div>

      <div class="buttons">
        <button
          @click="switchMode('test')"
          :disabled="config.mode === 'test' || switching"
          class="btn btn-primary"
        >
          {{ switching ? 'Basculement...' : 'Activer TEST' }}
        </button>

        <button
          @click="switchMode('live')"
          :disabled="config.mode === 'live' || switching"
          class="btn btn-danger"
        >
          {{ switching ? 'Basculement...' : 'Activer LIVE' }}
        </button>
      </div>

      <div class="config-info">
        <p><strong>Public Key:</strong> {{ config.publicKey }}</p>
        <p><strong>API URL:</strong> {{ config.apiUrl }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePaydunyaConfig } from '../composables/usePaydunyaConfig';

const props = defineProps<{
  authToken: string;
}>();

const { config, loading, refetch } = usePaydunyaConfig();
const switching = ref(false);

async function switchMode(mode: 'test' | 'live') {
  if (mode === 'live') {
    const confirmed = confirm(
      '⚠️ ATTENTION: Basculer en mode PRODUCTION ?\n\n' +
      'Toutes les transactions seront RÉELLES et FACTURÉES !'
    );
    if (!confirmed) return;
  }

  switching.value = true;
  try {
    const response = await fetch('http://localhost:3004/admin/payment-config/switch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider: 'paydunya', mode })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    alert(`✅ Basculement réussi vers ${mode.toUpperCase()}`);
    await refetch();
  } catch (error: any) {
    alert(`❌ Erreur: ${error.message}`);
  } finally {
    switching.value = false;
  }
}
</script>
```

---

## Vue 3 Options API

```vue
<!-- components/PaymentConfig.vue -->
<template>
  <div>
    <div v-if="loading">Chargement...</div>
    <div v-else-if="config">
      <h3>Configuration Paydunya</h3>
      <p>Mode: {{ config.mode === 'test' ? '🧪 TEST' : '🚀 LIVE' }}</p>
      <p>Public Key: {{ config.publicKey }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      config: null,
      loading: true
    };
  },

  mounted() {
    this.fetchConfig();
  },

  methods: {
    async fetchConfig() {
      try {
        const response = await fetch('http://localhost:3004/payment-config/paydunya');
        this.config = await response.json();
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## Angular

### Service

```typescript
// services/payment-config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaydunyaConfig {
  provider: string;
  isActive: boolean;
  mode: 'test' | 'live';
  publicKey: string;
  apiUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentConfigService {
  private apiUrl = 'http://localhost:3004';

  constructor(private http: HttpClient) {}

  getPaydunyaConfig(): Observable<PaydunyaConfig> {
    return this.http.get<PaydunyaConfig>(`${this.apiUrl}/payment-config/paydunya`);
  }

  switchMode(mode: 'test' | 'live', token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(
      `${this.apiUrl}/admin/payment-config/switch`,
      { provider: 'paydunya', mode },
      { headers }
    );
  }
}
```

### Composant

```typescript
// components/payment-mode-indicator.component.ts
import { Component, OnInit } from '@angular/core';
import { PaymentConfigService, PaydunyaConfig } from '../services/payment-config.service';

@Component({
  selector: 'app-payment-mode-indicator',
  template: `
    <div *ngIf="loading">Chargement...</div>
    <div *ngIf="!loading && config" [class]="'mode-indicator ' + config.mode">
      <span class="icon">{{ config.mode === 'test' ? '🧪' : '🚀' }}</span>
      <span class="label">
        {{ config.mode === 'test' ? 'Mode TEST' : 'Mode PRODUCTION' }}
      </span>
      <span *ngIf="config.mode === 'live'" class="warning">
        ⚠️ Paiements réels
      </span>
    </div>
  `,
  styles: [`
    .mode-indicator {
      padding: 10px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mode-indicator.test {
      background-color: #d1ecf1;
      border: 1px solid #0c5460;
    }
    .mode-indicator.live {
      background-color: #fff3cd;
      border: 1px solid #856404;
    }
  `]
})
export class PaymentModeIndicatorComponent implements OnInit {
  config: PaydunyaConfig | null = null;
  loading = true;

  constructor(private paymentConfigService: PaymentConfigService) {}

  ngOnInit() {
    this.paymentConfigService.getPaydunyaConfig().subscribe({
      next: (data) => {
        this.config = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.loading = false;
      }
    });
  }
}
```

---

## Next.js

### Server Component (App Router)

```typescript
// app/payment/page.tsx
import { headers } from 'next/headers';

async function getPaydunyaConfig() {
  const res = await fetch('http://localhost:3004/payment-config/paydunya', {
    cache: 'no-store' // Toujours récupérer la dernière config
  });

  if (!res.ok) {
    throw new Error('Failed to fetch config');
  }

  return res.json();
}

export default async function PaymentPage() {
  const config = await getPaydunyaConfig();

  return (
    <div>
      <h1>Configuration Paydunya</h1>
      <div className={`mode-indicator ${config.mode}`}>
        <p>Mode: {config.mode === 'test' ? '🧪 TEST' : '🚀 LIVE'}</p>
        <p>Public Key: {config.publicKey}</p>
        <p>API URL: {config.apiUrl}</p>
      </div>
    </div>
  );
}
```

### Client Component

```typescript
// components/PaymentModeSwitch.tsx
'use client';

import { useState, useEffect } from 'react';

export function PaymentModeSwitch({ authToken }: { authToken: string }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3004/payment-config/paydunya')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  const switchMode = async (mode: 'test' | 'live') => {
    const response = await fetch('http://localhost:3004/admin/payment-config/switch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider: 'paydunya', mode })
    });

    const result = await response.json();
    setConfig({ ...config, mode });
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <p>Mode actuel: {config.mode}</p>
      <button onClick={() => switchMode('test')}>TEST</button>
      <button onClick={() => switchMode('live')}>LIVE</button>
    </div>
  );
}
```

### API Route (Pages Router)

```typescript
// pages/api/payment-config.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch('http://localhost:3004/payment-config/paydunya');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
}
```

---

## Vanilla JavaScript

### Script Simple

```html
<!DOCTYPE html>
<html>
<head>
  <title>Payment Config</title>
</head>
<body>
  <div id="payment-config">Chargement...</div>

  <script>
    // Récupérer la configuration
    fetch('http://localhost:3004/payment-config/paydunya')
      .then(response => response.json())
      .then(config => {
        const div = document.getElementById('payment-config');
        div.innerHTML = `
          <h2>Configuration Paydunya</h2>
          <p>Mode: ${config.mode === 'test' ? '🧪 TEST' : '🚀 LIVE'}</p>
          <p>Public Key: ${config.publicKey}</p>
          <p>API URL: ${config.apiUrl}</p>
        `;

        // Ajouter une alerte si mode LIVE
        if (config.mode === 'live') {
          div.innerHTML += '<div style="color: red;">⚠️ Mode PRODUCTION - Paiements réels</div>';
        }
      })
      .catch(error => {
        console.error('Erreur:', error);
        document.getElementById('payment-config').innerHTML = 'Erreur de chargement';
      });
  </script>
</body>
</html>
```

### Classe Complète

```javascript
class PaymentConfigManager {
  constructor() {
    this.apiUrl = 'http://localhost:3004';
    this.config = null;
  }

  async loadConfig() {
    try {
      const response = await fetch(`${this.apiUrl}/payment-config/paydunya`);
      this.config = await response.json();
      return this.config;
    } catch (error) {
      console.error('Erreur chargement config:', error);
      return null;
    }
  }

  async switchMode(mode, token) {
    try {
      const response = await fetch(`${this.apiUrl}/admin/payment-config/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider: 'paydunya', mode })
      });

      const result = await response.json();
      this.config = { ...this.config, mode };
      return result;
    } catch (error) {
      console.error('Erreur basculement:', error);
      throw error;
    }
  }

  isTestMode() {
    return this.config?.mode === 'test';
  }

  getPublicKey() {
    return this.config?.publicKey;
  }

  getApiUrl() {
    return this.config?.apiUrl;
  }
}

// Usage
const paymentManager = new PaymentConfigManager();
await paymentManager.loadConfig();

console.log('Mode:', paymentManager.isTestMode() ? 'TEST' : 'LIVE');
console.log('Public Key:', paymentManager.getPublicKey());
```

---

## Résumé des URLs

```
Base: http://localhost:3004

Public:
  GET  /payment-config/paydunya

Admin:
  GET  /admin/payment-config/paydunya
  POST /admin/payment-config/switch
```

**Date**: 12 Février 2026
