import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  Logger,
  Render,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaydunyaService } from '../paydunya/paydunya.service';
import { ConfigService } from '@nestjs/config';

/**
 * Payment Redirection Controller
 * Handles payment success/cancel redirects from PayDunya
 */
@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paydunyaService: PaydunyaService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Payment success redirect page
   * Public endpoint - no authentication required
   */
  @Get('success')
  @ApiOperation({ summary: 'Payment success redirect page' })
  @ApiResponse({ status: 200, description: 'Payment success page displayed' })
  async paymentSuccess(
    @Query('token') token: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`Payment success redirect with token: ${token}`);

      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).send(`
          <html>
            <head><title>Erreur de Paiement</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
              <h1 style="color: #e74c3c;">❌ Erreur de Paiement</h1>
              <p>Token de paiement manquant.</p>
              <a href="${this.configService.get('FRONTEND_URL')}/">Retour à l'accueil</a>
            </body>
          </html>
        `);
      }

      // Vérifier le statut du paiement
      const paymentStatus = await this.paydunyaService.confirmPayment(token);

      // Page HTML de succès
      const successPage = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Paiement Réussi</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success-icon { font-size: 60px; color: #27ae60; margin-bottom: 20px; }
            h1 { color: #27ae60; margin-bottom: 20px; }
            p { color: #555; line-height: 1.6; margin-bottom: 15px; }
            .btn { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px; }
            .btn:hover { background: #2980b9; }
            .status { background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Paiement Réussi !</h1>
            <p>Votre paiement a été traité avec succès.</p>

            <div class="status">
              <strong>Statut:</strong> ${paymentStatus.status || 'Completed'}<br>
              <strong>Token:</strong> ${token}<br>
              <strong>Montant:</strong> ${paymentStatus.total_amount || 'N/A'} FCFA
            </div>

            <p>Vous allez recevoir une confirmation par email.</p>
            <p>Votre commande sera traitée dans les plus brefs délais.</p>

            <a href="${this.configService.get('FRONTEND_URL')}/orders" class="btn">Voir mes commandes</a>
            <a href="${this.configService.get('FRONTEND_URL')}/" class="btn">Retour à l'accueil</a>
          </div>

          <script>
            // Auto-redirect after 5 seconds
            setTimeout(() => {
              window.location.href = '${this.configService.get('FRONTEND_URL')}/orders';
            }, 5000);
          </script>
        </body>
        </html>
      `;

      return res.send(successPage);

    } catch (error) {
      this.logger.error(`Payment success page error: ${error.message}`, error.stack);

      const errorPage = `
        <html>
        <head><title>Erreur de Paiement</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #e74c3c;">❌ Erreur de Paiement</h1>
          <p>Une erreur est survenue lors de la vérification du paiement.</p>
          <p>Token: ${token || 'N/A'}</p>
          <a href="${this.configService.get('FRONTEND_URL')}/orders" class="btn">Voir mes commandes</a>
          <a href="${this.configService.get('FRONTEND_URL')}/" class="btn">Retour à l'accueil</a>
        </body>
        </html>
      `;

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errorPage);
    }
  }

  /**
   * Payment cancel redirect page
   * Public endpoint - no authentication required
   */
  @Get('cancel')
  @ApiOperation({ summary: 'Payment cancel redirect page' })
  @ApiResponse({ status: 200, description: 'Payment cancel page displayed' })
  async paymentCancel(
    @Query('token') token: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`Payment cancel redirect with token: ${token}`);

      // Page HTML d'annulation
      const cancelPage = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Paiement Annulé</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .cancel-icon { font-size: 60px; color: #e67e22; margin-bottom: 20px; }
            h1 { color: #e67e22; margin-bottom: 20px; }
            p { color: #555; line-height: 1.6; margin-bottom: 15px; }
            .btn { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px; }
            .btn:hover { background: #2980b9; }
            .btn-primary { background: #27ae60; }
            .btn-primary:hover { background: #219a52; }
            .status { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="cancel-icon">⚠️</div>
            <h1>Paiement Annulé</h1>
            <p>Vous avez annulé le processus de paiement.</p>

            <div class="status">
              <strong>Statut:</strong> Annulé<br>
              <strong>Token:</strong> ${token || 'N/A'}
            </div>

            <p>Aucun montant n'a été débité de votre compte.</p>
            <p>Vous pouvez réessayer le paiement à tout moment.</p>

            <a href="${this.configService.get('FRONTEND_URL')}/checkout" class="btn btn-primary">Réessayer le paiement</a>
            <a href="${this.configService.get('FRONTEND_URL')}/orders" class="btn">Voir mes commandes</a>
            <a href="${this.configService.get('FRONTEND_URL')}/" class="btn">Retour à l'accueil</a>
          </div>
        </body>
        </html>
      `;

      return res.send(cancelPage);

    } catch (error) {
      this.logger.error(`Payment cancel page error: ${error.message}`, error.stack);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`
        <html>
        <head><title>Erreur</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #e74c3c;">❌ Erreur</h1>
          <p>Une erreur est survenue.</p>
          <a href="${this.configService.get('FRONTEND_URL')}/">Retour à l'accueil</a>
        </body>
        </html>
      `);
    }
  }
}