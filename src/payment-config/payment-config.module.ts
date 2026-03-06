import { Module } from '@nestjs/common';
import { PaymentConfigService } from './payment-config.service';
import {
  PaymentConfigController,
  PaymentMethodsAdminController,
} from './payment-config.controller';
import {
  PaymentConfigPublicController,
  PaymentMethodsPublicController,
} from './payment-config-public.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [],
  controllers: [
    PaymentConfigController,
    PaymentConfigPublicController,
    PaymentMethodsAdminController,
    PaymentMethodsPublicController,
  ],
  providers: [PaymentConfigService, PrismaService],
  exports: [PaymentConfigService], // Exporter pour utilisation dans d'autres modules
})
export class PaymentConfigModule {}
