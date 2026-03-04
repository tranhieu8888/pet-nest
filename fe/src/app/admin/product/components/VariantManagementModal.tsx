'use client';
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Warehouse, X } from "lucide-react";
import { useApi, api } from "../../../../../utils/axios";
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../../../utils/petPagesConfig.vi';
import enConfig from '../../../../../utils/petPagesConfig.en';

export default function VariantManagementModal({ product, isOpen, onClose }: any) {
  const { lang } = useLanguage();
  const config = (lang === 'vi' ? viConfig : enConfig).manageProduct.variant;
  const { request } = useApi();

  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<any>({ parentAttributes: [], childAttributes: [] });
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});
  
  const [formData, setFormData] = useState({
    images: [] as { file: File | null, url: string }[],
    parentAttr: '',
    childAttr: '',
    sellPrice: 0
  });

  const fetchVariants = async () => {
    setLoading(true);
    const res = await request(() => api.get(`/products/product-variant/${product._id}`));
    if (res?.success) {
      setVariants(res.data);
      res.data.forEach(async (v: any) => {
        const qRes = await request(() => api.get(`/products/import-batches/${v._id}`));
        const total = qRes.data?.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0) || 0;
        setVariantQuantities(prev => ({ ...prev, [v._id]: total }));
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchVariants();
      request(() => api.get(`/products/child-attributes/${product._id}`)).then(res => {
        if (res?.success) setAttributes(res.data);
      });
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData(prev => ({ ...prev, images: [...prev.images, { file, url: URL.createObjectURL(file) }] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    formData.images.forEach(img => { if (img.file) data.append('images', img.file); else data.append('existingImages', img.url); });
    data.append('attributes', formData.parentAttr);
    data.append('attributes', formData.childAttr);
    data.append('sellPrice', String(formData.sellPrice));

    const apiCall = editingId 
      ? () => api.put(`/products/variant/${editingId}`, data)
      : () => api.post(`/products/${product._id}/variant`, data);

    const res = await request(apiCall);
    if (res?.success) {
      fetchVariants();
      setIsFormOpen(false);
      setFormData({ images: [], parentAttr: '', childAttr: '', sellPrice: 0 });
      setEditingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{config.title} - {product.name}</DialogTitle>
          <Button onClick={() => { setIsFormOpen(true); setEditingId(null); }} size="sm"><Plus className="w-4 h-4 mr-2"/> Thêm mới</Button>
        </DialogHeader>

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50 space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thuộc tính chính</Label>
                <select className="w-full border rounded p-2" value={formData.parentAttr} onChange={e => setFormData({...formData, parentAttr: e.target.value})} required>
                  <option value="">Chọn loại</option>
                  {attributes.parentAttributes.map((a: any) => <option key={a._id} value={a._id}>{a.value}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Giá trị biến thể</Label>
                <select className="w-full border rounded p-2" value={formData.childAttr} onChange={e => setFormData({...formData, childAttr: e.target.value})} required>
                  <option value="">Chọn giá trị</option>
                  {attributes.childAttributes.filter((a: any) => a.parentId?._id === formData.parentAttr).map((a: any) => <option key={a._id} value={a._id}>{a.value}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hình ảnh</Label>
              <div className="flex gap-2 flex-wrap">
                {formData.images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 border rounded overflow-hidden">
                    <img src={img.url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData(p => ({...p, images: p.images.filter((_, idx) => idx !== i)}))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X className="w-3 h-3"/></button>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-white">
                  <Plus className="text-gray-400"/><input type="file" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1"><Label>Giá bán (VNĐ)</Label><Input type="number" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} /></div>
              <Button type="submit">{editingId ? "Cập nhật" : "Tạo biến thể"}</Button>
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Hủy</Button>
            </div>
          </form>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead>Giá bán</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map(v => (
              <TableRow key={v._id}>
                <TableCell><img src={v.images[0]?.url} className="w-12 h-12 rounded object-cover border" /></TableCell>
                <TableCell>{v.attribute.map((a: any) => <Badge key={a._id} variant="outline" className="mr-1">{a.value}</Badge>)}</TableCell>
                <TableCell>{v.sellPrice.toLocaleString()}đ</TableCell>
                <TableCell><div className="flex items-center gap-1 text-sm"><Warehouse className="w-3 h-3"/> {variantQuantities[v._id] || 0}</div></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingId(v._id);
                    setFormData({
                      sellPrice: v.sellPrice,
                      parentAttr: v.attribute.find((a: any) => !a.parentId)?._id || '',
                      childAttr: v.attribute.find((a: any) => a.parentId)?._id || '',
                      images: v.images.map((img: any) => ({ file: null, url: img.url }))
                    });
                    setIsFormOpen(true);
                  }}><Edit className="w-4 h-4"/></Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={async () => { if(confirm("Xóa?")) { await request(() => api.delete(`/products/variant/${v._id}`)); fetchVariants(); } }}><Trash2 className="w-4 h-4"/></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}