import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🎯 SYSTÈME RBAC COMPLET - Basé sur les modules réels du backend
 *
 * Modules détectés dans le backend:
 * - Gestion des utilisateurs (users)
 * - Gestion des rôles et permissions (roles)
 * - Gestion des produits/mockups (products)
 * - Gestion des catégories (categories)
 * - Gestion des thèmes (themes)
 * - Gestion des designs (designs)
 * - Gestion des vendeurs (vendors)
 * - Gestion des stocks (stocks)
 * - Validation des designs (design-validation)
 * - Gestion des demandes de fonds (funds)
 * - Gestion des commissions (commissions)
 * - Gestion des commandes (orders)
 * - Autres modules (notifications, colors, sizes, etc.)
 */

async function main() {
  console.log('🚀 Démarrage du seed RBAC complet...\n');

  // ========================================
  // 1️⃣ DÉFINITION DES MODULES ET PERMISSIONS
  // ========================================

  const MODULES_PERMISSIONS = [
    // 👥 Gestion des utilisateurs
    {
      module: 'users',
      label: 'Utilisateurs',
      description: 'Gestion des utilisateurs du système',
      permissions: [
        { key: 'users.view', name: 'Voir les utilisateurs', description: 'Consulter la liste des utilisateurs' },
        { key: 'users.create', name: 'Créer un utilisateur', description: 'Ajouter de nouveaux utilisateurs' },
        { key: 'users.update', name: 'Modifier un utilisateur', description: 'Modifier les informations des utilisateurs' },
        { key: 'users.delete', name: 'Supprimer un utilisateur', description: 'Supprimer des utilisateurs' },
        { key: 'users.manage-roles', name: 'Gérer les rôles utilisateurs', description: 'Attribuer/retirer des rôles' },
        { key: 'users.manage-status', name: 'Gérer le statut', description: 'Activer/désactiver des comptes' },
      ]
    },

    // 🔐 Gestion des rôles et permissions
    {
      module: 'roles',
      label: 'Rôles & Permissions',
      description: 'Gestion des rôles et permissions',
      permissions: [
        { key: 'roles.view', name: 'Voir les rôles', description: 'Consulter la liste des rôles' },
        { key: 'roles.create', name: 'Créer un rôle', description: 'Créer de nouveaux rôles' },
        { key: 'roles.update', name: 'Modifier un rôle', description: 'Modifier les rôles existants' },
        { key: 'roles.delete', name: 'Supprimer un rôle', description: 'Supprimer des rôles' },
        { key: 'roles.manage-permissions', name: 'Gérer les permissions', description: 'Attribuer des permissions aux rôles' },
      ]
    },

    // 🎨 Gestion des produits/mockups
    {
      module: 'products',
      label: 'Produits & Mockups',
      description: 'Gestion des produits et mockups',
      permissions: [
        { key: 'products.view', name: 'Voir les produits', description: 'Consulter la liste des produits' },
        { key: 'products.create', name: 'Créer un produit', description: 'Ajouter de nouveaux produits/mockups' },
        { key: 'products.update', name: 'Modifier un produit', description: 'Modifier les produits existants' },
        { key: 'products.delete', name: 'Supprimer un produit', description: 'Supprimer des produits' },
        { key: 'products.manage-images', name: 'Gérer les images', description: 'Ajouter/supprimer des images de produits' },
        { key: 'products.manage-variants', name: 'Gérer les variantes', description: 'Gérer les couleurs, tailles, etc.' },
      ]
    },

    // 📁 Gestion des catégories
    {
      module: 'categories',
      label: 'Catégories',
      description: 'Gestion des catégories de produits',
      permissions: [
        { key: 'categories.view', name: 'Voir les catégories', description: 'Consulter les catégories' },
        { key: 'categories.create', name: 'Créer une catégorie', description: 'Ajouter de nouvelles catégories' },
        { key: 'categories.update', name: 'Modifier une catégorie', description: 'Modifier les catégories existantes' },
        { key: 'categories.delete', name: 'Supprimer une catégorie', description: 'Supprimer des catégories' },
        { key: 'categories.manage-hierarchy', name: 'Gérer la hiérarchie', description: 'Organiser les catégories parent/enfant' },
      ]
    },

    // 🎭 Gestion des thèmes
    {
      module: 'themes',
      label: 'Thèmes',
      description: 'Gestion des thèmes de designs',
      permissions: [
        { key: 'themes.view', name: 'Voir les thèmes', description: 'Consulter les thèmes' },
        { key: 'themes.create', name: 'Créer un thème', description: 'Ajouter de nouveaux thèmes' },
        { key: 'themes.update', name: 'Modifier un thème', description: 'Modifier les thèmes existants' },
        { key: 'themes.delete', name: 'Supprimer un thème', description: 'Supprimer des thèmes' },
      ]
    },

    // 🖼️ Gestion des designs
    {
      module: 'designs',
      label: 'Designs',
      description: 'Gestion des designs créés par les vendeurs',
      permissions: [
        { key: 'designs.view', name: 'Voir les designs', description: 'Consulter tous les designs' },
        { key: 'designs.view-own', name: 'Voir ses propres designs', description: 'Voir uniquement ses designs' },
        { key: 'designs.create', name: 'Créer un design', description: 'Uploader de nouveaux designs' },
        { key: 'designs.update', name: 'Modifier un design', description: 'Modifier ses designs' },
        { key: 'designs.delete', name: 'Supprimer un design', description: 'Supprimer des designs' },
        { key: 'designs.validate', name: 'Valider les designs', description: 'Valider/rejeter les designs des vendeurs' },
        { key: 'designs.auto-validate', name: 'Auto-validation', description: 'Activer la validation automatique' },
      ]
    },

    // 🛍️ Gestion des vendeurs
    {
      module: 'vendors',
      label: 'Vendeurs',
      description: 'Gestion des vendeurs et leurs produits',
      permissions: [
        { key: 'vendors.view', name: 'Voir les vendeurs', description: 'Consulter la liste des vendeurs' },
        { key: 'vendors.create', name: 'Créer un vendeur', description: 'Ajouter de nouveaux vendeurs' },
        { key: 'vendors.update', name: 'Modifier un vendeur', description: 'Modifier les informations vendeurs' },
        { key: 'vendors.delete', name: 'Supprimer un vendeur', description: 'Supprimer des vendeurs' },
        { key: 'vendors.manage-products', name: 'Gérer les produits vendeurs', description: 'Créer/modifier produits vendeurs' },
        { key: 'vendors.validate-products', name: 'Valider les produits', description: 'Valider les produits des vendeurs' },
        { key: 'vendors.manage-types', name: 'Gérer les types vendeurs', description: 'Créer/modifier types de vendeurs' },
      ]
    },

    // 📦 Gestion des stocks
    {
      module: 'stocks',
      label: 'Stocks',
      description: 'Gestion des stocks et inventaire',
      permissions: [
        { key: 'stocks.view', name: 'Voir les stocks', description: 'Consulter les niveaux de stock' },
        { key: 'stocks.update', name: 'Mettre à jour les stocks', description: 'Modifier les quantités en stock' },
        { key: 'stocks.view-history', name: 'Voir l\'historique', description: 'Consulter les mouvements de stock' },
        { key: 'stocks.manage-alerts', name: 'Gérer les alertes', description: 'Configurer les alertes de stock bas' },
      ]
    },

    // 💰 Gestion des demandes de fonds
    {
      module: 'funds',
      label: 'Demandes de Fonds',
      description: 'Gestion des demandes de retrait des vendeurs',
      permissions: [
        { key: 'funds.view', name: 'Voir les demandes', description: 'Consulter les demandes de fonds' },
        { key: 'funds.view-own', name: 'Voir ses demandes', description: 'Voir uniquement ses propres demandes' },
        { key: 'funds.create', name: 'Créer une demande', description: 'Créer une demande de retrait' },
        { key: 'funds.process', name: 'Traiter les demandes', description: 'Approuver/rejeter les demandes' },
        { key: 'funds.view-stats', name: 'Voir les statistiques', description: 'Consulter les stats de paiements' },
      ]
    },

    // 💵 Gestion des commissions
    {
      module: 'commissions',
      label: 'Commissions',
      description: 'Gestion des commissions vendeurs',
      permissions: [
        { key: 'commissions.view', name: 'Voir les commissions', description: 'Consulter les taux de commission' },
        { key: 'commissions.create', name: 'Créer une commission', description: 'Définir des taux de commission' },
        { key: 'commissions.update', name: 'Modifier une commission', description: 'Changer les taux de commission' },
        { key: 'commissions.delete', name: 'Supprimer une commission', description: 'Supprimer des commissions' },
        { key: 'commissions.view-earnings', name: 'Voir les gains', description: 'Consulter les gains vendeurs' },
      ]
    },

    // 📋 Gestion des commandes
    {
      module: 'orders',
      label: 'Commandes',
      description: 'Gestion des commandes clients',
      permissions: [
        { key: 'orders.view', name: 'Voir les commandes', description: 'Consulter toutes les commandes' },
        { key: 'orders.view-own', name: 'Voir ses commandes', description: 'Voir uniquement ses commandes vendeur' },
        { key: 'orders.update-status', name: 'Modifier le statut', description: 'Changer le statut des commandes' },
        { key: 'orders.validate', name: 'Valider les commandes', description: 'Valider les commandes' },
        { key: 'orders.cancel', name: 'Annuler une commande', description: 'Annuler des commandes' },
        { key: 'orders.view-stats', name: 'Voir les statistiques', description: 'Consulter les stats de ventes' },
      ]
    },

    // 🔔 Autres modules
    {
      module: 'notifications',
      label: 'Notifications',
      description: 'Gestion des notifications système',
      permissions: [
        { key: 'notifications.view', name: 'Voir les notifications', description: 'Consulter les notifications' },
        { key: 'notifications.create', name: 'Créer une notification', description: 'Envoyer des notifications' },
        { key: 'notifications.delete', name: 'Supprimer une notification', description: 'Supprimer des notifications' },
      ]
    },

    // ⚙️ Configuration système
    {
      module: 'system',
      label: 'Système',
      description: 'Configuration et paramètres système',
      permissions: [
        { key: 'system.view-settings', name: 'Voir les paramètres', description: 'Consulter les paramètres système' },
        { key: 'system.update-settings', name: 'Modifier les paramètres', description: 'Modifier la configuration' },
        { key: 'system.view-logs', name: 'Voir les logs', description: 'Consulter les logs système' },
        { key: 'system.manage-cloudinary', name: 'Gérer Cloudinary', description: 'Gérer le stockage des images' },
      ]
    },
  ];

  console.log('📦 Modules à créer:', MODULES_PERMISSIONS.length);

  // ========================================
  // 2️⃣ CRÉATION DES PERMISSIONS
  // ========================================

  console.log('\n🔑 Création des permissions...');
  const createdPermissions: { [key: string]: number } = {};

  for (const moduleData of MODULES_PERMISSIONS) {
    console.log(`\n📂 Module: ${moduleData.label}`);

    for (const perm of moduleData.permissions) {
      const permission = await prisma.permission.upsert({
        where: { key: perm.key },
        update: {
          name: perm.name,
          description: perm.description,
          module: moduleData.module,
        },
        create: {
          key: perm.key,
          name: perm.name,
          description: perm.description,
          module: moduleData.module,
        },
      });

      createdPermissions[perm.key] = permission.id;
      console.log(`   ✅ ${perm.key}`);
    }
  }

  const totalPermissions = Object.keys(createdPermissions).length;
  console.log(`\n✨ Total: ${totalPermissions} permissions créées`);

  // ========================================
  // 3️⃣ CRÉATION DES RÔLES PRÉDÉFINIS
  // ========================================

  console.log('\n\n👥 Création des rôles prédéfinis...\n');

  // 👑 SUPERADMIN - Toutes les permissions
  const superadminRole = await prisma.customRole.upsert({
    where: { slug: 'superadmin' },
    update: {
      name: 'Super Administrateur',
      description: 'Accès complet à toutes les fonctionnalités du système',
    },
    create: {
      name: 'Super Administrateur',
      slug: 'superadmin',
      description: 'Accès complet à toutes les fonctionnalités du système',
    },
  });

  // Attribuer TOUTES les permissions au superadmin
  for (const permKey of Object.keys(createdPermissions)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superadminRole.id,
          permissionId: createdPermissions[permKey],
        },
      },
      update: {},
      create: {
        roleId: superadminRole.id,
        permissionId: createdPermissions[permKey],
      },
    });
  }
  console.log(`👑 Super Administrateur: ${totalPermissions} permissions`);

  // 👤 ADMIN - Gestion complète sauf système
  const adminPermissions = Object.keys(createdPermissions).filter(
    key => !key.startsWith('system.') && !key.startsWith('roles.')
  );

  const adminRole = await prisma.customRole.upsert({
    where: { slug: 'admin' },
    update: {
      name: 'Administrateur',
      description: 'Gestion des utilisateurs, produits, commandes',
    },
    create: {
      name: 'Administrateur',
      slug: 'admin',
      description: 'Gestion des utilisateurs, produits, commandes',
    },
  });

  for (const permKey of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: createdPermissions[permKey],
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: createdPermissions[permKey],
      },
    });
  }
  console.log(`⚡ Administrateur: ${adminPermissions.length} permissions`);

  // 💰 GESTIONNAIRE FINANCIER - Finances et commissions
  const financePermissions = Object.keys(createdPermissions).filter(
    key => key.startsWith('funds.') ||
           key.startsWith('commissions.') ||
           key.startsWith('orders.view') ||
           key.startsWith('vendors.view')
  );

  const financeRole = await prisma.customRole.upsert({
    where: { slug: 'finance' },
    update: {
      name: 'Gestionnaire Financier',
      description: 'Gestion des demandes de fonds et commissions',
    },
    create: {
      name: 'Gestionnaire Financier',
      slug: 'finance',
      description: 'Gestion des demandes de fonds et commissions',
    },
  });

  for (const permKey of financePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: financeRole.id,
          permissionId: createdPermissions[permKey],
        },
      },
      update: {},
      create: {
        roleId: financeRole.id,
        permissionId: createdPermissions[permKey],
      },
    });
  }
  console.log(`💰 Gestionnaire Financier: ${financePermissions.length} permissions`);

  // 🏭 GESTIONNAIRE PRODUCTION - Produits, stocks, catégories
  const productionPermissions = Object.keys(createdPermissions).filter(
    key => key.startsWith('products.') ||
           key.startsWith('stocks.') ||
           key.startsWith('categories.') ||
           key.startsWith('themes.')
  );

  const productionRole = await prisma.customRole.upsert({
    where: { slug: 'production' },
    update: {
      name: 'Gestionnaire Production',
      description: 'Gestion des produits, stocks et catégories',
    },
    create: {
      name: 'Gestionnaire Production',
      slug: 'production',
      description: 'Gestion des produits, stocks et catégories',
    },
  });

  for (const permKey of productionPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: productionRole.id,
          permissionId: createdPermissions[permKey],
        },
      },
      update: {},
      create: {
        roleId: productionRole.id,
        permissionId: createdPermissions[permKey],
      },
    });
  }
  console.log(`🏭 Gestionnaire Production: ${productionPermissions.length} permissions`);

  // 🎨 VALIDATEUR DESIGN - Validation des designs
  const designValidatorPermissions = Object.keys(createdPermissions).filter(
    key => key.startsWith('designs.') ||
           key.startsWith('vendors.view') ||
           key.startsWith('themes.view')
  );

  const designValidatorRole = await prisma.customRole.upsert({
    where: { slug: 'design-validator' },
    update: {
      name: 'Validateur de Designs',
      description: 'Validation et gestion des designs vendeurs',
    },
    create: {
      name: 'Validateur de Designs',
      slug: 'design-validator',
      description: 'Validation et gestion des designs vendeurs',
    },
  });

  for (const permKey of designValidatorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: designValidatorRole.id,
          permissionId: createdPermissions[permKey],
        },
      },
      update: {},
      create: {
        roleId: designValidatorRole.id,
        permissionId: createdPermissions[permKey],
      },
    });
  }
  console.log(`🎨 Validateur de Designs: ${designValidatorPermissions.length} permissions`);

  // 🛍️ VENDEUR - Permissions limitées
  const vendorPermissions = Object.keys(createdPermissions).filter(
    key => key.includes('.view-own') ||
           key.includes('designs.create') ||
           key.includes('designs.update') ||
           key.includes('designs.delete') ||
           key.includes('funds.create') ||
           key.includes('vendors.manage-products') ||
           key.includes('products.view') ||
           key.includes('categories.view') ||
           key.includes('themes.view')
  );

  const vendorRole = await prisma.customRole.upsert({
    where: { slug: 'vendor' },
    update: {
      name: 'Vendeur',
      description: 'Gestion de ses propres designs et produits',
    },
    create: {
      name: 'Vendeur',
      slug: 'vendor',
      description: 'Gestion de ses propres designs et produits',
    },
  });

  for (const permKey of vendorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: vendorRole.id,
          permissionId: createdPermissions[permKey],
        },
      },
      update: {},
      create: {
        roleId: vendorRole.id,
        permissionId: createdPermissions[permKey],
      },
    });
  }
  console.log(`🛍️ Vendeur: ${vendorPermissions.length} permissions`);

  // ========================================
  // 4️⃣ RÉSUMÉ
  // ========================================

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ SEED RBAC COMPLET TERMINÉ');
  console.log('='.repeat(60));
  console.log(`\n📊 Statistiques:`);
  console.log(`   • ${MODULES_PERMISSIONS.length} modules`);
  console.log(`   • ${totalPermissions} permissions`);
  console.log(`   • 6 rôles prédéfinis`);
  console.log('\n🎯 Rôles créés:');
  console.log('   1. Super Administrateur (toutes permissions)');
  console.log('   2. Administrateur (gestion complète)');
  console.log('   3. Gestionnaire Financier (finances + commissions)');
  console.log('   4. Gestionnaire Production (produits + stocks)');
  console.log('   5. Validateur de Designs (validation designs)');
  console.log('   6. Vendeur (gestion limitée)');
  console.log('\n💡 Prochaines étapes:');
  console.log('   1. Le SUPERADMIN peut créer des rôles personnalisés');
  console.log('   2. Le SUPERADMIN peut attribuer des permissions CRUD aux rôles');
  console.log('   3. Le SUPERADMIN peut créer des utilisateurs avec des rôles spécifiques');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
