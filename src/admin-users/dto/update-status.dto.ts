import { IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Nouveau statut de l\'utilisateur',
    enum: ['active', 'inactive', 'suspended'],
    example: 'suspended',
  })
  @IsNotEmpty()
  @IsIn(['active', 'inactive', 'suspended', 'ACTIVE', 'INACTIVE', 'SUSPENDED'], {
    message: 'status must be one of: active, inactive, suspended',
  })
  @Transform(({ value }) => value ? value.toUpperCase() : 'ACTIVE')
  status: string;
}
