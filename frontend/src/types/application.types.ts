export interface BaseApplication {
  id: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ComplaintApplication extends BaseApplication {
  complaintType: string;
  incidentDetails: string;
}

export interface VerificationApplication extends BaseApplication {
  verificationType: string;
  name: string;
  address: string;
  mobile: string;
  propertyDetails?: string;
}

export interface CertificateApplication extends BaseApplication {
  name: string;
  address: string;
  district: string;
  purpose: string;
}

export interface EventPermissionApplication extends BaseApplication {
  eventName: string;
  eventDate: string;
  applicantName: string;
  location: string;
}
