export interface TrackingMilestone {
  title: string;
  status: string;
  timestamp: string;
  description?: string;
  isCompleted: boolean;
}

export interface ApplicationTrackingStatus {
  referenceNumber: string;
  serviceType: string;
  status: string;
  updatedAt: string;
  milestones: TrackingMilestone[];
  details?: Record<string, any>;
}
