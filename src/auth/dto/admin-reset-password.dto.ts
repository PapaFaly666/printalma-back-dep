import { IsEmail, IsNotEmpty } from 'class-validator';
 
export class AdminResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
} 