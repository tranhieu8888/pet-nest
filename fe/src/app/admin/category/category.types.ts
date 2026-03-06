export interface Category {
    _id: string;
    name: string;
    description?: string;
    image?: string;
    parentCategory?: string;
    children?: Category[];
}

export interface EditCategoryModalProps {
    category: Category;
    onSave: (category: Category) => void;
    onClose: () => void;
    isOpen: boolean;
}

export interface AddCategoryModalProps {
    onSave: (category: Category) => void;
    onClose: () => void;
    isOpen: boolean;
    parentId?: string;
}

export interface ChildCategoryModalProps {
    category: Category;
    isOpen: boolean;
    onClose: () => void;
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: string) => void;
    onManageChildren: (category: Category) => void;
    onAddCategory: (parentId: string) => void;
    isLastLevel?: boolean;
}
