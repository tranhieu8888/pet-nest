export interface Attribute {
    _id: string;
    value: string;
    description?: string;
    parentId?: string | null;
    categories?: string[];
    children?: Attribute[];
}

export interface Category {
    _id: string;
    name: string;
}
