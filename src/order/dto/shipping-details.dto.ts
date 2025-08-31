import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class ShippingDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  company?: string;

  @IsNotEmpty() // La rue est généralement requise
  @IsString()
  @MaxLength(200)
  street: string; // Ex: "123 Rue Principale, Appt 4B"

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apartment?: string; // Champ séparé si le frontend le gère ainsi, sinon intégrer à street

  @IsNotEmpty() // La ville est généralement requise
  @IsString()
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string; // État, province, région

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsNotEmpty() // Le pays est généralement requis
  @IsString()
  @MaxLength(100)
  country: string;
} 