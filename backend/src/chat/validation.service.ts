import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationService {
  /**
   * Validates full name:
   * - Must be at least 2 characters
   * - Only alphabets, spaces, hyphens, and apostrophes allowed.
   * - Must contain at least a first name and a last name (at least two words).
   */
  validateName(name: string): boolean {
    if (!name) return false;
    const trimmed = name.trim();
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(trimmed)) return false;
    
    const parts = trimmed.split(/\s+/);
    return parts.length >= 2 && parts.every(part => part.length >= 1);
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

    // 4. Location Extraction Patterns
    // "i live in Lucknow", "change location to Kanpur", "my location is Varanasi", "live in Noida"
    const locationPatterns = [
      /(?:i live in|change location to|my location is|live in|location is|i am in)\s+([a-zA-Z\s'-]+)/i,
      /change my location to\s+([a-zA-Z\s'-]+)/i
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const potentialLoc = match[1].trim().split(/\s+and\s+|\s+my\s+|\s+number\s+/i)[0].trim();
        if (potentialLoc.length >= 3) {
          data.location = potentialLoc;
          break;
        }
      }
    }

    return data;
  }
}
