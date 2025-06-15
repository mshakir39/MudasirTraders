export interface BatteryData {
  name: string;
  plate: string;
  ah: number;
  type?: string;
}

export interface ICategory {
  id?: string;
  brandName: string;
  series: BatteryData[];
}

// ... rest of the interfaces ...
