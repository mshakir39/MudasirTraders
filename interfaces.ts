export interface ICategory {
  id: string;
  series: string[];
  brandName: string | null;
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
  id: string;
  brandName: string;
  createdAt?: Date;
}
