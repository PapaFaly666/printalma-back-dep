import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TogglePublishDto {
  @ApiProperty({
    description: 'Publier ou dépublier la galerie',
    example: true
  })
  @IsBoolean({ message: 'is_published doit être un booléen' })
  is_published: boolean;
}
