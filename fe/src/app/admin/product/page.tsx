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
    let newSelected = checked
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
      let categories: { categoryId: string }[] = [];
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-2">{config.editTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md font-semibold text-center">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="font-semibold">{config.fields.name}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="brand" className="font-semibold">{config.fields.brand}</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="font-semibold">{config.fields.description}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border">
            <Label className="font-semibold mb-2 block">{config.fields.categories} <span className="text-red-500">*</span></Label>
            <div className="space-y-2 mt-2">
              {level1Categories.map((category) => (
                <div key={`parent-${category._id}`} className="flex flex-col gap-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`parent-${category._id}`}
                      checked={selectedParentCategories.includes(category._id)}
                      onChange={e => handleParentCategoryChange(category._id, e.target.checked)}
                    />
                    <Label htmlFor={`parent-${category._id}`}>{category.name}</Label>
                  </div>
                  {/* Nếu parent này được chọn thì hiện child/grandchild ngay dưới nó */}
                  {selectedParentCategories.includes(category._id) && (
                    <div className="ml-6 mt-2 border-l-2 border-gray-200 pl-4">
                      <div>
                        <Label className="font-semibold">{childCategoryLabel}</Label>
                        <div className="space-y-2 mt-2">
                          {categorySets[category._id]?.level2.map((child) => (
                            <div key={`child-${child._id}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`child-${category._id}-${child._id}`}
                                name={`childCategory-${category._id}`}
                                checked={selectedChildCategories[category._id] === child._id}
                                onChange={() => handleChildCategoryChange(category._id, child._id)}
                              />
                              <Label htmlFor={`child-${category._id}-${child._id}`}>{child.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="font-semibold">{grandchildCategoryLabel}</Label>
                        <div className="space-y-2 mt-2">
                          {selectedChildCategories[category._id] && categorySets[category._id]?.level3.map((grand) => (
                            <div key={`grandchild-${grand._id}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`grandchild-${category._id}-${grand._id}`}
                                name={`grandchildCategory-${category._id}`}
                                checked={selectedGrandChildCategories[category._id] === grand._id}
                                onChange={() => handleGrandChildCategoryChange(category._id, grand._id)}
                              />
                              <Label htmlFor={`grandchild-${category._id}-${grand._id}`}>{grand.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="px-6 py-2">
              {config.buttons.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-6 py-2 font-semibold">
              {isSubmitting ? config.buttons.save : config.buttons.save}
            </Button>
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
    setNewVariant(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{config.title} - {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              onClick={() => setIsAddFormOpen(true)}
              className="mb-4"
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
            <div className="border rounded-lg p-4 mb-4">
              <form onSubmit={handleAddVariant} className="space-y-4">
                <div>
                  <Label>{config.form.fields.images} <span className="text-red-500">*</span></Label>
                  <div className="space-y-2">
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
                          disabled={newVariant.images.length === 1 || isAddingVariant}
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

                <div>
                  <Label>{config.form.fields.attributes} <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                    <div>
                      <Label className="font-semibold">{config.form.fields.parentAttributes}</Label>
                      <div className="space-y-2 mt-2">
                        {attributes.parentAttributes.map((attr) => (
                          <div key={`parent-attr-${attr._id}`} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`parent-${attr._id}`}
                              name="parentAttribute"
                              checked={selectedParentAttribute === attr._id}
                              onChange={() => handleParentAttributeChange(attr._id)}
                              required
                              disabled={isAddingVariant}
                            />
                            <Label htmlFor={`parent-${attr._id}`}>{attr.value}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="font-semibold">{config.form.fields.childAttributes}</Label>
                      <div className="space-y-2 mt-2">
                        {selectedParentAttribute && attributes.childAttributes
                          .filter(attr => attr.parentId && attr.parentId._id === selectedParentAttribute)
                          .map((attr) => (
                            <div key={`child-attr-${attr._id}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`child-${attr._id}`}
                                name="childAttribute"
                                checked={selectedChildAttribute === attr._id}
                                onChange={() => handleChildAttributeChange(attr._id)}
                                disabled={!selectedParentAttribute || isAddingVariant}
                                required
                              />
                              <Label htmlFor={`child-${attr._id}`}>{attr.value}</Label>
                            </div>
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
                  <Button type="submit" disabled={isAddingVariant}>
                    {isAddingVariant ? config.form.buttons.add : config.form.buttons.add}
                  </Button>
                </div>
              </form>
            </div> 
          )}

          {isEditFormOpen && selectedVariant && (
            <div className="border rounded-lg p-6 bg-white shadow-md">
              <form onSubmit={handleUpdateVariant} className="space-y-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md font-semibold text-center">
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
                            disabled={newVariant.images.length === 1 || isAddingVariant}
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
                    <Label className="font-semibold">{config.form.fields.attributes} <span className="text-red-500">*</span></Label>
                    <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                      <div>
                        <Label className="font-semibold">{config.form.fields.parentAttributes}</Label>
                        <div className="space-y-2 mt-2">
                          {attributes.parentAttributes.map((attr) => (
                            <div key={`edit-parent-attr-${attr._id}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`edit-parent-${attr._id}`}
                                name="parentAttribute"
                                checked={selectedParentAttribute === attr._id}
                                onChange={() => handleParentAttributeChange(attr._id)}
                                required
                                disabled={isAddingVariant}
                              />
                              <Label htmlFor={`edit-parent-${attr._id}`}>{attr.value}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="font-semibold">{config.form.fields.childAttributes}</Label>
                        <div className="space-y-2 mt-2">
                          {selectedParentAttribute && attributes.childAttributes
                            .filter(attr => attr.parentId && attr.parentId._id === selectedParentAttribute)
                            .map((attr) => (
                              <div key={`edit-child-attr-${attr._id}`} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`edit-child-${attr._id}`}
                                  name="childAttribute"
                                  checked={selectedChildAttribute === attr._id}
                                  onChange={() => handleChildAttributeChange(attr._id)}
                                  disabled={!selectedParentAttribute || isAddingVariant}
                                  required
                                />
                                <Label htmlFor={`edit-child-${attr._id}`}>{attr.value}</Label>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-price" className="font-semibold">{config.form.fields.sellPrice} <span className="text-red-500">*</span></Label>
                      <Input id="edit-price" type="number" value={newVariant.sellPrice} onChange={(e) => setNewVariant(prev => ({ ...prev, sellPrice: Number(e.target.value) }))} min={0} required className="mt-1" />
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
                      <Button type="submit" disabled={isAddingVariant}>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">{config.table.headers.no}</TableHead>
                    <TableHead className="min-w-[200px]">{config.table.headers.attributes}</TableHead>
                    <TableHead className="w-[120px]">{config.table.headers.sellPrice}</TableHead>
                    <TableHead className="w-[120px]">{config.table.headers.totalQuantity}</TableHead>
                    <TableHead className="min-w-[150px]">{config.table.headers.images}</TableHead>
                    <TableHead className="w-[100px] text-right">{config.table.headers.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant, index) => (
                    <TableRow key={`variant-${variant._id}`}>
                      <TableCell className="w-[50px]">{index + 1}</TableCell>
                      <TableCell className="min-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {variant.attribute.map((attr, i) => (
                            <Badge key={`variant-attr-${attr._id}`} variant="secondary">
                              {attr.parentId ? `${attr.parentId.value}: ` : ''}{attr.value}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px]">
                        {/* Hiển thị sellPrice dạng VND */}
                        {formatVND(variant.sellPrice)}
                      </TableCell>
                      <TableCell className="w-[120px]">
                        {/* Hiển thị tổng quantity từ import-batches */}
                        {variantQuantities[variant._id] !== undefined ? variantQuantities[variant._id] : <span className="text-gray-400">...</span>}
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex gap-2">
                          {variant.images.map((image, i) => (
                            <img
                              key={`variant-image-${i}`}
                              src={image.url}
                              alt={`Variant ${index + 1} image ${i + 1}`}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="w-[100px] text-right">
                        <div className="flex items-center justify-end space-x-2">
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
          <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {config.form.buttons.cancel}
            </Button>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Variant</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this variant? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setVariantToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteVariant}
            >
              Delete
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
    let newSelected = checked
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
      let categories: { categoryId: string }[] = [];
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-2">{config.addTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md font-semibold text-center">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="font-semibold">{config.fields.name} <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="brand" className="font-semibold">{config.fields.brand}</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="font-semibold">{config.fields.description} <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border">
            <Label className="font-semibold mb-2 block">{config.fields.categories} <span className="text-red-500">*</span></Label>
            <div className="space-y-2 mt-2">
              {level1Categories.map((category) => (
                <div key={`parent-${category._id}`} className="flex flex-col gap-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`parent-${category._id}`}
                      checked={selectedParentCategories.includes(category._id)}
                      onChange={e => handleParentCategoryChange(category._id, e.target.checked)}
                    />
                    <Label htmlFor={`parent-${category._id}`}>{category.name}</Label>
                  </div>
                  {/* Nếu parent này được chọn thì hiện child/grandchild ngay dưới nó */}
                  {selectedParentCategories.includes(category._id) && (
                    <div className="ml-6 mt-2 border-l-2 border-gray-200 pl-4">
                      <div>
                        <Label className="font-semibold">{childCategoryLabel}</Label>
                        <div className="space-y-2 mt-2">
                          {categorySets[category._id]?.level2.map((child) => (
                            <div key={`child-${child._id}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`child-${category._id}-${child._id}`}
                                name={`childCategory-${category._id}`}
                                checked={selectedChildCategories[category._id] === child._id}
                                onChange={() => handleChildCategoryChange(category._id, child._id)}
                              />
                              <Label htmlFor={`child-${category._id}-${child._id}`}>{child.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="font-semibold">{grandchildCategoryLabel}</Label>
                        <div className="space-y-2 mt-2">
                          {selectedChildCategories[category._id] && categorySets[category._id]?.level3.map((grand) => (
                            <div key={`grandchild-${grand._id}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`grandchild-${category._id}-${grand._id}`}
                                name={`grandchildCategory-${category._id}`}
                                checked={selectedGrandChildCategories[category._id] === grand._id}
                                onChange={() => handleGrandChildCategoryChange(category._id, grand._id)}
                              />
                              <Label htmlFor={`grandchild-${category._id}-${grand._id}`}>{grand.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-base text-gray-700">{pagesConfig.manageProduct.variant.title}</h3>
              <Button type="button" onClick={() => setIsAddVariantFormOpen(true)} disabled={selectedParentCategories.length === 0}>{pagesConfig.manageProduct.variant.addNewButton}</Button>
            </div>
            {variants.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium">{pagesConfig.manageProduct.variant.table.headers.no} {variants.length}</h4>
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm"><span className="font-medium">{pagesConfig.manageProduct.variant.table.headers.images}:</span> {variant.images.length}</div>
                      <div className="text-sm"><span className="font-medium">{pagesConfig.manageProduct.variant.table.headers.attributes}:</span> {variant.attributes.length}</div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveVariant(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
            {isAddVariantFormOpen && (
              <div className="border rounded-lg p-6 bg-white shadow-md space-y-6">
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
                          />
                          {image.url && (
                            <img src={image.url} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveImage(index)}
                            disabled={newVariant.images.length === 1 || isAddingVariantAddProduct}
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
                      >
                        {pagesConfig.manageProduct.variant.form.fields.images}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="font-semibold">{pagesConfig.manageProduct.variant.form.fields.attributes} <span className="text-red-500">*</span></Label>
                    <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                      <div>
                        <Label className="font-semibold">{pagesConfig.manageProduct.variant.form.fields.parentAttributes}</Label>
                        <div className="space-y-2 mt-2">
                          {attributes.parentAttributes.map((attr) => (
                            <div key={`parent-attr-${attr._id}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`parent-${attr._id}`}
                                name="parentAttribute"
                                checked={selectedParentAttribute === attr._id}
                                onChange={() => handleParentAttributeChange(attr._id)}
                                required
                                disabled={isAddingVariantAddProduct}
                              />
                              <Label htmlFor={`parent-${attr._id}`}>{attr.value}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="font-semibold">{pagesConfig.manageProduct.variant.form.fields.childAttributes}</Label>
                        <div className="space-y-2 mt-2">
                          {selectedParentAttribute && attributes.childAttributes
                            .filter(attr => attr.parentId && attr.parentId._id === selectedParentAttribute)
                            .map((attr) => (
                              <div key={`child-attr-${attr._id}`} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`child-${attr._id}`}
                                  name="childAttribute"
                                  checked={selectedChildAttribute === attr._id}
                                  onChange={() => handleChildAttributeChange(attr._id)}
                                  disabled={!selectedParentAttribute || isAddingVariantAddProduct}
                                  required
                                />
                                <Label htmlFor={`child-${attr._id}`}>{attr.value}</Label>
                              </div>
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
                      <Button type="button" onClick={handleAddVariant} disabled={isAddingVariantAddProduct}>
                        {isAddingVariantAddProduct ? pagesConfig.manageProduct.variant.form.buttons.add : pagesConfig.manageProduct.variant.form.buttons.add}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="px-6 py-2">
              {config.buttons.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-6 py-2 font-semibold">
              {isSubmitting ? config.buttons.add : config.buttons.add}
            </Button>
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
  const [sellPrice, setSellPrice] = useState<number>(variant.sellPrice);
  const [isUpdatingSellPrice, setIsUpdatingSellPrice] = useState(false);
  const [sellPriceError, setSellPriceError] = useState<string | null>(null);
  const { request } = useApi();

  useEffect(() => {
    setSellPrice(variant.sellPrice);
  }, [variant.sellPrice, variant._id]);

  useEffect(() => {
    const fetchImportBatches = async () => {
      try {
        const response = await request(() => api.get(`/products/import-batches/${variant._id}`));
        if (response.success) {
          setImportBatches(response.data);
        } else {
          setError(response.message || 'Failed to fetch import batches');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchImportBatches();
    }
  }, [isOpen, variant._id]);

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (newBatch.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (newBatch.costPrice <= 0) {
      setError('Cost price must be greater than 0');
      return;
    }

    try {
      const response = await request(() => 
        api.post(`/products/import-batches/${variant._id}`, newBatch)
      );
      if (response.success) {
        setImportBatches([...importBatches, response.data]);
        setIsAddFormOpen(false);
        setNewBatch({
          importDate: new Date().toISOString().split('T')[0],
          quantity: 0,
          costPrice: 0
        });
        setError(null);
        if (onImportChanged) onImportChanged();
      } else {
        setError(response.message || 'Failed to add import batch');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditBatch = (batch: ImportBatch) => {
    setSelectedBatch(batch);
    setNewBatch({
      importDate: batch.importDate.split('T')[0],
      quantity: batch.quantity,
      costPrice: batch.costPrice
    });
    setIsEditFormOpen(true);
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    // Validate required fields
    if (newBatch.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (newBatch.costPrice <= 0) {
      setError('Cost price must be greater than 0');
      return;
    }

    try {
      const response = await request(() => 
        api.put(`/products/import-batches/${selectedBatch._id}`, newBatch)
      );
      if (response.success) {
        setImportBatches(importBatches.map(batch => 
          batch._id === selectedBatch._id ? response.data : batch
        ));
        setIsEditFormOpen(false);
        setSelectedBatch(null);
        setNewBatch({
          importDate: new Date().toISOString().split('T')[0],
          quantity: 0,
          costPrice: 0
        });
        setError(null);
        if (onImportChanged) onImportChanged();
      } else {
        setError(response.message || 'Failed to update import batch');
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

  const totalQuantity = importBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  const averageCostPrice = importBatches.length > 0 
    ? importBatches.reduce((sum, batch) => sum + batch.costPrice, 0) / importBatches.length 
    : 0;
  const totalInventoryValue = importBatches.reduce((sum, batch) => sum + (batch.quantity * batch.costPrice), 0);

  // Format variant attributes for display
  const variantAttributes = variant.attribute.map(attr => 
    attr.parentId ? `${attr.parentId.value}: ${attr.value}` : attr.value
  ).join(', ');

  const handleSellPriceUpdate = async (newPrice: number) => {
    setIsUpdatingSellPrice(true);
    setSellPriceError(null);
    try {
      const formData = new FormData();
      formData.append('sellPrice', String(newPrice));
      const response = await request(() =>
        api.put(`/products/variant/${variant._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      if (!response.success) {
        setSellPriceError(response.message || 'Failed to update sell price');
        setSellPrice(variant.sellPrice);
      } else {
        // Fetch latest variant data
        const variantRes = await request(() => api.get(`/products/product-variant/${variant.product_id}`));
        if (variantRes.success && Array.isArray(variantRes.data)) {
          const updated = variantRes.data.find((v: ProductVariant) => v._id === variant._id);
          if (updated) {
            setSellPrice(updated.sellPrice);
            if (onVariantUpdate) onVariantUpdate(updated);
          }
        }
      }
    } catch (err: any) {
      setSellPriceError(err.message || 'Failed to update sell price');
      setSellPrice(variant.sellPrice);
    } finally {
      setIsUpdatingSellPrice(false);
    }
  };

  // Thêm hàm format tiền VND
  function formatVND(amount: number) {
    return amount.toLocaleString('vi-VN') + ' vnđ';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {config.title} - {product.name} ({variantAttributes})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
          {/* Variant Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Variant Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Product:</span> {product.name}
              </div>
              <div>
                <span className="font-medium">Brand:</span> {product.brand || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Attributes:</span> {variantAttributes}
              </div>
              <div>
                <span className="font-medium">Categories:</span> {product.category.map(cat => cat.name).join(', ')}
              </div>
              <div>
                <span className="font-medium">Images:</span> {variant.images.length}
              </div>
            </div>
          </div>

          {/* Sell Price Update */}
          <div className="bg-white p-4 rounded-lg border flex items-center gap-4 mb-2">
            <Label htmlFor="variant-sell-price" className="font-semibold">{config.sellPrice?.label || 'Sell Price:'}</Label>
            <Input
              id="variant-sell-price"
              type="number"
              value={sellPrice}
              min={0}
              step={0.01}
              className="w-32"
              disabled={isUpdatingSellPrice}
              onChange={e => setSellPrice(Number(e.target.value))}
              onBlur={async () => {
                if (sellPrice === variant.sellPrice) return;
                await handleSellPriceUpdate(sellPrice);
              }}
            />
            {isUpdatingSellPrice && <span className="text-sm text-gray-500">{config.sellPrice?.saving || 'Saving...'}</span>}
            {sellPriceError && <span className="text-sm text-red-500">{sellPriceError}</span>}
          </div>

          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              onClick={() => setIsAddFormOpen(true)}
              className="mb-4"
            >
              {config.addNewButton}
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-500">{config.summary?.totalQuantity || 'Total Quantity'}</div>
                <div className="text-2xl font-bold">{totalQuantity}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-500">{config.summary?.averageCostPrice || 'Average Cost Price'}</div>
                <div className="text-2xl font-bold">{formatVND(averageCostPrice)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-500">{config.summary?.totalInventoryValue || 'Total Inventory Value'}</div>
                <div className="text-2xl font-bold text-blue-600">{formatVND(totalInventoryValue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-500">{config.summary?.profitMargin || 'Profit Margin'}</div>
                <div className="text-2xl font-bold text-green-600">
                  {averageCostPrice > 0 ? `${((variant.sellPrice - averageCostPrice) / variant.sellPrice * 100).toFixed(1)}%` : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">
              {error}
            </div>
          )}

          {isAddFormOpen && (
            <div className="border rounded-lg p-4 mb-4">
              <form onSubmit={handleAddBatch} className="space-y-4">
                <div>
                  <Label htmlFor="importDate">Import Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="importDate"
                    type="date"
                    value={newBatch.importDate}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, importDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newBatch.quantity}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    min={1}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="costPrice">Cost Price <span className="text-red-500">*</span></Label>
                  <Input
                    id="costPrice"
                    type="number"
                    value={newBatch.costPrice}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                    min={0.01}
                    step={0.01}
                    placeholder="Enter cost price"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddFormOpen(false);
                    setNewBatch({
                      importDate: new Date().toISOString().split('T')[0],
                      quantity: 0,
                      costPrice: 0
                    });
                    setError(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Batch
                  </Button>
                </div>
              </form>
            </div>
          )}

          {isEditFormOpen && selectedBatch && (
            <div className="border rounded-lg p-4 mb-4">
              <form onSubmit={handleUpdateBatch} className="space-y-4">
                <div>
                  <Label htmlFor="editImportDate">Import Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="editImportDate"
                    type="date"
                    value={newBatch.importDate}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, importDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editQuantity">Quantity <span className="text-red-500">*</span></Label>
                  <Input
                    id="editQuantity"
                    type="number"
                    value={newBatch.quantity}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    min={1}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editCostPrice">Cost Price <span className="text-red-500">*</span></Label>
                  <Input
                    id="editCostPrice"
                    type="number"
                    value={newBatch.costPrice}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                    min={0.01}
                    step={0.01}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditFormOpen(false);
                    setSelectedBatch(null);
                    setNewBatch({
                      importDate: new Date().toISOString().split('T')[0],
                      quantity: 0,
                      costPrice: 0
                    });
                    setError(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update Batch
                  </Button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div>{config.loading}</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : importBatches.length === 0 ? (
            <div className="text-center py-4">{config.empty}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">{config.table.headers.no}</TableHead>
                    <TableHead className="w-[120px]">{config.table.headers.importDate}</TableHead>
                    <TableHead className="w-[100px]">{config.table.headers.quantity}</TableHead>
                    <TableHead className="w-[120px]">{config.table.headers.costPrice}</TableHead>
                    <TableHead className="w-[120px]">{config.table.headers.totalValue}</TableHead>
                    <TableHead className="w-[100px] text-right">{config.table.headers.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importBatches.map((batch, index) => (
                    <TableRow key={`batch-${batch._id}`}>
                      <TableCell className="w-[50px]">{index + 1}</TableCell>
                      <TableCell className="w-[120px]">
                        {new Date(batch.importDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="w-[100px] font-medium">{batch.quantity}</TableCell>
                      <TableCell className="w-[120px]">{formatVND(batch.costPrice)}</TableCell>
                      <TableCell className="w-[120px] font-semibold text-green-600">
                        {formatVND(batch.quantity * batch.costPrice)}
                      </TableCell>
                      <TableCell className="w-[100px] text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit Batch"
                            onClick={() => handleEditBatch(batch)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Batch"
                            onClick={() => handleDeleteBatch(batch._id)}
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
          <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {config.form.buttons.cancel}
            </Button>
          </div>
        </div>
      </DialogContent>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Import Batch</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this import batch? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setBatchToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteBatch}
            >
              Delete
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
    let sortable = [...products];
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
        setProducts(response.data);
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

  function Pagination({ filteredProducts, itemsPerPage, currentPage, setItemsPerPage, setCurrentPage }: PaginationProps) {
    const { lang } = useLanguage();
    const pagesConfig = lang === 'vi' ? viConfig : enConfig;
    const config = pagesConfig.manageProduct.pagination;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            {config.previous}
          </Button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, index) => (
              <Button
                key={index + 1}
                variant={currentPage === index + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {config.next}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select value={String(itemsPerPage)} onValueChange={val => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 8, 10, 20, 50].map(num => (
                <SelectItem key={num} value={String(num)}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{config.title}</CardTitle>
            <Button onClick={() => setIsAddModalOpen(true)}>{config.addNewButton}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder={config.search.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            {/* Dropdown lọc danh mục đẹp hơn */}
            <div className="flex items-center gap-2">
              <label htmlFor="category-filter" className="font-medium text-gray-700">Lọc danh mục:</label>
              <select
                id="category-filter"
                className="category-filter-select border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all bg-white text-gray-800"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="">Tất cả danh mục</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div>{config.loading}</div>
          ) : error ? (
            <div className="text-red-500">{config.error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{config.table.headers.no}</TableHead>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer select-none">
                    {config.table.headers.name} {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('brand')} className="cursor-pointer select-none">
                    {config.table.headers.brand} {sortConfig?.key === 'brand' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('description')} className="cursor-pointer select-none">
                    {config.table.headers.description} {sortConfig?.key === 'description' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('category')} className="cursor-pointer select-none">
                    {config.table.headers.categories} {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead className="text-right">{config.table.headers.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product, index) => (
                  <TableRow key={product._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.brand || '-'}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.category.map((cat, i) => (
                          <Badge key={i} variant="secondary">
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          title={config.variant.title}
                          onClick={() => {
                            setSelectedProductForVariants(product);
                            setIsVariantModalOpen(true);
                          }}
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          title={config.editTitle} 
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title={config.deleteDialog.title}
                          onClick={() => handleDeleteProduct(product._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
          
      {selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
          onSave={handleEditProduct}
        />
      )}

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError(null);
        }}
        onSave={handleAddProduct}
      />

      {selectedProductForVariants && (
        <VariantManagementModal
          product={selectedProductForVariants}
          isOpen={isVariantModalOpen}
          onClose={() => {
            setIsVariantModalOpen(false);
            setSelectedProductForVariants(null);
          }}
        />
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{config.deleteDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{config.deleteDialog.content}</p>
            {error && (
              <div className="mt-2 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
                setError(null);
              }}
              disabled={isDeleting}
            >
              {config.deleteDialog.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? config.deleteDialog.deleting : config.deleteDialog.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Pagination
        filteredProducts={filteredProducts}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        setItemsPerPage={setItemsPerPage}
        setCurrentPage={setCurrentPage}
      /> 
    </div>
  );
};
