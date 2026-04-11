// Input validation utilities

export const ValidationRules = {
  // Email validation
  email: (email: string): { valid: boolean; error?: string } => {
    if (!email) return { valid: false, error: 'Email is required' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true };
  },

  // Phone validation (Indian format: 10 digits)
  phone: (phone: string): { valid: boolean; error?: string } => {
    if (!phone) return { valid: false, error: 'Phone number is required' };
    const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits
    if (cleaned.length === 0) {
      return { valid: false, error: 'Phone number cannot be empty' };
    }
    if (cleaned.length < 10) {
      return { valid: false, error: `Phone number must have at least 10 digits (you entered ${cleaned.length})` };
    }
    if (cleaned.length > 10) {
      return { valid: false, error: `Phone number must have exactly 10 digits (you entered ${cleaned.length})` };
    }
    return { valid: true };
  },

  // CGPA validation (0-10 scale)
  cgpa: (cgpa: any): { valid: boolean; error?: string } => {
    const cgpaNum = parseFloat(cgpa);
    if (isNaN(cgpaNum)) {
      return { valid: false, error: 'CGPA must be a number' };
    }
    if (cgpaNum < 0 || cgpaNum > 10) {
      return { valid: false, error: 'CGPA must be between 0 and 10' };
    }
    return { valid: true };
  },

  // Name validation
  name: (name: string): { valid: boolean; error?: string } => {
    if (!name) return { valid: false, error: 'Name is required' };
    if (name.trim().length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }
    if (name.trim().length > 100) {
      return { valid: false, error: 'Name cannot exceed 100 characters' };
    }
    return { valid: true };
  },

  // URL validation
  url: (url: string): { valid: boolean; error?: string } => {
    if (!url) return { valid: true }; // Optional field
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Please enter a valid URL' };
    }
  },

  // Required field
  required: (value: any, fieldName: string): { valid: boolean; error?: string } => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  },

  // Min length validation
  minLength: (value: string, length: number, fieldName: string): { valid: boolean; error?: string } => {
    if (value && value.length < length) {
      return { valid: false, error: `${fieldName} must be at least ${length} characters` };
    }
    return { valid: true };
  },

  // Max length validation
  maxLength: (value: string, length: number, fieldName: string): { valid: boolean; error?: string } => {
    if (value && value.length > length) {
      return { valid: false, error: `${fieldName} cannot exceed ${length} characters` };
    }
    return { valid: true };
  },

  // Numeric validation
  numeric: (value: any): { valid: boolean; error?: string } => {
    if (value && isNaN(parseFloat(value))) {
      return { valid: false, error: 'This field must be a number' };
    }
    return { valid: true };
  }
};

// Batch validation
export const validateForm = (
  formData: Record<string, any>,
  rules: Record<string, (value: any) => { valid: boolean; error?: string }>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach(fieldName => {
    const result = rules[fieldName](formData[fieldName]);
    if (!result.valid && result.error) {
      errors[fieldName] = result.error;
    }
  });
  
  return errors;
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

// Clean phone number
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};
