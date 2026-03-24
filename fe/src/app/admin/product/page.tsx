'use client';
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useRef } from "react";
import { useApi } from "../../../../utils/axios";
import { api } from "../../../../utils/axios";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, Trash2, Package, Warehouse } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox";
import ChatBot from "@/components/chatbot/ChatBot";
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../../utils/petPagesConfig.vi';
import enConfig from '../../../../utils/petPagesConfig.en';

interface Product {
  _id: string;
  name: string;
  description: string;
  brand?: string;
  category: Array<{
    categoryId: string;
    name: string;
    description: string;
    isParent?: boolean;
    parentCategory?: string;
  }>;
  variants?: Array<{ images?: Array<{ url: string }> }>;
}



interface CategorySet {
  level2: Array<{
    _id: string;
    name: string;
    description: string;
  }>;
  level3: Array<{
    _id: string;
    name: string;
    description: string;
  }>;
}

interface EditProductModalProps {
  product: Product;
  onSave: (product: Product) => void;
  onClose: () => void;
  isOpen: boolean;
}

function EditProductModal({ product, onSave, onClose, isOpen }: EditProductModalProps) {
  
  const { lang } = useLanguage();
  const pagesConfig = lang === 'vi' ? viConfig : enConfig;
  const config = pagesConfig.manageProduct.form;
  const childCategoryLabel = (config.fields as any).childCategory || 'Child Category';
  const grandchildCategoryLabel = (config.fields as any).grandchildCategory || 'Grandchild Category';
  const [level1Categories, setLevel1Categories] = useState<Array<{ _id: string; name: string; description: string }>>([]);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    brand: product.brand || ''
  });
  // Change to array for multi-select
  const [selectedParentCategories, setSelectedParentCategories] = useState<string[]>([]);
  // Store child/grandchild per parent
  const [selectedChildCategories, setSelectedChildCategories] = useState<Record<string, string | null>>({});
  const [selectedGrandChildCategories, setSelectedGrandChildCategories] = useState<Record<string, string | null>>({});
  const [categorySets, setCategorySets] = useState<Record<string, CategorySet>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitRef = useRef(false);
  const { request } = useApi();

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      submitRef.current = false;
      setError(null);
    }
  }, [isOpen]); 

  // Fetch level 1 categories and product data when modal opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch level 1 categories
        const categoriesResponse = await request(() => api.get('/categories/parent'));
        if (categoriesResponse && categoriesResponse.success) {
          setLevel1Categories(categoriesResponse.data);
        } else {
          return;
        }
        // Fetch product details
        const productResponse = await request(() => api.get(`/products/productById2/${product._id}`));
        if (productResponse.success) {
          const productData = productResponse.data;
          // Thêm dòng này:
          console.log('product.category:', productData.category);
          setFormData({
            name: productData.name,
            description: productData.description,
            brand: productData.brand || ''
          });
          // Process categories
          if (productData.category && productData.category.length > 0) {
            // 1. Lấy parent
            const parentCategories = productData.category.filter((cat: any) => cat.isParent);
            const parentIds = parentCategories.map((cat: any) => cat._id);

            // 2. Mapping child và grandchild cho từng parent
            const newChild = {};
            const newGrand = {};
            const newCategorySets = {};

            for (const parent of parentCategories) {
              // Tìm child (con trực tiếp của parent)
              const child = productData.category.find((cat: any) => cat.parentCategory === parent._id);
              if (child) {
                (newChild as any)[parent._id] = child._id;
                // Fetch child categories (level2)
                const childRes = await request(() => api.get(`/categories/child-categories/${parent._id}`));
                (newCategorySets as any)[parent._id] = { level2: childRes.data || [], level3: [] };

                // Tìm grandchild (con của child)
                const grand = productData.category.find((cat: any) => cat.parentCategory === child._id);
                if (grand) {
                  (newGrand as any)[parent._id] = grand._id;
                  // Fetch grandchild categories (level3)
                  const grandRes = await request(() => api.get(`/categories/child-categories/${child._id}`));
                  (newCategorySets as any)[parent._id].level3 = grandRes.data || [];
                }
              } else {
                // Nếu không có child, vẫn fetch child categories
                const childRes = await request(() => api.get(`/categories/child-categories/${parent._id}`));
                (newCategorySets as any)[parent._id] = { level2: childRes.data || [], level3: [] };
                (newChild as any)[parent._id] = null;
                (newGrand as any)[parent._id] = null;
              }
            }

            setSelectedParentCategories(parentIds);
            setSelectedChildCategories(newChild);
            setSelectedGrandChildCategories(newGrand);
            setCategorySets(newCategorySets);
          }
        }
      } catch (error) {
        //
      }
    };
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, product._id]);

  // Handle parent checkbox
  const handleParentCategoryChange = async (categoryId: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedParentCategories, categoryId]
      : selectedParentCategories.filter(id => id !== categoryId);
    setSelectedParentCategories(newSelected);
    if (checked) {
      // Fetch child categories for the selected parent
      try {
        const response = await request(() => api.get(`/categories/child-categories/${categoryId}`));
        setCategorySets(prev => ({ ...prev, [categoryId]: { level2: response.data || [], level3: [] } }));
        setSelectedChildCategories(prev => ({ ...prev, [categoryId]: null }));
        setSelectedGrandChildCategories(prev => ({ ...prev, [categoryId]: null }));
      } catch {}
    } else {
      // Remove child/grandchild for this parent
      setCategorySets(prev => { const p = { ...prev }; delete p[categoryId]; return p; });
      setSelectedChildCategories(prev => { const p = { ...prev }; delete p[categoryId]; return p; });
      setSelectedGrandChildCategories(prev => { const p = { ...prev }; delete p[categoryId]; return p; });
    }
  };

  // Handle child category per parent
  const handleChildCategoryChange = async (parentId: string, childId: string) => {
    setSelectedChildCategories(prev => ({ ...prev, [parentId]: childId }));
    setSelectedGrandChildCategories(prev => ({ ...prev, [parentId]: null }));
    // Fetch grandchild
    try {
      const response = await request(() => api.get(`/categories/child-categories/${childId}`));
      setCategorySets(prev => ({ ...prev, [parentId]: { ...prev[parentId], level3: response.data || [] } }));
    } catch {}
  };
  // Handle grandchild per parent
  const handleGrandChildCategoryChange = (parentId: string, grandId: string) => {
    setSelectedGrandChildCategories(prev => ({ ...prev, [parentId]: grandId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitRef.current) return;
    submitRef.current = true;
    setError(null);
    try {
      setIsSubmitting(true);
      if (!formData.name || !formData.description) throw new Error('Name and description are required');
      if (selectedParentCategories.length === 0) throw new Error('Please select at least one parent category');
      // Chỉ lấy các parentId còn tick và child/grandchild của chúng
      const categories: { categoryId: string }[] = [];
      selectedParentCategories.forEach(parentId => {
        if (!level1Categories.find(c => c._id === parentId)) return; // parentId không hợp lệ
        categories.push({ categoryId: parentId });
        const childId = selectedChildCategories[parentId];
        if (childId && categorySets[parentId]?.level2.find(c => c._id === childId)) {
          categories.push({ categoryId: childId });
          const grandId = selectedGrandChildCategories[parentId];
          if (grandId && categorySets[parentId]?.level3.find(c => c._id === grandId)) {
            categories.push({ categoryId: grandId });
          }
        }
      });
      const submitData = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        categories
      };
      const response = await request(() => api.put(`/products/${product._id}`, submitData));
      if (response.success) {
        onSave(response.data);
        onClose();
      } else {
        throw new Error(response.message || 'Failed to update product');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
      submitRef.current = false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[980px] max-h-[92vh] p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden flex flex-col gap-0 [&>button]:text-white [&>button]:bg-transparent [&>button]:border-0 [&>button]:shadow-none [&>button]:opacity-100 [&>button:hover]:text-white [&>button:hover]:bg-transparent [&>button:focus]:ring-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-white">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-7 py-4 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[1.75rem] font-bold text-white tracking-tight">{config.editTitle}</DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="space-y-6 overflow-y-auto flex-1 px-7 py-7 bg-white">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm leading-relaxed">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white via-slate-50/80 to-blue-50/40 p-7 rounded-2xl border border-slate-200 shadow-sm">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[13px] font-semibold text-slate-600 tracking-wide">{config.fields.name}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="h-11 rounded-xl border-slate-300 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-[15px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-[13px] font-semibold text-slate-600 tracking-wide">{config.fields.brand}</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="h-11 rounded-xl border-slate-300 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-[15px]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[13px] font-semibold text-slate-600 tracking-wide">{config.fields.description}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[124px] rounded-xl border-slate-300 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-[15px]"
                />
              </div>
            </div>

            <div className="bg-gradient-to-b from-white to-slate-50/60 p-6 rounded-2xl border border-slate-200 shadow-sm">
              <Label className="text-sm font-semibold text-slate-700 mb-3 block">{config.fields.categories} <span className="text-red-500">*</span></Label>
              <div className="space-y-2.5">
                {level1Categories.map((category) => (
                  <div key={`parent-${category._id}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`parent-${category._id}`}
                        checked={selectedParentCategories.includes(category._id)}
                        onChange={e => handleParentCategoryChange(category._id, e.target.checked)}
                      />
                      <Label htmlFor={`parent-${category._id}`} className="font-semibold text-slate-800">{category.name}</Label>
                    </div>
                    {selectedParentCategories.includes(category._id) && (
                      <div className="ml-5 mt-1 border-l-2 border-blue-100 pl-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <Label className="font-semibold text-slate-700 text-[13px] tracking-wide">{childCategoryLabel}</Label>
                            <div className="space-y-1.5 mt-2">
                              {categorySets[category._id]?.level2.map((child) => (
                                <label key={`child-${child._id}`} htmlFor={`child-${category._id}-${child._id}`} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 border transition-all cursor-pointer text-[15px] ${selectedChildCategories[category._id] === child._id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-transparent hover:border-slate-200 hover:bg-white text-slate-700'}`}>
                                  <input
                                    type="radio"
                                    id={`child-${category._id}-${child._id}`}
                                    name={`childCategory-${category._id}`}
                                    checked={selectedChildCategories[category._id] === child._id}
                                    onChange={() => handleChildCategoryChange(category._id, child._id)}
                                    className="h-4 w-4"
                                  />
                                  <span className="font-medium">{child.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <Label className="font-semibold text-slate-700 text-[13px] tracking-wide">{grandchildCategoryLabel}</Label>
                            <div className="space-y-1.5 mt-2">
                              {selectedChildCategories[category._id] && categorySets[category._id]?.level3.map((grand) => (
                                <label key={`grandchild-${grand._id}`} htmlFor={`grandchild-${category._id}-${grand._id}`} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 border transition-all cursor-pointer text-[15px] ${selectedGrandChildCategories[category._id] === grand._id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-transparent hover:border-slate-200 hover:bg-white text-slate-700'}`}>
                                  <input
                                    type="radio"
                                    id={`grandchild-${category._id}-${grand._id}`}
                                    name={`grandchildCategory-${category._id}`}
                                    checked={selectedGrandChildCategories[category._id] === grand._id}
                                    onChange={() => handleGrandChildCategoryChange(category._id, grand._id)}
                                    className="h-4 w-4"
                                  />
                                  <span className="font-medium">{grand.name}</span>
                                </label>
                              ))}
                              {!selectedChildCategories[category._id] && (
                                <p className="text-xs text-slate-400 italic px-1 py-2">Chọn danh mục con để hiển thị danh mục cháu</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 -mx-7 px-7 py-4 bg-white border-t border-slate-200">
            <div className="flex justify-end gap-2 pr-1">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100 px-6">
                {config.buttons.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 shadow-sm transition-all">
                {isSubmitting ? config.buttons.save : config.buttons.save}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProductVariant {
  _id: string;
  product_id: string;
  images: Array<{ url: string }>;
  attribute: Array<{
    _id: string;
    value: string;
    description: string;
    parentId?: {
      _id: string;
      value: string;
    };
  }>;
  sellPrice: number;
  totalQuantity?: number;
}

interface Attribute {
  _id: string;
  value: string;
  description: string;
  parentId?: {
    _id: string;
    value: string;
  };
}

interface VariantManagementModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

function VariantManagementModal({ product, isOpen, onClose }: VariantManagementModalProps) {
  const { lang } = useLanguage();
  const pagesConfig = lang === 'vi' ? viConfig : enConfig;
  const config = pagesConfig.manageProduct.variant;
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedVariantForImport, setSelectedVariantForImport] = useState<ProductVariant | null>(null);
  const [attributes, setAttributes] = useState<{
    parentAttributes: Attribute[];
    childAttributes: Attribute[];
  }>({ parentAttributes: [], childAttributes: [] });
  const [selectedParentAttribute, setSelectedParentAttribute] = useState<string | null>(null);
  const [selectedChildAttribute, setSelectedChildAttribute] = useState<string | null>(null);
  const [isAddVariantFormOpen, setIsAddVariantFormOpen] = useState(false);
  const [newVariant, setNewVariant] = useState({
    images: [{ file: null as File | null, url: '' }],
    attributes: [] as string[],
    sellPrice: 0
  });
  const [isAddingVariant, setIsAddingVariant] = useState(false); // Thêm state loading
  const { request } = useApi();
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});
  const [importChanged, setImportChanged] = useState(false);

  // Đưa fetchVariants ra ngoài useEffect để có thể gọi lại
  const fetchVariants = async () => {
    try {
      const response = await request(() => api.get(`/products/product-variant/${product._id}`));
      if (response.success) {
        setVariants(response.data);
        // Sau khi lấy variants, lấy tổng quantity cho từng variant
        const variantsArr = response.data;
        const quantityPromises = variantsArr.map(async (variant: ProductVariant) => {
          try {
            const res = await request(() => api.get(`/products/import-batches/${variant._id}`));
            if (res.success && Array.isArray(res.data)) {
              // Tính tổng quantity
              const total = res.data.reduce((sum: number, batch: any) => sum + (batch.quantity || 0), 0);
              return { id: variant._id, total };
            }
          } catch {}
          return { id: variant._id, total: 0 };
        });
        const quantities = await Promise.all(quantityPromises);
        const quantityMap: Record<string, number> = {};
        quantities.forEach(q => { quantityMap[q.id] = q.total; });
        setVariantQuantities(quantityMap);
      } else {
        setError(response.message || 'Failed to fetch variants');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const response = await request(() => api.get(`/products/child-attributes/${product._id}`));
        if (response.success) {
          setAttributes({
            parentAttributes: response.data.parentAttributes,
            childAttributes: response.data.childAttributes
          });
        }
      } catch (err: any) {
        console.error('Error fetching attributes:', err);
      }
    };

    if (isOpen) {
      fetchVariants();
      fetchAttributes();
    }
  }, [isOpen, product._id]);

  useEffect(() => {
    const fetchChildAttributes = async () => {
      if (selectedParentAttribute) {
        try {
          const response = await request(() => 
            api.get(`/products/child-attributes/parent/${selectedParentAttribute}`)
          );
          if (response.success) {
            setAttributes(prev => ({
              ...prev,
              childAttributes: response.data
            }));
          }
        } catch (err: any) {
          console.error('Error fetching child attributes:', err);
        }
      }
    };

    fetchChildAttributes();
  }, [selectedParentAttribute]);

  const handleParentAttributeChange = (attributeId: string) => {
    setSelectedParentAttribute(attributeId);
    setSelectedChildAttribute(null); // Reset child selection when parent changes
    // Reset attributes to only include the selected parent
    setNewVariant(prev => ({
      ...prev,
      attributes: [attributeId]
    }));
  };

  const handleChildAttributeChange = (attributeId: string) => {
    setSelectedChildAttribute(attributeId);
    // Update attributes to include both parent and selected child
    setNewVariant(prev => ({
      ...prev,
      attributes: selectedParentAttribute ? [selectedParentAttribute, attributeId] : [attributeId]
    }));
  };

  const handleAddImage = () => {
    setNewVariant(prev => ({
      ...prev,
      images: [...prev.images, { file: null, url: '' }]
    }));
  };

  const handleRemoveImage = (index: number) => {
    setNewVariant(prev => {
      if (prev.images.length === 1) {
        return {
          ...prev,
          images: [{ file: null, url: '' }]
        };
      }

      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      };
    });
  };

  const handleImageChange = (index: number, file: File | null) => {
    setNewVariant(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? { file, url: file ? URL.createObjectURL(file) : '' } : img)
    }));
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setNewVariant({
      images: (variant.images ?? []).map((img: any) => ({ url: img?.url || '', file: null })),
      attributes: variant.attribute.map(attr => attr._id),
      sellPrice: variant.sellPrice
    });
    // Set selected attributes
    const parentAttr = variant.attribute.find(attr => !attr.parentId);
    const childAttr = variant.attribute.find(attr => attr.parentId);
    if (parentAttr) {
      setSelectedParentAttribute(parentAttr._id);
    }
    if (childAttr) {
      setSelectedChildAttribute(childAttr._id);
    }
    setIsEditFormOpen(true);
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingVariant) return; // Ngăn double submit
    // Validate required fields
    if (newVariant.images.length === 0 || newVariant.images.some(img => !img.file)) {
      setError('Please add at least one image');
      return;
    }
    if (!selectedParentAttribute) {
      setError('Please select a parent attribute');
      return;
    }
    if (!selectedChildAttribute) {
      setError('Please select a child attribute');
      return;
    }
    try {
      setIsAddingVariant(true);
      const formData = new FormData();
      newVariant.images.forEach((img) => {
        if (img.file) {
          formData.append('images', img.file);
        }
      });
      newVariant.attributes.forEach(attrId => {
        formData.append('attributes', attrId);
      });
      const response = await request(() =>
        api.post(`/products/${product._id}/variant`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      if (response.success) {
        setVariants([...variants, { ...response.data, images: response.data.images.map((img: { url: string }) => ({ url: img.url, file: null })) }]);
        setIsAddFormOpen(false);
        setNewVariant({ images: [{ file: null, url: '' }], attributes: [], sellPrice: 0 });
        setSelectedParentAttribute(null);
        setSelectedChildAttribute(null);
        setError(null);
      } else {
        setError(response.message || 'Failed to add variant');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAddingVariant(false);
    }
  };

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;
    if (newVariant.images.length === 0 || newVariant.images.every(img => !img.file && !img.url)) {
      setError('Please add at least one image');
      return;
    }
    if (!selectedParentAttribute) {
      setError('Please select a parent attribute');
      return;
    }
    if (!selectedChildAttribute) {
      setError('Please select a child attribute');
      return;
    }
    if (newVariant.sellPrice <= 0) {
      setError('Please enter a valid price');
      return;
    }
    try {
      const formData = new FormData();
      newVariant.images.forEach((img) => {
        if (img.file) {
          formData.append('images', img.file);
        } else if (img.url) {
          formData.append('existingImages', img.url); // gửi url ảnh cũ
        }
      });
      newVariant.attributes.forEach(attrId => {
        formData.append('attributes', attrId);
      });
      formData.append('sellPrice', String(newVariant.sellPrice));
      const response = await request(() =>
        api.put(`/products/variant/${selectedVariant._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      if (response.success) {
        setVariants(variants.map(v => v._id === selectedVariant._id ? { ...response.data, images: response.data.images.map((img: { url: string }) => ({ url: img.url, file: null })) } : v));
        setIsEditFormOpen(false);
        setSelectedVariant(null);
        setNewVariant({ images: [{ file: null, url: '' }], attributes: [], sellPrice: 0 });
        setSelectedParentAttribute(null);
        setSelectedChildAttribute(null);
        setError(null);
      } else {
        setError(response.message || 'Failed to update variant');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    setVariantToDelete(variantId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteVariant = async () => {
    if (!variantToDelete) return;
    
    try {
      await request(() => api.delete(`/products/variant/${variantToDelete}`));
      setVariants(variants.filter(variant => variant._id !== variantToDelete));
      setIsDeleteDialogOpen(false);
      setVariantToDelete(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[980px] max-h-[92vh] p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden flex flex-col gap-0 [&>button]:text-white [&>button]:bg-transparent [&>button]:border-0 [&>button]:shadow-none [&>button]:opacity-100 [&>button:hover]:text-white [&>button:hover]:bg-transparent [&>button:focus]:ring-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-white">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-4 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold leading-snug">{config.title} - {product.name}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-5 overflow-y-auto flex-1 px-6 py-6 pb-6 bg-white">
          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              onClick={() => setIsAddFormOpen(true)}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow gap-1.5 transition-all"
            >
              {config.addNewButton}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">
              {error}
            </div>
          )}

          {isAddFormOpen && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-b from-white to-slate-50/60 shadow-sm">
              <form onSubmit={handleAddVariant} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">{config.form.fields.images} <span className="text-red-500">*</span></Label>
                  <div className="space-y-2.5">
                    {newVariant.images.map((image, index) => (
                      <div key={`image-${index}`} className="flex gap-2 items-center">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageChange(index, e.target.files?.[0] || null)}
                          required={index === 0}
                          disabled={isAddingVariant}
                        />
                        {image.url && (
                          <img src={image.url} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveImage(index)}
                          disabled={isAddingVariant}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddImage}
                      disabled={isAddingVariant}
                    >
                      Add Image
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">{config.form.fields.attributes} <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-1">
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
                      <Label className="font-semibold text-slate-700 text-sm tracking-wide">{config.form.fields.parentAttributes}</Label>
                      <div className="space-y-2 mt-3">
                        {attributes.parentAttributes.map((attr) => (
                          <label key={`parent-attr-${attr._id}`} htmlFor={`parent-${attr._id}`} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border transition-all cursor-pointer ${selectedParentAttribute === attr._id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <input
                              type="radio"
                              id={`parent-${attr._id}`}
                              name="parentAttribute"
                              checked={selectedParentAttribute === attr._id}
                              onChange={() => handleParentAttributeChange(attr._id)}
                              required
                              disabled={isAddingVariant}
                              className="h-4 w-4"
                            />
                            <span className="font-medium">{attr.value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
                      <Label className="font-semibold text-slate-700 text-sm tracking-wide">{config.form.fields.childAttributes}</Label>
                      <div className="space-y-2 mt-3">
                        {selectedParentAttribute && attributes.childAttributes
                          .filter(attr => attr.parentId && attr.parentId._id === selectedParentAttribute)
                          .map((attr) => (
                            <label key={`child-attr-${attr._id}`} htmlFor={`child-${attr._id}`} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border transition-all cursor-pointer ${selectedChildAttribute === attr._id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                              <input
                                type="radio"
                                id={`child-${attr._id}`}
                                name="childAttribute"
                                checked={selectedChildAttribute === attr._id}
                                onChange={() => handleChildAttributeChange(attr._id)}
                                disabled={!selectedParentAttribute || isAddingVariant}
                                required
                                className="h-4 w-4"
                              />
                              <span className="font-medium">{attr.value}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* <div>
                  <Label htmlFor="price">{config.form.fields.sellPrice} <span className="text-red-500">*</span></Label>
                  <Input
                    id="price"
                    type="number"
                    value={newVariant.sellPrice}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, sellPrice: Number(e.target.value) }))}
                    min={0}
                    required
                  />
                </div> */}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddFormOpen(false);
                    setNewVariant({ images: [{ file: null, url: '' }], attributes: [], sellPrice: 0 });
                    setSelectedParentAttribute(null);
                    setSelectedChildAttribute(null);
                    setError(null);
                  }} disabled={isAddingVariant}>
                    {config.form.buttons.cancel}
                  </Button>
                  <Button type="submit" disabled={isAddingVariant} className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-5 shadow-sm transition-all">
                    {isAddingVariant ? config.form.buttons.add : config.form.buttons.add}
                  </Button>
                </div>
              </form>
            </div> 
          )}

          {isEditFormOpen && selectedVariant && (
            <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
              <form onSubmit={handleUpdateVariant} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm leading-relaxed">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="font-semibold">{config.form.fields.images} <span className="text-red-500">*</span></Label>
                    <div className="space-y-2">
                      {newVariant.images.map((image, index) => (
                        <div key={`edit-image-${index}`} className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageChange(index, e.target.files?.[0] || null)}
                            required={!image.url && !image.file} // Chỉ required nếu không có url và không có file
                            disabled={isAddingVariant}
                          />
                          {image.url && (
                            <img src={image.url} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveImage(index)}
                            disabled={isAddingVariant}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddImage}
                        disabled={isAddingVariant}
                      >
                        Add Image
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-slate-700">{config.form.fields.attributes} <span className="text-red-500">*</span></Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-1">
                      <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
                        <Label className="font-semibold text-slate-700 text-sm tracking-wide">{config.form.fields.parentAttributes}</Label>
                        <div className="space-y-2 mt-3">
                          {attributes.parentAttributes.map((attr) => (
                            <label key={`edit-parent-attr-${attr._id}`} htmlFor={`edit-parent-${attr._id}`} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border transition-all cursor-pointer ${selectedParentAttribute === attr._id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                              <input
                                type="radio"
                                id={`edit-parent-${attr._id}`}
                                name="parentAttribute"
                                checked={selectedParentAttribute === attr._id}
                                onChange={() => handleParentAttributeChange(attr._id)}
                                required
                                disabled={isAddingVariant}
                                className="h-4 w-4"
                              />
                              <span className="font-medium">{attr.value}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
                        <Label className="font-semibold text-slate-700 text-sm tracking-wide">{config.form.fields.childAttributes}</Label>
                        <div className="space-y-2 mt-3">
                          {selectedParentAttribute && attributes.childAttributes
                            .filter(attr => attr.parentId && attr.parentId._id === selectedParentAttribute)
                            .map((attr) => (
                              <label key={`edit-child-attr-${attr._id}`} htmlFor={`edit-child-${attr._id}`} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border transition-all cursor-pointer ${selectedChildAttribute === attr._id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                <input
                                  type="radio"
                                  id={`edit-child-${attr._id}`}
                                  name="childAttribute"
                                  checked={selectedChildAttribute === attr._id}
                                  onChange={() => handleChildAttributeChange(attr._id)}
                                  disabled={!selectedParentAttribute || isAddingVariant}
                                  required
                                  className="h-4 w-4"
                                />
                                <span className="font-medium">{attr.value}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-amber-800 flex-shrink-0">Giá bán:</span>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Input
                            id="edit-price"
                            type="text"
                            inputMode="numeric"
                            value={newVariant.sellPrice > 0 ? newVariant.sellPrice.toLocaleString('vi-VN') : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              const num = raw ? parseInt(raw, 10) : 0;
                              setNewVariant(prev => ({ ...prev, sellPrice: num }));
                            }}
                            min={0}
                            required
                            className="w-44 h-10 border-amber-300 focus:border-amber-500 rounded-xl pr-7 text-right font-bold text-amber-900 bg-white"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-500 text-xs pointer-events-none font-bold">₫</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsEditFormOpen(false);
                        setSelectedVariant(null);
                        setNewVariant({
                          images: [{ file: null, url: '' }],
                          attributes: [],
                          sellPrice: 0
                        });
                        setSelectedParentAttribute(null);
                        setSelectedChildAttribute(null);
                        setError(null);
                      }} disabled={isAddingVariant}>
                        {config.form.buttons.cancel}
                      </Button>
                      <Button type="submit" disabled={isAddingVariant} className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-5 shadow-sm transition-all">
                        {isAddingVariant ? config.form.buttons.save : config.form.buttons.save}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div>{config.loading}</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : variants.length === 0 ? (
            <div className="text-center py-4">{config.empty}</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="w-[50px] text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.no}</TableHead>
                    <TableHead className="min-w-[200px] text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.attributes}</TableHead>
                    <TableHead className="w-[120px] text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.sellPrice}</TableHead>
                    <TableHead className="w-[120px] text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.totalQuantity}</TableHead>
                    <TableHead className="min-w-[150px] text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.images}</TableHead>
                    <TableHead className="w-[100px] text-right text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant, index) => (
                    <TableRow key={`variant-${variant._id}`} className="align-middle hover:bg-slate-50/70 transition-colors">
                      <TableCell className="w-[50px] py-4 align-middle">{index + 1}</TableCell>
                      <TableCell className="min-w-[200px] py-4 align-middle">
                        <div className="flex flex-wrap gap-1.5">
                          {variant.attribute.map((attr, i) => (
                            <Badge key={`variant-attr-${attr._id}`} variant="secondary" className="rounded-full px-2.5 py-0.5 border border-slate-200 bg-slate-100 text-slate-700">
                              {attr.parentId ? `${attr.parentId.value}: ` : ''}{attr.value}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px] py-4 align-middle font-medium text-slate-700">
                        {formatVND(variant.sellPrice)}
                      </TableCell>
                      <TableCell className="w-[120px] py-4 align-middle">
                        {variantQuantities[variant._id] !== undefined ? (
                          <span className="inline-flex min-w-8 justify-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                            {variantQuantities[variant._id]}
                          </span>
                        ) : (
                          <span className="text-gray-400">...</span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[150px] py-4 align-middle">
                        <div className="flex gap-2 items-center">
                          {variant.images.map((image, i) => (
                            <img
                              key={`variant-image-${i}`}
                              src={image.url}
                              alt={`Variant ${index + 1} image ${i + 1}`}
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-sm"
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="w-[100px] py-4 align-middle text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Manage Import"
                            onClick={() => {
                              setSelectedVariantForImport(variant);
                              setIsImportModalOpen(true);
                            }}
                          >
                            <Warehouse className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit Variant"
                            onClick={() => handleEditVariant(variant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Variant"
                            onClick={() => handleDeleteVariant(variant._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-2 -mx-6 px-6 py-3 bg-white border-t border-slate-200">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100">
                {config.form.buttons.cancel}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {selectedVariantForImport && (
        <ImportManagementModal
          variant={selectedVariantForImport}
          product={product}
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setSelectedVariantForImport(null);
            if (importChanged) {
              // Reload lại variants và quantity khi có thay đổi
              fetchVariants();
              setImportChanged(false);
            }
          }}
          onVariantUpdate={(updatedVariant) => {
            setVariants((prev) => prev.map(v => v._id === updatedVariant._id ? { ...v, sellPrice: updatedVariant.sellPrice } : v));
            setSelectedVariantForImport((prev) => prev && prev._id === updatedVariant._id ? { ...prev, sellPrice: updatedVariant.sellPrice } : prev);
          }}
          onImportChanged={() => setImportChanged(true)}
        />
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl shadow-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800">Xác nhận xoá biến thể</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed">
              Bạn có chắc chắn muốn xoá biến thể này không? <br />Hành động này <strong>không thể hoàn tác</strong>.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setVariantToDelete(null);
              }}
              className="rounded-xl border-slate-300 text-slate-600"
            >
              Huỷ bỏ
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteVariant}
              className="rounded-xl font-semibold"
            >
              Xoá biến thể
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

interface AddProductModalProps {
  onSave: (product: Product) => void;
  onClose: () => void;
  isOpen: boolean;
}

function AddProductModal({ onSave, onClose, isOpen }: AddProductModalProps) {
  const [level1Categories, setLevel1Categories] = useState<Array<{ _id: string; name: string; description: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: ''
  });
  // Đổi sang multi-select giống Edit
  const [selectedParentCategories, setSelectedParentCategories] = useState<string[]>([]);
  const [selectedChildCategories, setSelectedChildCategories] = useState<Record<string, string | null>>({});
  const [selectedGrandChildCategories, setSelectedGrandChildCategories] = useState<Record<string, string | null>>({});
  const [categorySets, setCategorySets] = useState<Record<string, CategorySet>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitRef = useRef(false);
  const { request } = useApi();
  const [variants, setVariants] = useState<Array<{
    images: Array<{ url: string }>;
    attributes: string[];
    sellPrice: number;
  }>>([]);
  const [attributes, setAttributes] = useState<{ parentAttributes: Attribute[]; childAttributes: Attribute[] }>({ parentAttributes: [], childAttributes: [] });
  const [selectedParentAttribute, setSelectedParentAttribute] = useState<string | null>(null);
  const [selectedChildAttribute, setSelectedChildAttribute] = useState<string | null>(null);
  const [isAddVariantFormOpen, setIsAddVariantFormOpen] = useState(false);
  const [newVariant, setNewVariant] = useState({
    images: [{ file: null as File | null, url: '' }],
    attributes: [] as string[],
    sellPrice: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAddingVariantAddProduct, setIsAddingVariantAddProduct] = useState(false); // Thêm state riêng cho modal này

  // Lấy config ngôn ngữ và label cho child/grandchild category
  const { lang } = useLanguage();
  const pagesConfig = lang === 'vi' ? viConfig : enConfig;
  const config = pagesConfig.manageProduct?.form || {};
  const childCategoryLabel = (config.fields as any)?.childCategory || 'Child Category';
  const grandchildCategoryLabel = (config.fields as any)?.grandchildCategory || 'Grandchild Category';

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      submitRef.current = false;
      setError(null);
      setFormData({ name: '', description: '', brand: '' });
      setSelectedParentCategories([]);
      setSelectedChildCategories({});
      setSelectedGrandChildCategories({});
      setCategorySets({});
      setVariants([]);
      setAttributes({ parentAttributes: [], childAttributes: [] });
      setSelectedParentAttribute(null);
      setSelectedChildAttribute(null);
      setIsAddVariantFormOpen(false);
      setNewVariant({ images: [{ file: null, url: '' }], attributes: [], sellPrice: 0 });
      setSelectedFile(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  // Fetch level 1 categories when modal opens
  useEffect(() => {
    const fetchLevel1Categories = async () => {
      try {
        const response = await request(() => api.get('/categories/parent'));
        if (response && response.success) {
          console.log(response.data)
          setLevel1Categories(response.data);
        }
      } catch (error) {
        setError('Failed to fetch categories');
      }
    };
    if (isOpen) {
      fetchLevel1Categories();
    }
  }, [isOpen]);

  // Khi chọn parent attribute, fetch child attribute động (nếu cần)
  useEffect(() => {
    if (!selectedParentAttribute) {
      setSelectedChildAttribute(null);
      return;
    }
    // Không cần fetch lại vì đã lấy hết child attribute ở trên
  }, [selectedParentAttribute]);

  const handleParentCategoryChange = async (categoryId: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedParentCategories, categoryId]
      : selectedParentCategories.filter(id => id !== categoryId);
    setSelectedParentCategories(newSelected);
    if (checked) {
      // Fetch child categories for the selected parent
      try {
        const response = await request(() => api.get(`/categories/child-categories/${categoryId}`));
        setCategorySets(prev => ({ ...prev, [categoryId]: { level2: response.data || [], level3: [] } }));
        setSelectedChildCategories(prev => ({ ...prev, [categoryId]: null }));
        setSelectedGrandChildCategories(prev => ({ ...prev, [categoryId]: null }));
      } catch {}
    } else {
      // Remove child/grandchild for this parent
      setCategorySets(prev => { const p = { ...prev }; delete p[categoryId]; return p; });
      setSelectedChildCategories(prev => { const p = { ...prev }; delete p[categoryId]; return p; });
      setSelectedGrandChildCategories(prev => { const p = { ...prev }; delete p[categoryId]; return p; });
    }
  };

  const handleChildCategoryChange = async (parentId: string, childId: string) => {
    setSelectedChildCategories(prev => ({ ...prev, [parentId]: childId }));
    setSelectedGrandChildCategories(prev => ({ ...prev, [parentId]: null }));
    // Fetch grandchild
    try {
      const response = await request(() => api.get(`/categories/child-categories/${childId}`));
      setCategorySets(prev => ({ ...prev, [parentId]: { ...prev[parentId], level3: response.data || [] } }));
    } catch {}
  };
  // Handle grandchild per parent
  const handleGrandChildCategoryChange = (parentId: string, grandId: string) => {
    setSelectedGrandChildCategories(prev => ({ ...prev, [parentId]: grandId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitRef.current || isSubmitting) return;
    submitRef.current = true;
    setError(null);
    try {
      setIsSubmitting(true);
      if (!formData.name || !formData.description) throw new Error('Name and description are required');
      if (selectedParentCategories.length === 0) throw new Error('Please select at least one parent category');
      // Build categories giống Edit
      const categories: { categoryId: string }[] = [];
      selectedParentCategories.forEach(parentId => {
        if (!level1Categories.find(c => c._id === parentId)) return;
        categories.push({ categoryId: parentId });
        const childId = selectedChildCategories[parentId];
        if (childId && categorySets[parentId]?.level2.find(c => c._id === childId)) {
          categories.push({ categoryId: childId });
          const grandId = selectedGrandChildCategories[parentId];
          if (grandId && categorySets[parentId]?.level3.find(c => c._id === grandId)) {
            categories.push({ categoryId: grandId });
          }
        }
      });
      const submitData = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        categories
      };
      const response = await request(() => api.post('/products', submitData));
      if (response.success) {
        const createdProduct = response.data;
        // Tạo các variant nếu có
        if (variants.length > 0) {
          for (const variant of variants) {
            try {
              const formData = new FormData();
              variant.images.forEach((img: any) => {
                if (img.file) {
                  formData.append('images', img.file);
                }
              });
              variant.attributes.forEach((attrId: string) => {
                formData.append('attributes', attrId);
              });
              formData.append('sellPrice', String(variant.sellPrice));
              await request(() => api.post(
                `/products/${createdProduct._id}/variant`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
              ));
            } catch (err) {
              // Có thể log lỗi từng variant nếu muốn
              console.error('Error creating variant:', err);
            }
          }
        }
        onSave(createdProduct);
        onClose();
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
      submitRef.current = false;
    }
  };

  const handleAddVariant = () => {
    if (isAddingVariantAddProduct) return;
    if (newVariant.images.length === 0 || newVariant.images.some(img => !img.file)) {
      setError('Please add at least one image');
      return;
    }
    if (!selectedParentAttribute) {
      setError('Please select a parent attribute');
      return;
    }
    if (!selectedChildAttribute) {
      setError('Please select a child attribute');
      return;
    }
    setIsAddingVariantAddProduct(true);
    setVariants([
      ...variants,
      { ...newVariant, images: newVariant.images.map(img => ({ file: img.file, url: img.url })) }
    ]);
    setIsAddVariantFormOpen(false);
    setNewVariant({ images: [{ file: null, url: '' }], attributes: [], sellPrice: 0 });
    setSelectedParentAttribute(null);
    setSelectedChildAttribute(null);
    setError(null);
    setTimeout(() => setIsAddingVariantAddProduct(false), 300); // reset sau khi thêm xong
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    setNewVariant(prev => ({ ...prev, images: [...prev.images, { file: null, url: '' }] }));
  };

  const handleRemoveImage = (index: number) => {
    setNewVariant(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleImageChange = (index: number, file: File | null) => {
    setNewVariant(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? { file, url: file ? URL.createObjectURL(file) : '' } : img)
    }));
  };

  const handleParentAttributeChange = (attributeId: string) => {
    setSelectedParentAttribute(attributeId);
    setSelectedChildAttribute(null);
    setNewVariant(prev => ({ ...prev, attributes: [attributeId] }));
  };

  const handleChildAttributeChange = (attributeId: string) => {
    setSelectedChildAttribute(attributeId);
    setNewVariant(prev => ({ ...prev, attributes: selectedParentAttribute ? [selectedParentAttribute, attributeId] : [attributeId] }));
  };

  const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setNewVariant(prev => ({ ...prev, images: [{ file, url: '' }] })); // reset url, sẽ upload file
    }
  };

  // Thêm vào trong AddProductModal, sau khi setSelectedParentCategories trong handleParentCategoryChange:
  // Sau khi cập nhật selectedParentCategories, fetch attributes cho tất cả category đã chọn
  const fetchAttributesForCategories = async (categoryIds: string[]) => {
    if (categoryIds.length === 0) {
      setAttributes({ parentAttributes: [], childAttributes: [] });
      return;
    }
    try {
      // Gọi API lấy attribute cho nhiều category
      const response = await request(() => api.attributes.getByCategory(categoryIds));
      if (response.success) {
        // Nếu response.data là mảng attribute (theo utils/axios.js)
        // Nếu backend trả về { data: [...] }
        setAttributes({
          parentAttributes: response.data.filter((attr: any) => !attr.parentId),
          childAttributes: response.data.filter((attr: any) => attr.parentId)
        });
      } else if (response.data && response.data.attributes) {
        // Nếu backend trả về { attributes: [...] }
        setAttributes({
          parentAttributes: response.data.attributes.filter((attr: any) => !attr.parentId),
          childAttributes: response.data.attributes.filter((attr: any) => attr.parentId)
        });
      } else {
        setAttributes({ parentAttributes: [], childAttributes: [] });
      }
    } catch (err) {
      setAttributes({ parentAttributes: [], childAttributes: [] });
    }
  };

  // Gọi hàm fetchAttributesForCategories mỗi khi selectedParentCategories thay đổi
  useEffect(() => {
    fetchAttributesForCategories(selectedParentCategories);
    // Reset selected attribute khi đổi category
    setSelectedParentAttribute(null);
    setSelectedChildAttribute(null);
  }, [selectedParentCategories]);

  // Fetch child attributes when selectedParentAttribute changes
  useEffect(() => {
    const fetchChildAttributes = async () => {
      if (selectedParentAttribute) {
        try {
          const response = await request(() => api.get(`/products/child-attributes/parent/${selectedParentAttribute}`));
          if (response.success) {
            setAttributes(prev => ({
              ...prev,
              childAttributes: response.data
            }));
          } else {
            setAttributes(prev => ({ ...prev, childAttributes: [] }));
          }
        } catch (err) {
          setAttributes(prev => ({ ...prev, childAttributes: [] }));
        }
      } else {
        setAttributes(prev => ({ ...prev, childAttributes: [] }));
      }
    };
    fetchChildAttributes();
  }, [selectedParentAttribute]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[980px] max-h-[92vh] p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden flex flex-col gap-0 [&>button]:text-white [&>button]:bg-transparent [&>button]:border-0 [&>button]:shadow-none [&>button]:opacity-100 [&>button:hover]:text-white [&>button:hover]:bg-transparent [&>button:focus]:ring-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-white">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-7 py-4 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[1.75rem] font-bold text-white tracking-tight">{config.addTitle}</DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="space-y-6 overflow-y-auto flex-1 px-7 py-7 bg-white">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm leading-relaxed">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white via-slate-50/80 to-blue-50/40 p-7 rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[13px] font-semibold text-slate-600 tracking-wide">{config.fields.name} <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="mt-1 h-11 rounded-xl border-slate-300 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-[15px]"
                />
              </div>
              <div>
                <Label htmlFor="brand" className="text-[13px] font-semibold text-slate-600 tracking-wide">{config.fields.brand}</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="mt-1 h-11 rounded-xl border-slate-300 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-[15px]"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-[13px] font-semibold text-slate-600 tracking-wide">{config.fields.description} <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                className="mt-1 min-h-[124px] rounded-xl border-slate-300 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-[15px]"
              />
            </div>
          </div>
          <div className="bg-gradient-to-b from-white to-slate-50/60 p-6 rounded-2xl border border-slate-200 shadow-sm">
            <Label className="text-sm font-semibold text-slate-700 mb-3 block">{config.fields.categories} <span className="text-red-500">*</span></Label>
            <div className="space-y-2.5">
              {level1Categories.map((category) => (
                <div key={`parent-${category._id}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`parent-${category._id}`}
                      checked={selectedParentCategories.includes(category._id)}
                      onChange={e => handleParentCategoryChange(category._id, e.target.checked)}
                    />
                    <Label htmlFor={`parent-${category._id}`} className="font-semibold text-slate-800">{category.name}</Label>
                  </div>
                  {selectedParentCategories.includes(category._id) && (
                    <div className="ml-5 mt-1 border-l-2 border-blue-100 pl-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <Label className="font-semibold text-slate-700 text-[13px] tracking-wide">{childCategoryLabel}</Label>
                          <div className="space-y-1.5 mt-2">
                            {categorySets[category._id]?.level2.map((child) => (
                              <label key={`child-${child._id}`} htmlFor={`child-${category._id}-${child._id}`} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 border transition-all cursor-pointer text-[15px] ${selectedChildCategories[category._id] === child._id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-transparent hover:border-slate-200 hover:bg-white text-slate-700'}`}>
                                <input
                                  type="radio"
                                  id={`child-${category._id}-${child._id}`}
                                  name={`childCategory-${category._id}`}
                                  checked={selectedChildCategories[category._id] === child._id}
                                  onChange={() => handleChildCategoryChange(category._id, child._id)}
                                  className="h-4 w-4"
                                />
                                <span className="font-medium">{child.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <Label className="font-semibold text-slate-700 text-[13px] tracking-wide">{grandchildCategoryLabel}</Label>
                          <div className="space-y-1.5 mt-2">
                            {selectedChildCategories[category._id] && categorySets[category._id]?.level3.map((grand) => (
                              <label key={`grandchild-${grand._id}`} htmlFor={`grandchild-${category._id}-${grand._id}`} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 border transition-all cursor-pointer text-[15px] ${selectedGrandChildCategories[category._id] === grand._id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-transparent hover:border-slate-200 hover:bg-white text-slate-700'}`}>
                                <input
                                  type="radio"
                                  id={`grandchild-${category._id}-${grand._id}`}
                                  name={`grandchildCategory-${category._id}`}
                                  checked={selectedGrandChildCategories[category._id] === grand._id}
                                  onChange={() => handleGrandChildCategoryChange(category._id, grand._id)}
                                  className="h-4 w-4"
                                />
                                <span className="font-medium">{grand.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-b from-white to-slate-50/60 p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-700 tracking-wide">{pagesConfig.manageProduct.variant.title}</h3>
              <Button
                type="button"
                onClick={() => setIsAddVariantFormOpen(true)}
                disabled={selectedParentCategories.length === 0}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 h-9 shadow-sm disabled:opacity-50"
              >
                + {pagesConfig.manageProduct.variant.addNewButton}
              </Button>
            </div>
            {variants.length > 0 && (
              <div className="space-y-2.5 mb-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{pagesConfig.manageProduct.variant.table.headers.no} {variants.length}</h4>
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-center justify-between px-3.5 py-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-slate-700"><span className="font-semibold">{pagesConfig.manageProduct.variant.table.headers.images}:</span> {variant.images.length}</div>
                      <div className="text-sm text-slate-700"><span className="font-semibold">{pagesConfig.manageProduct.variant.table.headers.attributes}:</span> {variant.attributes.length}</div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveVariant(index)} className="rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
            {isAddVariantFormOpen && (
              <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md font-semibold text-center">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="font-semibold">{pagesConfig.manageProduct.variant.form.fields.images} <span className="text-red-500">*</span></Label>
                    <div className="space-y-2">
                      {newVariant.images.map((image, index) => (
                        <div key={`image-${index}`} className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageChange(index, e.target.files?.[0] || null)}
                            required={index === 0}
                            disabled={isAddingVariantAddProduct}
                            className="h-10 rounded-xl border-slate-300 bg-white"
                          />
                          {image.url && (
                            <img src={image.url} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveImage(index)}
                            disabled={isAddingVariantAddProduct}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddImage}
                        disabled={isAddingVariantAddProduct}
                        className="rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100"
                      >
                        + {pagesConfig.manageProduct.variant.form.fields.images}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-slate-700">{pagesConfig.manageProduct.variant.form.fields.attributes} <span className="text-red-500">*</span></Label>
                    <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                      <div className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/70 to-cyan-50/30 p-3">
                        <Label className="text-[13px] font-semibold text-blue-700 tracking-wide">{pagesConfig.manageProduct.variant.form.fields.parentAttributes}</Label>
                        <div className="space-y-1.5 mt-2">
                          {attributes.parentAttributes.map((attr) => (
                            <label key={`parent-attr-${attr._id}`} htmlFor={`parent-${attr._id}`} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 border transition-all cursor-pointer text-[15px] ${selectedParentAttribute === attr._id ? 'border-blue-300 bg-blue-100/80 text-blue-700' : 'border-transparent hover:border-blue-200 hover:bg-white text-slate-700'}`}>
                              <input
                                type="radio"
                                id={`parent-${attr._id}`}
                                name="parentAttribute"
                                checked={selectedParentAttribute === attr._id}
                                onChange={() => handleParentAttributeChange(attr._id)}
                                required
                                disabled={isAddingVariantAddProduct}
                                className="h-4 w-4"
                              />
                              <span className="font-medium">{attr.value}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/70 to-cyan-50/30 p-3">
                        <Label className="text-[13px] font-semibold text-blue-700 tracking-wide">{pagesConfig.manageProduct.variant.form.fields.childAttributes}</Label>
                        <div className="space-y-1.5 mt-2">
                          {selectedParentAttribute && attributes.childAttributes
                            .filter(attr => attr.parentId && attr.parentId._id === selectedParentAttribute)
                            .map((attr) => (
                              <label key={`child-attr-${attr._id}`} htmlFor={`child-${attr._id}`} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 border transition-all cursor-pointer text-[15px] ${selectedChildAttribute === attr._id ? 'border-blue-300 bg-blue-100/80 text-blue-700' : 'border-transparent hover:border-blue-200 hover:bg-white text-slate-700'}`}>
                                <input
                                  type="radio"
                                  id={`child-${attr._id}`}
                                  name="childAttribute"
                                  checked={selectedChildAttribute === attr._id}
                                  onChange={() => handleChildAttributeChange(attr._id)}
                                  disabled={!selectedParentAttribute || isAddingVariantAddProduct}
                                  required
                                  className="h-4 w-4"
                                />
                                <span className="font-medium">{attr.value}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      {/* <Label htmlFor="price">{pagesConfig.manageProduct.variant.form.fields.sellPrice} <span className="text-red-500">*</span></Label> */}
                      {/* <Input
                        id="price"
                        type="number"
                        value={newVariant.sellPrice}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, sellPrice: Number(e.target.value) }))}
                        min={0}
                        required
                      /> */}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsAddVariantFormOpen(false);
                        setNewVariant({ images: [{ file: null, url: '' }], attributes: [], sellPrice: 0 });
                        setSelectedParentAttribute(null);
                        setSelectedChildAttribute(null);
                        setError(null);
                      }} disabled={isAddingVariantAddProduct}>
                        {pagesConfig.manageProduct.variant.form.buttons.cancel}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddVariant}
                        disabled={isAddingVariantAddProduct}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-5 shadow-sm"
                      >
                        {isAddingVariantAddProduct ? pagesConfig.manageProduct.variant.form.buttons.add : pagesConfig.manageProduct.variant.form.buttons.add}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
          <div className="mt-2 -mx-7 px-7 py-4 bg-white border-t border-slate-200">
            <div className="flex justify-end gap-2 pr-1">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100 px-6">
                {config.buttons.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 shadow-sm transition-all">
                {isSubmitting ? config.buttons.add : config.buttons.add}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ImportBatch {
  _id: string;
  variantId: string;
  importDate: string;
  quantity: number;
  costPrice: number;
}

interface ImportManagementModalProps {
  variant: ProductVariant;
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onVariantUpdate?: (updatedVariant: ProductVariant) => void;
  onImportChanged?: () => void;
}

function ImportManagementModal({ variant, product, isOpen, onClose, onVariantUpdate, onImportChanged }: ImportManagementModalProps) {
  const { lang } = useLanguage();
  const pagesConfig = lang === 'vi' ? viConfig : enConfig;
  const config = pagesConfig.manageProduct.import;
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [newBatch, setNewBatch] = useState({
    importDate: new Date().toISOString().split('T')[0],
    quantity: 0,
    costPrice: 0
  });
  const [quantityStr, setQuantityStr] = useState('');
  const [costPriceStr, setCostPriceStr] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ importDate?: string; quantity?: string; costPrice?: string }>({});
  const [sellPrice, setSellPrice] = useState<number>(variant.sellPrice);
  const [sellPriceStr, setSellPriceStr] = useState('');
  const [isUpdatingSellPrice, setIsUpdatingSellPrice] = useState(false);
  const [sellPriceError, setSellPriceError] = useState<string | null>(null);
  const { request } = useApi();

  useEffect(() => {
    setSellPrice(variant.sellPrice);
    setSellPriceStr(variant.sellPrice > 0 ? variant.sellPrice.toLocaleString('vi-VN') : '');
  }, [variant.sellPrice, variant._id]);

  useEffect(() => {
    const fetchImportBatches = async () => {
      try {
        const response = await request(() => api.get(`/products/import-batches/${variant._id}`));
        if (response.success) {
          setImportBatches(response.data);
        } else {
          setError(response.message || 'Không thể tải danh sách lô nhập hàng');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) fetchImportBatches();
  }, [isOpen, variant._id]);

  const resetForm = () => {
    setNewBatch({ importDate: new Date().toISOString().split('T')[0], quantity: 0, costPrice: 0 });
    setQuantityStr('');
    setCostPriceStr('');
    setFieldErrors({});
    setError(null);
  };

  const validateForm = () => {
    const errors: { importDate?: string; quantity?: string; costPrice?: string } = {};
    if (!newBatch.importDate) errors.importDate = 'Vui lòng chọn ngày nhập hàng';
    if (newBatch.quantity <= 0 || !Number.isInteger(newBatch.quantity)) errors.quantity = 'Số lượng phải là số nguyên lớn hơn 0';
    if (newBatch.costPrice <= 0) errors.costPrice = 'Giá vốn phải lớn hơn 0 ₫';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const response = await request(() => api.post(`/products/import-batches/${variant._id}`, newBatch));
      if (response.success) {
        setImportBatches([...importBatches, response.data]);
        setIsAddFormOpen(false);
        resetForm();
        if (onImportChanged) onImportChanged();
      } else {
        setError(response.message || 'Không thể thêm lô nhập hàng');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditBatch = (batch: ImportBatch) => {
    setSelectedBatch(batch);
    setNewBatch({ importDate: batch.importDate.split('T')[0], quantity: batch.quantity, costPrice: batch.costPrice });
    setQuantityStr(batch.quantity.toString());
    setCostPriceStr(batch.costPrice.toLocaleString('vi-VN'));
    setFieldErrors({});
    setIsEditFormOpen(true);
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !validateForm()) return;
    try {
      const response = await request(() => api.put(`/products/import-batches/${selectedBatch._id}`, newBatch));
      if (response.success) {
        setImportBatches(importBatches.map(b => b._id === selectedBatch._id ? response.data : b));
        setIsEditFormOpen(false);
        setSelectedBatch(null);
        resetForm();
        if (onImportChanged) onImportChanged();
      } else {
        setError(response.message || 'Không thể cập nhật lô nhập hàng');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    setBatchToDelete(batchId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    try {
      await request(() => api.delete(`/products/import-batches/${batchToDelete}`));
      setImportBatches(importBatches.filter(batch => batch._id !== batchToDelete));
      setIsDeleteDialogOpen(false);
      setBatchToDelete(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalQuantity = importBatches.reduce((sum, b) => sum + b.quantity, 0);
  const averageCostPrice = importBatches.length > 0 && totalQuantity > 0
    ? importBatches.reduce((sum, b) => sum + b.costPrice * b.quantity, 0) / totalQuantity
    : 0;
  const totalInventoryValue = importBatches.reduce((sum, b) => sum + b.quantity * b.costPrice, 0);
  const profitMargin = averageCostPrice > 0 && sellPrice > 0 ? ((sellPrice - averageCostPrice) / sellPrice * 100) : null;
  const variantAttributes = variant.attribute.map(attr => attr.parentId ? `${attr.parentId.value}: ${attr.value}` : attr.value).join(', ');

  function formatVND(amount: number) { return amount.toLocaleString('vi-VN') + ' ₫'; }

  const handleSellPriceUpdate = async (newPrice: number) => {
    if (newPrice <= 0) { setSellPriceError('Giá bán phải lớn hơn 0 ₫'); return; }
    setIsUpdatingSellPrice(true);
    setSellPriceError(null);
    try {
      const formData = new FormData();
      formData.append('sellPrice', String(newPrice));
      const response = await request(() => api.put(`/products/variant/${variant._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
      if (!response.success) {
        setSellPriceError(response.message || 'Không thể cập nhật giá bán');
        setSellPrice(variant.sellPrice);
        setSellPriceStr(variant.sellPrice.toLocaleString('vi-VN'));
      } else {
        const variantRes = await request(() => api.get(`/products/product-variant/${variant.product_id}`));
        if (variantRes.success && Array.isArray(variantRes.data)) {
          const updated = variantRes.data.find((v: ProductVariant) => v._id === variant._id);
          if (updated) { setSellPrice(updated.sellPrice); setSellPriceStr(updated.sellPrice.toLocaleString('vi-VN')); if (onVariantUpdate) onVariantUpdate(updated); }
        }
      }
    } catch (err: any) {
      setSellPriceError(err.message || 'Không thể cập nhật giá bán');
      setSellPrice(variant.sellPrice);
      setSellPriceStr(variant.sellPrice.toLocaleString('vi-VN'));
    } finally {
      setIsUpdatingSellPrice(false);
    }
  };

  const renderBatchForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string, onCancel: () => void) => (
    <form onSubmit={onSubmit} noValidate>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block"></span>
          {submitLabel === 'Thêm lô' ? 'Thêm lô nhập hàng mới' : 'Chỉnh sửa lô nhập hàng'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="importDate" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Ngày nhập <span className="text-red-500">*</span>
            </Label>
            <Input
              id="importDate"
              type="date"
              value={newBatch.importDate}
              onChange={e => { setNewBatch(p => ({ ...p, importDate: e.target.value })); setFieldErrors(fe => ({ ...fe, importDate: undefined })); }}
              className={`h-10 rounded-xl border-slate-300 focus:border-blue-500 transition-colors ${fieldErrors.importDate ? 'border-red-400 bg-red-50/50 focus:border-red-400' : ''}`}
            />
            {fieldErrors.importDate && <p className="text-red-500 text-xs flex items-center gap-1 mt-1"><span className="text-red-500">⚠</span>{fieldErrors.importDate}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Số lượng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="text"
              inputMode="numeric"
              placeholder="Ví dụ: 100"
              value={quantityStr}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '');
                setQuantityStr(raw);
                setNewBatch(p => ({ ...p, quantity: raw ? parseInt(raw, 10) : 0 }));
                setFieldErrors(fe => ({ ...fe, quantity: undefined }));
              }}
              className={`h-10 rounded-xl border-slate-300 focus:border-blue-500 transition-colors ${fieldErrors.quantity ? 'border-red-400 bg-red-50/50 focus:border-red-400' : ''}`}
            />
            {fieldErrors.quantity && <p className="text-red-500 text-xs flex items-center gap-1 mt-1"><span>⚠</span>{fieldErrors.quantity}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="costPrice" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Giá vốn <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="costPrice"
                type="text"
                inputMode="numeric"
                placeholder="Ví dụ: 50.000"
                value={costPriceStr}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const num = raw ? parseInt(raw, 10) : 0;
                  setCostPriceStr(num > 0 ? num.toLocaleString('vi-VN') : raw);
                  setNewBatch(p => ({ ...p, costPrice: num }));
                  setFieldErrors(fe => ({ ...fe, costPrice: undefined }));
                }}
                onBlur={() => { if (newBatch.costPrice > 0) setCostPriceStr(newBatch.costPrice.toLocaleString('vi-VN')); }}
                className={`h-10 rounded-xl border-slate-300 focus:border-blue-500 transition-colors pr-7 ${fieldErrors.costPrice ? 'border-red-400 bg-red-50/50 focus:border-red-400' : ''}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none font-medium">₫</span>
            </div>
            {newBatch.costPrice > 0 && !fieldErrors.costPrice && (
              <p className="text-xs text-blue-600 font-medium mt-1">{formatVND(newBatch.costPrice)}</p>
            )}
            {fieldErrors.costPrice && <p className="text-red-500 text-xs flex items-center gap-1 mt-1"><span>⚠</span>{fieldErrors.costPrice}</p>}
          </div>
        </div>
        {newBatch.quantity > 0 && newBatch.costPrice > 0 && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-sm text-blue-700 font-medium">
            Tổng tiền lô nhập: <span className="font-bold">{formatVND(newBatch.quantity * newBatch.costPrice)}</span>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200/80">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100">
            Huỷ bỏ
          </Button>
          <Button type="submit" size="sm" className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-5 shadow-sm transition-all">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[960px] max-h-[92vh] p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden flex flex-col gap-0 [&>button]:text-white [&>button]:bg-transparent [&>button]:border-0 [&>button]:shadow-none [&>button]:opacity-100 [&>button:hover]:text-white [&>button:hover]:bg-transparent [&>button:focus]:ring-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-white">
        {/* Dark gradient header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-4 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold leading-snug">
              Quản lý Lô nhập hàng
            </DialogTitle>
            <p className="text-slate-300 text-sm mt-0.5 font-medium">{product.name} · {variantAttributes}</p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-5 bg-white">
          {/* Variant Info Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
            {[
              { label: 'Sản phẩm', value: product.name },
              { label: 'Thương hiệu', value: product.brand || '—' },
              { label: 'Thuộc tính', value: variantAttributes || '—' },
              { label: 'Danh mục', value: product.category.map(c => c.name).join(', ') },
            ].map(info => (
              <div key={info.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <span className="text-slate-400 text-xs font-medium block">{info.label}</span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block truncate" title={info.value}>{info.value}</span>
              </div>
            ))}
          </div>

          {/* Sell Price Row */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-amber-800 flex-shrink-0">Giá bán:</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  id="variant-sell-price"
                  type="text"
                  inputMode="numeric"
                  value={sellPriceStr}
                  placeholder="Nhập giá bán..."
                  disabled={isUpdatingSellPrice}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const num = raw ? parseInt(raw, 10) : 0;
                    setSellPriceStr(num > 0 ? num.toLocaleString('vi-VN') : raw);
                    setSellPrice(num);
                    setSellPriceError(null);
                  }}
                  onBlur={async () => {
                    if (sellPrice > 0) setSellPriceStr(sellPrice.toLocaleString('vi-VN'));
                    if (sellPrice === variant.sellPrice) return;
                    await handleSellPriceUpdate(sellPrice);
                  }}
                  className="w-40 h-9 border-amber-300 focus:border-amber-500 rounded-xl pr-7 text-right font-bold text-amber-900 bg-white"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-500 text-xs pointer-events-none font-bold">₫</span>
              </div>
              {isUpdatingSellPrice && <span className="text-xs text-amber-600 animate-pulse font-medium">Đang lưu...</span>}
              {sellPriceError && <span className="text-xs text-red-500 font-medium">⚠ {sellPriceError}</span>}
            </div>
            <p className="text-xs text-amber-600 ml-auto hidden sm:block italic">Nhập giá mới rồi bấm ra ngoài để lưu tự động</p>
          </div>

          {/* Add Button or Forms */}
          {!isAddFormOpen && !isEditFormOpen && (
            <Button
              type="button"
              onClick={() => { setIsAddFormOpen(true); resetForm(); }}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow gap-1.5 transition-all"
            >
              <span className="text-lg leading-none">+</span> Thêm Lô Nhập Hàng Mới
            </Button>
          )}
          {isAddFormOpen && renderBatchForm(handleAddBatch, 'Thêm lô', () => { setIsAddFormOpen(false); resetForm(); })}
          {isEditFormOpen && selectedBatch && renderBatchForm(handleUpdateBatch, 'Lưu thay đổi', () => { setIsEditFormOpen(false); setSelectedBatch(null); resetForm(); })}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Tổng số lượng</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-2">{totalQuantity.toLocaleString('vi-VN')}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Giá vốn trung bình</p>
              <p className="text-xl font-extrabold text-slate-800 mt-2">{averageCostPrice > 0 ? formatVND(Math.round(averageCostPrice)) : '—'}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Tổng giá trị tồn kho</p>
              <p className="text-xl font-extrabold text-blue-700 mt-2">{formatVND(totalInventoryValue)}</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border ${profitMargin !== null ? (profitMargin >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100') : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${profitMargin !== null ? (profitMargin >= 0 ? 'text-emerald-600' : 'text-red-500') : 'text-slate-500'}`}>Tỷ lệ lãi gộp</p>
              <p className={`text-xl font-extrabold mt-2 ${profitMargin !== null ? (profitMargin >= 0 ? 'text-emerald-700' : 'text-red-600') : 'text-slate-500'}`}>
                {profitMargin !== null ? `${profitMargin.toFixed(1)}%` : '—'}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Batches Table */}
          {loading ? (
            <div className="text-center py-10 text-slate-500">
              <p className="animate-pulse">Đang tải dữ liệu...</p>
            </div>
          ) : importBatches.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-5xl mb-3">📦</p>
              <p className="font-semibold text-slate-600 text-lg">Chưa có lô nhập hàng nào</p>
              <p className="text-sm mt-1 text-slate-400">Nhấn nút "+ Thêm Lô Nhập Hàng Mới" phía trên để bắt đầu</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide w-12">STT</TableHead>
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">Ngày nhập</TableHead>
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide text-right">Số lượng</TableHead>
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide text-right">Giá vốn</TableHead>
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide text-right">Tổng giá trị</TableHead>
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide text-center w-24">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importBatches.map((batch, index) => (
                    <TableRow key={`batch-${batch._id}`} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                      <TableCell className="text-slate-400 font-semibold text-sm">{index + 1}</TableCell>
                      <TableCell className="text-slate-700 font-semibold text-sm">
                        {new Date(batch.importDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-slate-800 text-sm bg-slate-100 px-2 py-0.5 rounded-lg">
                          {batch.quantity.toLocaleString('vi-VN')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-slate-600 text-sm font-medium">{formatVND(batch.costPrice)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-emerald-700 text-sm">{formatVND(batch.quantity * batch.costPrice)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors"
                            title="Chỉnh sửa lô này"
                            onClick={() => { setIsAddFormOpen(false); handleEditBatch(batch); }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors"
                            title="Xoá lô này"
                            onClick={() => handleDeleteBatch(batch._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100">
            Đóng
          </Button>
        </div>
      </DialogContent>

      {/* Delete Confirm Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl shadow-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">🗑 Xác nhận xoá lô nhập hàng</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed">
              Bạn có chắc chắn muốn xoá lô nhập hàng này không? <br />
              Hành động này <strong>không thể hoàn tác</strong>.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setBatchToDelete(null); }} className="rounded-xl border-slate-300 text-slate-600">
              Huỷ bỏ
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteBatch} className="rounded-xl font-semibold">
              Xoá lô nhập hàng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}



// Đặt interface PaginationProps ở ngoài function ProductPage
interface PaginationProps {
  filteredProducts: Product[];
  itemsPerPage: number;
  currentPage: number;
  setItemsPerPage: (value: number) => void;
  setCurrentPage: (value: number) => void;
}

// Đặt hàm formatVND ở đầu file, ngoài cùng
function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' vnđ';
}

export default function ProductPage() {
  const { lang } = useLanguage();
  const pagesConfig = lang === 'vi' ? viConfig : enConfig;
  const config = pagesConfig.manageProduct;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { request } = useApi();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Sorting handler
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        // Toggle direction
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Sort products
  const sortedProducts = React.useMemo(() => {
    const sortable = [...products];
    if (sortConfig) {
      sortable.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Product];
        let bValue: any = b[sortConfig.key as keyof Product];
        // Special handling for category
        if (sortConfig.key === 'category') {
          aValue = a.category[0]?.name || '';
          bValue = b.category[0]?.name || '';
        }
        // Fallback to string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    return sortable;
  }, [products, sortConfig]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await request(() => api.get('/products'));
        const productList: Product[] = response.data;

        // Batch-fetch first variant image for each product in parallel
        const withImages = await Promise.all(
          productList.map(async (product) => {
            try {
              const vRes = await api.get(`/products/product-variant/${product._id}`);
              const variants = vRes.data?.data || vRes.data || [];
              return { ...product, variants };
            } catch {
              return product;
            }
          })
        );
        setProducts(withImages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Lấy tất cả tên danh mục duy nhất từ products
  const allCategories = React.useMemo(() => {
    const names = products.flatMap(product => product.category.map(cat => cat.name));
    return Array.from(new Set(names));
  }, [products]);

  // Lọc sản phẩm theo danh mục đã chọn
  const filteredProducts = sortedProducts.filter(product => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category.some(cat => cat.name === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      const response = await request(() => 
        api.put(`/products/${updatedProduct._id}`, updatedProduct)
      );
      setProducts(products.map(p => p._id === updatedProduct._id ? response.data : p));
      setIsEditModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (!id) {
      console.error('No product ID provided for deletion');
      setError('Invalid product ID');
      return;
    }
    console.log('Setting product to delete:', id);
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) {
      console.error('No product ID available for deletion');
      setError('No product selected for deletion');
      return;
    }

    try {
      setIsDeleting(true);
      console.log('Deleting product with ID:', productToDelete);
      
      const response = await request(() => api.delete(`/products/${productToDelete}`));
      console.log('Delete response:', response);
      
      if (response.success) {
        // Remove the deleted product from the list
        setProducts(products.filter(product => product._id !== productToDelete));
        setError(null);
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    try {
      setProducts([...products, newProduct]);
      setIsAddModalOpen(false);
      setError(null);
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError(err.message);
    }
  };

  // ----- Stat helpers -----
  const totalProducts = products.length;
  const totalBrands = React.useMemo(() => new Set(products.map(p => p.brand).filter(Boolean)).size, [products]);
  const totalCats = React.useMemo(() => new Set(products.flatMap(p => p.category.map(c => c.name))).size, [products]);

  function Pagination({ filteredProducts, itemsPerPage, currentPage, setItemsPerPage, setCurrentPage }: PaginationProps) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pageNumbers = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pageNumbers.push(i);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/60 border-t border-slate-200 rounded-b-2xl">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}
            className="rounded-xl border-slate-300 h-8 px-3 text-slate-600 hover:bg-slate-100 disabled:opacity-40">
            ← Trước
          </Button>
          {start > 1 && <><Button variant="outline" size="sm" className="rounded-xl border-slate-300 w-8 h-8" onClick={() => setCurrentPage(1)}>1</Button><span className="text-slate-400 text-xs">…</span></>}
          {pageNumbers.map(n => (
            <Button key={n} size="sm"
              className={`rounded-xl w-8 h-8 font-semibold transition-all ${
                currentPage === n ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20 border-slate-800' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => setCurrentPage(n)}>{n}</Button>
          ))}
          {end < totalPages && <><span className="text-slate-400 text-xs">…</span><Button variant="outline" size="sm" className="rounded-xl border-slate-300 w-8 h-8" onClick={() => setCurrentPage(totalPages)}>{totalPages}</Button></>}
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}
            className="rounded-xl border-slate-300 h-8 px-3 text-slate-600 hover:bg-slate-100 disabled:opacity-40">
            Sau →
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Trang <strong className="text-slate-700">{currentPage}</strong> / {totalPages} &nbsp;·&nbsp; Hiển thị</span>
          <Select value={String(itemsPerPage)} onValueChange={val => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
            <SelectTrigger className="w-16 h-7 rounded-lg border-slate-300 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {[5, 8, 10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <span>/ trang</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 bg-slate-50/50 min-h-full">

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg">📦</div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none">{config.title}</h2>
              <p className="text-slate-300 text-xs mt-0.5">{filteredProducts.length} sản phẩm · trang {currentPage}</p>
            </div>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold backdrop-blur-sm transition-all h-9 gap-1.5"
          >
            <span className="text-base leading-none">＋</span> {config.addNewButton}
          </Button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Input
              placeholder={config.search.placeholder}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="h-9 rounded-xl border-slate-300 focus:border-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm font-medium whitespace-nowrap">Danh mục:</span>
            <select
              id="category-filter"
              className="h-9 text-sm rounded-xl border border-slate-300 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all cursor-pointer"
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              style={{ minWidth: 170 }}
            >
              <option value="">Tất cả danh mục</option>
              {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(''); setCurrentPage(1); }}
              className="h-9 px-3 text-sm rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors font-medium flex items-center gap-1"
            >✕ Xoá bộ lọc</button>
          )}
          <div className="ml-auto">
            {searchQuery || selectedCategory ? (
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                {filteredProducts.length} / {totalProducts} kết quả
              </span>
            ) : <span className="text-xs text-slate-400">{totalProducts} sản phẩm</span>}
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="m-5 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm flex items-start gap-2">
            <span>⚠</span><span>{config.error}</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl">📦</div>
            <p className="font-semibold text-slate-600 text-lg">Không tìm thấy sản phẩm</p>
            <p className="text-sm">{searchQuery || selectedCategory ? 'Thử thay đổi điều kiện tìm kiếm' : 'Nhấn "+ Thêm sản phẩm" để bắt đầu'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wider w-10 select-none">#</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors select-none" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">{config.table.headers.name} <span className="text-slate-300 text-[10px]">{sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '⇅'}</span></span>
                  </th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors select-none" onClick={() => handleSort('brand')}>
                    <span className="flex items-center gap-1">{config.table.headers.brand} <span className="text-slate-300 text-[10px]">{sortConfig?.key === 'brand' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '⇅'}</span></span>
                  </th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wider">{config.table.headers.description}</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wider">{config.table.headers.categories}</th>
                  <th className="py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wider text-center w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product, index) => (
                  <tr key={product._id} className="border-b border-slate-100 hover:bg-blue-50/25 transition-colors last:border-b-0">
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg flex-shrink-0 border border-slate-200 overflow-hidden">
                          {product.variants?.[0]?.images?.[0]?.url ? (
                            <img
                              src={product.variants[0].images[0].url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>🐾</span>
                          )}
                        </div>
                        <p className="font-semibold text-slate-800 leading-tight line-clamp-1 text-sm">{product.name}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {product.brand ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium border border-slate-200">{product.brand}</span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{product.description || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {product.category.slice(0, 3).map((cat, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 font-medium">{cat.name}</span>
                        ))}
                        {product.category.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-lg border border-slate-200 font-medium">+{product.category.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button title={config.variant.title} onClick={() => { setSelectedProductForVariants(product); setIsVariantModalOpen(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-violet-100 hover:text-violet-600 transition-colors">
                          <Package className="w-3.5 h-3.5" />
                        </button>
                        <button title={config.editTitle} onClick={() => { setSelectedProduct(product); setIsEditModalOpen(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button title={config.deleteDialog.title} onClick={() => handleDeleteProduct(product._id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <Pagination filteredProducts={filteredProducts} itemsPerPage={itemsPerPage} currentPage={currentPage} setItemsPerPage={setItemsPerPage} setCurrentPage={setCurrentPage} />
        )}
      </div>

      {selectedProduct && (
        <EditProductModal product={selectedProduct} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedProduct(null); }} onSave={handleEditProduct} />
      )}
      <AddProductModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setError(null); }} onSave={handleAddProduct} />
      {selectedProductForVariants && (
        <VariantManagementModal product={selectedProductForVariants} isOpen={isVariantModalOpen} onClose={() => { setIsVariantModalOpen(false); setSelectedProductForVariants(null); }} />
      )}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl shadow-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">🗑 {config.deleteDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed">
              {config.deleteDialog.content} <br />Hành động này <strong>không thể hoàn tác</strong>.
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setProductToDelete(null); setError(null); }} disabled={isDeleting} className="rounded-xl border-slate-300 text-slate-600">
              {config.deleteDialog.cancel}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteProduct} disabled={isDeleting} className="rounded-xl font-semibold">
              {isDeleting ? '⏳ Đang xoá...' : config.deleteDialog.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
