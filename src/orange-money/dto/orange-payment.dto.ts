import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrangePaymentDto {
  @ApiProperty({
    description: 'Order ID',
    example: 123,
  })
  @IsNumber()
  orderId: number;

  @ApiProperty({
    description: 'Total amount in XOF',
    example: 10000,
  })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({
    description: 'Customer name',
    example: 'Jean Dupont',
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Customer phone',
    example: '221771234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({
    description: 'Order number (reference)',
    example: 'ORD-123456',
  })
  @IsString()
  orderNumber: string;
}
