import { IBatterySeries, ICategory } from '@/interfaces';

// Use IBatterySeries directly instead of creating a new interface
export type BatteryData = IBatterySeries;

// Extend ICategory to ensure series is BatteryData[]
export interface CategoryWithBatteryData extends ICategory {
  id: string; // Make id required for the UI
  historyDate?: Date; // Optional for history entries
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HistoryEntry {
  _id?: string;
  categoryId?: string;
  brandName: string;
  series: BatteryData[];
  salesTax: number;
  historyDate: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
