/**
 * Israeli ID/Business Number Validation
 * 
 * - ת.ז. (ID): 9 digits with Luhn-variant checksum
 * - ח.פ. (Company): 9 digits starting with 51-59, no public checksum algorithm
 * - עוסק מורשה (Licensed Dealer): Uses owner's ID number
 * 
 * Note: Full ח.פ. validation requires checking against the Companies Registrar.
 * Morning API does this automatically when creating documents.
 */

/**
 * Validates an Israeli ID number (ת.ז.) using the Luhn algorithm variant
 * @param id - The ID number to validate (9 digits)
 * @returns true if valid, false otherwise
 */
export function validateIsraeliId(id: string): boolean {
  // Remove any non-digit characters
  const cleanId = id.replace(/\D/g, '');
  
  // ID must be exactly 9 digits (pad with leading zeros if shorter)
  const paddedId = cleanId.padStart(9, '0');
  
  if (paddedId.length !== 9) {
    return false;
  }
  
  // Apply the Luhn algorithm variant for Israeli IDs
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(paddedId[i], 10);
    
    // Double every second digit (0-indexed, so odd positions)
    if (i % 2 !== 0) {
      digit *= 2;
      // If result is > 9, subtract 9 (equivalent to summing the digits)
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }
  
  return sum % 10 === 0;
}

/**
 * Checks if a number looks like a company number (ח.פ.)
 * Company numbers start with 51-59
 */
function looksLikeCompanyNumber(value: string): boolean {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length !== 9) return false;
  
  const prefix = parseInt(cleanValue.substring(0, 2), 10);
  return prefix >= 51 && prefix <= 59;
}

/**
 * Validates either an Israeli ID or Business Number
 * @param value - The ID or business number to validate
 * @returns object with isValid boolean, type, and message
 */
export function validateIsraeliIdOrBn(value: string): {
  isValid: boolean;
  type: 'id' | 'company' | 'unknown';
  message: string;
} {
  // Remove any non-digit characters
  const cleanValue = value.replace(/\D/g, '');
  
  // Empty is valid (field is optional)
  if (!cleanValue) {
    return { isValid: true, type: 'unknown', message: '' };
  }
  
  // Check for non-numeric characters in original
  if (value.replace(/[-\s]/g, '') !== cleanValue && value.replace(/[-\s]/g, '').length !== cleanValue.length) {
    return { 
      isValid: false, 
      type: 'unknown', 
      message: 'יש להזין מספרים בלבד' 
    };
  }
  
  // Check length - too short
  if (cleanValue.length < 5) {
    return { 
      isValid: false, 
      type: 'unknown', 
      message: 'מספר קצר מדי' 
    };
  }
  
  // Check length - too long
  if (cleanValue.length > 9) {
    return { 
      isValid: false, 
      type: 'unknown', 
      message: 'מספר ארוך מדי (מקסימום 9 ספרות)' 
    };
  }
  
  // For 9-digit numbers, determine if it's a company or ID
  if (cleanValue.length === 9) {
    // Check if it looks like a company number (starts with 51-59)
    if (looksLikeCompanyNumber(cleanValue)) {
      // Company numbers - we can't validate checksum, Morning will verify
      return { 
        isValid: true, 
        type: 'company', 
        message: '' 
      };
    }
    
    // Otherwise, validate as ID number
    if (validateIsraeliId(cleanValue)) {
      return { isValid: true, type: 'id', message: '' };
    }
    
    return { 
      isValid: false, 
      type: 'id', 
      message: 'מספר ת.ז. לא תקין - ספרת הביקורת שגויה' 
    };
  }
  
  // For 8 digits, could be an old format - pad and validate as ID
  if (cleanValue.length === 8) {
    if (validateIsraeliId(cleanValue)) {
      return { isValid: true, type: 'id', message: '' };
    }
    // If it doesn't pass ID validation, it might still be a valid business number
    // Morning will verify
    return { 
      isValid: true, 
      type: 'unknown', 
      message: '' 
    };
  }
  
  // For 5-7 digits, could be older formats - accept without validation
  return { 
    isValid: true, 
    type: 'unknown', 
    message: '' 
  };
}
