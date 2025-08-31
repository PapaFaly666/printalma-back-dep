import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DesignUploadDto {
  @ApiProperty({
    description: 'Nom original du fichier design',
    example: 'mon-design.png',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;

  @ApiProperty({
    description: 'Description du design',
    example: 'Design personnalisé pour le front du t-shirt',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class DesignUploadResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: {
      id: 'design_123',
      url: 'https://res.cloudinary.com/example/image/upload/v1620123456/designs/design_123.webp',
      filename: 'design_123.webp',
      size: 245760
    }
  })
  design: {
    id: string;
    url: string;
    filename: string;
    size: number;
  };
}

export class DesignDeleteResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: {
      id: 'design_123',
      filename: 'design_123.webp'
    }
  })
  deletedDesign: {
    id: string;
    filename: string;
  };
}

export class DesignGetResponseDto {
  @ApiProperty({
    example: {
      id: 'design_123',
      url: 'https://res.cloudinary.com/example/image/upload/v1620123456/designs/design_123.webp',
      filename: 'design_123.webp',
      originalName: 'mon-design.png',
      size: 245760,
      uploadedAt: '2024-01-15T10:30:00Z',
      isActive: true,
      description: 'Design personnalisé'
    },
    nullable: true
  })
  design: {
    id: string;
    url: string;
    filename: string;
    originalName: string;
    size: number;
    uploadedAt: string;
    isActive: boolean;
    description?: string;
  } | null;
} 