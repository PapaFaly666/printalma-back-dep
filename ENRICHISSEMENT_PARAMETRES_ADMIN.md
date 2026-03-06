# Guide d'enrichissement des Paramètres Administrateur

Ce document propose des idées pour enrichir la page `/admin/settings` du frontend en se basant sur les fonctionnalités existantes dans le backend PrintAlma.

---

## 📊 Paramètres existants dans les apps

### 1. **Configuration des Paiements** (`/admin/payment-config`)

Le backend dispose déjà d'un système complet de gestion des configurations de paiement.

**Endpoints disponibles :**
- `GET /admin/payment-config` - Liste toutes les configurations
- `GET /admin/payment-config/:provider` - Configuration d'un provider spécifique
- `PATCH /admin/payment-config/:provider` - Mettre à jour une configuration
- `POST /admin/payment-config/switch` - Basculer entre TEST et LIVE
- `POST /admin/payment-config/cash-on-delivery/toggle` - Activer/désactiver le paiement à la livraison

**Providers disponibles :**
- PayTech
- PayDunya
- Orange Money
- Cash on Delivery (Paiement à la livraison)

**Suggestion pour `/admin/settings` :**
Ajouter une section "Méthodes de paiement" qui permet de :
- Voir toutes les méthodes de paiement disponibles
- Activer/Désactiver chaque méthode
- Basculer entre mode TEST et LIVE
- Configurer les clés API pour chaque provider
- Gérer le paiement à la livraison

---

### 2. **Gestion des Rôles et Permissions** (`/admin/roles`)

Le système dispose d'un RBAC (Role-Based Access Control) complet avec rôles personnalisables.

**Tables existantes :**
- `CustomRole` : Rôles personnalisés
- `Permission` : Permissions granulaires
- `RolePermission` : Association rôles-permissions

**Rôles système :**
- SUPERADMIN
- ADMIN
- VENDEUR

**Suggestion pour `/admin/settings` :**
Ajouter une section "Rôles & Permissions" qui permet de :
- Créer/Modifier/Supprimer des rôles personnalisés
- Assigner des permissions spécifiques à chaque rôle
- Voir la liste des utilisateurs par rôle
- Gérer les permissions par module (users, products, orders, designs, etc.)

**Modules de permissions possibles :**
- `users` : Gestion des utilisateurs
- `products` : Gestion des produits
- `orders` : Gestion des commandes
- `designs` : Gestion des designs
- `payments` : Gestion des paiements
- `vendors` : Gestion des vendeurs
- `settings` : Accès aux paramètres

---

### 3. **Configuration des Commissions Vendeurs**

Le système dispose d'un module de gestion des commissions vendeurs.

**Tables existantes :**
- `VendorCommission` : Commission par vendeur
- `CommissionAuditLog` : Historique des changements

**Fonctionnalités :**
- Commission par défaut : 40%
- Commission personnalisée par vendeur
- Historique des modifications (traçabilité)

**Suggestion pour `/admin/settings` :**
Ajouter une section "Commissions" qui permet de :
- Définir la commission par défaut pour tous les nouveaux vendeurs
- Voir l'historique des modifications de commission
- Gérer les taux de commission par catégorie de vendeur (Designer, Influenceur, Artiste)

---

### 4. **Paramètres de Livraison**

Le système dispose d'un module complet de gestion des livraisons.

**Tables existantes :**
- `DeliveryCity` : Villes de Dakar et Banlieue
- `DeliveryRegion` : 13 régions du Sénégal
- `DeliveryInternationalZone` : Zones internationales
- `DeliveryTransporteur` : Transporteurs
- `DeliveryZoneTarif` : Tarifs par zone et transporteur

**Suggestion pour `/admin/settings` :**
Ajouter une section "Livraison" qui permet de :
- Gérer les zones de livraison (Dakar, Régions, International)
- Configurer les tarifs de livraison par zone
- Gérer les transporteurs partenaires
- Activer/Désactiver certaines zones
- Définir les délais de livraison par zone

---

### 5. **Gestion des Types de Vendeurs**

Le système dispose de types de vendeurs personnalisables.

**Types par défaut :**
- DESIGNER
- INFLUENCEUR
- ARTISTE

**Table existante :**
- `VendorType` : Types personnalisables

**Suggestion pour `/admin/settings` :**
Ajouter une section "Types de vendeurs" qui permet de :
- Créer/Modifier/Supprimer des types de vendeurs
- Assigner des commissions spécifiques par type
- Définir des règles de validation différentes par type

---

### 6. **Configuration Email**

Le système utilise un service d'email complet.

**Service existant :**
- `MailService` : Envoi d'emails transactionnels

**Emails envoyés :**
- Code d'activation vendeur
- Mot de passe temporaire
- Notifications de commande
- Confirmation de paiement
- Réinitialisation de mot de passe
- OTP pour 2FA

**Suggestion pour `/admin/settings` :**
Ajouter une section "Email" qui permet de :
- Configurer les paramètres SMTP
- Personnaliser les templates d'email
- Activer/Désactiver certains types d'emails
- Tester l'envoi d'email
- Voir l'historique des emails envoyés

---

### 7. **Gestion du Contenu de la Page d'Accueil**

Le système dispose d'un module de gestion du contenu homepage.

**Table existante :**
- `HomeContent` : 3 sections (Designs, Influenceurs, Merchandising)

**Suggestion pour `/admin/settings` :**
Ajouter une section "Page d'accueil" qui permet de :
- Gérer les 3 sections de contenu
- Uploader/Modifier les images des sections
- Définir l'ordre d'affichage
- Activer/Désactiver des sections

---

### 8. **Configuration Cloudinary**

Le système utilise Cloudinary pour le stockage d'images.

**Service existant :**
- `CloudinaryService` : Upload et gestion des images

**Suggestion pour `/admin/settings` :**
Ajouter une section "Médias" qui permet de :
- Voir les statistiques d'utilisation Cloudinary
- Configurer les paramètres de transformation d'images
- Gérer les dossiers Cloudinary
- Optimisation automatique des images

---

### 9. **Système de Notifications**

Le système dispose d'un module de notifications.

**Table existante :**
- `Notification` : Notifications utilisateurs

**Types de notifications :**
- ORDER_NEW
- ORDER_UPDATED
- SYSTEM
- SUCCESS
- WARNING
- ERROR

**Suggestion pour `/admin/settings` :**
Ajouter une section "Notifications" qui permet de :
- Configurer quels types de notifications envoyer
- Définir les règles d'expiration des notifications
- Gérer les notifications système
- Envoyer des notifications broadcast à tous les utilisateurs

---

### 10. **Logs d'Audit et Sécurité**

Le système dispose de plusieurs tables de logs.

**Tables existantes :**
- `AuditLog` : Traçabilité des actions
- `CommissionAuditLog` : Changements de commission
- `SecurityLog` : Logs de sécurité
- `PaymentAttempt` : Tentatives de paiement

**Suggestion pour `/admin/settings` :**
Ajouter une section "Logs & Sécurité" qui permet de :
- Voir les logs d'audit récents
- Filtrer les logs par type d'action
- Voir les tentatives de connexion échouées
- Exporter les logs pour analyse
- Configurer la rétention des logs

---

### 11. **Paramètres de Validation**

Le système a plusieurs flux de validation :
- Validation des designs
- Validation des produits vendeurs
- Validation des vendeurs

**Suggestion pour `/admin/settings` :**
Ajouter une section "Workflow de validation" qui permet de :
- Activer/Désactiver la validation automatique
- Définir qui peut valider (rôles spécifiques)
- Configurer les notifications de validation
- Gérer les règles de rejet

---

### 12. **Statistiques et Analytics**

Le système collecte déjà des statistiques :
- Nombre de vues par produit/design
- Nombre de commandes
- Chiffre d'affaires
- Taux de conversion

**Suggestion pour `/admin/settings` :**
Ajouter une section "Analytics" qui permet de :
- Voir les KPIs principaux
- Configurer les objectifs de vente
- Exporter les statistiques
- Configurer les rapports automatiques

---

## 🎨 Proposition d'architecture pour `/admin/settings`

### Structure de navigation recommandée :

```
/admin/settings
├── /general              (Paramètres généraux)
│   ├── App Info          (Nom, logo, contact)
│   ├── Maintenance Mode  (Activer/Désactiver)
│   └── Localization      (Langue, devise, fuseau horaire)
│
├── /account              (Compte admin)
│   ├── Profile           (Infos personnelles)
│   ├── Change Password   (Changement mot de passe)
│   └── Security          (2FA, sessions actives)
│
├── /users                (Gestion utilisateurs)
│   ├── Roles             (Rôles personnalisés)
│   ├── Permissions       (Permissions granulaires)
│   └── Vendor Types      (Types de vendeurs)
│
├── /payments             (Configuration paiements)
│   ├── Payment Methods   (Méthodes de paiement)
│   ├── Providers Config  (PayTech, Orange Money, etc.)
│   └── Cash on Delivery  (Paiement à la livraison)
│
├── /commissions          (Commissions vendeurs)
│   ├── Default Rate      (Taux par défaut)
│   ├── By Vendor Type    (Taux par type)
│   └── History           (Historique des changements)
│
├── /delivery             (Paramètres livraison)
│   ├── Zones             (Zones de livraison)
│   ├── Carriers          (Transporteurs)
│   └── Rates             (Tarifs par zone)
│
├── /content              (Gestion du contenu)
│   ├── Homepage          (Sections page d'accueil)
│   ├── Categories        (Catégories de produits)
│   └── Design Categories (Catégories de designs)
│
├── /notifications        (Notifications)
│   ├── Email Settings    (Config SMTP)
│   ├── Templates         (Templates d'emails)
│   └── Preferences       (Types de notifications)
│
├── /media                (Gestion médias)
│   ├── Cloudinary        (Config Cloudinary)
│   ├── Storage           (Statistiques stockage)
│   └── Optimization      (Paramètres d'optimisation)
│
├── /security             (Sécurité)
│   ├── Audit Logs        (Logs d'audit)
│   ├── Failed Logins     (Tentatives échouées)
│   └── Security Policies (Politiques de sécurité)
│
└── /advanced             (Paramètres avancés)
    ├── API Keys          (Clés API externes)
    ├── Webhooks          (Configuration webhooks)
    └── Integrations      (Intégrations tierces)
```

---

## 🚀 Priorisation des fonctionnalités

### Phase 1 - Essentiels (MVP)
✅ Changement de mot de passe admin
✅ Statistiques dashboard
✅ Profil admin
- Configuration des méthodes de paiement
- Paramètres généraux de l'app

### Phase 2 - Important
- Gestion des rôles et permissions
- Configuration des commissions
- Paramètres de livraison
- Types de vendeurs

### Phase 3 - Avancé
- Configuration email
- Gestion du contenu homepage
- Logs d'audit et sécurité
- Notifications

### Phase 4 - Optimisations
- Analytics avancés
- Médias et Cloudinary
- Webhooks et intégrations
- Workflow de validation

---

## 💡 Bonnes pratiques d'implémentation

### 1. **Validation côté frontend**
- Valider les formulaires avant l'envoi
- Afficher des messages d'erreur clairs
- Utiliser des composants de formulaire réutilisables

### 2. **Feedback utilisateur**
- Toast notifications pour les actions réussies/échouées
- Loading states pendant les requêtes
- Confirmations pour les actions critiques

### 3. **Permissions**
- Vérifier les permissions avant d'afficher les sections
- Désactiver les actions non autorisées
- Afficher des messages explicatifs pour les restrictions

### 4. **Performance**
- Lazy loading des sections
- Cache des données peu modifiées
- Pagination pour les longues listes

### 5. **Accessibilité**
- Labels clairs sur tous les champs
- Navigation au clavier
- Contraste suffisant
- Support des screen readers

---

## 📚 Ressources supplémentaires

### Documentation backend existante :
- `ADMIN_SETTINGS_API.md` : Documentation des endpoints admin settings
- `PAYMENT_METHODS_API_DOCUMENTATION.md` : Documentation des méthodes de paiement
- Swagger UI : `http://localhost:3000/api`

### Modèles de données :
- Voir `prisma/schema.prisma` pour tous les modèles

### Services disponibles :
- `AdminSettingsService` : Gestion des paramètres admin
- `PaymentConfigService` : Configuration des paiements
- `MailService` : Envoi d'emails
- `CloudinaryService` : Gestion des images

---

**Date de création :** 2024-01-15
**Dernière mise à jour :** 2024-01-15
**Version :** 1.0.0
