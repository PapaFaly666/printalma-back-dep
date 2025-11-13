import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * OptionalJwtAuthGuard permet d'avoir un endpoint qui fonctionne
 * avec ou sans authentification. Si un token est fourni, il sera validé,
 * sinon la requête continue sans user dans req.user
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Si erreur ou pas d'utilisateur, on continue quand même (pour les guests)
    // On retourne undefined au lieu de lever une exception
    if (err || !user) {
      return null;
    }
    return user;
  }
}
