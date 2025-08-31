import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // En production, spécifiez votre domaine frontend
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedAdmins = new Map<string, Socket>();
  private connectedUsers = new Map<string, Socket>();

  constructor(private jwtService: JwtService) {}

  // Extraire le token depuis plusieurs sources (cookies inclus)
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

    // 4. Vérifier les cookies
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const cookieMatch = cookies.match(/auth_token=([^;]+)/);
      if (cookieMatch) {
        console.log('🍪 Token trouvé dans les cookies (notifications)');
        return cookieMatch[1];
      }
    }

    return null;
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);

      if (!token) {
        console.log('🚫 Connexion WebSocket notifications refusée: pas de token');
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
        client.join('admins'); // Room pour tous les admins
        console.log(`🔔 Admin connecté aux notifications: ${user.email} (${client.id})`);
        console.log(`📊 Total admins connectés aux notifications: ${this.connectedAdmins.size}`);
      } else {
        this.connectedUsers.set(client.id, client);
        client.join(`user_${user.sub}`); // Room individuelle pour chaque utilisateur
        console.log(`🔔 Utilisateur connecté aux notifications: ${user.email} (${client.id})`);
      }

      // Confirmer la connexion
      client.emit('connected', {
        message: 'Connecté aux notifications en temps réel',
        userId: user.sub,
        role: user.role,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.log('🚫 Erreur authentification WebSocket notifications:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    
    if (user) {
      if (['ADMIN', 'SUPERADMIN'].includes(user.role)) {
        this.connectedAdmins.delete(client.id);
        console.log(`🔔 Admin déconnecté des notifications: ${user.email}`);
        console.log(`📊 Total admins connectés aux notifications: ${this.connectedAdmins.size}`);
      } else {
        this.connectedUsers.delete(client.id);
        console.log(`🔔 Utilisateur déconnecté des notifications: ${user.email}`);
      }
    }
  }

  /**
   * 🆕 Notifier une nouvelle commande aux admins
   */
  notifyNewOrderNotification(notification: any, orderData: any) {
    const notificationData = {
      type: 'NEW_ORDER_NOTIFICATION',
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      },
      orderData: {
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        totalAmount: orderData.totalAmount,
        customer: notification.metadata?.customer || 'Client',
        itemsCount: notification.metadata?.itemsCount || 0,
      },
      timestamp: new Date().toISOString(),
    };

    // Envoyer à tous les admins connectés
    this.server.to('admins').emit('newOrderNotification', notificationData);
    
    console.log(`🔔 Notification nouvelle commande envoyée à ${this.connectedAdmins.size} admin(s)`);
    console.log(`📦 Commande: #${orderData.orderNumber} - ${orderData.totalAmount}€`);
  }

  /**
   * 📝 Notifier un changement de statut de commande
   */
  notifyOrderUpdateNotification(notification: any, orderData: any, targetUserId?: number) {
    const notificationData = {
      type: 'ORDER_UPDATE_NOTIFICATION',
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      },
      orderData: {
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        totalAmount: orderData.totalAmount,
        customer: notification.metadata?.customer || 'Client',
        oldStatus: notification.metadata?.oldStatus,
        newStatus: notification.metadata?.newStatus,
      },
      timestamp: new Date().toISOString(),
    };

    if (targetUserId) {
      // Notification pour un utilisateur spécifique
      this.server.to(`user_${targetUserId}`).emit('orderUpdateNotification', notificationData);
      console.log(`🔄 Notification mise à jour commande envoyée à l'utilisateur ${targetUserId}`);
    } else {
      // Notification pour tous les admins
      this.server.to('admins').emit('orderUpdateNotification', notificationData);
      console.log(`🔄 Notification mise à jour commande envoyée à ${this.connectedAdmins.size} admin(s)`);
    }
  }

  /**
   * ⚙️ Notifier une notification système
   */
  notifySystemNotification(notification: any, targetUserId?: number) {
    const notificationData = {
      type: 'SYSTEM_NOTIFICATION',
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      },
      timestamp: new Date().toISOString(),
    };

    if (targetUserId) {
      // Notification pour un utilisateur spécifique
      this.server.to(`user_${targetUserId}`).emit('systemNotification', notificationData);
      console.log(`⚙️ Notification système envoyée à l'utilisateur ${targetUserId}`);
    } else {
      // Notification pour tous les admins
      this.server.to('admins').emit('systemNotification', notificationData);
      console.log(`⚙️ Notification système envoyée à ${this.connectedAdmins.size} admin(s)`);
    }
  }

  /**
   * 📢 Notification générale (peut être utilisée pour tous types)
   */
  broadcastNotification(notification: any, targetRole?: 'ADMIN' | 'USER', targetUserId?: number) {
    const notificationData = {
      type: 'GENERAL_NOTIFICATION',
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      },
      timestamp: new Date().toISOString(),
    };

    if (targetUserId) {
      // Utilisateur spécifique
      this.server.to(`user_${targetUserId}`).emit('notification', notificationData);
      console.log(`📢 Notification envoyée à l'utilisateur ${targetUserId}`);
    } else if (targetRole === 'ADMIN') {
      // Tous les admins
      this.server.to('admins').emit('notification', notificationData);
      console.log(`📢 Notification envoyée à ${this.connectedAdmins.size} admin(s)`);
    } else {
      // Tous les utilisateurs connectés
      this.server.emit('notification', notificationData);
      console.log(`📢 Notification broadcast à tous les utilisateurs connectés`);
    }
  }

  /**
   * 📊 Statistiques de connexion
   */
  @SubscribeMessage('getStats')
  handleGetStats(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    const stats = {
      connectedAdmins: this.connectedAdmins.size,
      connectedUsers: this.connectedUsers.size,
      yourRole: user?.role,
      timestamp: new Date().toISOString(),
    };

    client.emit('stats', stats);
    return stats;
  }

  /**
   * 🏓 Test de connexion
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const user = client.data.user;
    console.log(`🏓 Ping notifications reçu de ${user?.email}`);
    client.emit('pong', { 
      message: 'Connexion WebSocket notifications active', 
      timestamp: new Date().toISOString(),
      service: 'notifications'
    });
  }

  /**
   * 📊 Obtenir les statistiques de connexion
   */
  getConnectionStats() {
    return {
      connectedAdmins: this.connectedAdmins.size,
      connectedUsers: this.connectedUsers.size,
      totalConnections: this.connectedAdmins.size + this.connectedUsers.size,
    };
  }
} 