"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import viConfig from "../../../../utils/petPagesConfig.vi";
import enConfig from "../../../../utils/petPagesConfig.en";
import { useCategoryFilter } from "./useCategoryFilter";
import { FilterSidebar } from "./components/FilterSidebar";
import { ProductGrid } from "./components/ProductGrid";
import { CategoryBreadcrumb } from "./components/CategoryBreadcrumb";
import { PaginationControls } from "./components/PaginationControls";
import { Category } from "./types";
import { toSlug } from "@/lib/slug";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductsPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const config = lang === "vi" ? viConfig : enConfig;
  const categoryPageConfig = config.categoryPage;

  const {
    allProducts,
    products,
    loading,
    error,
    categories,
    brandSearch,
    setBrandSearch,
    showMoreBrands,
    setShowMoreBrands,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    selectedRating,
    setSelectedRating,
    selectedAttributes,
    handleAttributeChange,
    currentPage,
    setCurrentPage,
    breadcrumbHistory,
    setBreadcrumbHistory,
    wishlistItems,
    wishlistLoading,
    handleToggleWishlist,
    resetFilters,
  } = useCategoryFilter(params.slug as string);

  const itemsPerPage = 9;

  // Tạo danh sách brand động từ allProducts
  const brandCounts = allProducts.reduce((acc, p) => {
    if (p.brand) {
      acc[p.brand] = (acc[p.brand] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const brands = Object.entries(brandCounts).map(([name, count]) => ({ name, count }));

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );
  const displayedBrands = showMoreBrands ? filteredBrands : filteredBrands.slice(0, 7);

  const handleCategoryClick = (categoryId: string) => {
    resetFilters();
    const clickedCat = categories?.children?.find((c) => c._id === categoryId);
    if (!clickedCat) return;

    const newHistory = [...breadcrumbHistory, clickedCat];
    setBreadcrumbHistory(newHistory);
    localStorage.setItem("breadcrumbHistory", JSON.stringify(newHistory));
    router.push(`/category/${toSlug(clickedCat.name)}`);
  };

  const handleBreadcrumbClick = (history: Category[], catId?: string) => {
    setBreadcrumbHistory(history);
    localStorage.setItem("breadcrumbHistory", JSON.stringify(history));
    if (catId) {
      const target = history.find((c) => c._id === catId);
      router.push(`/category/${target ? toSlug(target.name) : catId}`);
    }
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  // Initial load
  if (loading && allProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Breadcrumb */}
      <CategoryBreadcrumb
        categoryPageConfig={categoryPageConfig}
        breadcrumbHistory={breadcrumbHistory}
        setBreadcrumbHistory={setBreadcrumbHistory}
        handleBreadcrumbClick={handleBreadcrumbClick}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <FilterSidebar
            categories={categories}
            categoryPageConfig={categoryPageConfig}
            handleCategoryClick={handleCategoryClick}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            brandSearch={brandSearch}
            setBrandSearch={setBrandSearch}
            displayedBrands={displayedBrands}
            filteredBrandsLength={filteredBrands.length}
            showMoreBrands={showMoreBrands}
            setShowMoreBrands={setShowMoreBrands}
            selectedRating={selectedRating}
            setSelectedRating={setSelectedRating}
            selectedAttributes={selectedAttributes}
            handleAttributeChange={handleAttributeChange}
          />

          {/* Main List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700 font-medium">
                {categoryPageConfig.sort.results.replace(
                  "{count}",
                  products.length.toString()
                )}
              </p>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 font-medium">
                  {categoryPageConfig.sort.sortBy}
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">{categoryPageConfig.sort.relevance}</SelectItem>
                    <SelectItem value="price-low">{categoryPageConfig.sort.priceLow}</SelectItem>
                    <SelectItem value="price-high">{categoryPageConfig.sort.priceHigh}</SelectItem>
                    <SelectItem value="rating">{categoryPageConfig.sort.rating}</SelectItem>
                    <SelectItem value="newest">{categoryPageConfig.sort.newest}</SelectItem>
                    <SelectItem value="bestselling">{categoryPageConfig.sort.bestselling}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid */}
            <ProductGrid
              loading={loading}
              products={currentProducts}
              itemsPerPage={itemsPerPage}
              wishlistItems={wishlistItems}
              wishlistLoading={wishlistLoading}
              handleToggleWishlist={handleToggleWishlist}
            />

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              categoryPageConfig={categoryPageConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
