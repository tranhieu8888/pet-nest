"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{config.title}</CardTitle>
                        <Button onClick={handleAdd}>{config.addNewButton}</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <Input placeholder={config.search.placeholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-sm" />
                    </div>
                    {loading ? (
                        <div>Loading...</div>
                    ) : error ? (
                        <div className="text-red-500">Error: {error}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{config.table.headers.no}</TableHead>
                                    <TableHead>{config.table.headers.value}</TableHead>
                                    <TableHead>{config.table.headers.description}</TableHead>
                                    <TableHead>{config.table.headers.categories}</TableHead>
                                    <TableHead className="text-right">{config.table.headers.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedAttributes.map((attr, index) => (
                                    <TableRow key={attr._id}>
                                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                        <TableCell>{attr.value}</TableCell>
                                        <TableCell>{attr.description}</TableCell>
                                        <TableCell>{attr.categories?.map(cid => categories.find(c => c._id === cid)?.name).filter(Boolean).join(", ")}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={config.child.add} onClick={() => handleShowChildren(attr)}><ChevronRight className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={config.editTitle} onClick={() => handleEdit(attr)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title={config.deleteTitle} onClick={() => handleDelete(attr._id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
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
                        {[...Array(Math.ceil(filteredAttributes.length / itemsPerPage))].map((_, index) => (
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
                        onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredAttributes.length / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(filteredAttributes.length / itemsPerPage)}
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
            <AddAttributeModal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setError(null); }}
                onSave={handleSave}
                categories={categories}
                parentOptions={flattenAttributes(attributes)}
                config={config}
            />
            {selectedAttribute && (
                <EditAttributeModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setSelectedAttribute(null); setError(null); }}
                    onSave={handleSave}
                    attribute={selectedAttribute}
                    categories={categories}
                    parentOptions={flattenAttributes(attributes)}
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
            {parentForChildModal && (
                <ChildAttributeModal
                    parent={parentForChildModal}
                    isOpen={isChildModalOpen}
                    onClose={() => { setIsChildModalOpen(false); setParentForChildModal(null); }}
                    categories={categories}
                    parentOptions={flattenAttributes(attributes)}
                    config={config}
                />
            )}
        </div>
    );
};
