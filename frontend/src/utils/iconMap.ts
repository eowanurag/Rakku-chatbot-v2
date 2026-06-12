import {
  ShieldAlert,
  UserCheck,
  BadgeCheck,
  CalendarCheck,
  Search,
  MapPinned,
  PhoneCall,
  CheckCircle,
  AlertTriangle,
  LucideIcon
} from 'lucide-react';

export const serviceIcons: Record<string, LucideIcon> = {
  Complaint: ShieldAlert,
  Verification: UserCheck,
  Certificate: BadgeCheck,
  Permission: CalendarCheck,
  Tracking: Search,
  PoliceStation: MapPinned,
  Emergency: PhoneCall,
  Success: CheckCircle,
  Warning: AlertTriangle,
};
