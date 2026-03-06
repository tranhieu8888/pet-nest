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

    const handleAddCategoryInternal = async (parentId: string) => {
        setIsAddModalOpen(true);
    };

    const handleEditCategoryInternal = async (category: Category) => {
        onEditCategory(category);
        // After editing, refresh the child categories
        await fetchChildCategories();
    };

    const handleSaveCategoryInternal = async (newCategory: Category) => {
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
                                onClick={() => handleAddCategoryInternal(category._id)}
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
                                                                onClick={() => handleEditCategoryInternal(childCategory)}
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
                onSave={handleSaveCategoryInternal}
                parentId={category._id}
            />
        </>
    );
}
