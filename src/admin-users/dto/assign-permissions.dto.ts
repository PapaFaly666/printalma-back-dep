import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Liste des IDs des permissions à attribuer',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'La liste des permissions ne peut pas être vide' })
  @IsInt({ each: true, message: 'Chaque permission doit être un nombre entier' })
  permissionIds: number[];
}
