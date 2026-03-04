export interface Product {
  _id: string;
  name: string;
  description: string;
  brand?: string;
  category: Array<{
    _id: string;
    name: string;
    description: string;
    isParent?: boolean;
    parentCategory?: string;
  }>;
}

export interface ProductVariant {
  _id: string;
  product_id: string;
  images: Array<{ url: string }>;
  attribute: Array<Attribute>;
  sellPrice: number;
}

export interface Attribute {
  _id: string;
  value: string;
  description: string;
  parentId?: {
    _id: string;
    value: string;
  };
}

export interface CategorySet {
  level2: Array<any>;
  level3: Array<any>;
}