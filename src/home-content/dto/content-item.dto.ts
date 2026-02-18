import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validateur personnalisé pour accepter les URLs complètes et relatives
 */
export function IsImageUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isImageUrl',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }

          // URLs relatives commençant par / sont acceptées
          if (value.startsWith('/')) {
            return true;
          }

          // URLs complètes doivent être valides
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} doit être une URL valide (commençant par http://, https:// ou /)`;
        },
      },
    });
  };
}

export class ContentItemDto {
  @IsString()
  @IsNotEmpty({ message: 'L\'ID est obligatoire' })
  id: string;

  @IsString()
  @MinLength(1, { message: 'Le nom doit contenir au moins 1 caractère' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;

  @IsString()
  @IsImageUrl({ message: 'L\'image doit être une URL valide (http://, https:// ou /)' })
  @MaxLength(500, { message: 'L\'URL ne peut pas dépasser 500 caractères' })
  imageUrl: string;
}
