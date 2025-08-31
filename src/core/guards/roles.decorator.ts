import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Surcharge pour accepter un tableau ou des arguments multiples
export function Roles(roles: string[]): any;
export function Roles(...roles: string[]): any;
export function Roles(...args: any[]): any {
  const roles = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
  return SetMetadata(ROLES_KEY, roles);
}
