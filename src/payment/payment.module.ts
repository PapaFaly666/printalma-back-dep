import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaydunyaModule } from '../paydunya/paydunya.module';

@Module({
  imports: [PaydunyaModule],
  controllers: [PaymentController],
  exports: [],
})
export class PaymentModule {}