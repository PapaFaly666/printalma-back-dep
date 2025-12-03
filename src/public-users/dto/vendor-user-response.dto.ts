export class VendorUserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  shop_name?: string;
  vendeur_type: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
  photo_profil?: string;
  profile_photo_url?: string;
  phone?: string;
  country?: string;
  address?: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
}