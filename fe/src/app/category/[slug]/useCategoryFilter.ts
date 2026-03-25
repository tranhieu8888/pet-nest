import { useState, useEffect } from "react";
import { productApi } from "@/api/product";
import { categoryApi } from "@/api/category";
import { wishlistApi } from "@/api/wishlist";
import { Product, CategoryResponse, Category } from "./types";
import { isMongoObjectId, toSlug } from "@/lib/slug";

type CategoryNode = Category & { children?: CategoryNode[] };

const flattenCategories = (nodes: CategoryNode[] = []) => {
  const result: CategoryNode[] = [];

  const walk = (items: CategoryNode[]) => {
    items.forEach((item) => {
      result.push(item);
      if (Array.isArray(item.children) && item.children.length > 0) {
        walk(item.children);
      }
    });
  };

  walk(nodes);
  return result;
};

export function useCategoryFilter(categoryParam: string) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryResponse | null>(null);
  const [resolvedCategoryId, setResolvedCategoryId] = useState<string>("");

  const [brandSearch, setBrandSearch] = useState("");
  const [showMoreBrands, setShowMoreBrands] = useState(false);
  const [priceRange, setPriceRange] = useState<[string, string]>(["", ""]);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [breadcrumbHistory, setBreadcrumbHistory] = useState<Category[]>([]);

  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const resolveCategoryId = async () => {
      try {
        if (!categoryParam) return;

        if (isMongoObjectId(categoryParam)) {
          setResolvedCategoryId(categoryParam);
          return;
        }

        const allCategoryTrees = await categoryApi.getChildCategoriesTree();
        const flat = flattenCategories(
          allCategoryTrees.flatMap((group: { parent: CategoryNode; children: CategoryNode[] }) => [
            group.parent,
            ...(group.children || []),
          ]),
        );

        const found = flat.find((cat) => toSlug(cat.name) === categoryParam);
        setResolvedCategoryId(found?._id || "");

        if (!found) {
          setError("Không tìm thấy danh mục phù hợp");
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tìm danh mục");
        setLoading(false);
      }
    };

    resolveCategoryId();
  }, [categoryParam]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesResponse, attributesResponse, productsData] = await Promise.all([
          categoryApi.getChildCategories(resolvedCategoryId),
          categoryApi.getCategoryAttributes(resolvedCategoryId),
          productApi.getProductsByCategory(resolvedCategoryId),
        ]);

        if (categoriesResponse.success) {
          setCategories((prev) => ({
            ...prev,
            ...categoriesResponse,
            attributes: attributesResponse.attributes,
          }));

          if (categoriesResponse.parent) {
            let history: Category[] = [];
            try {
              const stored = localStorage.getItem("breadcrumbHistory");
              if (stored) history = JSON.parse(stored);
            } catch {}

            if (!history.length || history[history.length - 1]._id !== categoriesResponse.parent._id) {
              history = [categoriesResponse.parent];
            }
            setBreadcrumbHistory(history);
            localStorage.setItem("breadcrumbHistory", JSON.stringify(history));
          }
        }

        setAllProducts(productsData);
        setProducts(productsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    if (resolvedCategoryId) {
      fetchData();
    }
  }, [resolvedCategoryId]);

  useEffect(() => {
    if (resolvedCategoryId) {
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
              } else if (min !== undefined) {
                return price >= min;
              } else if (max !== undefined) {
                return price <= max;
              }
              return true;
            });
          });
        }

        if (selectedAttributes && Object.keys(selectedAttributes).length > 0) {
          filteredProducts = filteredProducts.filter((product) => {
            if (!product.variants || product.variants.length === 0) return false;
            return Object.entries(selectedAttributes).every(([attributeId, childIds]) => {
              if (childIds.length === 0) return true;
              return product.variants.some((variant) =>
                variant.attribute.some((attr) => {
                  const matchingChild = categories?.attributes
                    ?.find((a) => a._id === attributeId)
                    ?.children.find((c) => c._id === attr.toString());
                  return matchingChild && childIds.includes(attr.toString());
                }),
              );
            });
          });
        }

        if (typeof selectedRating === "number") {
          filteredProducts = filteredProducts.filter((product) => {
            const avg = (product as any).averageRating;
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
          }
        }

        setProducts(filteredProducts);
      } catch (err) {
        console.error("Error filtering products:", err);
        setError(err instanceof Error ? err.message : "An error occurred while filtering products");
      } finally {
        setLoading(false);
      }
    }
  }, [priceRange, selectedAttributes, selectedRating, sortBy, allProducts, resolvedCategoryId, categories?.attributes]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const wishlistProducts = await wishlistApi.getWishlist();
        if (wishlistProducts) {
          setWishlistItems(wishlistProducts.map((p: any) => p._id));
        }
      } catch (err) {
        console.error("Error fetching wishlist:", err);
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
    resolvedCategoryId,
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
  };
}
