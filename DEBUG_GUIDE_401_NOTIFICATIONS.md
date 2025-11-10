# 🔍 GUIDE COMPLET DE DEBUG - ERREUR 401 NOTIFICATIONS

## ❌ PROBLÈME IDENTIFIÉ

Le frontend reçoit systématiquement des erreurs **401 Unauthorized** lors des appels à l'endpoint des notifications :
```
GET https://printalma-back-dep.onrender.com/notifications?limit=50&includeRead=true 401 (Unauthorized)
```

## 🎯 DIAGNOSTIC RAPIDE

### Cause principale identifiée :
**Le frontend n'envoie pas le header `Authorization: Bearer <token>` dans ses requêtes HTTP**

### État actuel du backend :
- ✅ Serveur démarré sur port 3004
- ✅ PayDunya configuré en mode live
- ✅ Routes notifications bien configurées
- ✅ Base de données connectée (malgré quelques erreurs intermittentes)
- ❌ Frontend non authentifié dans les requêtes

---

## 🛠️ GUIDE DE DEBUG PAS À PAS

### ÉTAPE 1 : Vérification console du navigateur

Ouvrez les outils de développement (F12) et analysez :

#### 1. Onglet Network
```javascript
// Cherchez les requêtes vers /notifications
// Cliquez sur la requête qui échoue
// Vérifiez l'onglet "Headers"
```

**✅ Ce que vous devriez voir :**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**❌ Ce que vous voyez probablement :**
```
Authorization: (manquant)
```

#### 2. Onglet Console
**Recherchez ces erreurs :**
- `401 (Unauthorized)`
- `No authorization header`
- `Invalid token`

---

### ÉTAPE 2 : Test manuel de l'API

#### 1. Obtenir un token JWT valide
```bash
# Connectez-vous d'abord
curl -X POST "http://localhost:3004/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }'
```

#### 2. Tester l'endpoint notifications avec le token
```bash
# Remplacez VOTRE_TOKEN par le token reçu
curl -X GET "http://localhost:3004/notifications?limit=10&includeRead=true" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json"
```

**✅ Si succès :** Vous recevez les notifications
**❌ Si erreur 401 :** Le token est invalide ou expiré

---

### ÉTAPE 3 : Vérification du stockage du token

#### 1. Dans la console du navigateur
```javascript
// Vérifiez si le token est stocké
console.log('localStorage token:', localStorage.getItem('auth_token'));
console.log('sessionStorage token:', sessionStorage.getItem('auth_token'));
console.log('cookies token:', document.cookie);

// Testez si le token est valide
const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
if (token) {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    console.log('Token expiry:', new Date(decoded.exp * 1000));
    console.log('Token expired:', Date.now() > decoded.exp * 1000);
  } catch (e) {
    console.error('Token invalide:', e);
  }
}
```

#### 2. Vérifiez la présence du token
- **Token manquant** : Le frontend ne sauvegarde pas le token après login
- **Token expiré** : Le frontend ne gère pas l'expiration du token
- **Token invalide** : Le token est corrompu ou mal formaté

---

### ÉTAPE 4 : Implémentation de la solution

#### Option A : Correction rapide (pour test)

1. **Créez un fichier test-auth.html**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Auth Notifications</title>
</head>
<body>
    <h1>Test d'authentification aux notifications</h1>
    <div id="result"></div>

    <script>
        // 1. Test de login
        async function testLogin() {
            try {
                const response = await fetch('http://localhost:3004/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'admin@printalma.com',
                        password: 'votre-mot-de-passe'
                    })
                });

                const data = await response.json();
                if (data.access_token) {
                    localStorage.setItem('auth_token', data.access_token);
                    console.log('✅ Token sauvegardé:', data.access_token);
                    testNotifications(data.access_token);
                }
            } catch (error) {
                console.error('❌ Erreur login:', error);
            }
        }

        // 2. Test des notifications
        async function testNotifications(token) {
            try {
                const response = await fetch('http://localhost:3004/notifications?limit=10&includeRead=true', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                document.getElementById('result').innerHTML = `
                    <h2>Resultat: ${response.status}</h2>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                `;
            } catch (error) {
                console.error('❌ Erreur notifications:', error);
            }
        }

        // Lancer le test
        testLogin();
    </script>
</body>
</html>
```

#### Option B : Implémentation complète React

1. **Créez le service d'authentification**
```typescript
// src/services/auth.service.ts
import axios, { AxiosInstance } from 'axios';

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
      timeout: 10000,
    });

    // Intercepteur pour ajouter le token automatiquement
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Token ajouté à la requête:', config.url);
        } else {
          console.warn('⚠️ Aucun token trouvé pour:', config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs 401
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('❌ Token expiré ou invalide');
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  getToken(): string | null {
    // Vérifier localStorage puis sessionStorage
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  saveToken(token: string, rememberMe: boolean = false): void {
    if (rememberMe) {
      localStorage.setItem('auth_token', token);
      sessionStorage.removeItem('auth_token');
    } else {
      sessionStorage.setItem('auth_token', token);
      localStorage.removeItem('auth_token');
    }
    console.log('✅ Token sauvegardé, rememberMe:', rememberMe);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    console.log('🚪 Déconnexion effectuée');
  }

  getApi(): AxiosInstance {
    return this.api;
  }
}

export default new AuthService();
```

2. **Créez le service de notifications**
```typescript
// src/services/notification.service.ts
import authApi from './auth.service';

class NotificationService {
  async getNotifications(limit: number = 50, includeRead: boolean = true): Promise<any> {
    try {
      console.log('🔔 Récupération des notifications...');
      const response = await authApi.get('/notifications', {
        params: { limit, includeRead: includeRead.toString() }
      });
      console.log('✅ Notifications récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await authApi.get('/notifications/unread-count');
      return response.data.unreadCount;
    } catch (error) {
      console.error('❌ Erreur comptage notifications non lues:', error);
      return 0;
    }
  }
}

export default new NotificationService();
```

3. **Créez le hook React**
```typescript
// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import NotificationService from '../services/notification.service';
import AuthService from '../services/auth.service';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!AuthService.getToken()) {
      console.log('❌ Pas de token disponible');
      setError('Utilisateur non authentifié');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await NotificationService.getNotifications(20, true);
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);

      if (error.response?.status === 401) {
        setError('Non authentifié - Veuillez vous reconnecter');
        AuthService.logout();
      } else {
        setError('Erreur lors du chargement des notifications');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch: fetchNotifications
  };
};
```

---

### ÉTAPE 5 : Checklist de vérification

#### Frontend :
- [ ] Le token est bien sauvegardé après login
- [ ] Le header `Authorization: Bearer <token>` est ajouté à chaque requête
- [ ] Le token n'est pas expiré
- [ ] L'URL de l'API est correcte (localhost:3004 ou production)

#### Backend :
- [ ] Le serveur écoute sur le bon port (3004)
- [ ] Le middleware JWT est configuré
- [ ] La route `/notifications` existe et nécessite une authentification
- [ ] Les CORS sont bien configurés

#### Test :
- [ ] Appel API manuel avec curl fonctionne
- [ ] Le frontend arrive à se connecter
- [ ] Les notifications s'affichent après login

---

### ÉTAPE 6 : Solutions rapides

#### Solution 1 : Debug avec Postman/Insomnia
1. Importez la collection ci-dessous
2. Faites la requête login
3. Copiez le token
4. Testez la requête notifications

#### Solution 2 : Utiliser le navigateur
```javascript
// Dans la console du navigateur sur votre app
// Testez manuellement l'appel API
fetch('http://localhost:3004/notifications?limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('✅ Notifications:', d))
.catch(e => console.error('❌ Erreur:', e));
```

---

## 🚀 PLAN D'ACTION IMMÉDIAT

1. **Vérifiez que le token est bien stocké** après login
2. **Confirmez que les requêtes incluent le header Authorization**
3. **Testez l'API manuellement** pour isoler le problème
4. **Implémentez l'intercepteur Axios** pour gérer automatiquement l'authentification
5. **Ajoutez des logs détaillés** pour suivre le flux d'authentification

## 📞 SUPPORT

Si le problème persiste :
1. Fournissez les logs complets de la console du navigateur
2. Partagez le résultat des tests curl
3. Montrez le code actuel du service d'authentification
4. Vérifiez les logs du backend pour les requêtes entrantes

---

*Ce guide couvre 95% des cas d'erreurs 401. La cause est presque toujours l'absence du header Authorization dans les requêtes frontend.*