# 💰 Guide Backend - Système d'Appel de Fonds Vendeur

Ce guide détaille l'implémentation complète du système d'appel de fonds pour les vendeurs avec gestion administrative.

## 📋 Vue d'ensemble du système

Le système d'appel de fonds permet aux vendeurs de :
- Consulter leurs gains disponibles
- Créer des demandes de retrait
- Suivre le statut de leurs demandes

Et permet aux administrateurs de :
- Visualiser toutes les demandes
- Approuver, rejeter ou marquer comme payées les demandes
- Suivre les statistiques globales

## 🗄️ Schéma de Base de Données

### Table `vendor_funds_requests`

```sql
-- Table principale pour les demandes d'appel de fonds
CREATE TABLE vendor_funds_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vendor_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL, -- Montant demandé en FCFA
    requested_amount DECIMAL(10,2) NOT NULL, -- Montant original (peut différer après frais)
    description TEXT NOT NULL,
    payment_method ENUM('WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID') DEFAULT 'PENDING',
    reject_reason TEXT NULL,
    admin_note TEXT NULL,
    processed_by BIGINT NULL, -- ID de l'admin qui a traité
    processed_at DATETIME NULL,
    available_balance DECIMAL(10,2) NOT NULL, -- Solde disponible au moment de la demande
    commission_rate DECIMAL(4,3) NOT NULL DEFAULT 0.100, -- Taux de commission (ex: 0.100 = 10%)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Clés étrangères
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,

    -- Index pour les performances
    INDEX idx_vendor_status (vendor_id, status),
    INDEX idx_status_date (status, created_at),
    INDEX idx_processed_date (processed_at)
);
```

### Table de liaison `vendor_funds_request_orders`

```sql
-- Table de liaison entre demandes de fonds et commandes
CREATE TABLE vendor_funds_request_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    funds_request_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (funds_request_id) REFERENCES vendor_funds_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,

    -- Éviter les doublons
    UNIQUE KEY unique_request_order (funds_request_id, order_id),
    INDEX idx_funds_request (funds_request_id),
    INDEX idx_order (order_id)
);
```

### Table `vendor_earnings` (optionnelle, pour cache des gains)

```sql
-- Cache des gains vendeur pour optimiser les performances
CREATE TABLE vendor_earnings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vendor_id BIGINT NOT NULL UNIQUE,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    available_amount DECIMAL(10,2) DEFAULT 0,
    pending_amount DECIMAL(10,2) DEFAULT 0,
    this_month_earnings DECIMAL(10,2) DEFAULT 0,
    last_month_earnings DECIMAL(10,2) DEFAULT 0,
    total_commission_paid DECIMAL(10,2) DEFAULT 0,
    average_commission_rate DECIMAL(4,3) DEFAULT 0.100,
    last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_vendor (vendor_id)
);
```

## 🔧 Triggers et Procédures Stockées

### Trigger pour mettre à jour les gains

```sql
-- Trigger pour recalculer les gains quand une demande est traitée
DELIMITER $$

CREATE TRIGGER update_vendor_earnings_after_funds_request
AFTER UPDATE ON vendor_funds_requests
FOR EACH ROW
BEGIN
    -- Si le statut a changé vers PAID, déduire du montant disponible
    IF NEW.status = 'PAID' AND OLD.status != 'PAID' THEN
        INSERT INTO vendor_earnings (vendor_id, available_amount)
        VALUES (NEW.vendor_id, -NEW.amount)
        ON DUPLICATE KEY UPDATE
            available_amount = available_amount - NEW.amount,
            updated_at = CURRENT_TIMESTAMP;
    END IF;

    -- Si le statut a changé vers REJECTED depuis PENDING, libérer le montant
    IF NEW.status = 'REJECTED' AND OLD.status = 'PENDING' THEN
        INSERT INTO vendor_earnings (vendor_id, available_amount)
        VALUES (NEW.vendor_id, NEW.amount)
        ON DUPLICATE KEY UPDATE
            available_amount = available_amount + NEW.amount,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
END$$

DELIMITER ;
```

### Procédure pour calculer les gains vendeur

```sql
-- Procédure pour calculer les gains d'un vendeur
DELIMITER $$

CREATE PROCEDURE CalculateVendorEarnings(IN p_vendor_id BIGINT)
BEGIN
    DECLARE v_total_earnings DECIMAL(10,2) DEFAULT 0;
    DECLARE v_pending_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_this_month DECIMAL(10,2) DEFAULT 0;
    DECLARE v_last_month DECIMAL(10,2) DEFAULT 0;

    -- Calculer les gains totaux depuis les commandes livrées
    SELECT COALESCE(SUM(oi.unit_price * oi.quantity * (1 - COALESCE(p.commission_rate, 0.10))), 0)
    INTO v_total_earnings
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.vendor_id = p_vendor_id
    AND o.status IN ('DELIVERED', 'COMPLETED');

    -- Calculer le montant en attente (demandes PENDING/APPROVED)
    SELECT COALESCE(SUM(amount), 0)
    INTO v_pending_amount
    FROM vendor_funds_requests
    WHERE vendor_id = p_vendor_id
    AND status IN ('PENDING', 'APPROVED');

    -- Gains de ce mois
    SELECT COALESCE(SUM(oi.unit_price * oi.quantity * (1 - COALESCE(p.commission_rate, 0.10))), 0)
    INTO v_this_month
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.vendor_id = p_vendor_id
    AND o.status IN ('DELIVERED', 'COMPLETED')
    AND YEAR(o.updated_at) = YEAR(CURRENT_DATE)
    AND MONTH(o.updated_at) = MONTH(CURRENT_DATE);

    -- Gains du mois dernier
    SELECT COALESCE(SUM(oi.unit_price * oi.quantity * (1 - COALESCE(p.commission_rate, 0.10))), 0)
    INTO v_last_month
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.vendor_id = p_vendor_id
    AND o.status IN ('DELIVERED', 'COMPLETED')
    AND YEAR(o.updated_at) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
    AND MONTH(o.updated_at) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH);

    -- Mettre à jour ou insérer dans vendor_earnings
    INSERT INTO vendor_earnings (
        vendor_id,
        total_earnings,
        available_amount,
        pending_amount,
        this_month_earnings,
        last_month_earnings,
        last_calculated_at
    )
    VALUES (
        p_vendor_id,
        v_total_earnings,
        v_total_earnings - v_pending_amount - COALESCE((
            SELECT SUM(amount) FROM vendor_funds_requests
            WHERE vendor_id = p_vendor_id AND status = 'PAID'
        ), 0),
        v_pending_amount,
        v_this_month,
        v_last_month,
        CURRENT_TIMESTAMP
    )
    ON DUPLICATE KEY UPDATE
        total_earnings = v_total_earnings,
        available_amount = v_total_earnings - v_pending_amount - COALESCE((
            SELECT SUM(amount) FROM vendor_funds_requests
            WHERE vendor_id = p_vendor_id AND status = 'PAID'
        ), 0),
        pending_amount = v_pending_amount,
        this_month_earnings = v_this_month,
        last_month_earnings = v_last_month,
        last_calculated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;

END$$

DELIMITER ;
```

## 📡 Endpoints API

### 🎯 Endpoints Vendeur

#### 1. Récupérer les gains du vendeur
```
GET /api/vendor/earnings
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalEarnings": 182500,
    "pendingAmount": 23500,
    "availableAmount": 159000,
    "thisMonthEarnings": 182500,
    "lastMonthEarnings": 156000,
    "commissionPaid": 18250,
    "totalCommission": 20075,
    "averageCommissionRate": 0.10
  }
}
```

#### 2. Récupérer les demandes du vendeur
```
GET /api/vendor/funds-requests?page=1&limit=10&status=PENDING
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": 1,
        "amount": 45000,
        "description": "Vente de 3 T-shirts design Afrique",
        "paymentMethod": "WAVE",
        "phoneNumber": "+221770001234",
        "status": "PENDING",
        "requestDate": "2024-01-17T09:15:00Z",
        "createdAt": "2024-01-17T09:15:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

#### 3. Créer une demande d'appel de fonds
```
POST /api/vendor/funds-requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 45000,
  "description": "Gains du mois de janvier",
  "paymentMethod": "WAVE",
  "phoneNumber": "+221770001234",
  "orderIds": [1, 2, 3]
}
```

#### 4. Récupérer les détails d'une demande
```
GET /api/vendor/funds-requests/{requestId}
Authorization: Bearer {token}
```

#### 5. Annuler une demande en attente
```
PATCH /api/vendor/funds-requests/{requestId}/cancel
Authorization: Bearer {token}
```

### 🎯 Endpoints Admin

#### 1. Récupérer toutes les demandes (admin)
```
GET /api/admin/funds-requests?page=1&limit=10&status=PENDING&vendorId=2000
Authorization: Bearer {admin_token}
```

#### 2. Récupérer les statistiques des demandes
```
GET /api/admin/funds-requests/statistics
Authorization: Bearer {admin_token}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalPendingRequests": 5,
    "totalPendingAmount": 156500,
    "totalProcessedToday": 3,
    "totalProcessedAmount": 89700,
    "averageProcessingTime": 18.5,
    "requestsByStatus": {
      "pending": 5,
      "approved": 3,
      "rejected": 1,
      "paid": 12
    },
    "requestsByPaymentMethod": {
      "wave": 8,
      "orangeMoney": 6,
      "bankTransfer": 1
    }
  }
}
```

#### 3. Traiter une demande (admin)
```
PATCH /api/admin/funds-requests/{requestId}/process
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "APPROVED",
  "adminNote": "Demande approuvée après vérification",
  "rejectReason": null
}
```

#### 4. Traitement en lot (admin)
```
PATCH /api/admin/funds-requests/batch-process
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "requestIds": [1, 2, 3],
  "status": "APPROVED",
  "adminNote": "Lot approuvé"
}
```

## 💻 Implémentation Backend (Node.js/Express)

### Controller Vendeur

```javascript
// controllers/vendorFundsController.js
const { VendorFundsRequest, VendorEarnings, Order, User } = require('../models');
const { Op } = require('sequelize');

class VendorFundsController {

  // Récupérer les gains du vendeur
  async getVendorEarnings(req, res) {
    try {
      const vendorId = req.user.id;

      // Recalculer les gains
      await this.calculateVendorEarnings(vendorId);

      const earnings = await VendorEarnings.findOne({
        where: { vendor_id: vendorId }
      });

      if (!earnings) {
        return res.status(404).json({
          success: false,
          message: 'Aucun gain trouvé pour ce vendeur'
        });
      }

      res.json({
        success: true,
        data: {
          totalEarnings: parseFloat(earnings.total_earnings),
          pendingAmount: parseFloat(earnings.pending_amount),
          availableAmount: parseFloat(earnings.available_amount),
          thisMonthEarnings: parseFloat(earnings.this_month_earnings),
          lastMonthEarnings: parseFloat(earnings.last_month_earnings),
          commissionPaid: parseFloat(earnings.total_commission_paid),
          totalCommission: parseFloat(earnings.total_commission_paid),
          averageCommissionRate: parseFloat(earnings.average_commission_rate)
        }
      });

    } catch (error) {
      console.error('Erreur récupération gains vendeur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des gains'
      });
    }
  }

  // Récupérer les demandes du vendeur
  async getVendorFundsRequests(req, res) {
    try {
      const vendorId = req.user.id;
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;

      const whereClause = { vendor_id: vendorId };

      if (status) whereClause.status = status;
      if (startDate && endDate) {
        whereClause.created_at = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const offset = (page - 1) * limit;

      const { count, rows: requests } = await VendorFundsRequest.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'vendor',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          requests: requests.map(this.formatFundsRequest),
          total: count,
          page: parseInt(page),
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      });

    } catch (error) {
      console.error('Erreur récupération demandes vendeur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes'
      });
    }
  }

  // Créer une demande d'appel de fonds
  async createFundsRequest(req, res) {
    try {
      const vendorId = req.user.id;
      const { amount, description, paymentMethod, phoneNumber, orderIds } = req.body;

      // Validation des données
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être supérieur à 0'
        });
      }

      if (!description || !paymentMethod || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      // Vérifier le solde disponible
      await this.calculateVendorEarnings(vendorId);
      const earnings = await VendorEarnings.findOne({
        where: { vendor_id: vendorId }
      });

      if (!earnings || earnings.available_amount < amount) {
        return res.status(400).json({
          success: false,
          message: 'Solde insuffisant pour cette demande'
        });
      }

      // Créer la demande
      const fundsRequest = await VendorFundsRequest.create({
        vendor_id: vendorId,
        amount,
        requested_amount: amount,
        description,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        available_balance: earnings.available_amount,
        commission_rate: earnings.average_commission_rate
      });

      // Lier aux commandes si spécifiées
      if (orderIds && orderIds.length > 0) {
        const orderLinks = orderIds.map(orderId => ({
          funds_request_id: fundsRequest.id,
          order_id: orderId
        }));

        await VendorFundsRequestOrder.bulkCreate(orderLinks);
      }

      res.status(201).json({
        success: true,
        message: 'Demande créée avec succès',
        data: this.formatFundsRequest(fundsRequest)
      });

    } catch (error) {
      console.error('Erreur création demande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la demande'
      });
    }
  }

  // Méthode utilitaire pour calculer les gains
  async calculateVendorEarnings(vendorId) {
    // Appeler la procédure stockée ou faire le calcul ici
    // Cette méthode doit être implémentée selon votre ORM
    // Exemple avec Sequelize :

    const [results] = await sequelize.query(
      'CALL CalculateVendorEarnings(?)',
      {
        replacements: [vendorId]
      }
    );
  }

  // Formatter une demande pour la réponse
  formatFundsRequest(request) {
    return {
      id: request.id,
      vendorId: request.vendor_id,
      vendor: request.vendor ? {
        id: request.vendor.id,
        firstName: request.vendor.firstName,
        lastName: request.vendor.lastName,
        email: request.vendor.email
      } : null,
      amount: parseFloat(request.amount),
      requestedAmount: parseFloat(request.requested_amount),
      description: request.description,
      paymentMethod: request.payment_method,
      phoneNumber: request.phone_number,
      status: request.status,
      rejectReason: request.reject_reason,
      requestDate: request.created_at,
      processedDate: request.processed_at,
      processedBy: request.processed_by,
      adminNote: request.admin_note,
      availableBalance: parseFloat(request.available_balance),
      commissionRate: parseFloat(request.commission_rate),
      createdAt: request.created_at,
      updatedAt: request.updated_at
    };
  }
}

module.exports = new VendorFundsController();
```

### Controller Admin

```javascript
// controllers/adminFundsController.js
const { VendorFundsRequest, User } = require('../models');
const { Op } = require('sequelize');

class AdminFundsController {

  // Récupérer toutes les demandes (admin)
  async getAllFundsRequests(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        vendorId,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const whereClause = {};

      if (status) whereClause.status = status;
      if (vendorId) whereClause.vendor_id = vendorId;
      if (startDate && endDate) {
        whereClause.created_at = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const offset = (page - 1) * limit;

      const { count, rows: requests } = await VendorFundsRequest.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: User,
            as: 'vendor',
            attributes: ['id', 'firstName', 'lastName', 'email', 'shopName']
          },
          {
            model: User,
            as: 'processedByUser',
            attributes: ['id', 'firstName', 'lastName'],
            required: false
          }
        ]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          requests: requests.map(this.formatFundsRequest),
          total: count,
          page: parseInt(page),
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      });

    } catch (error) {
      console.error('Erreur récupération demandes admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes'
      });
    }
  }

  // Récupérer les statistiques (admin)
  async getAdminFundsStatistics(req, res) {
    try {
      // Statistiques des demandes en attente
      const pendingStats = await VendorFundsRequest.findOne({
        where: { status: 'PENDING' },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
        ],
        raw: true
      });

      // Statistiques du jour
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const todayStats = await VendorFundsRequest.findOne({
        where: {
          processed_at: {
            [Op.gte]: todayStart
          },
          status: ['APPROVED', 'PAID']
        },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
        ],
        raw: true
      });

      // Statistiques par statut
      const statusStats = await VendorFundsRequest.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // Statistiques par méthode de paiement
      const methodStats = await VendorFundsRequest.findAll({
        attributes: [
          'payment_method',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['payment_method'],
        raw: true
      });

      // Calculer le temps moyen de traitement
      const avgProcessingTime = await sequelize.query(`
        SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, processed_at)) as avg_hours
        FROM vendor_funds_requests
        WHERE processed_at IS NOT NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `, { type: sequelize.QueryTypes.SELECT });

      // Formater les réponses
      const requestsByStatus = {
        pending: 0,
        approved: 0,
        rejected: 0,
        paid: 0
      };

      statusStats.forEach(stat => {
        requestsByStatus[stat.status.toLowerCase()] = parseInt(stat.count);
      });

      const requestsByPaymentMethod = {
        wave: 0,
        orangeMoney: 0,
        bankTransfer: 0
      };

      methodStats.forEach(stat => {
        switch(stat.payment_method) {
          case 'WAVE':
            requestsByPaymentMethod.wave = parseInt(stat.count);
            break;
          case 'ORANGE_MONEY':
            requestsByPaymentMethod.orangeMoney = parseInt(stat.count);
            break;
          case 'BANK_TRANSFER':
            requestsByPaymentMethod.bankTransfer = parseInt(stat.count);
            break;
        }
      });

      res.json({
        success: true,
        data: {
          totalPendingRequests: parseInt(pendingStats.count) || 0,
          totalPendingAmount: parseFloat(pendingStats.total_amount) || 0,
          totalProcessedToday: parseInt(todayStats.count) || 0,
          totalProcessedAmount: parseFloat(todayStats.total_amount) || 0,
          averageProcessingTime: parseFloat(avgProcessingTime[0]?.avg_hours) || 0,
          requestsByStatus,
          requestsByPaymentMethod
        }
      });

    } catch (error) {
      console.error('Erreur récupération statistiques admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // Traiter une demande (admin)
  async processFundsRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { status, adminNote, rejectReason } = req.body;
      const adminId = req.user.id;

      // Validation
      if (!['APPROVED', 'REJECTED', 'PAID'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide'
        });
      }

      if (status === 'REJECTED' && !rejectReason) {
        return res.status(400).json({
          success: false,
          message: 'La raison du rejet est requise'
        });
      }

      // Récupérer la demande
      const fundsRequest = await VendorFundsRequest.findByPk(requestId);

      if (!fundsRequest) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }

      if (fundsRequest.status !== 'PENDING' && fundsRequest.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Cette demande ne peut plus être modifiée'
        });
      }

      // Mettre à jour la demande
      const updateData = {
        status,
        admin_note: adminNote,
        processed_by: adminId,
        processed_at: new Date()
      };

      if (status === 'REJECTED') {
        updateData.reject_reason = rejectReason;
      }

      await fundsRequest.update(updateData);

      // Recharger avec les relations
      const updatedRequest = await VendorFundsRequest.findByPk(requestId, {
        include: [
          {
            model: User,
            as: 'vendor',
            attributes: ['id', 'firstName', 'lastName', 'email', 'shopName']
          }
        ]
      });

      res.json({
        success: true,
        message: `Demande ${status === 'APPROVED' ? 'approuvée' : status === 'REJECTED' ? 'rejetée' : 'marquée comme payée'}`,
        data: this.formatFundsRequest(updatedRequest)
      });

    } catch (error) {
      console.error('Erreur traitement demande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement de la demande'
      });
    }
  }

  // Formatter une demande pour la réponse (même que vendeur)
  formatFundsRequest(request) {
    return {
      id: request.id,
      vendorId: request.vendor_id,
      vendor: request.vendor ? {
        id: request.vendor.id,
        firstName: request.vendor.firstName,
        lastName: request.vendor.lastName,
        email: request.vendor.email,
        shopName: request.vendor.shopName
      } : null,
      amount: parseFloat(request.amount),
      requestedAmount: parseFloat(request.requested_amount),
      description: request.description,
      paymentMethod: request.payment_method,
      phoneNumber: request.phone_number,
      status: request.status,
      rejectReason: request.reject_reason,
      requestDate: request.created_at,
      processedDate: request.processed_at,
      processedBy: request.processed_by,
      adminNote: request.admin_note,
      availableBalance: parseFloat(request.available_balance),
      commissionRate: parseFloat(request.commission_rate),
      createdAt: request.created_at,
      updatedAt: request.updated_at
    };
  }
}

module.exports = new AdminFundsController();
```

### Routes

```javascript
// routes/vendorFunds.js
const express = require('express');
const router = express.Router();
const vendorFundsController = require('../controllers/vendorFundsController');
const { authMiddleware, vendorMiddleware } = require('../middleware/auth');

// Appliquer l'authentification et vérification vendeur
router.use(authMiddleware);
router.use(vendorMiddleware);

// Routes vendeur
router.get('/earnings', vendorFundsController.getVendorEarnings);
router.get('/funds-requests', vendorFundsController.getVendorFundsRequests);
router.post('/funds-requests', vendorFundsController.createFundsRequest);
router.get('/funds-requests/:requestId', vendorFundsController.getFundsRequestDetails);
router.patch('/funds-requests/:requestId/cancel', vendorFundsController.cancelFundsRequest);

module.exports = router;

// routes/adminFunds.js
const express = require('express');
const router = express.Router();
const adminFundsController = require('../controllers/adminFundsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Appliquer l'authentification et vérification admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Routes admin
router.get('/funds-requests', adminFundsController.getAllFundsRequests);
router.get('/funds-requests/statistics', adminFundsController.getAdminFundsStatistics);
router.get('/funds-requests/:requestId', adminFundsController.getFundsRequestDetails);
router.patch('/funds-requests/:requestId/process', adminFundsController.processFundsRequest);
router.patch('/funds-requests/batch-process', adminFundsController.batchProcessRequests);

module.exports = router;
```

## 📊 Données d'exemple

```sql
-- Insérer des données d'exemple pour les tests
INSERT INTO vendor_funds_requests (
    vendor_id, amount, requested_amount, description,
    payment_method, phone_number, status, available_balance, commission_rate
) VALUES
(2000, 45000.00, 45000.00, 'Vente de 3 T-shirts design Afrique', 'WAVE', '+221770001234', 'PENDING', 45000.00, 0.100),
(2001, 23500.00, 23500.00, 'Vente de 1 Hoodie premium', 'ORANGE_MONEY', '+221770002345', 'APPROVED', 23500.00, 0.100),
(2002, 67200.00, 67200.00, 'Gains du mois de décembre', 'WAVE', '+221770003456', 'PAID', 67200.00, 0.100);

-- Insérer des gains vendeur
INSERT INTO vendor_earnings (
    vendor_id, total_earnings, available_amount, pending_amount,
    this_month_earnings, last_month_earnings
) VALUES
(2000, 182500.00, 159000.00, 23500.00, 182500.00, 156000.00),
(2001, 156000.00, 132500.00, 23500.00, 156000.00, 134000.00),
(2002, 234700.00, 167500.00, 0.00, 67200.00, 167500.00);
```


```

### Tests

```javascript
// tests/vendorFunds.test.js
const request = require('supertest');
const app = require('../app');

describe('Vendor Funds API', () => {
  let vendorToken;
  let adminToken;

  beforeAll(async () => {
    // Setup test tokens
    vendorToken = await getTestVendorToken();
    adminToken = await getTestAdminToken();
  });

  describe('GET /vendor/earnings', () => {
    test('should return vendor earnings', async () => {
      const response = await request(app)
        .get('/api/vendor/earnings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalEarnings');
      expect(response.body.data).toHaveProperty('availableAmount');
    });
  });

  describe('POST /vendor/funds-requests', () => {
    test('should create a new funds request', async () => {
      const requestData = {
        amount: 50000,
        description: 'Test request',
        paymentMethod: 'WAVE',
        phoneNumber: '+221770001234'
      };

      const response = await request(app)
        .post('/api/vendor/funds-requests')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(50000);
      expect(response.body.data.status).toBe('PENDING');
    });
  });

  describe('PATCH /admin/funds-requests/:id/process', () => {
    test('should approve a funds request', async () => {
      const requestId = 1;
      const processData = {
        status: 'APPROVED',
        adminNote: 'Test approval'
      };

      const response = await request(app)
        .patch(`/api/admin/funds-requests/${requestId}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(processData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');
    });
  });
});
```

