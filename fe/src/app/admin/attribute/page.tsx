"use client";

import React, { useEffect, useState } from "react";
import { CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, ChevronRight } from "lucide-react";
import { useApi, api } from "../../../../utils/axios";
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../../utils/petPagesConfig.vi';
import enConfig from '../../../../utils/petPagesConfig.en';

import { Attribute, Category } from "./types/attribute.types";
import { AddAttributeModal } from "./components/AddAttributeModal";
import { EditAttributeModal } from "./components/EditAttributeModal";
import { ChildAttributeModal } from "./components/ChildAttributeModal";

export default function AttributePage() {
    const { lang } = useLanguage();
    const config = lang === 'vi' ? viConfig.manageAttribute : enConfig.manageAttribute;
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [attributeToDelete, setAttributeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isChildModalOpen, setIsChildModalOpen] = useState(false);
    const [parentForChildModal, setParentForChildModal] = useState<Attribute | null>(null);
    const { request } = useApi();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [catRes, attrRes] = await Promise.all([
                    request(() => api.get("/categories/parent")),
                    request(() => api.get("/attributes?parentId=null")),
                ]);
                if (catRes.success) setCategories(catRes.data);
                if (attrRes.success) setAttributes(attrRes.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const refreshAttributes = async () => {
        const attrRes = await request(() => api.get("/attributes?parentId=null"));
        if (attrRes.success) setAttributes(attrRes.data);
    };

    const handleAdd = () => {
        setIsAddModalOpen(true);
    };
    const handleEdit = (attr: Attribute) => {
        setSelectedAttribute(attr);
        setIsEditModalOpen(true);
    };
    const handleSave = async () => {
        await refreshAttributes();
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
                await refreshAttributes();
                setIsDeleteDialogOpen(false);
                setAttributeToDelete(null);
                setError(null);
            } else {
                throw new Error(res.message || "Failed to delete attribute");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };
    const handleShowChildren = (attr: Attribute) => {
        setParentForChildModal(attr);
        setIsChildModalOpen(true);
    };

    // Filtered attributes (only cha)
    const filteredAttributes = attributes.filter(attr =>
        attr.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (attr.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination logic
    const paginatedAttributes = filteredAttributes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Flatten all attributes for parent select
    const flattenAttributes = (attrs: Attribute[], arr: Attribute[] = []) => {
        for (const attr of attrs) {
            arr.push(attr);
        }
        return arr;
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg">🏷</div>
                        <div>
                            <CardTitle className="text-white font-bold text-lg leading-none">{config.title}</CardTitle>
                            <p className="text-slate-300 text-xs mt-0.5">{filteredAttributes.length} thuộc tính · trang {currentPage}</p>
                        </div>
                    </div>
                    <Button onClick={handleAdd} className="rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold backdrop-blur-sm transition-all h-9 gap-1.5">
                        <span className="text-base leading-none">＋</span> {config.addNewButton}
                    </Button>
                </div>
                <div className="pt-4 px-6 pb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Input placeholder={config.search.placeholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-sm rounded-xl border-slate-300 focus:border-blue-500 h-9" />
                        <span className="text-sm text-slate-500 ml-auto">{filteredAttributes.length} thuộc tính</span>
                    </div>
                    {loading ? (
                        <div className="text-center py-10 text-slate-400 animate-pulse">⏳ Đang tải dữ liệu...</div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">Lỗi: {error}</div>
                    ) : filteredAttributes.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <p className="text-5xl mb-3">🏷</p>
                            <p className="font-semibold text-slate-600 text-lg">Không có thuộc tính nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-b border-slate-200 hover:bg-slate-50">
                                        <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide w-12">{config.table.headers.no}</TableHead>
                                        <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.value}</TableHead>
                                        <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.description}</TableHead>
                                        <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide">{config.table.headers.categories}</TableHead>
                                        <TableHead className="text-slate-500 text-xs font-bold uppercase tracking-wide text-center w-28">{config.table.headers.actions}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedAttributes.map((attr, index) => (
                                        <TableRow key={attr._id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                                            <TableCell className="text-slate-400 font-semibold text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
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
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600 text-slate-400 transition-colors" title={config.child.add} onClick={() => handleShowChildren(attr)}><ChevronRight className="h-3.5 w-3.5" /></Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors" title={config.editTitle} onClick={() => handleEdit(attr)}><Edit className="h-3.5 w-3.5" /></Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors" title={config.deleteTitle} onClick={() => handleDelete(attr._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
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
                    {[...Array(Math.ceil(filteredAttributes.length / itemsPerPage))].map((_, index) => (
                        <Button key={index + 1} variant={currentPage === index + 1 ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(index + 1)} className={`rounded-xl w-9 ${currentPage === index + 1 ? 'bg-slate-800 text-white' : 'border-slate-300'}`}>
                            {index + 1}
                        </Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredAttributes.length / itemsPerPage)))} disabled={currentPage === Math.ceil(filteredAttributes.length / itemsPerPage)} className="rounded-xl border-slate-300">
                        Sau →
                    </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Dòng/trang:</span>
                    <Select value={String(itemsPerPage)} onValueChange={val => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                        <SelectTrigger className="w-20 rounded-xl border-slate-300"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {[5, 8, 10, 20, 50].map(num => (<SelectItem key={num} value={String(num)}>{num}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <AddAttributeModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setError(null); }} onSave={handleSave} categories={categories} parentOptions={flattenAttributes(attributes)} config={config} />
            {selectedAttribute && (
                <EditAttributeModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedAttribute(null); setError(null); }} onSave={handleSave} attribute={selectedAttribute} categories={categories} parentOptions={flattenAttributes(attributes)} config={config} />
            )}
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
                        <Button type="button" variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setAttributeToDelete(null); setError(null); }} disabled={isDeleting} className="rounded-xl border-slate-300 text-slate-600">{config.form.cancel}</Button>
                        <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="rounded-xl font-semibold">{isDeleting ? '⏳ Đang xoá...' : config.delete}</Button>
                    </div>
                </DialogContent>
            </Dialog>
            {parentForChildModal && (
                <ChildAttributeModal parent={parentForChildModal} isOpen={isChildModalOpen} onClose={() => { setIsChildModalOpen(false); setParentForChildModal(null); }} categories={categories} parentOptions={flattenAttributes(attributes)} config={config} />
            )}
        </div>
    );
};
