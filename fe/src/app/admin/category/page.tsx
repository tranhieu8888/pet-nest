'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useRef } from "react";
import { useApi } from "../../../../utils/axios";
import { api } from "../../../../utils/axios";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ChevronDown, ChevronRight, ListTree } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import NextImage from "next/image";
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../../utils/petPagesConfig.vi';
import enConfig from '../../../../utils/petPagesConfig.en';

interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;  // URL của ảnh sau khi upload
  parentCategory?: string;
  children?: Category[];
}

interface EditCategoryModalProps {
  category: Category;
  onSave: (category: Category) => void;
  onClose: () => void;
  isOpen: boolean;
}

function EditCategoryModal({ category, onSave, onClose, isOpen }: EditCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || '',
    image: category.image || '',
    parentCategory: category.parentCategory || null as string | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(category.image || null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitRef = useRef(false);
  const { request } = useApi();
  const { lang } = useLanguage();
  const config = lang === 'vi' ? viConfig.manaCategory : enConfig.manaCategory;

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      submitRef.current = false;
      setError(null);
      setSelectedFile(null);
      setImagePreview(category.image || null);
      setUploadProgress(0);
    }
  }, [isOpen, category.image]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (submitRef.current) {
      return;
    }
    submitRef.current = true;
    setError(null);

    try {
      setIsSubmitting(true);

      if (!formData.name) {
        throw new Error('Name is required');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      if (formData.parentCategory) {
        formDataToSend.append('parentCategory', formData.parentCategory);
      }
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      const response = await request(() => api.put(`/categories/${category._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }));

      if (response.success) {
        onSave(response.data);
        onClose();
      } else {
        throw new Error(response.message || 'Failed to update category');
      }
    } catch (error: any) {
      console.error('Error updating category:', error);
      setError(error.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
      submitRef.current = false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{config.editTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{config.form.name} <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{config.form.description}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">{config.form.image}</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSubmitting}
            />
            {isSubmitting && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">{config.uploading.replace('{progress}', String(uploadProgress))}</p>
              </div>
            )}
            {imagePreview && (
              <div className="mt-2 relative w-full h-48">
                <NextImage
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-contain rounded-md"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {config.form.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? config.form.saving : config.form.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AddCategoryModalProps {
  onSave: (category: Category) => void;
  onClose: () => void;
  isOpen: boolean;
  parentId?: string;
}

function AddCategoryModal({ onSave, onClose, isOpen, parentId }: AddCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parentCategory: parentId || null as string | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitRef = useRef(false);
  const { request } = useApi();
  const { lang } = useLanguage();
  const config = lang === 'vi' ? viConfig.manaCategory : enConfig.manaCategory;

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      submitRef.current = false;
      setError(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        parentCategory: parentId || null
      });
      setSelectedFile(null);
      setImagePreview(null);
      setUploadProgress(0);
    }
  }, [isOpen, parentId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (submitRef.current) {
      return;
    }
    submitRef.current = true;
    setError(null);

    try {
      setIsSubmitting(true);

      if (!formData.name) {
        throw new Error('Name is required');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      if (formData.parentCategory) {
        formDataToSend.append('parentCategory', formData.parentCategory);
      }
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      let response;
      if (parentId) {
        // If there's a parentId, use the createChildCategory endpoint
        response = await request(() => api.post(`/categories/child-category/${parentId}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }));
      } else {
        // Otherwise use the regular createCategory endpoint
        response = await request(() => api.post('/categories', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }));
      }

      if (response.success) {
        onSave(response.data);
        onClose();
      } else {
        throw new Error(response.message || 'Failed to create category');
      }
    } catch (error: any) {
      console.error('Error creating category:', error);
      setError(error.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
      submitRef.current = false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{config.form.add}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{config.form.name} <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{config.form.description}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">{config.form.image}</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSubmitting}
            />
            {isSubmitting && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">{config.uploading.replace('{progress}', String(uploadProgress))}</p>
              </div>
            )}
            {imagePreview && (
              <div className="mt-2 relative w-full h-48">
                <NextImage
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-contain rounded-md"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {config.form.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? config.form.adding : config.form.add}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ChildCategoryModalProps {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onManageChildren: (category: Category) => void;
  onAddCategory: (parentId: string) => void;
  isLastLevel?: boolean;
}

function ChildCategoryModal({
  category,
  isOpen,
  onClose,
  onEditCategory,
  onDeleteCategory,
  onManageChildren,
  onAddCategory,
  isLastLevel = false
}: ChildCategoryModalProps) {
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { request } = useApi();
  const { lang } = useLanguage();
  const config = lang === 'vi' ? viConfig.manaCategory : enConfig.manaCategory;

  const fetchChildCategories = async () => {
    try {
      setLoading(true);
      const response = await request(() => api.get(`/categories/child-categories/${category._id}`));
      if (response && response.success) {
        setChildCategories(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch child categories');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChildCategories();
    }
  }, [isOpen, category._id]);

  const handleDeleteClick = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      const response = await request(() => api.delete(`/categories/${categoryToDelete}`));
      if (response.success) {
        // Refresh child categories after deletion
        await fetchChildCategories();
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete category');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCategory = async (parentId: string) => {
    setIsAddModalOpen(true);
  };

  const handleEditCategory = async (category: Category) => {
    onEditCategory(category);
    // After editing, refresh the child categories
    await fetchChildCategories();
  };

  const handleSaveCategory = async (newCategory: Category) => {
    try {
      // Refresh child categories after adding
      await fetchChildCategories();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{config.childCategoriesTitle.replace('{name}', category.name)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
            <div className="flex justify-between items-center">
              <Button
                type="button"
                onClick={() => handleAddCategory(category._id)}
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

            {loading ? (
              <div>{config.loadingChildren}</div>
            ) : childCategories.length === 0 ? (
              <div className="text-center py-4">{config.noChildren}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{config.table.headers.name}</TableHead>
                      <TableHead>{config.table.headers.description}</TableHead>
                      <TableHead>{config.table.headers.image}</TableHead>
                      <TableHead className="text-right">{config.table.headers.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {childCategories.map((childCategory) => (
                      <React.Fragment key={childCategory._id}>
                        <TableRow>
                          <TableCell>{childCategory.name}</TableCell>
                          <TableCell>{childCategory.description}</TableCell>
                          <TableCell>
                            {childCategory.image && (
                              <img
                                src={childCategory.image}
                                alt={childCategory.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {!isLastLevel && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title={config.button.manageChildren}
                                  onClick={() => onManageChildren(childCategory)}
                                >
                                  <ListTree className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title={config.button.edit}
                                onClick={() => handleEditCategory(childCategory)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title={config.button.delete}
                                onClick={() => handleDeleteClick(childCategory._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {config.dialog.close}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{config.dialog.deleteTitle}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{config.dialog.deleteContent}</p>
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
                setCategoryToDelete(null);
                setError(null);
              }}
              disabled={isDeleting}
            >
              {config.form.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={isDeleting}
            >
              {isDeleting ? config.dialog.deleting : config.dialog.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError(null);
        }}
        onSave={handleSaveCategory}
        parentId={category._id}
      />
    </>
  );
}

export default function CategoryPage() {
  const { lang } = useLanguage();
  const config = lang === 'vi' ? viConfig.manaCategory : enConfig.manaCategory;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isChildCategoryModalOpen, setIsChildCategoryModalOpen] = useState(false);
  const [selectedCategoryForChildren, setSelectedCategoryForChildren] = useState<Category | null>(null);
  const [isGrandChildCategoryModalOpen, setIsGrandChildCategoryModalOpen] = useState(false);
  const [selectedCategoryForGrandChildren, setSelectedCategoryForGrandChildren] = useState<Category | null>(null);
  const { request } = useApi();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await request(() => api.get('/categories/admin/parent'));
        if (response && response.success) {
          setCategories(response.data);
        } else {
          throw new Error(response?.message || 'Failed to fetch categories');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic for main table
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEditCategory = async (updatedCategory: Category) => {
    try {
      const response = await request(() =>
        api.put(`/categories/${updatedCategory._id}`, updatedCategory)
      );
      setCategories(categories.map(c => c._id === updatedCategory._id ? response.data : c));
      setIsEditModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      const response = await request(() => api.delete(`/categories/${categoryToDelete}`));

      if (response.success) {
        // Refresh the categories list
        const categoriesResponse = await request(() => api.get('/categories/admin/parent'));
        if (categoriesResponse && categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        }
        setError(null);
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete category');
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveCategory = async (newCategory: Category) => {
    try {
      // Refresh the categories list
      const categoriesResponse = await request(() => api.get('/categories/admin/parent'));
      if (categoriesResponse && categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      }
      setIsAddModalOpen(false);
      setError(null);
    } catch (err: any) {
      console.error('Error saving category:', err);
      setError(err.message || 'Failed to save category');
    }
  };

  const handleManageChildren = (category: Category) => {
    setSelectedCategoryForGrandChildren(category);
    setIsGrandChildCategoryModalOpen(true);
  };

  const handleAddCategory = (parentId: string) => {
    setIsAddModalOpen(true);
    setSelectedCategory({ _id: '', name: '', parentCategory: parentId } as Category);
  };

  const renderCategoryRow = (category: Category, level: number = 0): React.ReactElement => {
    const isExpanded = expandedCategories.has(category._id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <React.Fragment key={category._id}>
        <TableRow>
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleCategory(category._id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {category.name}
            </div>
          </TableCell>
          <TableCell>{category.description}</TableCell>
          <TableCell>
            {category.image && (
              <img
                src={category.image}
                alt={category.name}
                className="w-10 h-10 object-cover rounded"
              />
            )}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title={config.button.manageChildren}
                onClick={() => {
                  setSelectedCategoryForChildren(category);
                  setIsChildCategoryModalOpen(true);
                }}
              >
                <ListTree className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title={config.button.edit}
                onClick={() => {
                  setSelectedCategory(category);
                  setIsEditModalOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title={config.button.delete}
                onClick={() => handleDeleteCategory(category._id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && hasChildren && category.children?.map((child: Category) =>
          renderCategoryRow(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{config.title}</CardTitle>
            <Button onClick={() => handleAddCategory('')}>{config.addNewButton}</Button>
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
          </div>

          {loading ? (
            <div>{config.loading}</div>
          ) : error ? (
            <div className="text-red-500">{config.error}: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{config.table.headers.no}</TableHead>
                  <TableHead>{config.table.headers.name}</TableHead>
                  <TableHead>{config.table.headers.description}</TableHead>
                  <TableHead>{config.table.headers.image}</TableHead>
                  <TableHead className="text-right">{config.table.headers.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.map((category, index) => (
                  <React.Fragment key={category._id}>
                    <TableRow>
                      <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        {category.image && (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Manage Child Categories"
                            onClick={() => {
                              setSelectedCategoryForChildren(category);
                              setIsChildCategoryModalOpen(true);
                            }}
                          >
                            <ListTree className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit Category"
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Category"
                            onClick={() => handleDeleteCategory(category._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {[...Array(Math.ceil(filteredCategories.length / itemsPerPage))].map((_, index) => (
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
            onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredCategories.length / itemsPerPage)))}
            disabled={currentPage === Math.ceil(filteredCategories.length / itemsPerPage)}
          >
            Next
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

      {selectedCategory && (
        <EditCategoryModal
          category={selectedCategory}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCategory(null);
          }}
          onSave={handleEditCategory}
        />
      )}

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError(null);
        }}
        onSave={handleSaveCategory}
        parentId={selectedCategory?.parentCategory || ''}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{config.dialog.deleteTitle}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{config.dialog.deleteContent}</p>
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
                setCategoryToDelete(null);
                setError(null);
              }}
              disabled={isDeleting}
            >
              {config.form.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteCategory}
              disabled={isDeleting}
            >
              {isDeleting ? config.dialog.deleting : config.dialog.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedCategoryForChildren && (
        <ChildCategoryModal
          category={selectedCategoryForChildren}
          isOpen={isChildCategoryModalOpen}
          onClose={() => {
            setIsChildCategoryModalOpen(false);
            setSelectedCategoryForChildren(null);
          }}
          onEditCategory={(category) => {
            setSelectedCategory(category);
            setIsEditModalOpen(true);
          }}
          onDeleteCategory={handleDeleteCategory}
          onManageChildren={handleManageChildren}
          onAddCategory={handleAddCategory}
          isLastLevel={false}
        />
      )}

      {selectedCategoryForGrandChildren && (
        <ChildCategoryModal
          category={selectedCategoryForGrandChildren}
          isOpen={isGrandChildCategoryModalOpen}
          onClose={() => {
            setIsGrandChildCategoryModalOpen(false);
            setSelectedCategoryForGrandChildren(null);
          }}
          onEditCategory={(category) => {
            setSelectedCategory(category);
            setIsEditModalOpen(true);
          }}
          onDeleteCategory={handleDeleteCategory}
          onManageChildren={handleManageChildren}
          onAddCategory={handleAddCategory}
          isLastLevel={true}
        />
      )}
    </div>
  );
};
