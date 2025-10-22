import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PrismaService } from '../../prisma.service';

@ValidatorConstraint({ name: 'VariationExists', async: true })
@Injectable()
export class VariationExistsConstraint implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(variationId: number, args: ValidationArguments): Promise<boolean> {
    if (!variationId) return true; // Si optionnel, laisser @IsOptional() gérer

    const variation = await this.prisma.variation.findUnique({
      where: { id: variationId },
    });

    return !!variation;
  }

  defaultMessage(args: ValidationArguments): string {
    return `La variation avec l'ID ${args.value} n'existe pas`;
  }
}

export function VariationExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'VariationExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: VariationExistsConstraint,
    });
  };
}
