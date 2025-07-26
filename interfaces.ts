export interface ICategory {
  id?: string;
  brandName: string;
  series: IBatterySeries[];
  salesTax: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDropdownOption {
  label: string;
  value: any;
}

export interface IStock {
  id?: string;
  brandName: string;
  series: string;
  productCost: string;
  inStock: string;
  updatedDate: Date;
}

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

export interface ICategoryHistory extends ICategory {
  categoryId: string;
  historyDate: Date;
}
