# Fix: Erreur "Unauthorized" sur PayDunya Payment

## 🔴 Problème

```
❌ [OrderForm] Erreur lors du processus de commande: Error: Unauthorized
```

## 🔍 Cause

Le frontend envoie un **token JWT** dans le header `Authorization` pour l'endpoint `/paydunya/payment`, mais cet endpoint est **PUBLIC** et ne nécessite pas d'authentification.

Si le token est **expiré** ou **invalide**, le backend retourne une erreur `401 Unauthorized`.

## ✅ Solution

### Option 1: Exclure l'endpoint PayDunya de l'intercepteur (RECOMMANDÉ)

Modifiez votre client API pour **ne pas envoyer le token JWT** pour les endpoints PayDunya.

#### Avec Axios

```typescript
// src/lib/api.ts ou votre fichier de configuration API
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use((config) => {
  // Liste des endpoints publics (pas besoin de token)
  const publicEndpoints = [
    '/paydunya/payment',
    '/paydunya/status',
    '/paydunya/test-config',
    '/paydunya/callback',
  ];

  // Vérifier si l'URL actuelle est un endpoint public
  const isPublicEndpoint = publicEndpoints.some(endpoint =>
    config.url?.includes(endpoint)
  );

  // Ajouter le token seulement si ce n'est PAS un endpoint public
  if (!isPublicEndpoint) {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ne rediriger vers login que si ce n'est PAS un endpoint public
      const publicEndpoints = ['/paydunya/'];
      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        error.config.url?.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

#### Avec Fetch

```typescript
// src/services/payment.service.ts
export class PaymentService {
  static async initializePayment(data: PayDunyaPaymentRequest) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

    // NE PAS inclure le token Authorization pour PayDunya
    const response = await fetch(`${apiUrl}/paydunya/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // PAS de Authorization ici !
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### Option 2: Créer une instance Axios séparée pour PayDunya

```typescript
// src/lib/paydunya-api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

// Client API spécifique pour PayDunya (SANS authentication)
export const paydunyaClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// PAS d'intercepteur pour ajouter le token JWT
```

Puis utilisez-le dans votre service :

```typescript
// src/services/payment.service.ts
import { paydunyaClient } from '@/lib/paydunya-api';

export class PaymentService {
  static async initializePayment(data: PayDunyaPaymentRequest) {
    const response = await paydunyaClient.post('/paydunya/payment', data);
    return response.data;
  }

  static async checkPaymentStatus(token: string) {
    const response = await paydunyaClient.get(`/paydunya/status/${token}`);
    return response.data;
  }
}
```

### Option 3: Vérifier et renouveler le token avant l'appel

```typescript
// src/services/payment.service.ts
import { apiClient } from '@/lib/api';
import { authService } from '@/services/auth.service';

export class PaymentService {
  static async initializePayment(data: PayDunyaPaymentRequest) {
    try {
      // Vérifier si le token est valide
      const token = localStorage.getItem('access_token');

      if (token && authService.isTokenExpired(token)) {
        // Token expiré, le renouveler ou supprimer
        localStorage.removeItem('access_token');
      }

      // Faire l'appel (l'intercepteur ne mettra pas de token si absent)
      const response = await apiClient.post('/paydunya/payment', data);
      return response.data;

    } catch (error: any) {
      if (error.response?.status === 401) {
        // Réessayer sans token
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/paydunya/payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }
        );
        return response.json();
      }
      throw error;
    }
  }
}
```

## 🧪 Test de la Solution

### 1. Tester l'endpoint sans authentification

```bash
# Depuis votre terminal
curl -X POST http://localhost:3004/paydunya/payment \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": {
      "total_amount": 5000,
      "description": "Test",
      "customer": {
        "name": "Test",
        "email": "test@test.com",
        "phone": "+221775588834"
      }
    },
    "store": {"name": "Printalma"},
    "actions": {
      "callback_url": "http://localhost:3004/paydunya/callback",
      "return_url": "http://localhost:3001/success",
      "cancel_url": "http://localhost:3001/cancel"
    },
    "custom_data": {"order_number": "TEST"}
  }'

# Vous devriez recevoir une réponse avec success: true
```

### 2. Vérifier dans le navigateur

Ouvrez la console du navigateur (F12) et vérifiez les requêtes réseau :

```
Network > paydunya/payment > Headers

✅ Request Headers devrait contenir :
   Content-Type: application/json

❌ Request Headers NE DEVRAIT PAS contenir :
   Authorization: Bearer xxx
```

## 📝 Code Complet Recommandé

### Configuration API avec gestion des endpoints publics

```typescript
// src/lib/api.ts
import axios, { AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

// Liste des endpoints qui ne nécessitent PAS d'authentification
const PUBLIC_ENDPOINTS = [
  '/paydunya/payment',
  '/paydunya/status/',
  '/paydunya/test-config',
  '/paydunya/callback',
  '/auth/login',
  '/auth/register',
];

// Fonction pour vérifier si un endpoint est public
const isPublicEndpoint = (url: string = ''): boolean => {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// Client API principal
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

// Intercepteur de requête
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);

    // Ne pas ajouter le token pour les endpoints publics
    if (!isPublicEndpoint(config.url || '')) {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Token ajouté');
      }
    } else {
      console.log('[API] Endpoint public - pas de token');
    }

    return config;
  },
  (error) => {
    console.error('[API] Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Réponse ${response.status} pour ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(`[API] Erreur ${status} pour ${url}`, error.response?.data);

    // Rediriger vers login seulement pour les endpoints protégés
    if (status === 401 && !isPublicEndpoint(url || '')) {
      console.log('[API] Token invalide - redirection vers login');
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Service de paiement

```typescript
// src/services/payment.service.ts
import apiClient from '@/lib/api';
import type { PayDunyaPaymentRequest, PayDunyaPaymentResponse } from '@/types/payment';

export class PaymentService {
  /**
   * Initialiser un paiement PayDunya
   * Cet endpoint est PUBLIC - pas besoin d'authentification
   */
  static async initializePayment(
    orderNumber: string,
    amount: number,
    customer: { name: string; email: string; phone: string }
  ): Promise<PayDunyaPaymentResponse> {
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

    const payload: PayDunyaPaymentRequest = {
      invoice: {
        total_amount: amount,
        description: `Commande Printalma #${orderNumber}`,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        channels: ['orange-money-senegal', 'wave-senegal'],
      },
      store: {
        name: 'Printalma Store',
        tagline: 'Impression de qualité professionnelle',
        phone: '+221338234567',
      },
      actions: {
        callback_url: `${backendUrl}/paydunya/callback`,
        return_url: `${frontendUrl}/orders/${orderNumber}/success`,
        cancel_url: `${frontendUrl}/orders/${orderNumber}/cancel`,
      },
      custom_data: {
        order_number: orderNumber,
        user_id: customer.email,
        platform: 'web',
      },
    };

    try {
      console.log('[PaymentService] Initialisation paiement:', { orderNumber, amount });

      const response = await apiClient.post<PayDunyaPaymentResponse>(
        '/paydunya/payment',
        payload
      );

      console.log('[PaymentService] Paiement initialisé:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('[PaymentService] Erreur:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Erreur lors de l\'initialisation du paiement'
      );
    }
  }

  /**
   * Vérifier le statut d'un paiement
   * Cet endpoint est PUBLIC
   */
  static async checkPaymentStatus(token: string) {
    try {
      const response = await apiClient.get(`/paydunya/status/${token}`);
      return response.data;
    } catch (error: any) {
      console.error('[PaymentService] Erreur statut:', error);
      throw error;
    }
  }
}
```

## 🎯 Résumé

| Problème | Cause | Solution |
|----------|-------|----------|
| Error: Unauthorized | Token JWT invalide/expiré envoyé à un endpoint public | Ne pas envoyer de token pour `/paydunya/payment` |
| 401 sur /paydunya/payment | Intercepteur Axios ajoute systématiquement le token | Exclure les endpoints PayDunya de l'intercepteur |
| Token expiré | Session expirée | Vérifier la validité du token avant l'appel |

## 📞 Support

Si le problème persiste après avoir appliqué ces solutions :

1. **Vérifier les logs du backend** : `tail -f logs/application.log`
2. **Vérifier les requêtes réseau** : Console navigateur > Network tab
3. **Tester l'endpoint directement** : Utiliser curl ou Postman sans token
4. **Vérifier la configuration CORS** si erreur CORS

---

**Date**: 3 Novembre 2025
**Version**: 1.0
