"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Star,
  Heart,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "../../../utils/axios";
import Header from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: Array<{ _id: string; name: string; description: string; parentCategory?: string }>;
  brand: string;
  createAt: string;
  updateAt: string;
  variants: {
    _id: string;
    images: { url: string }[];
    attribute: string[];
    sellPrice: number;
    availableQuantity: number;
  }[];
  averageRating?: number;
  totalReviews?: number;
}

const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="w-full h-56 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-6 bg-gray-200 rounded w-2/5 mt-2" />
    </div>
  </div>
);

export default function AllProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[string, string]>(["", ""]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [showMoreBrands, setShowMoreBrands] = useState(false);
  const itemsPerPage = 12;
  const { addToCart } = useCart();
  const { lang } = useLanguage();
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<Record<string, boolean>>({});

  const t = useMemo(() => {
    if (lang === "vi") return {
      title: "Tất cả sản phẩm",
      breadcrumbHome: "Trang chủ",
      breadcrumbProducts: "Sản phẩm",
      searchPlaceholder: "Tìm kiếm sản phẩm...",
      sortBy: "Sắp xếp theo",
      newest: "Mới nhất",
      priceLow: "Giá: Thấp → Cao",
      priceHigh: "Giá: Cao → Thấp",
      rating: "Đánh giá cao",
      nameAZ: "Tên: A → Z",
      results: (n: number) => `${n} sản phẩm`,
      price: "Khoảng giá",
      min: "Từ",
      max: "Đến",
      brand: "Thương hiệu",
      findBrand: "Tìm thương hiệu...",
      showMore: (n: number) => `Xem thêm (${n})`,
      showLess: "Thu gọn",
      customerRating: "Đánh giá",
      andUp: "trở lên",
      outOfStock: "Hết hàng",
      noProducts: "Không tìm thấy sản phẩm nào",
      noProductsDesc: "Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm",
      clearFilters: "Xóa bộ lọc",
      previous: "Trước",
      next: "Tiếp",
      filter: "Bộ lọc",
      addToCart: "Thêm vào giỏ",
      reviews: "đánh giá",
      loading: "Đang tải...",
      error: "Đã có lỗi xảy ra",
    };
    return {
      title: "All Products",
      breadcrumbHome: "Home",
      breadcrumbProducts: "Products",
      searchPlaceholder: "Search products...",
      sortBy: "Sort by",
      newest: "Newest",
      priceLow: "Price: Low → High",
      priceHigh: "Price: High → Low",
      rating: "Top Rated",
      nameAZ: "Name: A → Z",
      results: (n: number) => `${n} products`,
      price: "Price Range",
      min: "Min",
      max: "Max",
      brand: "Brand",
      findBrand: "Find brand...",
      showMore: (n: number) => `Show more (${n})`,
      showLess: "Show less",
      customerRating: "Rating",
      andUp: "& up",
      outOfStock: "Out of stock",
      noProducts: "No products found",
      noProductsDesc: "Try changing filters or search terms",
      clearFilters: "Clear filters",
      previous: "Previous",
      next: "Next",
      filter: "Filters",
      addToCart: "Add to cart",
      reviews: "reviews",
      loading: "Loading...",
      error: "An error occurred",
    };
  }, [lang]);

  // Fetch products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/products/all");
        if (response.data.success) {
          setAllProducts(response.data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t.error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await api.get("/wishlist");
        if (res.data.success && res.data.products) {
          setWishlistItems(res.data.products.map((p: any) => p._id));
        }
      } catch {}
    };
    fetchWishlist();
  }, []);

  // Brand list
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    allProducts.forEach(p => {
      if (p.brand) map.set(p.brand, (map.get(p.brand) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [allProducts]);

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));
  const displayedBrands = showMoreBrands ? filteredBrands : filteredBrands.slice(0, 7);

  // Filter + sort
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower) ||
        p.brand?.toLowerCase().includes(lower)
      );
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // Price filter
    const min = priceRange[0] ? parseInt(priceRange[0], 10) : null;
    const max = priceRange[1] ? parseInt(priceRange[1], 10) : null;
    if (min !== null) result = result.filter(p => (p.variants?.[0]?.sellPrice || 0) >= min);
    if (max !== null) result = result.filter(p => (p.variants?.[0]?.sellPrice || 0) <= max);

    // Rating filter
    if (selectedRating) {
      result = result.filter(p =>
        p.averageRating != null && p.averageRating >= selectedRating
      );
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => (a.variants?.[0]?.sellPrice || 0) - (b.variants?.[0]?.sellPrice || 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.variants?.[0]?.sellPrice || 0) - (a.variants?.[0]?.sellPrice || 0));
        break;
      case "rating":
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "name-az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.createAt || 0).getTime() - new Date(a.createAt || 0).getTime());
        break;
    }

    return result;
  }, [allProducts, searchTerm, selectedBrands, priceRange, selectedRating, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedBrands, priceRange, selectedRating, sortBy]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleToggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistLoading(prev => ({ ...prev, [productId]: true }));
    try {
      if (wishlistItems.includes(productId)) {
        await api.post("/wishlist/remove", { productId });
        setWishlistItems(prev => prev.filter(id => id !== productId));
      } else {
        await api.post("/wishlist/add", { productId });
        setWishlistItems(prev => [...prev, productId]);
      }
    } catch {}
    setWishlistLoading(prev => ({ ...prev, [productId]: false }));
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants?.[0];
    if (!variant || variant.availableQuantity <= 0) return;
    addToCart({
      _id: product._id,
      name: product.name,
      price: variant.sellPrice,
      image: variant.images?.[0]?.url || "/placeholder.svg",
      variantId: variant._id,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBrands([]);
    setPriceRange(["", ""]);
    setSelectedRating(null);
    setSortBy("newest");
  };

  const activeFilterCount = [
    selectedBrands.length > 0,
    priceRange[0] || priceRange[1],
    selectedRating !== null,
  ].filter(Boolean).length;

  // Sidebar filter component
  const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`space-y-5 ${mobile ? "" : "sticky top-24"}`}>
      {/* Price Range */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-sm mb-4 text-gray-800 uppercase tracking-wider">{t.price}</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number" min={0}
            value={priceRange[0]}
            onChange={e => setPriceRange([e.target.value, priceRange[1]])}
            className="h-10 rounded-xl border-gray-200 text-sm"
            placeholder={t.min}
          />
          <span className="text-gray-400 font-medium">—</span>
          <Input
            type="number" min={0}
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], e.target.value])}
            className="h-10 rounded-xl border-gray-200 text-sm"
            placeholder={t.max}
          />
        </div>
      </div>

      {/* Brand Filter */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-sm mb-4 text-gray-800 uppercase tracking-wider">{t.brand}</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t.findBrand}
            value={brandSearch}
            onChange={e => setBrandSearch(e.target.value)}
            className="pl-10 h-9 rounded-xl border-gray-200 text-sm"
          />
        </div>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {displayedBrands.map(brand => (
            <label
              key={brand.name}
              htmlFor={`brand-${mobile ? "m-" : ""}${brand.name}`}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-colors text-sm ${
                selectedBrands.includes(brand.name)
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`brand-${mobile ? "m-" : ""}${brand.name}`}
                  checked={selectedBrands.includes(brand.name)}
                  onChange={() => handleBrandChange(brand.name)}
                />
                <span>{brand.name}</span>
              </div>
              <span className="text-xs text-gray-400">({brand.count})</span>
            </label>
          ))}
        </div>
        {filteredBrands.length > 7 && (
          <Button
            variant="link"
            className="text-blue-600 p-0 h-auto mt-2 text-xs"
            onClick={() => setShowMoreBrands(!showMoreBrands)}
          >
            {showMoreBrands ? (
              <><ChevronUp className="w-3.5 h-3.5 mr-1" />{t.showLess}</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5 mr-1" />{t.showMore(filteredBrands.length - 7)}</>
            )}
          </Button>
        )}
      </div>

      {/* Rating Filter */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-sm mb-4 text-gray-800 uppercase tracking-wider">{t.customerRating}</h3>
        <div className="space-y-1">
          {[4, 3, 2, 1].map(rating => (
            <label
              key={`rating-${rating}`}
              htmlFor={`rating-${mobile ? "m-" : ""}${rating}`}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors text-sm ${
                selectedRating === rating ? "bg-amber-50" : "hover:bg-gray-50"
              }`}
            >
              <Checkbox
                checked={selectedRating === rating}
                onChange={(e) => setSelectedRating((e.target as HTMLInputElement).checked ? rating : null)}
                id={`rating-${mobile ? "m-" : ""}${rating}`}
              />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-1">{t.andUp}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full rounded-xl border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200"
        >
          <X className="w-4 h-4 mr-2" />
          {t.clearFilters}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">{t.breadcrumbHome}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-semibold">{t.breadcrumbProducts}</span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Package className="w-8 h-8" />
            {t.title}
          </h1>
          <p className="text-blue-100 text-sm">
            {t.results(filteredProducts.length)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="product-search"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl border-gray-200 bg-white shadow-sm text-sm"
              />
            </div>
            <Button
              variant="outline"
              className="lg:hidden h-11 rounded-xl border-gray-200 relative"
              onClick={() => setShowMobileFilters(true)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {t.filter}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">{t.sortBy}:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-10 rounded-xl border-gray-200 bg-white shadow-sm text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t.newest}</SelectItem>
                <SelectItem value="price-low">{t.priceLow}</SelectItem>
                <SelectItem value="price-high">{t.priceHigh}</SelectItem>
                <SelectItem value="rating">{t.rating}</SelectItem>
                <SelectItem value="name-az">{t.nameAZ}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar />
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: itemsPerPage }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 text-lg font-medium">{t.error}</p>
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 text-lg font-semibold mb-2">{t.noProducts}</p>
                <p className="text-gray-500 text-sm mb-6">{t.noProductsDesc}</p>
                <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                  {t.clearFilters}
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {currentProducts.map(product => {
                    const variant = product.variants?.[0];
                    const imageUrl = variant?.images?.[0]?.url || "/placeholder.svg";
                    const price = variant?.sellPrice || 0;
                    const inStock = (variant?.availableQuantity ?? 0) > 0;
                    const isWished = wishlistItems.includes(product._id);

                    return (
                      <Link href={`/product/${product._id}`} key={product._id}>
                        <Card className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer h-full">
                          <CardContent className="p-0 flex flex-col h-full">
                            {/* Image */}
                            <div className="relative overflow-hidden bg-gray-50">
                              <Image
                                src={imageUrl}
                                alt={product.name}
                                width={400}
                                height={400}
                                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {/* Wishlist */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all ${
                                  isWished ? "text-red-500" : "text-gray-500"
                                }`}
                                onClick={e => handleToggleWishlist(e, product._id)}
                                disabled={wishlistLoading[product._id]}
                              >
                                {wishlistLoading[product._id] ? (
                                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Heart className={`w-4 h-4 ${isWished ? "fill-red-500" : ""}`} />
                                )}
                              </Button>
                              {/* Out of stock badge */}
                              {!inStock && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="bg-white text-gray-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {t.outOfStock}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-4 flex flex-col flex-1">
                              {product.brand && (
                                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mb-1">
                                  {product.brand}
                                </span>
                              )}
                              <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors leading-snug">
                                {product.name}
                              </h3>

                              {/* Rating */}
                              {(product.averageRating ?? 0) > 0 && (
                                <div className="flex items-center gap-1.5 mb-2">
                                  <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star
                                        key={star}
                                        className={`w-3.5 h-3.5 ${
                                          star <= Math.round(product.averageRating || 0)
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-gray-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    ({product.totalReviews} {t.reviews})
                                  </span>
                                </div>
                              )}

                              {/* Price */}
                              <div className="mt-auto pt-2">
                                <span className="font-bold text-lg text-red-600">
                                  {price.toLocaleString("vi-VN")} ₫
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl h-10 px-4"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      {t.previous}
                    </Button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, idx, arr) => (
                          <span key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="w-10 h-10 flex items-center justify-center text-gray-400">…</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-xl ${
                                currentPage === page
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "border-gray-200"
                              }`}
                            >
                              {page}
                            </Button>
                          </span>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-xl h-10 px-4"
                    >
                      {t.next}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-50 overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">{t.filter}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowMobileFilters(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <FilterSidebar mobile />
          </div>
        </div>
      )}
    </div>
  );
}
