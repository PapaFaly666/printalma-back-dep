import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentConfigService } from './payment-config.service';
import { CreatePaymentConfigDto, PaymentProvider } from './dto/create-payment-config.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

/**
 * Controller pour la gestion des configurations de paiement (Admin uniquement)
 */
@Controller('admin/payment-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class PaymentConfigController {
  constructor(private readonly paymentConfigService: PaymentConfigService) {}

  /**
   * Crée une nouvelle configuration de paiement
   * POST /admin/payment-config
   */
  @Post()
  create(@Body() createDto: CreatePaymentConfigDto) {
    return this.paymentConfigService.create(createDto);
  }

  /**
   * Récupère toutes les configurations
   * GET /admin/payment-config
   */
  @Get()
  findAll() {
    return this.paymentConfigService.findAll();
  }

  /**
   * Récupère la configuration pour un provider
   * GET /admin/payment-config/:provider
   */
  @Get(':provider')
  findByProvider(@Param('provider') provider: string) {
    return this.paymentConfigService.findByProvider(provider);
  }

  /**
   * Met à jour une configuration
   * PATCH /admin/payment-config/:provider
   */
  @Patch(':provider')
  update(
    @Param('provider') provider: string,
    @Body() updateDto: UpdatePaymentConfigDto,
  ) {
    return this.paymentConfigService.update(provider, updateDto);
  }

  /**
   * Active ou désactive le paiement à la livraison
   * POST /admin/payment-config/cash-on-delivery/toggle
   * Body: { "isActive": true|false }
   */
  @Post('cash-on-delivery/toggle')
  toggleCod(@Body() body: { isActive: boolean }) {
    return this.paymentConfigService.upsertCodStatus(body.isActive);
  }

  /**
   * Récupère le statut du paiement à la livraison (admin)
   * GET /admin/payment-config/cash-on-delivery
   * Doit être AVANT @Get(':provider') pour éviter le conflit de route
   */
  @Get('cash-on-delivery')
  getCodStatus() {
    return this.paymentConfigService.getCodStatus();
  }

  /**
   * Basculer entre TEST et LIVE
   * POST /admin/payment-config/switch
   * Body: { "provider": "paydunya", "mode": "live" }
   */
  @Post('switch')
  switchMode(
    @Body()
    switchDto: {
      provider: PaymentProvider;
      mode: 'test' | 'live';
    },
  ) {
    return this.paymentConfigService.switchMode(switchDto.provider, switchDto.mode);
  }

  /**
   * Supprime une configuration
   * DELETE /admin/payment-config/:provider
   */
  @Delete(':provider')
  remove(@Param('provider') provider: string) {
    return this.paymentConfigService.remove(provider);
  }
}
