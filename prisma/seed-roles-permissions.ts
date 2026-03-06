/**
 * Script d'initialisation des rôles et permissions
 * Ce script crée les CustomRoles et Permissions pour le système de gestion des utilisateurs admin
 */

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Définition des permissions par module
const PERMISSIONS_CONFIG = {
  products: {
    mockups: [
      { key: 'products.mockups.view', name: 'Voir les mockups', description: 'Peut voir la liste des mockups' },
      { key: 'products.mockups.create', name: 'Créer des mockups', description: 'Peut créer de nouveaux mockups' },
      { key: 'products.mockups.edit', name: 'Modifier les mockups', description: 'Peut modifier les mockups existants' },
      { key: 'products.mockups.delete', name: 'Supprimer les mockups', description: 'Peut supprimer des mockups' },
    ],
    categories: [
      { key: 'products.categories.view', name: 'Voir les catégories', description: 'Peut voir les catégories' },
      { key: 'products.categories.manage', name: 'Gérer les catégories', description: 'Peut créer/modifier/supprimer des catégories' },
    ],
    themes: [
      { key: 'products.themes.view', name: 'Voir les thèmes', description: 'Peut voir les thèmes' },
      { key: 'products.themes.manage', name: 'Gérer les thèmes', description: 'Peut créer/modifier/supprimer des thèmes' },
    ],
    stock: [
      { key: 'products.stock.view', name: 'Voir le stock', description: 'Peut consulter les niveaux de stock' },
      { key: 'products.stock.manage', name: 'Gérer le stock', description: 'Peut modifier les quantités en stock' },
    ],
  },
  validation: {
    designs: [
      { key: 'validation.designs.view', name: 'Voir les designs en attente', description: 'Peut voir les designs à valider' },
      { key: 'validation.designs.validate', name: 'Valider les designs', description: 'Peut valider/rejeter des designs' },
    ],
    autovalidation: [
      { key: 'validation.auto.manage', name: 'Gérer l\'auto-validation', description: 'Peut configurer l\'auto-validation' },
    ],
  },
  orders: {
    management: [
      { key: 'orders.view', name: 'Voir les commandes', description: 'Peut voir les commandes' },
      { key: 'orders.manage', name: 'Gérer les commandes', description: 'Peut modifier le statut des commandes' },
    ],
    delivery: [
      { key: 'orders.delivery.view', name: 'Voir la livraison', description: 'Peut voir les informations de livraison' },
      { key: 'orders.delivery.manage', name: 'Gérer la livraison', description: 'Peut gérer les zones et options de livraison' },
    ],
  },
  users: {
    admins: [
      { key: 'users.admins.view', name: 'Voir les admins', description: 'Peut voir la liste des administrateurs' },
      { key: 'users.admins.create', name: 'Créer des utilisateurs', description: 'Peut créer de nouveaux utilisateurs admin' },
      { key: 'users.admins.edit', name: 'Modifier les utilisateurs', description: 'Peut modifier les utilisateurs' },
      { key: 'users.admins.delete', name: 'Supprimer les utilisateurs', description: 'Peut supprimer des utilisateurs' },
      { key: 'users.admins.roles', name: 'Gérer les rôles', description: 'Peut modifier les rôles des utilisateurs' },
    ],
    vendors: [
      { key: 'users.vendors.view', name: 'Voir les vendeurs', description: 'Peut voir la liste des vendeurs' },
      { key: 'users.vendors.manage', name: 'Gérer les vendeurs', description: 'Peut activer/désactiver des vendeurs' },
    ],
  },
  content: {
    management: [
      { key: 'content.view', name: 'Voir le contenu', description: 'Peut voir le contenu du site' },
      { key: 'content.manage', name: 'Gérer le contenu', description: 'Peut modifier le contenu du site' },
    ],
  },
  statistics: {
    analytics: [
      { key: 'statistics.view', name: 'Voir les statistiques', description: 'Peut consulter les analytics' },
    ],
  },
  payments: {
    requests: [
      { key: 'payments.requests.view', name: 'Voir les demandes de paiement', description: 'Peut voir les demandes de paiement' },
      { key: 'payments.requests.process', name: 'Traiter les paiements', description: 'Peut approuver/rejeter les demandes' },
    ],
    methods: [
      { key: 'payments.methods.view', name: 'Voir les moyens de paiement', description: 'Peut voir les moyens de paiement' },
      { key: 'payments.methods.manage', name: 'Gérer les moyens de paiement', description: 'Peut gérer les moyens de paiement' },
    ],
  },
  settings: {
    general: [
      { key: 'settings.view', name: 'Voir les paramètres', description: 'Peut voir les paramètres système' },
      { key: 'settings.manage', name: 'Modifier les paramètres', description: 'Peut modifier les paramètres système' },
    ],
  },
  trash: {
    management: [
      { key: 'trash.view', name: 'Voir la corbeille', description: 'Peut voir les éléments supprimés' },
      { key: 'trash.restore', name: 'Restaurer depuis la corbeille', description: 'Peut restaurer des éléments' },
      { key: 'trash.delete', name: 'Supprimer définitivement', description: 'Peut supprimer définitivement des éléments' },
    ],
  },
};

// Définition des rôles personnalisés et leurs permissions
const CUSTOM_ROLES_CONFIG = [
  {
    name: 'Super Administrateur',
    slug: 'superadmin',
    role: Role.SUPERADMIN,
    description: 'Accès total au système',
    isSystem: true,
    permissions: '*', // Toutes les permissions
  },
  {
    name: 'Administrateur',
    slug: 'admin',
    role: Role.ADMIN,
    description: 'Gestionnaire complet du système',
    isSystem: true,
    permissions: [
      // Produits
      'products.mockups.view',
      'products.mockups.create',
      'products.mockups.edit',
      'products.mockups.delete',
      'products.categories.view',
      'products.categories.manage',
      'products.themes.view',
      'products.themes.manage',
      'products.stock.view',
      'products.stock.manage',
      // Validation
      'validation.designs.view',
      'validation.designs.validate',
      'validation.auto.manage',
      // Commandes
      'orders.view',
      'orders.manage',
      'orders.delivery.view',
      'orders.delivery.manage',
      // Utilisateurs
      'users.admins.view',
      'users.vendors.view',
      'users.vendors.manage',
      // Contenu
      'content.view',
      'content.manage',
      // Statistiques
      'statistics.view',
      // Paiements
      'payments.requests.view',
      'payments.requests.process',
      'payments.methods.view',
      'payments.methods.manage',
      // Paramètres
      'settings.view',
      'settings.manage',
      // Corbeille
      'trash.view',
      'trash.restore',
      'trash.delete',
    ],
  },
  {
    name: 'Modérateur',
    slug: 'moderateur',
    role: Role.MODERATEUR,
    description: 'Gestion des validations et du contenu',
    isSystem: true,
    permissions: [
      // Produits (lecture seule sauf catégories/thèmes)
      'products.mockups.view',
      'products.categories.view',
      'products.categories.manage',
      'products.themes.view',
      'products.themes.manage',
      // Validation (accès complet)
      'validation.designs.view',
      'validation.designs.validate',
      'validation.auto.manage',
      // Commandes (lecture seule)
      'orders.view',
      // Utilisateurs (lecture seule vendeurs)
      'users.vendors.view',
      // Contenu (accès complet)
      'content.view',
      'content.manage',
      // Corbeille (lecture + restauration)
      'trash.view',
      'trash.restore',
    ],
  },
  {
    name: 'Support Client',
    slug: 'support',
    role: Role.SUPPORT,
    description: 'Support client et gestion des commandes',
    isSystem: true,
    permissions: [
      // Produits (lecture seule)
      'products.mockups.view',
      // Commandes (accès complet)
      'orders.view',
      'orders.manage',
      'orders.delivery.view',
      'orders.delivery.manage',
      // Utilisateurs (lecture seule)
      'users.vendors.view',
    ],
  },
  {
    name: 'Comptable',
    slug: 'comptable',
    role: Role.COMPTABLE,
    description: 'Gestion financière et paiements',
    isSystem: true,
    permissions: [
      // Commandes (lecture seule)
      'orders.view',
      // Utilisateurs (lecture seule)
      'users.vendors.view',
      // Statistiques
      'statistics.view',
      // Paiements (accès complet)
      'payments.requests.view',
      'payments.requests.process',
      'payments.methods.view',
    ],
  },
];

async function createPermissions() {
  console.log('🔄 Création des permissions...');

  const allPermissions: any[] = [];
  for (const [module, categories] of Object.entries(PERMISSIONS_CONFIG)) {
    for (const [category, permissions] of Object.entries(categories)) {
      for (const permission of permissions) {
        allPermissions.push({
          ...permission,
          module,
        });
      }
    }
  }

  for (const permData of allPermissions) {
    await prisma.permission.upsert({
      where: { key: permData.key },
      update: {
        name: permData.name,
        description: permData.description,
        module: permData.module,
      },
      create: permData,
    });
  }

  console.log(`✅ ${allPermissions.length} permissions créées/mises à jour`);
  return allPermissions;
}

async function createCustomRoles(allPermissions: any[]) {
  console.log('🔄 Création des rôles personnalisés...');

  for (const roleConfig of CUSTOM_ROLES_CONFIG) {
    // Créer ou mettre à jour le rôle
    const customRole = await prisma.customRole.upsert({
      where: { slug: roleConfig.slug },
      update: {
        name: roleConfig.name,
        description: roleConfig.description,
        isSystem: roleConfig.isSystem,
      },
      create: {
        name: roleConfig.name,
        slug: roleConfig.slug,
        description: roleConfig.description,
        isSystem: roleConfig.isSystem,
      },
    });

    console.log(`✅ Rôle créé/mis à jour: ${roleConfig.name}`);

    // Supprimer les permissions existantes pour ce rôle
    await prisma.rolePermission.deleteMany({
      where: { roleId: customRole.id },
    });

    // Ajouter les permissions
    if (roleConfig.permissions === '*') {
      // Toutes les permissions pour SUPERADMIN
      const allPerms = await prisma.permission.findMany();
      for (const perm of allPerms) {
        await prisma.rolePermission.create({
          data: {
            roleId: customRole.id,
            permissionId: perm.id,
          },
        });
      }
      console.log(`   ✅ ${allPerms.length} permissions attribuées (toutes)`);
    } else {
      // Permissions spécifiques
      for (const permKey of roleConfig.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { key: permKey },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: customRole.id,
              permissionId: permission.id,
            },
          });
        } else {
          console.warn(`   ⚠️  Permission introuvable: ${permKey}`);
        }
      }
      console.log(`   ✅ ${roleConfig.permissions.length} permissions attribuées`);
    }
  }

  console.log(`✅ ${CUSTOM_ROLES_CONFIG.length} rôles configurés`);
}

async function main() {
  console.log('🚀 Initialisation du système de rôles et permissions...\n');

  try {
    // Créer toutes les permissions
    const allPermissions = await createPermissions();

    // Créer les rôles personnalisés avec leurs permissions
    await createCustomRoles(allPermissions);

    console.log('\n✅ Initialisation terminée avec succès!');
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
