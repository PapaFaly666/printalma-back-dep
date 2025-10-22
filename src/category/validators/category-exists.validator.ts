import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PrismaService } from '../../prisma.service';

@ValidatorConstraint({ name: 'CategoryExists', async: true })
@Injectable()
export class CategoryExistsConstraint implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(categoryId: number, args: ValidationArguments): Promise<boolean> {
    if (!categoryId) return true; // Si optionnel, laisser @IsOptional() gérer

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    return !!category;
  }

  defaultMessage(args: ValidationArguments): string {
    return `La catégorie avec l'ID ${args.value} n'existe pas`;
  }
}

export function CategoryExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'CategoryExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: CategoryExistsConstraint,
    });
  };
}
