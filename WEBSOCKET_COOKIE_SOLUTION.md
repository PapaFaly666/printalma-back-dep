# 🔧 Solution WebSocket avec Cookies HttpOnly - PrintAlma

## 🚨 Problème Identifié

Votre backend utilise des cookies `auth_token` httpOnly, mais votre `OrderGateway` ne les lit pas ! Il cherche seulement le token dans :
- `client.handshake.auth?.token`
- `client.handshake.query?.token`  
- `client.handshake.headers?.authorization`

**❌ Mais pas dans les cookies !**

## 🛠️ Solution: Modifier le OrderGateway

### 📝 Étape 1: Mettre à jour le OrderGateway

Remplacez votre méthode `handleConnection` dans `src/order/order.gateway.ts`:

```typescript
async handleConnection(client: Socket) {
  try {
    // 🔧 NOUVELLE LOGIQUE: Récupérer le token depuis plusieurs sources
    let token = 
      client.handshake.auth?.token || 
      client.handshake.query?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');

    // ⭐ AJOUT: Vérifier les cookies si aucun token trouvé
    if (!token) {
      const cookies = client.handshake.headers.cookie;
      if (cookies) {
        // Parser les cookies pour trouver auth_token
        const cookieMatch = cookies.match(/auth_token=([^;]+)/);
        if (cookieMatch) {
          token = cookieMatch[1];
          console.log('🍪 Token trouvé dans les cookies');
        }
      }
    }

    if (!token) {
      console.log('🚫 Connexion WebSocket refusée: pas de token');
      client.disconnect();
      return;
    }

    // Vérifier le token JWT
    const payload = await this.jwtService.verifyAsync(token);
    const user = payload;

    // Stocker les infos utilisateur dans le socket
    client.data.user = user;
    client.data.userId = user.sub;
    client.data.userRole = user.role;

    // Séparer les admins des utilisateurs normaux
    if (['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      this.connectedAdmins.set(client.id, client);
      client.join('admins');
      console.log(`👑 Admin connecté: ${user.email} (${client.id})`);
      console.log(`📊 Total admins connectés: ${this.connectedAdmins.size}`);
    } else {
      this.connectedUsers.set(client.id, client);
      client.join(`user_${user.sub}`);
      console.log(`👤 Utilisateur connecté: ${user.email} (${client.id})`);
    }

  } catch (error) {
    console.log('🚫 Erreur authentification WebSocket:', error.message);
    client.disconnect();
  }
}
```

### 📝 Étape 2: Version Alternative Plus Robuste

Pour une solution encore plus propre, vous pouvez créer une méthode utilitaire :

```typescript
// src/order/order.gateway.ts - Ajoutez cette méthode privée
private extractTokenFromSocket(client: Socket): string | null {
  // 1. Vérifier auth token
  if (client.handshake.auth?.token) {
    return client.handshake.auth.token;
  }

  // 2. Vérifier query params
  if (client.handshake.query?.token) {
    return client.handshake.query.token as string;
  }

  // 3. Vérifier headers Authorization
  const authHeader = client.handshake.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // 4. ⭐ Vérifier les cookies
  const cookies = client.handshake.headers.cookie;
  if (cookies) {
    const cookieMatch = cookies.match(/auth_token=([^;]+)/);
    if (cookieMatch) {
      return cookieMatch[1];
    }
  }

  return null;
}

// Puis modifiez handleConnection :
async handleConnection(client: Socket) {
  try {
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      console.log('🚫 Connexion WebSocket refusée: pas de token');
      client.disconnect();
      return;
    }

    // Reste du code identique...
    const payload = await this.jwtService.verifyAsync(token);
    // ... etc
  } catch (error) {
    console.log('🚫 Erreur authentification WebSocket:', error.message);
    client.disconnect();
  }
}
```

### 📝 Étape 3: Service Frontend Adapté

Utilisez cette version simplifiée dans votre frontend :

```javascript
// src/services/WebSocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
    this.listeners = {
      newOrder: [],
      orderStatusChanged: [],
      myOrderUpdated: []
    };
  }

  connect() {
    console.log('🔌 Connexion WebSocket avec cookies...');
    
    this.socket = io(`${this.baseURL}/orders`, {
      withCredentials: true, // ⭐ Envoie automatiquement les cookies
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();
    return true;
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket déconnecté:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur WebSocket:', error.message);
      
      if (error.message.includes('401')) {
        console.error('🔐 Cookie d\'authentification manquant ou expiré');
        this.handleAuthError();
      }
    });

    // Événements des notifications
    this.socket.on('newOrder', (notification) => {
      console.log('🆕 Nouvelle commande:', notification);
      this.triggerListeners('newOrder', notification);
      this.showNotification(notification);
    });

    this.socket.on('orderStatusChanged', (notification) => {
      console.log('📝 Statut changé:', notification);
      this.triggerListeners('orderStatusChanged', notification);
    });

    this.socket.on('myOrderUpdated', (notification) => {
      console.log('📦 Ma commande mise à jour:', notification);
      this.triggerListeners('myOrderUpdated', notification);
      this.showNotification(notification);
    });
  }

  handleAuthError() {
    if (window.location.pathname !== '/login') {
      console.log('🔄 Redirection vers login...');
      window.location.href = '/login';
    }
  }

  triggerListeners(event, data) {
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erreur listener ${event}:`, error);
      }
    });
  }

  async showNotification(notification) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    
    if (Notification.permission === 'granted') {
      const notif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });

      setTimeout(() => notif.close(), 5000);
    }
  }

  onNewOrder(callback) {
    this.listeners.newOrder.push(callback);
  }

  onOrderStatusChanged(callback) {
    this.listeners.orderStatusChanged.push(callback);
  }

  onMyOrderUpdated(callback) {
    this.listeners.myOrderUpdated.push(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isConnectedToWebSocket() {
    return this.isConnected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

export default new WebSocketService();
```

## 🧪 Test de la Solution

### 1. Tester le Backend Modifié

Après avoir modifié le gateway, testez avec :

```bash
npm run start
```

Vérifiez que les logs n'affichent pas d'erreur au démarrage.

### 2. Tester depuis le Frontend

Dans votre navigateur (console F12), après connexion :

```javascript
// Vérifier que le cookie existe
console.log('Cookie présent:', document.cookie.includes('auth_token'));

// Tester la connexion WebSocket
import WebSocketService from './services/WebSocketService';
WebSocketService.connect();

// Ou test rapide :
const socket = io('http://localhost:3004/orders', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => console.log('✅ Connecté!'));
socket.on('connect_error', (err) => console.error('❌ Erreur:', err));
```

### 3. Test Complet

1. **Connectez-vous** sur votre frontend
2. **Ouvrez** la console du navigateur
3. **Vérifiez** le cookie : `document.cookie`
4. **Implémentez** le service WebSocket
5. **Créez** une commande de test
6. **Vérifiez** que l'admin reçoit la notification

## 🔄 Si ça ne marche toujours pas

### Vérification Debug

Ajoutez des logs temporaires dans votre gateway :

```typescript
async handleConnection(client: Socket) {
  console.log('🔍 DEBUG - Headers cookies:', client.handshake.headers.cookie);
  console.log('🔍 DEBUG - Auth token:', client.handshake.auth?.token);
  console.log('🔍 DEBUG - Query token:', client.handshake.query?.token);
  
  // ... reste du code
}
```

### Alternative: Cookie Parser

Si la solution simple ne fonctionne pas, installez un parser de cookies :

```bash
npm install cookie
```

Puis dans le gateway :

```typescript
import * as cookie from 'cookie';

async handleConnection(client: Socket) {
  try {
    let token = client.handshake.auth?.token;

    if (!token && client.handshake.headers.cookie) {
      const cookies = cookie.parse(client.handshake.headers.cookie);
      token = cookies.auth_token;
    }

    // ... reste du code
  } catch (error) {
    // ...
  }
}
```

## ✅ Résumé de la Solution

1. **Modifiez** `order.gateway.ts` pour lire les cookies
2. **Utilisez** `withCredentials: true` dans le frontend
3. **Testez** depuis le navigateur (pas Node.js)
4. **Vérifiez** les logs backend pour debug

Cette solution devrait résoudre votre problème d'authentification WebSocket avec les cookies ! 🎉 