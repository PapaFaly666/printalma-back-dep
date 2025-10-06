import { IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nom du rôle',
    example: 'Responsable SAV',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Slug du rôle (format kebab-case)',
    example: 'support-manager',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Le slug doit être en format kebab-case (ex: support-manager)',
  })
  slug: string;

  @ApiProperty({
    description: 'Description du rôle',
    example: 'Gestion du service après-vente',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Liste des IDs de permissions',
    example: [1, 5, 10, 15, 20],
    type: [Number],
  })
  @IsArray()
  @IsNotEmpty()
  permissionIds: number[];
}
