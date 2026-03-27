import { Search, ChevronDown, ChevronUp, Star, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Category, CategoryResponse } from "../types";

interface FilterSidebarProps {
  categories: CategoryResponse | null;
  categoryPageConfig: any;
  handleCategoryClick: (categoryId: string) => void;
  priceRange: [string, string];
  setPriceRange: (range: [string, string]) => void;
  brandSearch: string;
  setBrandSearch: (search: string) => void;
  displayedBrands: { name: string; count: number }[];
  selectedBrands: string[];
  handleBrandChange: (brandName: string) => void;
  filteredBrandsLength: number;
  showMoreBrands: boolean;
  setShowMoreBrands: (show: boolean) => void;
  selectedRating: number | null;
  setSelectedRating: (rating: number | null) => void;
  selectedAttributes: Record<string, string[]>;
  handleAttributeChange: (attributeId: string, childId: string) => void;
}

export const FilterSidebar = ({
  categories,
  categoryPageConfig,
  handleCategoryClick,
  priceRange,
  setPriceRange,
  brandSearch,
  setBrandSearch,
  displayedBrands,
  selectedBrands,
  handleBrandChange,
  filteredBrandsLength,
  showMoreBrands,
  setShowMoreBrands,
  selectedRating,
  setSelectedRating,
  selectedAttributes,
  handleAttributeChange,
}: FilterSidebarProps) => {
  return (
    <div className="w-72 space-y-6">
      {categories?.children && categories.children.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-3 text-gray-900">
            {categoryPageConfig.sidebar.category}
          </h3>
          <div className="space-y-1">
            {categories.children.map((category: Category) => (
              <button
                key={category._id}
                onClick={() => handleCategoryClick(category._id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 group"
              >
                <span className="truncate pr-2">{category.name}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-500 transition-all duration-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-4 text-gray-900">
          {categoryPageConfig.sidebar.price}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min={0}
              value={priceRange[0]}
              onChange={(e) => setPriceRange([e.target.value, priceRange[1]])}
              className="w-24 border-gray-300"
              placeholder="Min"
            />
            <span className="mx-2">-</span>
            <Input
              type="number"
              min={0}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], e.target.value])}
              className="w-24 border-gray-300"
              placeholder="Max"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {priceRange[0] ? Number(priceRange[0]).toLocaleString() + " ₫" : ""}
            </span>
            <span>
              {priceRange[1] ? Number(priceRange[1]).toLocaleString() + " ₫+" : ""}
            </span>
          </div>
        </div>
      </div>

      {categories?.attributes?.map((attribute) => (
        <div key={attribute._id} className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-bold text-lg mb-4 text-gray-900 capitalize">
            {attribute.value.replace(/_/g, " ")}
          </h3>
          <div className="space-y-3">
            {attribute.children.map((child) => (
              <div key={child._id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${attribute._id}-${child._id}`}
                  checked={selectedAttributes[attribute._id]?.includes(child._id) || false}
                  onChange={() => handleAttributeChange(attribute._id, child._id)}
                />
                <label
                  htmlFor={`${attribute._id}-${child._id}`}
                  className="text-sm cursor-pointer text-gray-700 capitalize"
                >
                  {child.value}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-4 text-gray-900">
          {categoryPageConfig.sidebar.brand}
        </h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={categoryPageConfig.sidebar.findBrandPlaceholder}
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            className="pl-10 border-gray-300"
          />
        </div>
        <div className="space-y-3">
          {displayedBrands.map((brand) => (
            <div key={brand.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand.name}`}
                  checked={selectedBrands.some(
                    (selectedBrand) =>
                      selectedBrand.trim().toLowerCase() === brand.name.trim().toLowerCase(),
                  )}
                  onChange={() => handleBrandChange(brand.name)}
                />
                <label
                  htmlFor={`brand-${brand.name}`}
                  className="text-sm cursor-pointer text-gray-700"
                >
                  {brand.name}
                </label>
              </div>
              <span className="text-gray-500 text-sm">({brand.count})</span>
            </div>
          ))}
        </div>
        <Button
          variant="link"
          className="text-blue-600 p-0 h-auto mt-3 text-sm"
          onClick={() => setShowMoreBrands(!showMoreBrands)}
        >
          {showMoreBrands ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              {categoryPageConfig.sidebar.showLess}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              {categoryPageConfig.sidebar.showMore.replace(
                "{count}",
                Math.max(0, filteredBrandsLength - 7).toString(),
              )}
            </>
          )}
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-4 text-gray-900">
          {categoryPageConfig.sidebar.customerRating}
        </h3>
        <div className="space-y-3">
          {[4, 3, 2, 1].map((rating) => (
            <div key={`rating-${rating}`} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedRating === rating}
                  onChange={(e) => setSelectedRating(e.target.checked ? rating : null)}
                  id={`rating-${rating}`}
                />
                <label htmlFor={`rating-${rating}`} className="flex items-center cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={`star-${rating}-${star}`}
                      className={`w-5 h-5 ${star <= rating ? "text-orange-400 fill-orange-400" : "text-gray-300"}`}
                      fill={star <= rating ? "#f59e42" : "none"}
                    />
                  ))}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
