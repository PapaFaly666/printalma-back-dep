import { Injectable, NotFoundException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType, Notification } from '@prisma/client';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject('NotificationGateway')
    private notificationGateway?: NotificationGateway,
  ) {}

  /**
   * Setter pour injecter le gateway après l'initialisation (évite la référence circulaire)
   */
  setGateway(gateway: NotificationGateway) {
    this.notificationGateway = gateway;
  }

  /**
   * Créer une nouvelle notification
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: createNotificationDto.userId,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        metadata: createNotificationDto.metadata || null,
        expiresAt: createNotificationDto.expiresAt ? new Date(createNotificationDto.expiresAt) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // 🔥 ENVOI WEBSOCKET EN TEMPS RÉEL
    try {
      // Envoi selon le type de notification
      if (createNotificationDto.type === NotificationType.ORDER_NEW) {
        // Notification pour les admins uniquement
        this.notificationGateway?.broadcastNotification(notification, 'ADMIN');
      } else if (createNotificationDto.type === NotificationType.ORDER_UPDATED) {
        // Notification pour l'utilisateur spécifique ou les admins
        this.notificationGateway?.broadcastNotification(notification, undefined, createNotificationDto.userId);
      } else {
        // Autres types de notifications
        this.notificationGateway?.broadcastNotification(notification, undefined, createNotificationDto.userId);
      }
    } catch (error) {
      console.error('Erreur envoi WebSocket notification:', error);
      // Ne pas faire échouer la création de notification pour une erreur WebSocket
    }

    return notification;
  }

  /**
   * Notification pour nouvelle commande
   */
  async notifyNewOrder(userId: number, orderData: any): Promise<Notification> {
    // Gestion robuste du nom du client
    let customer = 'Client';
    if (orderData.user) {
      const firstName = orderData.user.firstName || '';
      const lastName = orderData.user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      customer = fullName || 'Client';
    }

    const itemsCount = orderData.orderItems?.length || 0;
    const products = orderData.orderItems
      ?.slice(0, 2)
      .map((item: any) => item.product?.name || 'Produit')
      .join(', ') || 'Produits non spécifiés';

    return this.create({
      userId,
      type: NotificationType.ORDER_NEW,
      title: 'Nouvelle commande reçue',
      message: `${customer} a passé une commande de ${itemsCount} article${itemsCount > 1 ? 's' : ''} : ${products}`,
      metadata: {
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        amount: orderData.totalAmount,
        customer: customer,
        itemsCount: itemsCount,
      },
    });
  }

  /**
   * Notification pour mise à jour de commande
   */
  async notifyOrderUpdate(
    userId: number,
    orderData: any,
    newStatus: string,
    oldStatus: string,
  ): Promise<Notification> {
    // Gestion robuste du nom du client
    let customer = 'Client';
    if (orderData.user) {
      const firstName = orderData.user.firstName || '';
      const lastName = orderData.user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      customer = fullName || 'Client';
    }

    const statusLabels = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En traitement',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
      REJECTED: 'Rejetée',
    };

    return this.create({
      userId,
      type: NotificationType.ORDER_UPDATED,
      title: 'Commande mise à jour',
      message: `Statut de la commande ${orderData.orderNumber} modifié de "${statusLabels[oldStatus] || oldStatus}" vers "${statusLabels[newStatus] || newStatus}"`,
      metadata: {
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        amount: orderData.totalAmount,
        customer: customer,
        oldStatus: oldStatus,
        newStatus: newStatus,
      },
    });
  }

  /**
   * Notification système
   */
  async notifySystem(
    userId: number,
    title: string,
    message: string,
    metadata: any = {},
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.SYSTEM,
      title,
      message,
      metadata,
    });
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getUserNotifications(
    userId: number,
    limit: number = 50,
    includeRead: boolean = true,
  ): Promise<Notification[]> {
    const where: any = {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (!includeRead) {
      where.isRead = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: number, userId?: number): Promise<Notification> {
    const where: any = { id: notificationId };
    if (userId) {
      where.userId = userId;
    }

    const notification = await this.prisma.notification.findFirst({ where });
    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Marquer toutes les notifications comme lues pour un utilisateur
   */
  async markAllAsRead(userId: number): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      data: { isRead: true },
    });

    return { count: result.count };
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: number, userId?: number): Promise<void> {
    const where: any = { id: notificationId };
    if (userId) {
      where.userId = userId;
    }

    const notification = await this.prisma.notification.findFirst({ where });
    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
  }

  /**
   * Supprimer les notifications expirées
   */
  async cleanExpired(): Promise<{ count: number }> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return { count: result.count };
  }

  /**
   * Notifier tous les admins d'une nouvelle commande
   */
  async notifyAdminsNewOrder(orderData: any): Promise<Notification[]> {
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPERADMIN'] },
        status: true,
      },
    });

    const notifications = await Promise.all(
      admins.map(admin => this.notifyNewOrder(admin.id, orderData))
    );

    // 🔥 WEBSOCKET NOTIFICATION EN TEMPS RÉEL POUR NOUVELLE COMMANDE
    try {
      if (notifications.length > 0) {
        this.notificationGateway?.notifyNewOrderNotification(notifications[0], orderData);
      }
    } catch (error) {
      console.error('Erreur WebSocket nouvelle commande:', error);
    }

    return notifications;
  }

  /**
   * Notifier tous les admins d'une mise à jour de commande
   */
  async notifyAdminsOrderUpdate(
    orderData: any,
    newStatus: string,
    oldStatus: string,
  ): Promise<Notification[]> {
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPERADMIN'] },
        status: true,
      },
    });

    const notifications = await Promise.all(
      admins.map(admin => this.notifyOrderUpdate(admin.id, orderData, newStatus, oldStatus))
    );

    // 🔥 WEBSOCKET NOTIFICATION EN TEMPS RÉEL POUR MISE À JOUR COMMANDE
    try {
      if (notifications.length > 0) {
        this.notificationGateway?.notifyOrderUpdateNotification(notifications[0], orderData);
      }
    } catch (error) {
      console.error('Erreur WebSocket mise à jour commande:', error);
    }

    return notifications;
  }

  /**
   * Notifier un utilisateur spécifique du changement de statut de sa commande
   */
  async notifyCustomerOrderUpdate(
    customerId: number,
    orderData: any,
    newStatus: string,
  ): Promise<Notification> {
    const statusLabels = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En traitement',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
      REJECTED: 'Rejetée',
    };

    const notification = await this.create({
      userId: customerId,
      type: NotificationType.ORDER_UPDATED,
      title: 'Mise à jour de votre commande',
      message: `Votre commande ${orderData.orderNumber} est maintenant "${statusLabels[newStatus] || newStatus}"`,
      metadata: {
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        amount: orderData.totalAmount,
        newStatus: newStatus,
      },
    });

    // 🔥 WEBSOCKET NOTIFICATION EN TEMPS RÉEL POUR LE CLIENT
    try {
      this.notificationGateway?.notifyOrderUpdateNotification(notification, orderData, customerId);
    } catch (error) {
      console.error('Erreur WebSocket notification client:', error);
    }

    return notification;
  }
} 