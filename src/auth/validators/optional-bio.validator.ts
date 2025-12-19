import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class OptionalBioConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        // Si la valeur est undefined, null ou chaîne vide, c'est valide
        if (value === undefined || value === null || value === '') {
            return true;
        }

        // Sinon, doit avoir au moins 10 caractères
        return typeof value === 'string' && value.trim().length >= 10;
    }

    defaultMessage(args: ValidationArguments) {
        return 'La biographie doit contenir au moins 10 caractères si elle est renseignée';
    }
}

export function OptionalBio(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: OptionalBioConstraint,
        });
    };
}