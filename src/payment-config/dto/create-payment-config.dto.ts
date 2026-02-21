import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PaymentMode {
  TEST = 'test',
  LIVE = 'live',
}

export enum PaymentProvider {
  PAYDUNYA = 'PAYDUNYA',
  PAYTECH = 'PAYTECH',
  ORANGE_MONEY = 'ORANGE_MONEY',
}

export class CreatePaymentConfigDto {
  @IsEnum(PaymentProvider)
  @IsNotEmpty({ message: 'Le fournisseur de paiement est requis' })
  provider: PaymentProvider;

  @IsBoolean()
  @IsNotEmpty({ message: 'Le statut actif est requis' })
  isActive: boolean;

  @IsEnum(PaymentMode)
  @IsNotEmpty({ message: 'Le mode de paiement est requis' })
  mode: PaymentMode;

  @IsString()
  @IsOptional()
  masterKey?: string;

  @IsString()
  @IsNotEmpty({ message: 'La clé privée est requise' })
  privateKey: string;

  @IsString()
  @IsNotEmpty({ message: 'Le token est requis' })
  token: string;

  @IsString()
  @IsOptional()
  publicKey?: string;

  @IsString()
  @IsOptional()
  webhookSecret?: string;
}
