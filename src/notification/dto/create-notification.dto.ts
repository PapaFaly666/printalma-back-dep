import { IsEnum, IsString, IsOptional, IsInt, IsDateString, IsObject } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
} 