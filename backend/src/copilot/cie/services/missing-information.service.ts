import { Injectable } from '@nestjs/common';

export interface MissingInformationResult {
  missingRequired: string[];
  missingOptional: string[];
  nextRecommendation: string[];
  completenessScore: number; // 0 to 100
}

@Injectable()
export class MissingInformationService {
  public detectMissing(complaintType: string, providedData: Record<string, any> = {}): MissingInformationResult {
    const typeUpper = (complaintType || '').toUpperCase().replace(/\s+/g, '_');
    
    // Normalize keys to lowercase for robust lookup
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(providedData)) {
      normalizedData[key.toLowerCase()] = providedData[key];
    }

    let requiredFields: string[] = ['fullname', 'mobilenumber', 'incidentdetails'];
    let optionalFields: string[] = [];
    let nextRecommendation: string[] = [];

    if (typeUpper === 'LOST_MOBILE') {
      requiredFields = ['fullname', 'mobilenumber', 'incidentdetails', 'imei', 'lastseen'];
      optionalFields = ['mobilebrand', 'mobilemodel', 'mobilecolor', 'purchaseyear'];
      
      if (!normalizedData['imei']) {
        nextRecommendation.push('Please enter your 15-digit IMEI number.');
      }
      if (!normalizedData['lastseen']) {
        nextRecommendation.push('Specify the last seen place or location.');
      }
      if (!normalizedData['mobilemodel']) {
        nextRecommendation.push('Provide the mobile brand/model for quicker tracking.');
      }
    } else if (typeUpper === 'CYBER_FRAUD') {
      requiredFields = ['fullname', 'mobilenumber', 'incidentdetails', 'transactionid', 'bank'];
      optionalFields = ['upi', 'paymentmethod'];

      if (!normalizedData['transactionid']) {
        nextRecommendation.push('Provide the Transaction ID to freeze target accounts.');
      }
      if (!normalizedData['bank']) {
        nextRecommendation.push('Enter sender or recipient Bank Name.');
      }
    } else if (typeUpper === 'MISSING_PERSON') {
      requiredFields = ['fullname', 'mobilenumber', 'incidentdetails', 'lastseen', 'clothing'];
      optionalFields = ['photograph', 'age', 'gender'];

      if (!normalizedData['lastseen']) {
        nextRecommendation.push('Specify the last seen location of the missing person.');
      }
      if (!normalizedData['clothing']) {
        nextRecommendation.push('Provide a description of the clothing.');
      }
    } else {
      // Default / Generic
      optionalFields = ['additionalremarks'];
    }

    const missingRequired: string[] = [];
    const missingOptional: string[] = [];

    // Map field display names
    const getDisplayName = (key: string): string => {
      const mapping: Record<string, string> = {
        fullname: 'Full Name',
        mobilenumber: 'Mobile Number',
        incidentdetails: 'Incident Details',
        imei: 'IMEI',
        lastseen: 'Last Seen Location',
        mobilebrand: 'Mobile Brand',
        mobilemodel: 'Mobile Model',
        mobilecolor: 'Mobile Color',
        purchaseyear: 'Purchase Year',
        transactionid: 'Transaction ID',
        bank: 'Bank Name',
        upi: 'UPI ID',
        paymentmethod: 'Payment Method',
        clothing: 'Clothing Description',
        photograph: 'Photograph',
        age: 'Age',
        gender: 'Gender'
      };
      return mapping[key] || key;
    };

    for (const req of requiredFields) {
      if (normalizedData[req] === undefined || normalizedData[req] === null || String(normalizedData[req]).trim() === '') {
        missingRequired.push(getDisplayName(req));
      }
    }

    for (const opt of optionalFields) {
      if (normalizedData[opt] === undefined || normalizedData[opt] === null || String(normalizedData[opt]).trim() === '') {
        missingOptional.push(getDisplayName(opt));
      }
    }

    const totalFields = requiredFields.length + optionalFields.length;
    const filledRequired = requiredFields.length - missingRequired.length;
    const filledOptional = optionalFields.length - missingOptional.length;
    
    // Completeness score formula: required is weighted 75%, optional is weighted 25%
    let completenessScore = 0;
    if (requiredFields.length > 0) {
      completenessScore += (filledRequired / requiredFields.length) * 75;
    } else {
      completenessScore += 75;
    }

    if (optionalFields.length > 0) {
      completenessScore += (filledOptional / optionalFields.length) * 25;
    } else {
      completenessScore += 25;
    }

    completenessScore = Math.round(completenessScore);

    return {
      missingRequired,
      missingOptional,
      nextRecommendation,
      completenessScore
    };
  }
}
