import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';

// Configuration pour les uploads d'images de design
export const multerConfig: MulterOptions = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Types MIME autorisés pour les designs
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml' // Type MIME correct pour SVG
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`Format de fichier non autorisé. Types acceptés: ${allowedMimeTypes.join(', ')}`), false);
    }
  },
};

// 🆕 Configuration spécifique pour les photos de profil
export const profilePhotoConfig: MulterOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB pour les photos de profil
  },
  fileFilter: (req, file, cb) => {
    console.log(`📸 Validation photo de profil: ${file.originalname} (${file.mimetype})`);
    
    // Types MIME autorisés pour les photos de profil
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException(
        `Format d'image non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
      ), false);
    }
  },
};