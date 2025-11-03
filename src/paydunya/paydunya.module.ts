import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaydunyaController } from './paydunya.controller';
import { PaydunyaService } from './paydunya.service';
import { PrismaService } from '../prisma.service';
import { OrderModule } from '../order/order.module';

/**
 * PayDunya Payment Module
 * Handles all payment processing through PayDunya gateway
 */
@Module({
  imports: [
    ConfigModule,
    OrderModule,
  ],
  controllers: [PaydunyaController],
  providers: [PaydunyaService, PrismaService],
  exports: [PaydunyaService],
})
export class PaydunyaModule {}
