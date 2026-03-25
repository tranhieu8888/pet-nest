'use client';

import React from 'react';
import { CardTitle } from "@/components/ui/card"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg">🗂</div>
            <div>
              <CardTitle className="text-white font-bold text-lg leading-none">{config.title}</CardTitle>
              <p className="text-slate-300 text-xs mt-0.5">{filteredCategories.length} danh mục · trang {currentPage}</p>
            </div>
          </div>
          <Button onClick={() => handleAddCategory('')} className="rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold backdrop-blur-sm transition-all h-9 gap-1.5">
            <span className="text-base leading-none">＋</span> {config.addNewButton}
          </Button>
        </div>
        <div className="pt-4 px-6 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder={config.search.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm rounded-xl border-slate-300 focus:border-blue-500 h-9"
            />
            <span className="text-sm text-slate-500 ml-auto">{filteredCategories.length} danh mục</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-400 animate-pulse">⏳ Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{config.error}: {error}</div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-5xl mb-3">📂</p>
              <p className="font-semibold text-slate-600 text-lg">Không có danh mục nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide w-12">{config.table.headers.no}</TableHead>
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.name}</TableHead>
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.description}</TableHead>
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.image}</TableHead>
                    <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide text-center w-28">{config.table.headers.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((category, index) => (
                    <React.Fragment key={category._id}>
                      <TableRow className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                        <TableCell className="text-slate-400 font-semibold text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{category.name}</TableCell>
                        <TableCell className="text-slate-500 text-sm max-w-xs truncate">{category.description || '—'}</TableCell>
                        <TableCell>
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 text-xl">📷</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600 text-slate-400 transition-colors" title={config.button?.manageChildren ?? 'Quản lý danh mục con'} onClick={() => { setSelectedCategoryForChildren(category); setIsChildCategoryModalOpen(true); }}>
                              <ListTree className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors" title={config.button?.edit ?? 'Chỉnh sửa'} onClick={() => { setSelectedCategory(category); setIsEditModalOpen(true); }}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors" title={config.button?.delete ?? 'Xoá'} onClick={() => handleDeleteCategory(category._id)}>
                              <Trash2 className="h-3.5 w-3.5" />
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
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="rounded-xl border-slate-300">
            ← Trước
          </Button>
          {[...Array(Math.ceil(filteredCategories.length / itemsPerPage))].map((_, index) => (
            <Button key={index + 1} variant={currentPage === index + 1 ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(index + 1)} className={`rounded-xl w-9 ${currentPage === index + 1 ? 'bg-slate-800 text-white' : 'border-slate-300'}`}>
              {index + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredCategories.length / itemsPerPage)))} disabled={currentPage === Math.ceil(filteredCategories.length / itemsPerPage)} className="rounded-xl border-slate-300">
            Sau →
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Dòng/trang:</span>
          <Select value={String(itemsPerPage)} onValueChange={val => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
            <SelectTrigger className="w-20 rounded-xl border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {[5, 8, 10, 20, 50].map(num => (<SelectItem key={num} value={String(num)}>{num}</SelectItem>))}
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
        <DialogContent className="sm:max-w-[420px] rounded-2xl shadow-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">🗑 {config.dialog.deleteTitle}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed">
              {config.dialog.deleteContent} <br />Hành động này <strong>không thể hoàn tác</strong>.
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setCategoryToDelete(null); setError(null); }} disabled={isDeleting} className="rounded-xl border-slate-300 text-slate-600">
              {config.form.cancel}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteCategory} disabled={isDeleting} className="rounded-xl font-semibold">
              {isDeleting ? '⏳ Đang xoá...' : config.dialog.delete}
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
