import { IsOptional, IsString, IsUrl, Matches, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour la mise à jour des réseaux sociaux du vendeur
 */
export class UpdateSocialMediaDto {
  @ApiProperty({
    example: 'https://facebook.com/maboutique',
    description: 'URL du profil Facebook',
    required: false
  })
  @IsOptional()
  @ValidateIf(o => o.facebook_url !== undefined && o.facebook_url !== null && o.facebook_url !== '')
  @IsString()
  @IsUrl({}, { message: 'URL Facebook invalide' })
  @Matches(/^https?:\/\/(www\.)?(facebook\.com|fb\.me)\/.*/, {
    message: 'L\'URL Facebook doit être une URL valide (ex: https://facebook.com/maboutique)'
  })
  facebook_url?: string;

  @ApiProperty({
    example: 'https://instagram.com/@maboutique',
    description: 'URL du profil Instagram',
    required: false
  })
  @IsOptional()
  @ValidateIf(o => o.instagram_url !== undefined && o.instagram_url !== null && o.instagram_url !== '')
  @IsString()
  @IsUrl({}, { message: 'URL Instagram invalide' })
  @Matches(/^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/.*/, {
    message: 'L\'URL Instagram doit être une URL valide (ex: https://instagram.com/@maboutique)'
  })
  instagram_url?: string;

  @ApiProperty({
    example: 'https://twitter.com/maboutique',
    description: 'URL du profil Twitter/X',
    required: false
  })
  @IsOptional()
  @ValidateIf(o => o.twitter_url !== undefined && o.twitter_url !== null && o.twitter_url !== '')
  @IsString()
  @IsUrl({}, { message: 'URL Twitter/X invalide' })
  @Matches(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.*/, {
    message: 'L\'URL Twitter/X doit être une URL valide (ex: https://twitter.com/maboutique)'
  })
  twitter_url?: string;

  @ApiProperty({
    example: 'https://tiktok.com/@maboutique',
    description: 'URL du profil TikTok',
    required: false
  })
  @IsOptional()
  @ValidateIf(o => o.tiktok_url !== undefined && o.tiktok_url !== null && o.tiktok_url !== '')
  @IsString()
  @IsUrl({}, { message: 'URL TikTok invalide' })
  @Matches(/^https?:\/\/(www\.)?(tiktok\.com)\/(@|.).*/, {
    message: 'L\'URL TikTok doit être une URL valide (ex: https://tiktok.com/@maboutique)'
  })
  tiktok_url?: string;

  @ApiProperty({
    example: 'https://youtube.com/channel/maboutique',
    description: 'URL de la chaîne YouTube',
    required: false
  })
  @IsOptional()
  @ValidateIf(o => o.youtube_url !== undefined && o.youtube_url !== null && o.youtube_url !== '')
  @IsString()
  @IsUrl({}, { message: 'URL YouTube invalide' })
  @Matches(/^https?:\/\/(www\.)?(youtube\.com)\/(channel|c|user|@)\/.+/, {
    message: 'L\'URL YouTube doit être une URL valide (ex: https://youtube.com/channel/maboutique)'
  })
  youtube_url?: string;

  @ApiProperty({
    example: 'https://linkedin.com/in/maboutique',
    description: 'URL du profil LinkedIn',
    required: false
  })
  @IsOptional()
  @ValidateIf(o => o.linkedin_url !== undefined && o.linkedin_url !== null && o.linkedin_url !== '')
  @IsString()
  @IsUrl({}, { message: 'URL LinkedIn invalide' })
  @Matches(/^https?:\/\/(www\.)?(linkedin\.com)\/(in|company)\/.+/, {
    message: 'L\'URL LinkedIn doit être une URL valide (ex: https://linkedin.com/in/maboutique)'
  })
  linkedin_url?: string;
}

/**
 * DTO de réponse pour les réseaux sociaux du vendeur
 */
export class SocialMediaResponseDto {
  @ApiProperty({
    example: 'https://facebook.com/maboutique',
    description: 'URL du profil Facebook'
  })
  facebook_url?: string;

  @ApiProperty({
    example: 'https://instagram.com/@maboutique',
    description: 'URL du profil Instagram'
  })
  instagram_url?: string;

  @ApiProperty({
    example: 'https://twitter.com/maboutique',
    description: 'URL du profil Twitter/X'
  })
  twitter_url?: string;

  @ApiProperty({
    example: 'https://tiktok.com/@maboutique',
    description: 'URL du profil TikTok'
  })
  tiktok_url?: string;

  @ApiProperty({
    example: 'https://youtube.com/channel/maboutique',
    description: 'URL de la chaîne YouTube'
  })
  youtube_url?: string;

  @ApiProperty({
    example: 'https://linkedin.com/in/maboutique',
    description: 'URL du profil LinkedIn'
  })
  linkedin_url?: string;
}