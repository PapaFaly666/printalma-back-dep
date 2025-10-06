import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Décorateur pour spécifier les permissions requises pour accéder à un endpoint
 *
 * @example
 * @RequirePermissions('users.view', 'users.create')
 * @Get()
 * async findAll() { ... }
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
