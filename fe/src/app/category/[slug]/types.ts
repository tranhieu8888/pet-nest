export interface Product {
    _id: string;
    name: string;
    description: string;
    category: string[];
    createAt: string;
    updateAt: string;
    variants: {
        _id: string;
        images: {
            url: string;
        }[];
        attribute: {
            Attribute_id: string;
            value: string;
        }[];
        sellPrice: number;
        availableQuantity: number;
    }[];
    brand: string;
}

export interface Category {
    _id: string;
    name: string;
    description: string;
    image: string;
}

export interface Attribute {
    _id: string;
    parentId: string | null;
    value: string;
    children: {
        _id: string;
        value: string;
        parentId: string;
        children: any[];
    }[];
}

export interface CategoryResponse {
    parent: Category;
    children: Category[];
    attributes?: Attribute[];
}

export interface FilterParams {
    categoryId: string;
    priceRange?: [number, number];
    attributes?: Record<string, string[]>;
    rating?: number | undefined;
    sortBy?: string;
}
