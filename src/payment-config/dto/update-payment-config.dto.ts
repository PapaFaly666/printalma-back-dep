import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentConfigDto } from './create-payment-config.dto';

export class UpdatePaymentConfigDto extends PartialType(CreatePaymentConfigDto) {}
