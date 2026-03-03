'use client';
import React, { useEffect, useState } from "react";
import { useApi, api } from "../../../../../utils/axios";
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../../../utils/petPagesConfig.vi';
import enConfig from '../../../../../utils/petPagesConfig.en';

// Định nghĩa Interface để tránh lỗi "Binding element implicitly has an 'any' type"
interface Product {
  _id: string;
  name: string;
  description: string;
  brand?: string;
  category: any[];
}

interface CategorySet {
  level2: any[];
  level3: any[];
}

interface Props {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

export default function EditProductModal({ product, isOpen, onClose, onSave }: Props) {
  const { lang } = useLanguage();
  const config = (lang === 'vi' ? viConfig : enConfig).manageProduct.form;
  const { request } = useApi();

  const [level1Categories, setLevel1Categories] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: '', description: '', brand: '' });
  const [selectedParentCategories, setSelectedParentCategories] = useState<string[]>([]);
  const [selectedChildCategories, setSelectedChildCategories] = useState<Record<string, string | null>>({});
  const [selectedGrandChildCategories, setSelectedGrandChildCategories] = useState<Record<string, string | null>>({});
  const [categorySets, setCategorySets] = useState<Record<string, CategorySet>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logic lấy dữ liệu ban đầu
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isOpen) return;
      try {
        const catRes = await request(() => api.get('/categories/parent'));
        if (catRes?.success) setLevel1Categories(catRes.data);

        const prodRes = await request(() => api.get(`/products/productById2/${product._id}`));
        if (prodRes?.success) {
          const p = prodRes.data;
          setFormData({ name: p.name, description: p.description, brand: p.brand || '' });

          if (p.category) {
            const parents = p.category.filter((c: any) => c.isParent);
            const parentIds = parents.map((c: any) => c._id);
            const newChild: any = {}, newGrand: any = {}, newSets: any = {};

            for (const parent of parents) {
              const cRes = await request(() => api.get(`/categories/child-categories/${parent._id}`));
              newSets[parent._id] = { level2: cRes.data || [], level3: [] };
              
              const child = p.category.find((c: any) => c.parentCategory === parent._id);
              if (child) {
                newChild[parent._id] = child._id;
                const gRes = await request(() => api.get(`/categories/child-categories/${child._id}`));
                newSets[parent._id].level3 = gRes.data || [];
                const grand = p.category.find((c: any) => c.parentCategory === child._id);
                if (grand) newGrand[parent._id] = grand._id;
              }
            }
            setSelectedParentCategories(parentIds);
            setSelectedChildCategories(newChild);
            setSelectedGrandChildCategories(newGrand);
            setCategorySets(newSets);
          }
        }
      } catch (err) { setError("Không thể tải dữ liệu"); }
    };
    fetchInitialData();
  }, [isOpen, product._id]);

  const handleParentChange = async (id: string, checked: boolean) => {
    if (checked) {
      setSelectedParentCategories(prev => [...prev, id]);
      const res = await request(() => api.get(`/categories/child-categories/${id}`));
      setCategorySets(prev => ({ ...prev, [id]: { level2: res.data || [], level3: [] } }));
    } else {
      setSelectedParentCategories(prev => prev.filter(p => p !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalCategories: any[] = [];
      selectedParentCategories.forEach(pId => {
        finalCategories.push({ categoryId: pId });
        if (selectedChildCategories[pId]) finalCategories.push({ categoryId: selectedChildCategories[pId] });
        if (selectedGrandChildCategories[pId]) finalCategories.push({ categoryId: selectedGrandChildCategories[pId] });
      });

      const res = await request(() => api.put(`/products/${product._id}`, { ...formData, categories: finalCategories }));
      if (res.success) { onSave(res.data); onClose(); }
    } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">{config.editTitle}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Tên sản phẩm</label>
              <input 
                className="border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Thương hiệu</label>
              <input 
                className="border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.brand} 
                onChange={e => setFormData({...formData, brand: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea 
              className="border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>

          {/* Category Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Danh mục sản phẩm</h3>
            <div className="space-y-4">
              {level1Categories.map(cat => (
                <div key={cat._id} className="bg-white p-3 rounded border border-gray-200">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      id={`parent-${cat._id}`}
                      checked={selectedParentCategories.includes(cat._id)} 
                      onChange={(e) => handleParentChange(cat._id, e.target.checked)} 
                    />
                    <label htmlFor={`parent-${cat._id}`} className="font-bold cursor-pointer">{cat.name}</label>
                  </div>

                  {selectedParentCategories.includes(cat._id) && (
                    <div className="mt-3 ml-7 grid grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded border border-blue-100 animate-in fade-in duration-300">
                      {/* Cấp 2 */}
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Cấp 2</p>
                        {categorySets[cat._id]?.level2.map(child => (
                          <div key={child._id} className="flex items-center gap-2 mb-1">
                            <input 
                              type="radio" 
                              name={`child-${cat._id}`}
                              id={`child-${child._id}`}
                              checked={selectedChildCategories[cat._id] === child._id}
                              onChange={async () => {
                                setSelectedChildCategories(prev => ({...prev, [cat._id]: child._id}));
                                const res = await request(() => api.get(`/categories/child-categories/${child._id}`));
                                setCategorySets(prev => ({...prev, [cat._id]: { ...prev[cat._id], level3: res.data || [] }}));
                              }}
                            />
                            <label htmlFor={`child-${child._id}`} className="text-sm cursor-pointer">{child.name}</label>
                          </div>
                        ))}
                      </div>
                      {/* Cấp 3 */}
                      <div>
                        <p className="text-[10px] font-black text-green-600 uppercase mb-2">Cấp 3</p>
                        {categorySets[cat._id]?.level3.map(grand => (
                          <div key={grand._id} className="flex items-center gap-2 mb-1">
                            <input 
                              type="radio" 
                              name={`grand-${cat._id}`}
                              id={`grand-${grand._id}`}
                              checked={selectedGrandChildCategories[cat._id] === grand._id}
                              onChange={() => setSelectedGrandChildCategories(prev => ({...prev, [cat._id]: grand._id}))}
                            />
                            <label htmlFor={`grand-${grand._id}`} className="text-sm cursor-pointer">{grand.name}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2 border rounded-md hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}