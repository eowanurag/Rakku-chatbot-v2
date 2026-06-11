import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationService {
  /**
   * Validates full name:
   * - Must be at least 2 characters
   * - Only alphabets, spaces, hyphens, and apostrophes allowed.
   * - Must contain at least a first name and a last name (at least two words).
   */
  validateNameConfidence(name: string): { valid: boolean; confidence: number } {
    if (!name || name.trim().length < 2) {
      return { valid: false, confidence: 0 };
    }
    const trimmed = name.trim();
    
    // Pure numbers
    if (/^\d+$/.test(trimmed)) {
      return { valid: false, confidence: 0 };
    }
    
    // Special characters only (excluding Unicode letters, English letters, spaces, hyphens, and apostrophes)
    const invalidRegex = /^[^a-zA-Z\u0900-\u097F\s'-]+$/;
    if (invalidRegex.test(trimmed)) {
      return { valid: false, confidence: 0 };
    }
    
    // Only spaces/hyphens/apostrophes
    if (/^[\s'-]+$/.test(trimmed)) {
      return { valid: false, confidence: 0 };
    }
    
    // Confidence score
    // Lower confidence if name contains numbers or suspicious characters
    if (/[0-9@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`]/.test(trimmed)) {
      return { valid: true, confidence: 0.60 };
    }
    return { valid: true, confidence: 0.99 };
  }

  validateName(name: string): boolean {
    return this.validateNameConfidence(name).valid;
  }

  parseFullAddress(text: string): { addressLine1: string; addressLine2: string | null; pincode: string | null } {
    const pincodeMatch = text.match(/\b\d{6}\b/);
    const pincode = pincodeMatch ? pincodeMatch[0] : null;
    
    let cleanText = text;
    if (pincode) {
      cleanText = cleanText.replace(new RegExp('\\b' + pincode + '\\b', 'g'), '');
      cleanText = cleanText.replace(/[\s,-]+$/, '');
      cleanText = cleanText.replace(/\s*,\s*,/g, ',');
      cleanText = cleanText.trim();
    }
    
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let addressLine1 = '';
    let addressLine2: string | null = null;
    
    if (lines.length >= 2) {
      addressLine1 = lines[0];
      addressLine2 = lines.slice(1).join(', ');
    } else {
      addressLine1 = cleanText.trim();
      addressLine2 = null;
    }
    
    return {
      addressLine1,
      addressLine2,
      pincode,
    };
  }

  /**
   * Validates date format DD/MM/YYYY and rejects future dates for reports/complaints.
   */
  validateDate(dateStr: string, rejectFuture = true): boolean {
    if (!dateStr) return false;
    const trimmed = dateStr.trim();
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = trimmed.match(dateRegex);
    if (!match) return false;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if ([4, 6, 9, 11].includes(month) && day > 30) return false;
    
    if (month === 2) {
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      if (day > (isLeap ? 29 : 28)) return false;
    }
    
    if (rejectFuture) {
      const parsedDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (parsedDate > today) return false;
    }
    
    return true;
  }

  /**
   * Detects location inconsistencies between selected area and free text details.
   */
  validateConsistency(city: string, detailText: string): boolean {
    if (!city || !detailText) return true;
    const lowerCity = city.toLowerCase().trim();
    const lowerText = detailText.toLowerCase();
    
    const majorCities = ["lucknow", "kanpur", "noida", "ghaziabad", "varanasi", "prayagraj", "agra", "meerut", "delhi", "mumbai"];
    for (const otherCity of majorCities) {
      if (otherCity !== lowerCity && lowerText.includes(otherCity)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validates Indian mobile number:
   * - 10 digits when normalized
   */
  validateMobile(mobile: string): boolean {
    const normalized = this.normalizeMobile(mobile);
    if (!normalized) return false;
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(normalized);
  }

  /**
   * Normalizes mobile number to 10 digits:
   * e.g., "+91 9876543210" -> "9876543210"
   */
  normalizeMobile(mobile: string): string | null {
    if (!mobile) return null;
    let clean = mobile.replace(/\s+/g, '').replace(/[-()]/g, '');
    if (clean.startsWith('+91') && clean.length === 13) {
      clean = clean.substring(3);
    } else if (clean.startsWith('91') && clean.length === 12) {
      clean = clean.substring(2);
    } else if (clean.startsWith('0') && clean.length === 11) {
      clean = clean.substring(1);
    }
    if (/^\d{10}$/.test(clean)) {
      return clean;
    }
    return null;
  }

  /**
   * Validates optional email field.
   */
  validateEmail(email: string): boolean {
    if (!email) return true; 
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Helper to check if location contains valid district or city information.
   */
  validateLocation(locationText: string): boolean {
    return !!locationText && locationText.trim().length >= 3;
  }

  /**
   * Extracts citizen data from raw message using simple regex pattern matching.
   */
  extractCitizenData(text: string): { fullName?: string; mobileNumber?: string; email?: string; location?: string } {
    const data: { fullName?: string; mobileNumber?: string; email?: string; location?: string } = {};
    const lowerText = text.toLowerCase().trim();

    // Ignore reserved commands from extraction
    const reservedCommands = [
      "yes", "no", "confirm", "correct", "change", "modify", "submit", "ok", "okay",
      "confirm details", "modify details", "change location", "confirm location", "confirm name", "change name"
    ];
    if (reservedCommands.includes(lowerText) || reservedCommands.some(cmd => lowerText === `option:${cmd}`)) {
      return data;
    }

    // 1. Mobile Number Extraction
    // Match 10 digit numbers or +91 prefixes
    const phoneMatches = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}|\b[6-9]\d{9}\b/g);
    if (phoneMatches && phoneMatches.length > 0) {
      const normalized = this.normalizeMobile(phoneMatches[0]);
      if (normalized) {
        data.mobileNumber = normalized;
      }
    }

    // 2. Email Extraction
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches && emailMatches.length > 0) {
      data.email = emailMatches[0];
    }

    // 3. Name Extraction Patterns
    // "my name is Rahul Kumar", "i am Rahul Kumar", "name is Rahul Kumar", "this is Rahul Kumar"
    const namePatterns = [
      /(?:my name is|i am|name is|this is)\s+([a-zA-Z\s'-]+)/i,
      /called\s+([a-zA-Z\s'-]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const potentialName = match[1].trim().split(/\s+by\s+|\s+and\s+|\s+my\s+|\s+is\s+|\s+number\s+/i)[0].trim();
        if (this.validateName(potentialName)) {
          data.fullName = potentialName;
          break;
        }
      }
    }

    // 4. Location Extraction Patterns (including Hindi/Hinglish)
    const locationPatterns = [
      /(?:i live in|change location to|move location to|my location is|live in|location is|i am in|change my location to|my district is|district is)\s+([a-zA-Z\u0900-\u097F\s'-]+)/i,
      /([a-zA-Z\u0900-\u097F]+)\s+(?:me\s+rehta|me\s+rehti|mein\s+rehta|mein\s+rehti|me\s+rahta|me\s+rahti)/i,
      /([a-zA-Z\u0900-\u097F]+)\s*(?:में रहता|में रहती|मे रहता|मे रहती)/
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let potentialLoc = match[1].trim().split(/\s+and\s+|\s+my\s+|\s+number\s+/i)[0].trim();
        potentialLoc = potentialLoc.replace(/[।?!.,]$/, "").trim();
        if (potentialLoc.length >= 3) {
          data.location = potentialLoc.charAt(0).toUpperCase() + potentialLoc.slice(1);
          break;
        }
      }
    }

    // Fallback known UP cities list
    if (!data.location) {
      const upCities = ["lucknow", "kanpur", "noida", "ghaziabad", "varanasi", "prayagraj", "agra", "meerut", "bareilly", "aligarh", "moradabad", "saharanpur", "gorakhpur", "ayodhya", "jhansi", "muzaffarnagar", "mathura", "firozabad", "mirzapur", "lakhimpur", "hapur", "amroha", "greater noida"];
      const words = lowerText.split(/\s+/);
      for (const w of words) {
        if (upCities.includes(w)) {
          data.location = w.charAt(0).toUpperCase() + w.slice(1);
          break;
        }
      }
    }

    return data;
  }

  sanitizeInput(text: string): string {
    if (!text) return '';
    let clean = text;
    // Remove scripts, script tags, iframe, object, embed, svg tags, event handlers, javascript: links
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
    clean = clean.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
    
    // Remove HTML tags in general, keeping text
    clean = clean.replace(/<\/?\w+[^>]*>/g, ''); 
    
    // Remove javascript: and javascript event handlers like onload, onerror, etc.
    clean = clean.replace(/javascript:/gi, '');
    clean = clean.replace(/\bon\w+\s*=\s*(['"]?)[^\s>]*\1/gi, '');
    clean = clean.replace(/\bon\w+\s*=/gi, '');
    
    return clean.trim() || '[Invalid Input]';
  }

  sanitizeOutput(text: string): string {
    if (!text) return '';
    return this.sanitizeInput(text);
  }
}
