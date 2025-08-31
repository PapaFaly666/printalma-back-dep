import { IsEnum } from 'class-validator';
import { PostValidationAction } from '../vendor-product-validation.service';

export class UpdatePostValidationActionDto {
  @IsEnum(PostValidationAction, {
    message: 'Action de validation invalide. Valeurs autorisées: AUTO_PUBLISH, TO_DRAFT',
  })
  postValidationAction: PostValidationAction;
} 
 