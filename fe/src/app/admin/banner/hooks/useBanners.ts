import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { api } from "../../../../../utils/axios";
import { Banner, BannerSubmitData } from "../types";

export type TimeFilter = "all" | "activeNow" | "expired" | "upcoming";

export const useBanners = (itemsPerPage: number = 7) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | undefined>();

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/banners");
      setBanners(response.data || []);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || "Lỗi tải dữ liệu";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBannerTimeStatus = (banner: Banner): TimeFilter | "unknown" => {
    const now = new Date();
    const start = banner.startDate ? new Date(banner.startDate) : null;
    const end = banner.endDate ? new Date(banner.endDate) : null;

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "unknown";
    }

    if (start > now) return "upcoming";
    if (end < now) return "expired";
    return "activeNow";
  };

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const keyword = searchQuery.trim().toLowerCase();
      const matchSearch =
        banner.title?.toLowerCase().includes(keyword) ||
        banner.buttonText?.toLowerCase().includes(keyword);

      const bannerTimeStatus = getBannerTimeStatus(banner);
      const matchTime =
        timeFilter === "all" ? true : bannerTimeStatus === timeFilter;

      return matchSearch && matchTime;
    });
  }, [banners, searchQuery, timeFilter]);

  const paginatedBanners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBanners.slice(start, start + itemsPerPage);
  }, [filteredBanners, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, timeFilter]);

  const addBanner = async (data: BannerSubmitData) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value instanceof File ? value : String(value));
        }
      });

      await api.post("/banners", formData);
      await fetchBanners();
      setIsFormOpen(false);
      setSelectedBanner(undefined);
      toast.success("Tạo banner thành công");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Thêm thất bại";
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const editBanner = async (data: BannerSubmitData) => {
    if (!selectedBanner) return;
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value instanceof File ? value : String(value));
        }
      });

      const response = await api.put(
        `/banners/${selectedBanner._id}`,
        formData,
      );
      setBanners((prev) =>
        prev.map((item) =>
          item._id === selectedBanner._id ? response.data : item,
        ),
      );
      setIsFormOpen(false);
      setSelectedBanner(undefined);
      toast.success("Cập nhật banner thành công");
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Cập nhật thất bại";
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa banner này không?")) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners((prev) => prev.filter((item) => item._id !== id));
      toast.success("Xóa banner thành công");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Xóa thất bại");
    }
  };

  const handleOpenForm = (banner?: Banner) => {
    setSelectedBanner(banner);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsDetailOpen(true);
  };

  const handleCloseAll = () => {
    setIsFormOpen(false);
    setIsDetailOpen(false);
    setSelectedBanner(undefined);
  };

  return {
    banners: filteredBanners,
    paginatedBanners,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    timeFilter,
    setTimeFilter,
    currentPage,
    setCurrentPage,
    isFormOpen,
    isDetailOpen,
    selectedBanner,
    addBanner,
    editBanner,
    deleteBanner,
    handleOpenForm,
    handleOpenDetail,
    handleCloseAll,
    getBannerTimeStatus,
    refresh: fetchBanners,
  };
};
