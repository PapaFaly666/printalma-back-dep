import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PaydunyaController } from './paydunya.controller';
import { PaydunyaCronController } from './paydunya-cron.controller';
import { PaydunyaService } from './paydunya.service';
import { PaydunyaSyncService } from './paydunya-sync.service';
import { PaydunyaCronService } from './paydunya-cron.service';
import { PrismaService } from '../prisma.service';
import { OrderModule } from '../order/order.module';
import { PaymentConfigModule } from '../payment-config/payment-config.module';

/**
 * PayDunya Payment Module
 * Handles all payment processing through PayDunya gateway
 * Includes automatic payment status verification via cron job
 * Now supports dynamic configuration from database
 */
@Module({
  imports: [
    ConfigModule,
    ScheduleModule,
    forwardRef(() => OrderModule),
    PaymentConfigModule, // Import du module de configuration dynamique
  ],
  controllers: [PaydunyaController, PaydunyaCronController],
  providers: [PaydunyaService, PaydunyaSyncService, PaydunyaCronService, PrismaService],
  exports: [PaydunyaService, PaydunyaCronService],
})
export class PaydunyaModule {}
