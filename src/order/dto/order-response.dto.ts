// export class ProductViewResponseDto { ... } // Plus nécessaire dans la réponse de commande
// export class ColorInProductResponseDto { ... } // Plus nécessaire pour la liste complète
// export class SizeInProductResponseDto { ... } // Plus nécessaire

export class ProductInOrderResponseDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  designName?: string;
  designDescription?: string;
  designImageUrl?: string;  // Image principale du design (conservée)
  categoryId?: number;
  categoryName?: string;
  orderedColorName?: string;    // Nom de la couleur commandée
  orderedColorHexCode?: string; // Code Hex de la couleur commandée (si disponible)
  orderedColorImageUrl?: string; // Image de la couleur commandée (si disponible)
}

export class OrderItemResponseDto {
  id: number;
  quantity: number;
  unitPrice: number;
  size?: string;    // Taille sélectionnée pour cet item
  color?: string;   // Couleur sélectionnée pour cet item (nom ou code)
  product?: ProductInOrderResponseDto; // Objet produit détaillé
}

export class ShippingAddressResponseDto {
  name?: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  fullFormatted?: string;
}

export class OrderResponseDto {
  id: number;
  orderNumber: string;
  userId: number;
  // userFirstName: string; // Remplacé par l'objet user
  // userLastName: string;
  // userEmail: string;
  user?: { // Informations sur l'utilisateur qui a passé commande
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    photo_profil?: string;
  };
  status: string;
  totalAmount: number;
  shippingAddress: ShippingAddressResponseDto;
  phoneNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
  validatedBy?: number;
  validator?: { // Informations sur le validateur
    id: number;
    firstName: string;
    lastName: string;
  };
  orderItems: OrderItemResponseDto[];
} 