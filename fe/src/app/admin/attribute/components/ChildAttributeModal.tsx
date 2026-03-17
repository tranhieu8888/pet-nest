"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useApi, api } from "../../../../../utils/axios";
import { Attribute, Category } from "../types/attribute.types";
import { AddAttributeModal } from "./AddAttributeModal";
import { EditAttributeModal } from "./EditAttributeModal";

interface ChildAttributeModalProps {
    parent: Attribute;
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    parentOptions: Attribute[];
    config: any;
}

export function ChildAttributeModal({ parent, isOpen, onClose, categories, parentOptions, config }: ChildAttributeModalProps) {
    const [children, setChildren] = useState<Attribute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [attributeToDelete, setAttributeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { request } = useApi();

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const res = await request(() => api.get(`/attributes?parentId=${parent._id}`));
            if (res.success) setChildren(res.data);
            else throw new Error(res.message || 'Failed to fetch child attributes');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchChildren();
    }, [isOpen, parent._id]);

    const handleAdd = () => {
        setIsAddModalOpen(true);
    };
    const handleEdit = (attr: Attribute) => {
        setSelectedAttribute(attr);
        setIsEditModalOpen(true);
    };
    const handleSave = async () => {
        await fetchChildren();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedAttribute(null);
        setError(null);
    };
    const handleDelete = (id: string) => {
        setAttributeToDelete(id);
        setIsDeleteDialogOpen(true);
    };
    const confirmDelete = async () => {
        if (!attributeToDelete) return;
        setIsDeleting(true);
        try {
            const res = await request(() => api.delete(`/attributes/${attributeToDelete}`));
            if (res.success) {
                await fetchChildren();
                setIsDeleteDialogOpen(false);
                setAttributeToDelete(null);
                setError(null);
            } else {
                throw new Error(res.message || 'Failed to delete attribute');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Child Attributes of: {parent.value}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
                    <div className="flex justify-between items-center">
                        <Button type="button" onClick={handleAdd} className="mb-4">{config.child.addChildButton}</Button>
                    </div>
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">{error}</div>}
                    {loading ? (
                        <div>{config.child.loading}</div>
                    ) : children.length === 0 ? (
                        <div className="text-center py-4">{config.child.noChild}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{config.table.headers.value}</TableHead>
                                    <TableHead>{config.table.headers.description}</TableHead>
                                    <TableHead>{config.table.headers.categories}</TableHead>
                                    <TableHead className="text-right">{config.table.headers.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {children.map(attr => (
                                    <TableRow key={attr._id}>
                                        <TableCell>{attr.value}</TableCell>
                                        <TableCell>{attr.description}</TableCell>
                                        <TableCell>{attr.categories?.map(cid => categories.find(c => c._id === cid)?.name).filter(Boolean).join(', ')}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={config.child.add} onClick={() => handleEdit(attr)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title={config.deleteTitle} onClick={() => handleDelete(attr._id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>{config.close}</Button>
                    </div>
                </div>
                <AddAttributeModal
                    isOpen={isAddModalOpen}
                    onClose={() => { setIsAddModalOpen(false); setError(null); }}
                    onSave={handleSave}
                    parentId={parent._id}
                    categories={categories}
                    parentOptions={parentOptions}
                    config={config}
                />
                {selectedAttribute && (
                    <EditAttributeModal
                        isOpen={isEditModalOpen}
                        onClose={() => { setIsEditModalOpen(false); setSelectedAttribute(null); setError(null); }}
                        onSave={handleSave}
                        attribute={selectedAttribute}
                        categories={categories}
                        parentOptions={parentOptions}
                        config={config}
                    />
                )}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{config.deleteTitle}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p>{config.deleteConfirm}</p>
                            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setAttributeToDelete(null); setError(null); }} disabled={isDeleting}>{config.form.cancel}</Button>
                            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? config.deleting : config.delete}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
