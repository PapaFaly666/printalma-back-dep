import { Module } from '@nestjs/common';
import { PaymentConfigService } from './payment-config.service';
import { PaymentConfigController } from './payment-config.controller';
import { PaymentConfigPublicController } from './payment-config-public.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [],
  controllers: [PaymentConfigController, PaymentConfigPublicController],
  providers: [PaymentConfigService, PrismaService],
  exports: [PaymentConfigService], // Exporter pour utilisation dans d'autres modules
})
export class PaymentConfigModule {}
