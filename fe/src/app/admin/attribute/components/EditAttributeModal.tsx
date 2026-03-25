"use client";

import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useApi, api } from "../../../../../utils/axios";
import { Attribute, Category } from "../types/attribute.types";

interface EditAttributeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (attr: Attribute) => void;
    attribute: Attribute;
    categories: Category[];
    parentOptions: Attribute[];
    config: any;
}

export function EditAttributeModal({ isOpen, onClose, onSave, attribute, categories, parentOptions, config }: EditAttributeModalProps) {
    const [formData, setFormData] = useState({
        value: attribute?.value || '',
        description: attribute?.description || '',
        parentId: attribute?.parentId || '',
        categories: attribute?.categories || [],
    });
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ value?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitRef = useRef(false);
    const { request } = useApi();

    useEffect(() => {
        if (!isOpen) {
            setFormData({ value: attribute?.value || '', description: attribute?.description || '', parentId: attribute?.parentId || '', categories: attribute?.categories || [] });
            setError(null);
            setFieldErrors({});
            setIsSubmitting(false);
            submitRef.current = false;
        }
    }, [isOpen, attribute]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs: { value?: string } = {};
        if (!formData.value.trim()) errs.value = 'Giá trị không được bỏ trống';
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;
        if (submitRef.current) return;
        submitRef.current = true;
        setError(null);
        setIsSubmitting(true);
        try {
            const payload = { value: formData.value, description: formData.description, parentId: formData.parentId || null, categories: formData.categories };
            const response = await request(() => api.put(`/attributes/${attribute._id}`, payload));
            if (response.success) { onSave(response.data); onClose(); }
            else throw new Error(response.message || 'Không thể cập nhật thuộc tính');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
            submitRef.current = false;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[560px] p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden gap-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-white text-lg font-bold">
                            ✏️ {config.editTitle}
                        </DialogTitle>
                        <p className="text-slate-300 text-sm mt-0.5">{attribute?.value}</p>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                            <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
                        </div>
                    )}

                    {/* Value */}
                    <div className="space-y-1.5">
                        <Label htmlFor="value" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            {config.form.value} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="value"
                            value={formData.value}
                            onChange={(e) => { setFormData(f => ({ ...f, value: e.target.value })); setFieldErrors(fe => ({ ...fe, value: undefined })); }}
                            className={`h-10 rounded-xl border-slate-300 focus:border-blue-500 transition-colors ${fieldErrors.value ? 'border-red-400 bg-red-50/50' : ''}`}
                        />
                        {fieldErrors.value && <p className="text-red-500 text-xs flex items-center gap-1"><span>⚠</span>{fieldErrors.value}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            {config.form.description}
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                            className="rounded-xl border-slate-300 focus:border-blue-500 resize-none min-h-[72px] transition-colors"
                        />
                    </div>

                    {/* Parent */}
                    <div className="space-y-1.5">
                        <Label htmlFor="parentId" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            {config.form.parent}
                        </Label>
                        <Select value={formData.parentId || 'none'} onValueChange={val => setFormData(f => ({ ...f, parentId: val === 'none' ? '' : val }))}>
                            <SelectTrigger className="rounded-xl border-slate-300 h-10 focus:border-blue-500">
                                <SelectValue placeholder={config.form.noParent} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="none">{config.form.noParent}</SelectItem>
                                {parentOptions.filter(opt => opt._id !== attribute._id).map(opt => (
                                    <SelectItem key={opt._id} value={opt._id}>{opt.value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Categories */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            {config.form.categories}
                        </Label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {categories.map(cat => (
                                <label key={cat._id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer transition-colors text-sm ${formData.categories.includes(cat._id) ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                    <Checkbox
                                        checked={formData.categories.includes(cat._id)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setFormData(f => ({ ...f, categories: e.target.checked ? [...f.categories, cat._id] : f.categories.filter(id => id !== cat._id) }));
                                        }}
                                    />
                                    <span>{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl border-slate-300 text-slate-600">
                            {config.form.cancel}
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-semibold px-5 shadow-sm transition-all">
                            {isSubmitting ? '⏳ Đang lưu...' : config.form.save}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
