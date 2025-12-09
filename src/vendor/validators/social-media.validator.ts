import { BadRequestException } from '@nestjs/common';

export class SocialMediaValidator {
  private static readonly PATTERNS = {
    facebook_url: /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+/i,
    instagram_url: /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+/i,
    twitter_url: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+/i,
    tiktok_url: /^(https?:\/\/)?(www\.)?(tiktok\.com)\/@.+/i,
    youtube_url: /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel|c|user)\/.+|youtu\.be\/.+)/i,
    linkedin_url: /^(https?:\/\/)?(www\.)?(linkedin\.com\/(in|company)\/.+)/i,
  };

  private static readonly PLATFORM_NAMES = {
    facebook_url: 'Facebook',
    instagram_url: 'Instagram',
    twitter_url: 'Twitter/X',
    tiktok_url: 'TikTok',
    youtube_url: 'YouTube',
    linkedin_url: 'LinkedIn',
  };

  static validate(platform: keyof typeof SocialMediaValidator.PATTERNS, url: string): boolean {
    if (!url || url.trim() === '') {
      return true; // Les champs sont optionnels
    }

    const pattern = this.PATTERNS[platform];
    if (!pattern) {
      return false;
    }

    return pattern.test(url);
  }

  static validateAll(socialMedia: Record<string, string>): void {
    const errors: string[] = [];

    for (const [platform, url] of Object.entries(socialMedia)) {
      if (url && url.trim() !== '') {
        const platformKey = platform as keyof typeof SocialMediaValidator.PATTERNS;

        if (!this.PATTERNS[platformKey]) {
          continue; // Ignorer les champs non reconnus
        }

        if (!this.validate(platformKey, url)) {
          const platformName = this.PLATFORM_NAMES[platformKey];
          errors.push(`L'URL ${platformName} n'est pas valide. Exemple: https://${platformKey.replace('_url', '.com')}/monprofil`);
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(' | '));
    }
  }

  static sanitizeUrl(url: string): string {
    if (!url || url.trim() === '') {
      return '';
    }

    let sanitized = url.trim();

    // Ajouter https:// si aucun protocole n'est spécifié
    if (!sanitized.match(/^https?:\/\//)) {
      sanitized = `https://${sanitized}`;
    }

    return sanitized;
  }

  static formatSocialMediaUrls(socialMedia: Record<string, string>): Record<string, string> {
    const formatted: Record<string, string> = {};

    for (const [platform, url] of Object.entries(socialMedia)) {
      if (url && url.trim() !== '') {
        formatted[platform] = this.sanitizeUrl(url);
      }
    }

    return formatted;
  }
}