export interface CitizenProfile {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  district?: string;
  aadhaarLastFour?: string;
  isAuthenticated: boolean;
}
