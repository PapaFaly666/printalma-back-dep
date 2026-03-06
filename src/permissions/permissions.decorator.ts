import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_ANY_PERMISSION_KEY = 'requireAnyPermission';

/**
 * Decorator pour exiger une ou plusieurs permissions
 * Par défaut, l'utilisateur doit avoir TOUTES les permissions listées
 *
 * @example
 * @RequirePermissions('products.mockups.view', 'products.mockups.edit')
 * async updateMockup() { ... }
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator pour exiger AU MOINS UNE des permissions listées
 *
 * @example
 * @RequireAnyPermission('orders.view', 'orders.manage')
 * async getOrders() { ... }
 */
export const RequireAnyPermission = (...permissions: string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(PERMISSIONS_KEY, permissions)(target, propertyKey, descriptor);
    SetMetadata(REQUIRE_ANY_PERMISSION_KEY, true)(target, propertyKey, descriptor);
  };
};
