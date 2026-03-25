'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import NextImage from "next/image";
import { useApi, api } from "../../../../../utils/axios";
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../../../utils/petPagesConfig.vi';
import enConfig from '../../../../../utils/petPagesConfig.en';
import { AddCategoryModalProps } from '../category.types';

export default function AddCategoryModal({ onSave, onClose, isOpen, parentId }: AddCategoryModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        parentCategory: parentId || null as string | null
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ name?: string }>({});
    const submitRef = useRef(false);
    const { request } = useApi();
    const { lang } = useLanguage();
    const config = lang === 'vi' ? viConfig.manaCategory : enConfig.manaCategory;

    useEffect(() => {
        if (!isOpen) {
            submitRef.current = false;
            setError(null);
            setFieldErrors({});
            setFormData({ name: '', description: '', image: '', parentCategory: parentId || null });
            setSelectedFile(null);
            setImagePreview(null);
            setUploadProgress(0);
        }
    }, [isOpen, parentId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const errs: { name?: string } = {};
        if (!formData.name.trim()) errs.name = 'Tên danh mục không được bỏ trống';
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;
        if (submitRef.current) return;
        submitRef.current = true;
        setError(null);
        try {
            setIsSubmitting(true);
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            if (formData.parentCategory) formDataToSend.append('parentCategory', formData.parentCategory);
            if (selectedFile) formDataToSend.append('image', selectedFile);
            let response;
            if (parentId) {
                response = await request(() => api.post(`/categories/child-category/${parentId}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } }));
            } else {
                response = await request(() => api.post('/categories', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } }));
            }
            if (response.success) { onSave(response.data); onClose(); }
            else throw new Error(response.message || 'Không thể tạo danh mục');
        } catch (error: any) {
            setError(error.message || 'Không thể tạo danh mục');
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
                            🗂 {config.form.add}
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                            <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            {config.form.name} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            placeholder="Nhập tên danh mục..."
                            onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); setFieldErrors(fe => ({ ...fe, name: undefined })); }}
                            className={`h-10 rounded-xl border-slate-300 focus:border-blue-500 transition-colors ${fieldErrors.name ? 'border-red-400 bg-red-50/50' : ''}`}
                        />
                        {fieldErrors.name && <p className="text-red-500 text-xs flex items-center gap-1"><span>⚠</span>{fieldErrors.name}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            {config.form.description}
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            placeholder="Nhập mô tả (tuỳ chọn)..."
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="rounded-xl border-slate-300 focus:border-blue-500 resize-none min-h-[80px] transition-colors"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-1.5">
                        <Label htmlFor="image" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            {config.form.image}
                        </Label>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={isSubmitting}
                                className="border-0 p-0 h-auto file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium file:px-3 file:py-1.5 file:text-sm hover:file:bg-blue-100"
                            />
                            {!imagePreview && <p className="text-xs text-slate-400 mt-2">PNG, JPG, WEBP tối đa 5MB</p>}
                        </div>
                        {isSubmitting && uploadProgress > 0 && (
                            <div className="space-y-1">
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                                <p className="text-xs text-slate-500 text-right">{uploadProgress}%</p>
                            </div>
                        )}
                        {imagePreview && (
                            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                <NextImage src={imagePreview} alt="Preview" fill className="object-contain" />
                                <button type="button" onClick={() => { setImagePreview(null); setSelectedFile(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow">✕</button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl border-slate-300 text-slate-600">
                            {config.form.cancel}
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-semibold px-5 shadow-sm transition-all">
                            {isSubmitting ? '⏳ Đang lưu...' : config.form.add}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
