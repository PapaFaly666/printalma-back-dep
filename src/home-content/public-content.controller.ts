import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HomeContentService } from './home-content.service';

/**
 * Contrôleur public pour le contenu de la page d'accueil
 * Utilisé par le frontend pour afficher les sections
 */
@Controller('public/content')
export class PublicContentController {
  constructor(private readonly homeContentService: HomeContentService) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Récupérer le contenu public de la page d'accueil
   * GET /api/public/content
   *
   * Retourne les 3 sections avec leurs items respectifs:
   * - designs: 6 items
   * - influencers: 5 items
   * - merchandising: 6 items
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getPublicContent() {
    return this.homeContentService.getContent();
  }
}
