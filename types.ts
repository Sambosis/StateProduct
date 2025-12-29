
export interface ProductVariant {
  sku: string;
  description: string;
  unit: string;
  stdPrice: number;
  floorPrice: number;
  givePrice: number;
  gsaPrice: number;
  weight: number;
  productLine: string;
  family: string;
}

export interface ProductGroup {
  parentName: string;
  family: string;
  variants: ProductVariant[];
}

export enum PriceTier {
  Standard = 'Standard',
  Floor = 'Floor',
  Give = 'Give',
  GSA = 'GSA'
}
