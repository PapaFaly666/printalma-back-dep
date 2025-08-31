import { ApiProperty } from '@nestjs/swagger';

export class ColorResponseDto {
  @ApiProperty({
    description: 'ID unique de la couleur',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: 'Nom de la couleur',
    example: 'Rouge'
  })
  name: string;

  @ApiProperty({
    description: 'Code hexadécimal de la couleur',
    example: '#FF0000',
    required: false
  })
  hexCode?: string;

  @ApiProperty({
    description: 'URL de l\'image de la couleur',
    example: 'https://res.cloudinary.com/example/image/upload/v1620123456/colors/red.jpg'
  })
  imageUrl: string;
}