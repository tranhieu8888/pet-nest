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
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submitRef = useRef(false);
    const { request } = useApi();
    const { lang } = useLanguage();
    const config = lang === 'vi' ? viConfig.manaCategory : enConfig.manaCategory;

    // Reset states when modal closes
    useEffect(() => {
        if (!isOpen) {
            submitRef.current = false;
            setError(null);
            setFormData({
                name: '',
                description: '',
                image: '',
                parentCategory: parentId || null
            });
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

        if (submitRef.current) {
            return;
        }
        submitRef.current = true;
        setError(null);

        try {
            setIsSubmitting(true);

            if (!formData.name) {
                throw new Error('Name is required');
            }

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            if (formData.parentCategory) {
                formDataToSend.append('parentCategory', formData.parentCategory);
            }
            if (selectedFile) {
                formDataToSend.append('image', selectedFile);
            }

            let response;
            if (parentId) {
                // If there's a parentId, use the createChildCategory endpoint
                response = await request(() => api.post(`/categories/child-category/${parentId}`, formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }));
            } else {
                // Otherwise use the regular createCategory endpoint
                response = await request(() => api.post('/categories', formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }));
            }

            if (response.success) {
                onSave(response.data);
                onClose();
            } else {
                throw new Error(response.message || 'Failed to create category');
            }
        } catch (error: any) {
            console.error('Error creating category:', error);
            setError(error.message || 'Failed to create category');
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
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="name">{config.form.name} <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{config.form.description}</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image">{config.form.image}</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={isSubmitting}
                        />
                        {isSubmitting && (
                            <div className="space-y-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-500">{config.uploading.replace('{progress}', String(uploadProgress))}</p>
                            </div>
                        )}
                        {imagePreview && (
                            <div className="mt-2 relative w-full h-48">
                                <NextImage
                                    src={imagePreview}
                                    alt="Preview"
                                    fill
                                    className="object-contain rounded-md"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            {config.form.cancel}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? config.form.adding : config.form.add}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
