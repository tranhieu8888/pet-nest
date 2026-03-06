'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react";
import { useApi } from "../../../../utils/axios";
import { api } from "../../../../utils/axios";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, ListTree } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../../utils/petPagesConfig.vi';
import enConfig from '../../../../utils/petPagesConfig.en';

import { Category } from './category.types';
import EditCategoryModal from './components/EditCategoryModal';
import AddCategoryModal from './components/AddCategoryModal';
import ChildCategoryModal from './components/ChildCategoryModal';

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
