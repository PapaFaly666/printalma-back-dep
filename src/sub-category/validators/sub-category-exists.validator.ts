import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PrismaService } from '../../prisma.service';

@ValidatorConstraint({ name: 'SubCategoryExists', async: true })
@Injectable()
export class SubCategoryExistsConstraint implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(subCategoryId: number, args: ValidationArguments): Promise<boolean> {
    if (!subCategoryId) return true; // Si optionnel, laisser @IsOptional() gérer

    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    return !!subCategory;
  }

  defaultMessage(args: ValidationArguments): string {
    return `La sous-catégorie avec l'ID ${args.value} n'existe pas`;
  }
}

export function SubCategoryExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'SubCategoryExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: SubCategoryExistsConstraint,
    });
  };
}
