import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsObject, ValidateNested, IsIn, Min, Max, Matches, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// DTO pour un élément de texte
// Basé sur la documentation BACKEND_ORDER_CUSTOMIZATION_GUIDE.md
export class TextElementDto {
  @ApiProperty({ description: 'ID unique de l\'élément (ex: "text-1234567890")' })
  @IsString()
  id: string;

  @ApiProperty({ enum: ['text'], description: 'Type fixe pour les textes' })
  type: 'text';

  @ApiProperty({ description: 'Contenu du texte avec sauts de ligne (\\n)' })
  @IsString()
  text: string;

  // Position (en pourcentage du canvas, 0-1)
  @ApiProperty({ description: 'Position X (0-1, ex: 0.5 = 50% du canvas)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @ApiProperty({ description: 'Position Y (0-1, ex: 0.5 = 50% du canvas)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  // Dimensions (en pixels)
  @ApiProperty({ description: 'Largeur de la boîte de texte en pixels' })
  @IsNumber()
  @Min(10)
  width: number;

  @ApiProperty({ description: 'Hauteur de la boîte de texte en pixels' })
  @IsNumber()
  @Min(10)
  height: number;

  // Transformation
  @ApiProperty({ description: 'Rotation en degrés (0-360)' })
  @IsNumber()
  @Min(0)
  @Max(360)
  rotation: number;

  @ApiPropertyOptional({ description: 'Échelle (1 = 100%, 2 = 200%)' })
  @IsNumber()
  @Min(0.1)
  @Max(10)
  @IsOptional()
  scale?: number;

  @ApiProperty({ description: 'Ordre d\'empilement (z-index)' })
  @IsNumber()
  zIndex: number;

  // Style du texte
  @ApiProperty({ description: 'Taille de police en pixels (ex: 24)' })
  @IsNumber()
  @Min(1)
  fontSize: number;

  @ApiProperty({ description: 'Police (ex: "Arial", "Roboto", etc.)' })
  @IsString()
  fontFamily: string;

  @ApiProperty({ description: 'Couleur hex (ex: "#000000")', pattern: '^#[0-9A-Fa-f]{6}$' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color: string;

  // Formatage
  @ApiPropertyOptional({ description: 'Graisse de la police ("normal", "bold", "600", etc.)' })
  @IsString()
  @IsOptional()
  fontWeight?: string;

  @ApiPropertyOptional({ description: 'Style de la police ("normal", "italic")' })
  @IsString()
  @IsIn(['normal', 'italic'])
  @IsOptional()
  fontStyle?: string;

  @ApiPropertyOptional({ description: 'Décoration du texte ("none", "underline", "line-through")' })
  @IsString()
  @IsIn(['none', 'underline', 'line-through'])
  @IsOptional()
  textDecoration?: string;

  @ApiPropertyOptional({ description: 'Alignement du texte ("left", "center", "right")' })
  @IsString()
  @IsIn(['left', 'center', 'right'])
  @IsOptional()
  textAlign?: string;

  // Métadonnées
  @ApiPropertyOptional({ description: 'Élément verrouillé' })
  @IsBoolean()
  @IsOptional()
  locked?: boolean;

  @ApiPropertyOptional({ description: 'Élément visible' })
  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  // Champs existants spécifiques Printalma
  @ApiPropertyOptional({ description: 'Taille de police de base (calcul)' })
  @IsNumber()
  @IsOptional()
  baseFontSize?: number;

  @ApiPropertyOptional({ description: 'Largeur de base (calcul)' })
  @IsNumber()
  @IsOptional()
  baseWidth?: number;

  @ApiPropertyOptional({ description: 'Courbure du texte (effet courbe)' })
  @IsNumber()
  @IsOptional()
  curve?: number;
}

// DTO pour un élément d'image
export class ImageElementDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ['image'] })
  type: 'image';

  @ApiProperty()
  @IsNumber()
  x: number;

  @ApiProperty()
  @IsNumber()
  y: number;

  @ApiProperty()
  @IsNumber()
  width: number;

  @ApiProperty()
  @IsNumber()
  height: number;

  @ApiProperty()
  @IsNumber()
  rotation: number;

  @ApiProperty()
  @IsNumber()
  zIndex: number;

  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiProperty()
  @IsNumber()
  naturalWidth: number;

  @ApiProperty()
  @IsNumber()
  naturalHeight: number;

  // 📤 Pour les uploads client (nouveau)
  @ApiPropertyOptional({ description: 'Cloudinary public ID pour les images uploadées par le client' })
  @IsString()
  @IsOptional()
  cloudinaryPublicId?: string;

  @ApiPropertyOptional({ description: 'Indique si l\'image a été uploadée par le client (true) ou est un design vendeur (false)' })
  @IsBoolean()
  @IsOptional()
  isClientUpload?: boolean;

  // 💰 Pour les designs vendeur (optionnel)
  @ApiPropertyOptional({ description: 'ID du design vendeur (si applicable)' })
  @IsNumber()
  @IsOptional()
  designId?: number;

  @ApiPropertyOptional({ description: 'Prix du design vendeur en FCFA (si applicable)' })
  @IsNumber()
  @IsOptional()
  designPrice?: number;

  @ApiPropertyOptional({ description: 'Nom du design vendeur (si applicable)' })
  @IsString()
  @IsOptional()
  designName?: string;

  @ApiPropertyOptional({ description: 'ID du vendeur (si applicable)' })
  @IsNumber()
  @IsOptional()
  vendorId?: number;
}

// DTO pour une sélection de taille
export class SizeSelectionDto {
  @ApiProperty()
  @IsString()
  size: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

// DTO principal - Compatible avec la doc complète
export class CreateCustomizationDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @ApiPropertyOptional({ description: 'ID du produit vendeur (optionnel)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  vendorProductId?: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  colorVariationId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  viewId: number;

  // Format simple: Array d'éléments
  @ApiPropertyOptional({
    type: [Object],
    description: 'Array of DesignElement (format simple - une seule vue)'
  })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value, { toClassOnly: true }) // Préserver les données brutes sans transformation
  designElements?: any[];

  // Format multi-vues: Object {"colorId-viewId": Array<DesignElement>}
  @ApiPropertyOptional({
    type: Object,
    description: 'Object mapping viewKey to DesignElement array (format multi-vues)'
  })
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => value, { toClassOnly: true }) // Préserver les données brutes sans transformation
  elementsByView?: Record<string, any[]>;

  // Délimitations de zones
  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  delimitations?: any[];

  // Sélections de taille
  @ApiPropertyOptional({ type: [SizeSelectionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SizeSelectionDto)
  sizeSelections?: SizeSelectionDto[];

  // Session guest
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionId?: string;

  // Preview image
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previewImageUrl?: string;

  // Timestamp du client
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  timestamp?: number;

  // 📧 Email du client pour l'envoi du mockup (optionnel)
  @ApiPropertyOptional({ description: 'Email du client pour recevoir le mockup de personnalisation' })
  @IsString()
  @IsOptional()
  clientEmail?: string;

  // 👤 Nom du client (optionnel)
  @ApiPropertyOptional({ description: 'Nom du client pour personnaliser l\'email' })
  @IsString()
  @IsOptional()
  clientName?: string;
}

export class UpdateCustomizationDto {
  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  designElements?: (TextElementDto | ImageElementDto)[];

  @ApiPropertyOptional({ type: [SizeSelectionDto] })
  @IsArray()
  @IsOptional()
  sizeSelections?: SizeSelectionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previewImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
