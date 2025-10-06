import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Nom du rôle',
    example: 'Responsable SAV Senior',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description du rôle',
    example: 'Gestion avancée du SAV',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Liste des IDs de permissions',
    example: [1, 5, 10, 15, 20, 25],
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsOptional()
  permissionIds?: number[];
}
