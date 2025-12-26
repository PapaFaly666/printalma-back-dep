/**
 * Validateurs pour les numéros de téléphone sénégalais
 */

/**
 * Valider un numéro de téléphone sénégalais
 * Formats acceptés: +221XXXXXXXXX, 221XXXXXXXXX, 7XXXXXXXX, 3XXXXXXXX
 * Les numéros sénégalais commencent par 7 (mobile) ou 3 (fixe)
 */
export function validateSenegalPhone(phone: string): boolean {
  const cleanedPhone = phone.replace(/[\s-]/g, '');
  const phoneRegex = /^(\+?221|221)?[73][0-9]{8}$/;
  return phoneRegex.test(cleanedPhone);
}

/**
 * Normaliser un numéro de téléphone sénégalais
 * Retourne au format +221XXXXXXXXX
 */
export function normalizeSenegalPhone(phone: string): string {
  let cleaned = phone.replace(/[\s-]/g, '');

  // Ajouter +221 si manquant
  if (!cleaned.startsWith('+221') && !cleaned.startsWith('221')) {
    cleaned = '+221' + cleaned;
  } else if (cleaned.startsWith('221')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Extraire le nom d'utilisateur d'une URL de réseau social
 */
export function extractUsername(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const pathname = urlObj.pathname;
    return pathname.split('/').filter(Boolean).pop() || '';
  } catch {
    return url;
  }
}
