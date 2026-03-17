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

interface AddAttributeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (attr: Attribute) => void;
    parentId?: string | null;
    categories: Category[];
    parentOptions: Attribute[];
    config: any;
}

export function AddAttributeModal({ isOpen, onClose, onSave, parentId, categories, parentOptions, config }: AddAttributeModalProps) {
    const [formData, setFormData] = useState({
        value: '',
        description: '',
        parentId: parentId || '',
        categories: [] as string[],
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitRef = useRef(false);
    const { request } = useApi();

    useEffect(() => {
        if (!isOpen) {
            setFormData({ value: '', description: '', parentId: parentId || '', categories: [] });
            setError(null);
            setIsSubmitting(false);
            submitRef.current = false;
        }
    }, [isOpen, parentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitRef.current) return;
        submitRef.current = true;
        setError(null);
        setIsSubmitting(true);
        try {
            if (!formData.value) throw new Error('Value is required');
            const payload = {
                value: formData.value,
                description: formData.description,
                parentId: formData.parentId || null,
                categories: formData.categories,
            };
            const response = await request(() => api.post(`/attributes`, payload));
            if (response.success) {
                onSave(response.data);
                onClose();
            } else {
                throw new Error(response.message || 'Failed to save attribute');
            }
        } catch (err: any) {
            setError(err.message);
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
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">{error}</div>}
                    <div className="space-y-2">
                        <Label htmlFor="value">{config.form.value} <span className="text-red-500">*</span></Label>
                        <Input id="value" value={formData.value} onChange={e => setFormData(f => ({ ...f, value: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{config.form.description}</Label>
                        <Textarea id="description" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="parentId">{config.form.parent}</Label>
                        <Select value={formData.parentId || 'none'} onValueChange={val => setFormData(f => ({ ...f, parentId: val === 'none' ? '' : val }))}>
                            <SelectTrigger>
                                <SelectValue placeholder={config.form.noParent} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{config.form.noParent}</SelectItem>
                                {parentOptions.map(opt => (
                                    <SelectItem key={opt._id} value={opt._id}>{opt.value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{config.form.categories}</Label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <label key={cat._id} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.categories.includes(cat._id)}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setFormData(f => {
                                                if (isChecked) {
                                                    return { ...f, categories: [...f.categories, cat._id] };
                                                } else {
                                                    return { ...f, categories: f.categories.filter(id => id !== cat._id) };
                                                }
                                            });
                                        }}
                                    />
                                    <span>{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>{config.form.cancel}</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? config.form.saving : config.form.add}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
