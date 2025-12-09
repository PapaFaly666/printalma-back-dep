import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VendorSocialMediaDto {
  @ApiPropertyOptional({
    description: 'URL du profil Facebook',
    example: 'https://facebook.com/maboutique',
  })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'L\'URL Facebook doit être une URL valide commençant par http:// ou https://' }
  )
  @MaxLength(500, { message: 'L\'URL Facebook ne peut pas dépasser 500 caractères' })
  facebook_url?: string;

  @ApiPropertyOptional({
    description: 'URL du profil Instagram',
    example: 'https://instagram.com/@maboutique',
  })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'L\'URL Instagram doit être une URL valide commençant par http:// ou https://' }
  )
  @MaxLength(500, { message: 'L\'URL Instagram ne peut pas dépasser 500 caractères' })
  instagram_url?: string;

  @ApiPropertyOptional({
    description: 'URL du profil Twitter/X',
    example: 'https://twitter.com/maboutique',
  })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'L\'URL Twitter doit être une URL valide commençant par http:// ou https://' }
  )
  @MaxLength(500, { message: 'L\'URL Twitter ne peut pas dépasser 500 caractères' })
  twitter_url?: string;

  @ApiPropertyOptional({
    description: 'URL du profil TikTok',
    example: 'https://tiktok.com/@maboutique',
  })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'L\'URL TikTok doit être une URL valide commençant par http:// ou https://' }
  )
  @MaxLength(500, { message: 'L\'URL TikTok ne peut pas dépasser 500 caractères' })
  tiktok_url?: string;

  @ApiPropertyOptional({
    description: 'URL de la chaîne YouTube',
    example: 'https://youtube.com/channel/maboutique',
  })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'L\'URL YouTube doit être une URL valide commençant par http:// ou https://' }
  )
  @MaxLength(500, { message: 'L\'URL YouTube ne peut pas dépasser 500 caractères' })
  youtube_url?: string;

  @ApiPropertyOptional({
    description: 'URL du profil LinkedIn',
    example: 'https://linkedin.com/in/maboutique',
  })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'L\'URL LinkedIn doit être une URL valide commençant par http:// ou https://' }
  )
  @MaxLength(500, { message: 'L\'URL LinkedIn ne peut pas dépasser 500 caractères' })
  linkedin_url?: string;
}