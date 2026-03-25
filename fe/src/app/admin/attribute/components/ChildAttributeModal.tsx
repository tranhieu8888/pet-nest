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
            else throw new Error(res.message || 'Không thể tải thuộc tính con');
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (isOpen) fetchChildren(); }, [isOpen, parent._id]);

    const handleSave = async () => { await fetchChildren(); setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedAttribute(null); setError(null); };
    const handleDelete = (id: string) => { setAttributeToDelete(id); setIsDeleteDialogOpen(true); };
    const confirmDelete = async () => {
        if (!attributeToDelete) return;
        setIsDeleting(true);
        try {
            const res = await request(() => api.delete(`/attributes/${attributeToDelete}`));
            if (res.success) { await fetchChildren(); setIsDeleteDialogOpen(false); setAttributeToDelete(null); setError(null); }
            else throw new Error(res.message || 'Không thể xoá thuộc tính');
        } catch (err: any) { setError(err.message); }
        finally { setIsDeleting(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[820px] max-h-[90vh] p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden flex flex-col gap-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-4 flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-white text-lg font-bold">
                            🏷 Thuộc tính con của: {parent.value}
                        </DialogTitle>
                        <p className="text-slate-300 text-sm mt-0.5">{parent.description || 'Quản lý các giá trị thuộc tính cấp dưới'}</p>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-white">
                    {/* Add Button */}
                    <Button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow gap-1.5 transition-all"
                    >
                        <span className="text-lg leading-none">+</span> {config.child.addChildButton}
                    </Button>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                            <span>⚠</span><span>{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-10 text-slate-400 animate-pulse">⏳ Đang tải dữ liệu...</div>
                    ) : children.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <p className="text-5xl mb-3">🏷</p>
                            <p className="font-semibold text-slate-600 text-lg">Chưa có thuộc tính con nào</p>
                            <p className="text-sm mt-1">Nhấn "+" để thêm giá trị mới</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-b border-slate-200 hover:bg-slate-50">
                                        <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.value}</TableHead>
                                        <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.description}</TableHead>
                                        <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.categories}</TableHead>
                                        <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide text-center w-24">{config.table.headers.actions}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {children.map(attr => (
                                        <TableRow key={attr._id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                                            <TableCell className="font-semibold text-slate-800">{attr.value}</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{attr.description || '—'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {(attr.categories || []).map(cid => {
                                                        const name = categories.find(c => c._id === cid)?.name;
                                                        return name ? <span key={cid} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 font-medium">{name}</span> : null;
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors" title="Chỉnh sửa" onClick={() => { setSelectedAttribute(attr); setIsEditModalOpen(true); }}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors" title="Xoá" onClick={() => handleDelete(attr._id)}>
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
                        {config.close}
                    </Button>
                </div>

                <AddAttributeModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setError(null); }} onSave={handleSave} parentId={parent._id} categories={categories} parentOptions={parentOptions} config={config} />
                {selectedAttribute && (
                    <EditAttributeModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedAttribute(null); setError(null); }} onSave={handleSave} attribute={selectedAttribute} categories={categories} parentOptions={parentOptions} config={config} />
                )}

                {/* Delete Confirm */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[420px] rounded-2xl shadow-2xl border-slate-200 p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-slate-800">🗑 {config.deleteTitle}</DialogTitle>
                        </DialogHeader>
                        <div className="py-3">
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed">
                                {config.deleteConfirm} <br />Hành động này <strong>không thể hoàn tác</strong>.
                            </div>
                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setAttributeToDelete(null); setError(null); }} disabled={isDeleting} className="rounded-xl border-slate-300 text-slate-600">
                                {config.form.cancel}
                            </Button>
                            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="rounded-xl font-semibold">
                                {isDeleting ? '⏳ Đang xoá...' : config.delete}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
