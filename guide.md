# 📋 Guide Backend - Système de Commission PrintAlma

> **Guide complet pour l'implémentation du système de commission côté backend**
> 
> Version: 1.0 | Date: 2024 | PrintAlma Commission System

---

## 🎯 Vue d'ensemble

Le système de commission PrintAlma permet aux admins de définir des pourcentages de prélèvement (0-100%) sur les revenus des vendeurs directement depuis l'interface d'administration. Ce guide détaille l'implémentation côté serveur.

### ✨ Fonctionnalités Frontend Implémentées

- ✅ **Jauge interactive** dans le tableau de gestion des vendeurs
- ✅ **Plage flexible** : 0% à 100% avec précision décimale (step: 0.1)
- ✅ **Devise** : Francs CFA avec formatage localisé
- ✅ **UX optimisée** : Couleurs simplifiées, presets rapides, feedback visuel
- ✅ **Callback** : `onUpdateCommission(vendeurId, commission)` prêt à connecter

---

## 🗄️ Structure de Base de Données

### Table `vendor_commissions`

```sql
CREATE TABLE vendor_commissions (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES users(id),
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 40.00,
    -- Plage: 0.00 à 100.00 (avec 2 décimales de précision)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id), -- Admin qui a défini la commission
    
    -- Index pour performances
    UNIQUE(vendor_id),
    CHECK (commission_rate >= 0.00 AND commission_rate <= 100.00)
);

-- Index pour recherche rapide
CREATE INDEX idx_vendor_commissions_vendor_id ON vendor_commissions(vendor_id);
CREATE INDEX idx_vendor_commissions_rate ON vendor_commissions(commission_rate);
```

### Extension de la table `users` (optionnel)

```sql
-- Alternative: Ajouter directement dans la table users
ALTER TABLE users ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 40.00;
ALTER TABLE users ADD CONSTRAINT check_commission_rate 
    CHECK (commission_rate >= 0.00 AND commission_rate <= 100.00);
```

---

## 🔌 API Endpoints

### 1. Mettre à jour la commission d'un vendeur

```http
PUT /api/admin/vendors/:vendorId/commission
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "commissionRate": 35.5
}
```

**Réponse succès:**
```json
{
  "success": true,
  "message": "Commission mise à jour avec succès",
  "data": {
    "vendorId": 123,
    "commissionRate": 35.5,
    "updatedAt": "2024-01-15T10:30:00Z",
    "updatedBy": 1
  }
}
```

**Réponse erreur:**
```json
{
  "success": false,
  "error": "INVALID_COMMISSION_RATE",
  "message": "La commission doit être entre 0 et 100%"
}
```

### 2. Obtenir la commission d'un vendeur

```http
GET /api/admin/vendors/:vendorId/commission
Authorization: Bearer {admin_token}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "vendorId": 123,
    "commissionRate": 35.5,
    "setAt": "2024-01-15T10:30:00Z",
    "setBy": {
      "id": 1,
      "name": "Admin Principal"
    }
  }
}
```

### 3. Obtenir toutes les commissions (pour le tableau)

```http
GET /api/admin/vendors/commissions
Authorization: Bearer {admin_token}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "vendorId": 123,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "vendeur_type": "DESIGNER",
      "commissionRate": 35.5,
      "estimatedMonthlyRevenue": 150000,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 🛠️ Implémentation Backend (Node.js/Express)

### 1. Controller - Commission Management

```javascript
// controllers/commissionController.js
const { validateCommissionRate, calculateRevenueSplit } = require('../utils/commissionUtils');
const CommissionService = require('../services/commissionService');

class CommissionController {
  
  /**
   * Mettre à jour la commission d'un vendeur
   * PUT /api/admin/vendors/:vendorId/commission
   */
  async updateVendorCommission(req, res) {
    try {
      const { vendorId } = req.params;
      const { commissionRate } = req.body;
      const adminId = req.user.id;

      // Validation
      if (!validateCommissionRate(commissionRate)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_COMMISSION_RATE',
          message: 'La commission doit être entre 0 et 100%'
        });
      }

      // Vérifier que le vendeur existe
      const vendor = await CommissionService.getVendorById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          error: 'VENDOR_NOT_FOUND',
          message: 'Vendeur introuvable'
        });
      }

      // Mettre à jour la commission
      const result = await CommissionService.updateCommission({
        vendorId: parseInt(vendorId),
        commissionRate: parseFloat(commissionRate),
        updatedBy: adminId
      });

      // Log de l'action admin
      await CommissionService.logCommissionChange({
        vendorId,
        oldRate: vendor.commissionRate,
        newRate: commissionRate,
        adminId,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Commission mise à jour avec succès',
        data: result
      });

    } catch (error) {
      console.error('Erreur mise à jour commission:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la mise à jour de la commission'
      });
    }
  }

  /**
   * Obtenir la commission d'un vendeur
   * GET /api/admin/vendors/:vendorId/commission
   */
  async getVendorCommission(req, res) {
    try {
      const { vendorId } = req.params;

      const commission = await CommissionService.getCommissionByVendorId(vendorId);
      
      if (!commission) {
        return res.status(404).json({
          success: false,
          error: 'COMMISSION_NOT_FOUND',
          message: 'Commission non trouvée pour ce vendeur'
        });
      }

      res.json({
        success: true,
        data: commission
      });

    } catch (error) {
      console.error('Erreur récupération commission:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération de la commission'
      });
    }
  }

  /**
   * Obtenir toutes les commissions pour le tableau admin
   * GET /api/admin/vendors/commissions
   */
  async getAllVendorCommissions(req, res) {
    try {
      const commissions = await CommissionService.getAllCommissionsWithVendorInfo();

      res.json({
        success: true,
        data: commissions
      });

    } catch (error) {
      console.error('Erreur récupération commissions:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération des commissions'
      });
    }
  }
}

module.exports = new CommissionController();
```

### 2. Service - Commission Logic

```javascript
// services/commissionService.js
const db = require('../config/database');

class CommissionService {
  
  /**
   * Mettre à jour la commission d'un vendeur
   */
  async updateCommission({ vendorId, commissionRate, updatedBy }) {
    const query = `
      INSERT INTO vendor_commissions (vendor_id, commission_rate, created_by, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (vendor_id) 
      DO UPDATE SET 
        commission_rate = EXCLUDED.commission_rate,
        updated_at = CURRENT_TIMESTAMP,
        created_by = EXCLUDED.created_by
      RETURNING *;
    `;

    const result = await db.query(query, [vendorId, commissionRate, updatedBy]);
    return result.rows[0];
  }

  /**
   * Obtenir la commission d'un vendeur
   */
  async getCommissionByVendorId(vendorId) {
    const query = `
      SELECT 
        vc.*,
        u.firstName as admin_first_name,
        u.lastName as admin_last_name
      FROM vendor_commissions vc
      LEFT JOIN users u ON vc.created_by = u.id
      WHERE vc.vendor_id = $1;
    `;

    const result = await db.query(query, [vendorId]);
    return result.rows[0];
  }

  /**
   * Obtenir toutes les commissions avec infos vendeurs
   */
  async getAllCommissionsWithVendorInfo() {
    const query = `
      SELECT 
        u.id as vendorId,
        u.firstName,
        u.lastName,
        u.email,
        u.vendeur_type,
        COALESCE(vc.commission_rate, 40.00) as commissionRate,
        vc.updated_at as lastUpdated,
        -- Calcul du revenu estimé (exemple basé sur les ventes du mois)
        COALESCE(
          (SELECT SUM(amount) FROM sales s WHERE s.vendor_id = u.id AND s.created_at > CURRENT_DATE - INTERVAL '30 days'),
          0
        ) as estimatedMonthlyRevenue
      FROM users u
      LEFT JOIN vendor_commissions vc ON u.id = vc.vendor_id
      WHERE u.role = 'VENDEUR'
      ORDER BY u.firstName, u.lastName;
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Obtenir un vendeur par ID
   */
  async getVendorById(vendorId) {
    const query = `
      SELECT 
        u.*,
        COALESCE(vc.commission_rate, 40.00) as commissionRate
      FROM users u
      LEFT JOIN vendor_commissions vc ON u.id = vc.vendor_id
      WHERE u.id = $1 AND u.role = 'VENDEUR';
    `;

    const result = await db.query(query, [vendorId]);
    return result.rows[0];
  }

  /**
   * Logger les changements de commission pour audit
   */
  async logCommissionChange({ vendorId, oldRate, newRate, adminId, timestamp }) {
    const query = `
      INSERT INTO commission_audit_log (
        vendor_id, old_rate, new_rate, changed_by, changed_at
      ) VALUES ($1, $2, $3, $4, $5);
    `;

    await db.query(query, [vendorId, oldRate, newRate, adminId, timestamp]);
  }
}

module.exports = new CommissionService();
```

### 3. Utilitaires de Validation

```javascript
// utils/commissionUtils.js

/**
 * Valider un taux de commission
 */
function validateCommissionRate(rate) {
  if (typeof rate !== 'number') {
    return false;
  }
  
  return rate >= 0 && rate <= 100 && !isNaN(rate);
}

/**
 * Calculer la répartition des revenus
 */
function calculateRevenueSplit(totalAmount, commissionRate) {
  const commission = (totalAmount * commissionRate) / 100;
  const vendorRevenue = totalAmount - commission;
  
  return {
    totalAmount,
    commissionRate,
    commissionAmount: Math.round(commission),
    vendorRevenue: Math.round(vendorRevenue)
  };
}

/**
 * Formater un montant en FCFA
 */
function formatCFA(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

module.exports = {
  validateCommissionRate,
  calculateRevenueSplit,
  formatCFA
};
```

### 4. Routes

```javascript
// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');
const { requireAdmin } = require('../middleware/auth');

// Routes de gestion des commissions
router.put('/vendors/:vendorId/commission', requireAdmin, commissionController.updateVendorCommission);
router.get('/vendors/:vendorId/commission', requireAdmin, commissionController.getVendorCommission);
router.get('/vendors/commissions', requireAdmin, commissionController.getAllVendorCommissions);

module.exports = router;
```

---

## 🔐 Sécurité et Permissions

### Middleware d'authentification

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!['ADMIN', 'SUPERADMIN'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
}

module.exports = { requireAdmin };
```

---

## 📊 Tables d'Audit

### Table de logs pour traçabilité

```sql
-- Table pour tracer tous les changements de commission
CREATE TABLE commission_audit_log (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES users(id),
    old_rate DECIMAL(5,2),
    new_rate DECIMAL(5,2) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Informations contextuelles
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_commission_audit_vendor ON commission_audit_log(vendor_id);
CREATE INDEX idx_commission_audit_admin ON commission_audit_log(changed_by);
CREATE INDEX idx_commission_audit_date ON commission_audit_log(changed_at);
```

---

## 🧪 Tests

### Tests unitaires avec Jest

```javascript
// tests/commission.test.js
const CommissionService = require('../services/commissionService');
const { validateCommissionRate, calculateRevenueSplit } = require('../utils/commissionUtils');

describe('Commission System', () => {
  
  describe('validateCommissionRate', () => {
    test('should accept valid rates', () => {
      expect(validateCommissionRate(0)).toBe(true);
      expect(validateCommissionRate(50.5)).toBe(true);
      expect(validateCommissionRate(100)).toBe(true);
    });

    test('should reject invalid rates', () => {
      expect(validateCommissionRate(-1)).toBe(false);
      expect(validateCommissionRate(101)).toBe(false);
      expect(validateCommissionRate('invalid')).toBe(false);
      expect(validateCommissionRate(NaN)).toBe(false);
    });
  });

  describe('calculateRevenueSplit', () => {
    test('should calculate correct split', () => {
      const result = calculateRevenueSplit(50000, 40);
      
      expect(result.totalAmount).toBe(50000);
      expect(result.commissionRate).toBe(40);
      expect(result.commissionAmount).toBe(20000);
      expect(result.vendorRevenue).toBe(30000);
    });

    test('should handle 0% commission', () => {
      const result = calculateRevenueSplit(50000, 0);
      
      expect(result.commissionAmount).toBe(0);
      expect(result.vendorRevenue).toBe(50000);
    });

    test('should handle 100% commission', () => {
      const result = calculateRevenueSplit(50000, 100);
      
      expect(result.commissionAmount).toBe(50000);
      expect(result.vendorRevenue).toBe(0);
    });
  });
});
```

---

## 🚀 Déploiement

### Variables d'environnement

```env
# .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printalma
DB_USER=printalma_user
DB_PASSWORD=secure_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Commission par défaut pour nouveaux vendeurs
DEFAULT_COMMISSION_RATE=40.00

# Logs d'audit
AUDIT_LOG_ENABLED=true
```

### Migration de base de données

```javascript
// migrations/001_create_commission_tables.js
exports.up = function(knex) {
  return knex.schema
    .createTable('vendor_commissions', table => {
      table.increments('id');
      table.integer('vendor_id').unsigned().notNullable().references('id').inTable('users');
      table.decimal('commission_rate', 5, 2).notNullable().defaultTo(40.00);
      table.integer('created_by').unsigned().references('id').inTable('users');
      table.timestamps(true, true);
      
      table.unique('vendor_id');
      table.check('commission_rate >= 0 AND commission_rate <= 100');
    })
    .createTable('commission_audit_log', table => {
      table.increments('id');
      table.integer('vendor_id').unsigned().notNullable().references('id').inTable('users');
      table.decimal('old_rate', 5, 2);
      table.decimal('new_rate', 5, 2).notNullable();
      table.integer('changed_by').unsigned().notNullable().references('id').inTable('users');
      table.timestamp('changed_at').defaultTo(knex.fn.now());
      table.string('ip_address');
      table.text('user_agent');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('commission_audit_log')
    .dropTable('vendor_commissions');
};
```

---

## 📈 Monitoring et Analytics

### Endpoint de statistiques

```javascript
// Statistiques des commissions
router.get('/commission-stats', requireAdmin, async (req, res) => {
  const stats = await db.query(`
    SELECT 
      AVG(commission_rate) as average_commission,
      MIN(commission_rate) as min_commission,
      MAX(commission_rate) as max_commission,
      COUNT(*) as total_vendors,
      COUNT(CASE WHEN commission_rate = 0 THEN 1 END) as free_vendors,
      COUNT(CASE WHEN commission_rate > 50 THEN 1 END) as high_commission_vendors
    FROM vendor_commissions vc
    JOIN users u ON vc.vendor_id = u.id
    WHERE u.role = 'VENDEUR'
  `);

  res.json({
    success: true,
    data: stats.rows[0]
  });
});
```

---

## ✅ Checklist d'Implémentation

### Phase 1: Base de données
- [ ] Créer la table `vendor_commissions`
- [ ] Créer la table `commission_audit_log`
- [ ] Ajouter les index nécessaires
- [ ] Tester les contraintes de validation

### Phase 2: API
- [ ] Implémenter les endpoints CRUD
- [ ] Ajouter la validation des données
- [ ] Implémenter les permissions admin
- [ ] Tester tous les endpoints

### Phase 3: Intégration Frontend
- [ ] Connecter le callback `onUpdateCommission`
- [ ] Tester la mise à jour en temps réel
- [ ] Gérer les erreurs utilisateur
- [ ] Optimiser les performances

### Phase 4: Sécurité
- [ ] Audit des permissions
- [ ] Logs de traçabilité
- [ ] Tests de sécurité
- [ ] Documentation des endpoints

### Phase 5: Déploiement
- [ ] Tests en environnement de staging
- [ ] Migration de données existantes
- [ ] Monitoring de performance
- [ ] Formation équipe support

---

## 🆘 Support et Maintenance

### Problèmes courants

1. **Commission non mise à jour**
   - Vérifier les permissions admin
   - Contrôler les logs de la base de données
   - Valider le format des données

2. **Performance lente**
   - Optimiser les requêtes avec EXPLAIN
   - Vérifier les index de la base
   - Implémenter du cache Redis si nécessaire

3. **Erreurs de validation**
   - Contrôler les contraintes de base
   - Vérifier la validation côté serveur
   - Tester les cas limites (0%, 100%)

### Contacts
- **Tech Lead**: [email@printalma.com]
- **DevOps**: [devops@printalma.com]
- **Documentation**: [docs@printalma.com]

---

*Guide généré pour PrintAlma Commission System v1.0*