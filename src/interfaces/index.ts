export interface IBrand {
  id?: string;
  brandName: string;
}

export interface IBatterySeries {
  name: string;
  plate: string;
  ah: number;
  type?: string;
  retailPrice?: number;
  salesTax?: number;
  maxRetailPrice?: number;
}

export interface ICategory {
  id?: string;
  brandName: string;
  series: IBatterySeries[];
  salesTax: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategoryHistory extends ICategory {
  categoryId: string;
  historyDate: Date;
}

// ... rest of the interfaces ...
