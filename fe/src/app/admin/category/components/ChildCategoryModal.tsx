'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, ListTree } from "lucide-react";
import { useApi, api } from "../../../../../utils/axios";
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../../../utils/petPagesConfig.vi';
import enConfig from '../../../../../utils/petPagesConfig.en';
import { Category, ChildCategoryModalProps } from '../category.types';
import AddCategoryModal from './AddCategoryModal';

export default function ChildCategoryModal({
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
            if (response && response.success) setChildCategories(response.data);
            else throw new Error(response?.message || 'Không thể tải danh mục con');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (isOpen) fetchChildCategories(); }, [isOpen, category._id]);

    const handleDeleteClick = (categoryId: string) => { setCategoryToDelete(categoryId); setIsDeleteDialogOpen(true); };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;
        try {
            setIsDeleting(true);
            const response = await request(() => api.delete(`/categories/${categoryToDelete}`));
            if (response.success) { await fetchChildCategories(); setIsDeleteDialogOpen(false); setCategoryToDelete(null); }
            else throw new Error(response.message || 'Không thể xoá danh mục');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveCategoryInternal = async (newCategory: Category) => {
        try {
            await fetchChildCategories();
            setIsAddModalOpen(false);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[820px] max-h-[90vh] p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden flex flex-col gap-0">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-4 flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-white text-lg font-bold">
                                🗂 {config.childCategoriesTitle?.replace('{name}', category.name) ?? `Danh mục con của: ${category.name}`}
                            </DialogTitle>
                            <p className="text-slate-300 text-sm mt-0.5">{category.description || 'Quản lý các danh mục cấp dưới'}</p>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-white">
                        {/* Add Button */}
                        <Button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow gap-1.5 transition-all"
                        >
                            <span className="text-lg leading-none">+</span> {config.addNewButton}
                        </Button>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                                <span>⚠</span><span>{error}</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-10 text-slate-400 animate-pulse">⏳ Đang tải dữ liệu...</div>
                        ) : childCategories.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-5xl mb-3">📂</p>
                                <p className="font-semibold text-slate-600 text-lg">Chưa có danh mục con nào</p>
                                <p className="text-sm mt-1">Nhấn "+ {config.addNewButton}" để thêm mới</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-b border-slate-200 hover:bg-slate-50">
                                            <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.name}</TableHead>
                                            <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.description}</TableHead>
                                            <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.image}</TableHead>
                                            <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide text-center w-28">{config.table.headers.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {childCategories.map((childCategory) => (
                                            <TableRow key={childCategory._id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                                                <TableCell className="font-semibold text-slate-800">{childCategory.name}</TableCell>
                                                <TableCell className="text-slate-500 text-sm max-w-xs truncate">{childCategory.description || '—'}</TableCell>
                                                <TableCell>
                                                    {childCategory.image ? (
                                                        <img src={childCategory.image} alt={childCategory.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-sm" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 text-xl">📷</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {!isLastLevel && (
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600 text-slate-400 transition-colors" title={config.button.manageChildren} onClick={() => onManageChildren(childCategory)}>
                                                                <ListTree className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors" title={config.button.edit} onClick={() => onEditCategory(childCategory)}>
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors" title={config.button.delete} onClick={() => handleDeleteClick(childCategory._id)}>
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
                    <div className="flex justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100">
                            {config.dialog.close}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl shadow-2xl border-slate-200 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-800">🗑 {config.dialog.deleteTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="py-3">
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed">
                            {config.dialog.deleteContent} <br />
                            Hành động này <strong>không thể hoàn tác</strong>.
                        </div>
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setCategoryToDelete(null); setError(null); }} disabled={isDeleting} className="rounded-xl border-slate-300 text-slate-600">
                            {config.form.cancel}
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteCategory} disabled={isDeleting} className="rounded-xl font-semibold">
                            {isDeleting ? '⏳ Đang xoá...' : config.dialog.delete}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Category Modal */}
            <AddCategoryModal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setError(null); }}
                onSave={handleSaveCategoryInternal}
                parentId={category._id}
            />
        </>
    );
}
