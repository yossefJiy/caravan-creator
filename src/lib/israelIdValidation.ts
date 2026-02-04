/**
 * Israeli ID/Business Number Validation
 * 
 * Validates Israeli ID numbers (ת.ז.) and Business Numbers (ח.פ.)
 * using the Luhn-based algorithm used by the Israeli government.
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
 * Validates an Israeli Business Number (ח.פ.)
 * Business numbers are typically 8-9 digits
 * @param bn - The business number to validate
 * @returns true if valid, false otherwise
 */
export function validateBusinessNumber(bn: string): boolean {
  // Remove any non-digit characters
  const cleanBn = bn.replace(/\D/g, '');
  
  // Business numbers are typically 8-9 digits
  if (cleanBn.length < 8 || cleanBn.length > 9) {
    return false;
  }
  
  // For 9-digit business numbers, apply the same Luhn algorithm
  if (cleanBn.length === 9) {
    return validateIsraeliId(cleanBn);
  }
  
  // For 8-digit business numbers, pad with leading zero and validate
  return validateIsraeliId(cleanBn.padStart(9, '0'));
}

/**
 * Validates either an Israeli ID or Business Number
 * @param value - The ID or business number to validate
 * @returns object with isValid boolean and type of ID
 */
export function validateIsraeliIdOrBn(value: string): {
  isValid: boolean;
  type: 'id' | 'business' | 'unknown';
  message: string;
} {
  // Remove any non-digit characters
  const cleanValue = value.replace(/\D/g, '');
  
  // Empty is valid (field is optional)
  if (!cleanValue) {
    return { isValid: true, type: 'unknown', message: '' };
  }
  
  // Check length
  if (cleanValue.length < 5) {
    return { 
      isValid: false, 
      type: 'unknown', 
      message: 'מספר קצר מדי (מינימום 5 ספרות)' 
    };
  }
  
  if (cleanValue.length > 9) {
    return { 
      isValid: false, 
      type: 'unknown', 
      message: 'מספר ארוך מדי (מקסימום 9 ספרות)' 
    };
  }
  
  // Try to validate as ID (9 digits)
  if (cleanValue.length === 9) {
    if (validateIsraeliId(cleanValue)) {
      return { isValid: true, type: 'id', message: '' };
    }
    return { 
      isValid: false, 
      type: 'id', 
      message: 'מספר ת.ז. לא תקין - בדקו את הספרות' 
    };
  }
  
  // Try to validate as business number (8 digits)
  if (cleanValue.length === 8) {
    if (validateBusinessNumber(cleanValue)) {
      return { isValid: true, type: 'business', message: '' };
    }
    return { 
      isValid: false, 
      type: 'business', 
      message: 'מספר ח.פ. לא תקין - בדקו את הספרות' 
    };
  }
  
  // For other lengths (5-7), just check basic format
  // These could be older business numbers or special cases
  return { 
    isValid: true, 
    type: 'business', 
    message: '' 
  };
}
