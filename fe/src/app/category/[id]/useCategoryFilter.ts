import { useState, useEffect } from "react";
import { productApi } from "@/api/product";
import { categoryApi } from "@/api/category";
import { wishlistApi } from "@/api/wishlist";
import { Product, CategoryResponse, Category } from "./types";

export function useCategoryFilter(categoryId: string) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryResponse | null>(null);

  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showMoreBrands, setShowMoreBrands] = useState(false);
  const [priceRange, setPriceRange] = useState<[string, string]>(["", ""]);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [breadcrumbHistory, setBreadcrumbHistory] = useState<Category[]>([]);

  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<Record<string, boolean>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesResponse, attributesResponse, productsData] = await Promise.all([
          categoryApi.getChildCategories(categoryId),
          categoryApi.getCategoryAttributes(categoryId),
          productApi.getProductsByCategory(categoryId),
        ]);

        if (categoriesResponse.success) {
          setCategories({
            parent: categoriesResponse.parent,
            children: categoriesResponse.children,
            attributes: attributesResponse.attributes,
          });

          if (categoriesResponse.parent) {
            let history: Category[] = [];
            try {
              const stored = localStorage.getItem("breadcrumbHistory");
              if (stored) history = JSON.parse(stored);
            } catch {}

            if (
              !history.length ||
              history[history.length - 1]._id !== categoriesResponse.parent._id
            ) {
              history = [categoriesResponse.parent];
            }
            setBreadcrumbHistory(history);
            localStorage.setItem("breadcrumbHistory", JSON.stringify(history));
          }
        }

        setAllProducts(productsData);
        setProducts(productsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  useEffect(() => {
    if (!categoryId) return;

    try {
      setLoading(true);
      let filteredProducts = [...allProducts];

      const parsedPriceRange: [number, number] = [
        priceRange[0] ? Number(priceRange[0]) : 0,
        priceRange[1] ? Number(priceRange[1]) : 0,
      ];

      if (priceRange[0] || priceRange[1]) {
        filteredProducts = filteredProducts.filter((product) => {
          if (!product.variants || product.variants.length === 0) return false;
          return product.variants.some((variant) => {
            const price = variant.sellPrice || 0;
            const min = parsedPriceRange[0] > 0 ? parsedPriceRange[0] : undefined;
            const max = parsedPriceRange[1] > 0 ? parsedPriceRange[1] : undefined;
            if (min !== undefined && max !== undefined) {
              return price >= min && price <= max;
            }
            if (min !== undefined) {
              return price >= min;
            }
            if (max !== undefined) {
              return price <= max;
            }
            return true;
          });
        });
      }

      if (selectedBrands.length > 0) {
        filteredProducts = filteredProducts.filter((product) => {
          if (!product.brand) return false;
          return selectedBrands.some(
            (selectedBrand) =>
              selectedBrand.trim().toLowerCase() === product.brand.trim().toLowerCase(),
          );
        });
      }

      if (selectedAttributes && Object.keys(selectedAttributes).length > 0) {
        filteredProducts = filteredProducts.filter((product) => {
          if (!product.variants || product.variants.length === 0) return false;
          return Object.entries(selectedAttributes).every(([attributeId, childIds]) => {
            if (childIds.length === 0) return true;
            return product.variants.some((variant) =>
              (variant.attribute || []).some((attrId) => {
                const matchingChild = categories?.attributes
                  ?.find((a) => a._id === attributeId)
                  ?.children.find((c) => c._id === attrId);
                return Boolean(matchingChild && childIds.includes(attrId));
              }),
            );
          });
        });
      }

      if (typeof selectedRating === "number") {
        filteredProducts = filteredProducts.filter((product) => {
          const avg = product.averageRating;
          if (typeof avg !== "number") return false;
          if (selectedRating === 5) return avg === 5;
          return avg >= selectedRating && avg < selectedRating + 1;
        });
      }

      if (sortBy) {
        switch (sortBy) {
          case "price-low":
            filteredProducts.sort((a, b) => {
              const aMinPrice = Math.min(...a.variants.map((v) => v.sellPrice || 0));
              const bMinPrice = Math.min(...b.variants.map((v) => v.sellPrice || 0));
              return aMinPrice - bMinPrice;
            });
            break;
          case "price-high":
            filteredProducts.sort((a, b) => {
              const aMaxPrice = Math.max(...a.variants.map((v) => v.sellPrice || 0));
              const bMaxPrice = Math.max(...b.variants.map((v) => v.sellPrice || 0));
              return bMaxPrice - aMaxPrice;
            });
            break;
          case "newest":
            filteredProducts.sort((a, b) => {
              const aDate = new Date(a.createAt).getTime();
              const bDate = new Date(b.createAt).getTime();
              return bDate - aDate;
            });
            break;
          default:
            break;
        }
      }

      setProducts(filteredProducts);
    } catch (err) {
      console.error("Error filtering products:", err);
      setError(err instanceof Error ? err.message : "An error occurred while filtering products");
    } finally {
      setLoading(false);
    }
  }, [
    priceRange,
    selectedBrands,
    selectedAttributes,
    selectedRating,
    sortBy,
    allProducts,
    categoryId,
    categories?.attributes,
  ]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const token =
          (typeof window !== "undefined" &&
            (sessionStorage.getItem("token") || localStorage.getItem("token"))) ||
          null;

        const loggedIn = Boolean(token);
        setIsLoggedIn(loggedIn);
        if (!loggedIn) {
          setWishlistItems([]);
          return;
        }

        const wishlistProducts = await wishlistApi.getWishlist();
        if (wishlistProducts) {
          setWishlistItems(wishlistProducts.map((p: { _id: string }) => p._id));
        }
      } catch {
        // Bỏ qua để tránh spam 401 trên console khi token hết hạn
      }
    };
    fetchWishlist();
  }, []);

  const handleToggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setWishlistLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      if (wishlistItems.includes(productId)) {
        await wishlistApi.removeFromWishlist(productId);
        setWishlistItems((prev) => prev.filter((id) => id !== productId));
      } else {
        await wishlistApi.addToWishlist(productId);
        setWishlistItems((prev) => [...prev, productId]);
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    } finally {
      setWishlistLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleBrandChange = (brandName: string) => {
    setSelectedBrands((prev) => {
      const exists = prev.some(
        (brand) => brand.trim().toLowerCase() === brandName.trim().toLowerCase(),
      );

      if (exists) {
        return prev.filter(
          (brand) => brand.trim().toLowerCase() !== brandName.trim().toLowerCase(),
        );
      }

      return [...prev, brandName];
    });
  };

  const handleAttributeChange = (attributeId: string, childId: string) => {
    setSelectedAttributes((prev) => {
      const currentValues = prev[attributeId] || [];
      const newValues = currentValues.includes(childId)
        ? currentValues.filter((v) => v !== childId)
        : [...currentValues, childId];

      return {
        ...prev,
        [attributeId]: newValues,
      };
    });
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setSelectedAttributes({});
    setSelectedBrands([]);
    setSelectedRating(null);
    setBrandSearch("");
    setPriceRange(["", ""]);
    setSortBy("relevance");
  };

  return {
    allProducts,
    products,
    loading,
    error,
    categories,
    brandSearch,
    setBrandSearch,
    selectedBrands,
    handleBrandChange,
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
    isLoggedIn,
    handleToggleWishlist,
    resetFilters,
  };
}
