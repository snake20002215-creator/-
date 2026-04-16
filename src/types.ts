export type CommissionStatus = 'submitted' | 'queued' | 'draft' | 'delivered';

export interface Commission {
  id: string;
  officialId?: string;
  nickname: string;
  contact: string;
  title: string;
  types: string[];
  description?: string;
  referenceUrl?: string;
  status: CommissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  isCommissionOpen: boolean;
  adminPasswordHash: string; // Simple string for this demo
}

export interface AppData {
  commissions: Commission[];
  settings: AppSettings;
}
