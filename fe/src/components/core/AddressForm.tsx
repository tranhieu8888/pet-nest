"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AddressData {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}

interface AddressFormProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  disabled?: boolean;
  hideLabels?: boolean;
}

type ProvinceApiItem = {
  name: string;
  code: string | number;
};

type WardApiItem = {
  name: string;
  code: string | number;
};

export function AddressForm({ value, onChange, disabled, hideLabels }: AddressFormProps) {
  const [provincesList, setProvincesList] = useState<ProvinceApiItem[]>([]);
  const [wardsList, setWardsList] = useState<WardApiItem[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  // Fetch Provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch("https://provinces.open-api.vn/api/v2/p/");
        if (response.ok) {
          const rawData = await response.json();
          setProvincesList(rawData);
        }
      } catch (err) {
        console.error("Cannot load provinces", err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch Wards when Province changes
  useEffect(() => {
    const fetchWards = async () => {
      if (!value.province || provincesList.length === 0) {
        setWardsList([]);
        return;
      }
      
      const prov = provincesList.find((p) => p.name === value.province);
      if (!prov) {
        setWardsList([]);
        return;
      }

      try {
        const response = await fetch(
          `https://provinces.open-api.vn/api/v2/p/${prov.code}?depth=2`
        );
        if (response.ok) {
          const data = await response.json();
          setWardsList(data.wards || []);
        }
      } catch (err) {
        console.error("Cannot load wards", err);
      }
    };

    fetchWards();
  }, [value.province, provincesList]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tỉnh / Thành phố */}
        <div className="space-y-2">
          {!hideLabels && (
            <Label className="text-gray-700 font-bold text-sm">
              Tỉnh / Thành phố <span className="text-red-500">*</span>
            </Label>
          )}
          <Select
            disabled={disabled || loadingProvinces}
            value={value.province || ""}
            onValueChange={(val) =>
              onChange({ ...value, province: val, ward: "" }) // reset ward when province changes
            }
          >
            <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm bg-white">
              <SelectValue placeholder="Chọn Tỉnh/Thành phố" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {provincesList.map((p) => (
                <SelectItem key={p.code} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phường / Xã */}
        <div className="space-y-2">
          {!hideLabels && (
            <Label className="text-gray-700 font-bold text-sm">
              Phường / Xã <span className="text-red-500">*</span>
            </Label>
          )}
          <Select
            disabled={disabled || !value.province || wardsList.length === 0}
            value={value.ward || ""}
            onValueChange={(val) => onChange({ ...value, ward: val })}
          >
            <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm bg-white">
              <SelectValue placeholder="Chọn Phường/Xã" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {wardsList.map((w) => (
                <SelectItem key={w.code} value={w.name}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Đường phố / Số nhà */}
      <div className="space-y-2">
        {!hideLabels && (
          <Label className="text-gray-700 font-bold text-sm">
            Địa chỉ cụ thể (Số nhà, tên đường...) <span className="text-red-500">*</span>
          </Label>
        )}
        <Input
          disabled={disabled}
          placeholder="VD: 123 Đường ABC..."
          value={value.street || ""}
          onChange={(e) => onChange({ ...value, street: e.target.value })}
          className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white shadow-sm transition-all"
        />
      </div>
    </div>
  );
}
