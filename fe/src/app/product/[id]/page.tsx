"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Heart,
  Star,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle2,
  Minus,
  Plus,
  ZoomIn,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/layout/Header";
import { api } from "../../../../utils/axios";
import { useLanguage } from "@/context/LanguageContext";
import viConfig from "../../../../utils/petPagesConfig.vi";
import enConfig from "../../../../utils/petPagesConfig.en";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: {
    id: string;
    name: string;
  }[];
  createAt: string;
  updateAt: string;
  variants: {
    _id: string;
    product_id: string;
    images: {
      url: string;
    }[];
    attributes: {
      _id: string;
      value: string;
      parentId: string | null;
      categories?: string[];
    }[];
    sellPrice: number;
    importBatches: {
      _id: string;
      variantId: string;
      importDate: string;
      quantity: number;
      costPrice: number;
    }[];
    availableQuantity: number;
  }[];
  categoryInfo: {
    _id: string;
    name: string;
    description: string;
    parentCategory: string | null;
    createAt: string;
    updateAt: string;
    image: string;
  }[];
  reviews: any[];
  reviewUsers: any[];
  averageRating: number | null;
  totalReviews: number;
}

interface UnreviewedProduct {
  _id: string;
  productName: string;
  productDescription: string;
  productBrand: string;
  totalQuantity: number;
  lastPurchaseDate: string;
}

interface UnreviewedData {
  totalPurchasedProducts: number;
  totalReviewedProducts: number;
  unreviewedProducts: UnreviewedProduct[];
  unreviewedCount: number;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Math.round(price)) + "đ";
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" };
  const cls = sizeMap[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${cls} transition-colors ${star <= Math.floor(rating)
            ? "fill-amber-400 text-amber-400"
            : star <= rating
              ? "fill-amber-400/50 text-amber-400"
              : "fill-gray-200 text-gray-200"
            }`}
        />
      ))}
    </div>
  );
}

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const { lang } = useLanguage();
  const router = useRouter();
  const config =
    lang === "vi" ? viConfig.productDetail : enConfig.productDetail;
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
  const [imageZoom, setImageZoom] = useState(false);

  // Review form states
  const [unreviewedData, setUnreviewedData] = useState<UnreviewedData | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: "",
    images: [] as File[],
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/productById/${params.id}`);
        if (response.data.success) {
          setProduct(response.data.data);
        } else {
          throw new Error("Failed to fetch product");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An error occurred while fetching product"
        );
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchProduct();
  }, [params.id]);

  useEffect(() => {
    const fetchUnreviewedProducts = async () => {
      try {
        const response = await api.get(`/reviews/unreviewed/${params.id}`);
        if (response.data.success) setUnreviewedData(response.data.data);
      } catch { }
    };
    if (params.id) fetchUnreviewedProducts();
  }, [params.id]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await api.get("/wishlist");
        if (res.data.success && res.data.products) {
          setIsWishlisted(res.data.products.some((p: any) => p._id === product?._id));
        }
      } catch { }
    };
    if (product?._id) fetchWishlist();
  }, [product?._id]);

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  const handleBuyNow = async () => {
    if (!product || !product.variants[selectedVariant]) return;
    try {
      setAddingToCart(true);
      const response = await api.post("/cart/addtocart", {
        productId: product._id,
        productVariantId: product.variants[selectedVariant]._id,
        quantity,
      });
      if (response.data.success) {
        window.dispatchEvent(new Event("cartUpdated"));
        router.push("/cart");
      } else {
        throw new Error(response.data.message || config.addToCartFail);
      }
    } catch (err) {
      setAddToCartError(err instanceof Error ? err.message : config.addToCartFail);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !product.variants[selectedVariant]) return;
    if (quantity <= 0) return;
    try {
      setAddingToCart(true);
      setAddToCartError(null);
      const response = await api.post("/cart/addtocart", {
        productId: product._id,
        productVariantId: product.variants[selectedVariant]._id,
        quantity,
      });
      if (response.data.success) {
        setAddToCartSuccess(true);
        setTimeout(() => setAddToCartSuccess(false), 3000);
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        throw new Error(response.data.message || config.addToCartFail);
      }
    } catch (err) {
      setAddToCartError(err instanceof Error ? err.message : config.addToCartFail);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await api.post("/wishlist/remove", { productId: product._id });
        setIsWishlisted(false);
      } else {
        await api.post("/wishlist/add", { productId: product._id });
        setIsWishlisted(true);
      }
    } catch { }
    setWishlistLoading(false);
  };

  const handleReviewSubmit = async () => {
    if (!product) return;
    if (reviewForm.rating === 0) { setReviewError(config.reviewForm.minRating); return; }
    if (reviewForm.comment.length < 10) { setReviewError(config.reviewForm.minCommentLength); return; }
    const maxFileSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    for (const image of reviewForm.images) {
      if (image.size > maxFileSize) { setReviewError("Kích thước file không được vượt quá 5MB"); return; }
      if (!allowedTypes.includes(image.type)) { setReviewError("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)"); return; }
    }
    try {
      setSubmittingReview(true);
      setReviewError(null);
      let response;
      if (reviewForm.images.length === 0) {
        response = await api.post("/reviews", {
          productId: product._id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
      } else {
        const formData = new FormData();
        formData.append("productId", product._id);
        formData.append("rating", reviewForm.rating.toString());
        formData.append("comment", reviewForm.comment);
        reviewForm.images.forEach((image) => formData.append("images", image));
        response = await api.post("/reviews", formData);
      }
      if (response.data.success) {
        setShowReviewForm(false);
        setReviewForm({ rating: 0, comment: "", images: [] });
        window.location.reload();
      } else {
        throw new Error(response.data.message || config.reviewForm.error);
      }
    } catch (err: any) {
      if (err.response?.status === 413) setReviewError("File ảnh quá lớn.");
      else if (err.response?.status === 400) setReviewError(err.response.data.message || "Dữ liệu không hợp lệ");
      else if (err.response?.status === 500) setReviewError("Lỗi server. Vui lòng thử lại sau.");
      else setReviewError(err instanceof Error ? err.message : config.reviewForm.error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl bg-gray-200" />
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-square rounded-xl bg-gray-200" />)}
              </div>
            </div>
            <div className="space-y-6 pt-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-10 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-1/4" />
              <div className="h-20 bg-gray-200 rounded" />
              <div className="h-14 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500">{error || config.productNotFound}</p>
        </div>
      </div>
    );
  }

  const variant = product.variants[selectedVariant] || {};
  const images = variant?.images || [];
  const inStock = variant.availableQuantity > 0;

  // Build attribute options
  const parentAttributes = product.variants
    .flatMap((v) => v.attributes || [])
    .filter((attr) => attr.parentId === null)
    .reduce((acc, attr) => { acc[attr._id] = attr.value; return acc; }, {} as Record<string, string>);

  const attributeOptions: Record<string, { value: string; variantIndex: number }[]> = {};
  product.variants.forEach((v, idx) => {
    (v.attributes || []).forEach((attr) => {
      if (attr.parentId && parentAttributes[attr.parentId]) {
        if (!attributeOptions[attr.parentId]) attributeOptions[attr.parentId] = [];
        if (!attributeOptions[attr.parentId].some((opt) => opt.value === attr.value)) {
          attributeOptions[attr.parentId].push({ value: attr.value, variantIndex: idx });
        }
      }
    });
  });

  const isUnreviewed = unreviewedData?.unreviewedProducts?.some((p) => p._id === product._id);
  const unreviewedProduct = unreviewedData?.unreviewedProducts?.find((p) => p._id === product._id);

  // Rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: product.reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
      <Header />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <a href="/" className="hover:text-primary transition-colors">Trang chủ</a>
          <ChevronRight className="w-3.5 h-3.5" />
          {product.category?.[0] && (
            <>
              <a href={`/category/${product.category[0].id}`} className="hover:text-primary transition-colors">
                {product.category[0].name}
              </a>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-gray-600 font-medium truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Main Product Grid ─────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-10 mb-14">

          {/* ── Left: Image Gallery ────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-xl cursor-zoom-in group"
              onClick={() => setImageZoom(true)}
            >
              <Image
                src={images[selectedImage]?.url || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {/* Stock overlay */}
              {!inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white text-gray-800 font-bold text-lg px-6 py-2 rounded-full shadow-lg">
                    Hết hàng
                  </span>
                </div>
              )}
              {/* Zoom hint */}
              <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm text-gray-600 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                <ZoomIn className="w-4 h-4" />
              </div>
              {/* Image nav arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => (prev - 1 + images.length) % images.length); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => (prev + 1) % images.length); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${selectedImage === i
                      ? "border-primary shadow-md scale-105"
                      : "border-transparent hover:border-gray-300 opacity-60 hover:opacity-100"
                      }`}
                  >
                    <Image
                      src={img.url || "/placeholder.svg"}
                      alt={`${product.name} - ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}


          </div>

          {/* ── Right: Product Info ─────────────────────────────────────────── */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Category badges */}
            <div className="flex flex-wrap gap-2">
              {(product.category || []).map((cat, idx) => (
                <span
                  key={cat.id || idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                >
                  {cat.name}
                </span>
              ))}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>

            {/* Rating row */}
            {product.averageRating !== null && product.totalReviews > 0 && (
              <div className="flex items-center gap-3">
                <StarRating rating={product.averageRating} size="sm" />
                <span className="font-bold text-amber-500">{product.averageRating?.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({product.totalReviews} đánh giá)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-end gap-4">
              <span className="text-4xl font-black text-primary">
                {formatPrice(variant.sellPrice || 0)}
              </span>
              {inStock ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  Còn {variant.availableQuantity} sản phẩm
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                  {config.outOfStock}
                </span>
              )}
            </div>

            <Separator />

            {/* Description */}
            <p className="text-gray-500 text-base leading-relaxed">{product.description}</p>

            {/* Variant Attributes */}
            {Object.entries(attributeOptions).map(([parentId, options]) => (
              <div key={parentId}>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {parentAttributes[parentId][0].toUpperCase() + parentAttributes[parentId].slice(1)}:
                  <span className="text-primary ml-2">
                    {options.find((o) => o.variantIndex === selectedVariant)?.value}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedVariant(opt.variantIndex)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${selectedVariant === opt.variantIndex
                        ? "border-primary bg-primary text-white shadow-md shadow-primary/25"
                        : "border-gray-200 bg-white text-gray-600 hover:border-primary/50 hover:text-primary"
                        }`}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity + Add to cart */}
            {inStock && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">{config.quantity}:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-5 py-2 font-bold text-gray-900 min-w-[3rem] text-center border-x-2 border-gray-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(variant.availableQuantity, q + 1))}
                      className="px-3 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  {/* Add to Cart — outline style */}
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${addToCartSuccess
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200"
                      : "bg-white border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white active:scale-[0.98]"
                      }`}
                    style={{ height: "52px" }}
                  >
                    {addingToCart ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : addToCartSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Đã thêm!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        {config.addToCart}
                      </>
                    )}
                  </button>

                  {/* Buy Now — filled orange gradient */}
                  <button
                    onClick={handleBuyNow}
                    disabled={addingToCart}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white transition-all duration-300 active:scale-[0.98]"
                    style={{
                      height: "52px",
                      background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
                      boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Mua ngay
                  </button>
                </div>

                {addToCartError && (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    {addToCartError}
                  </p>
                )}

                {/* Wishlist as subtle text button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-400"
                      }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500" : ""}`} />
                    {isWishlisted ? "Đã yêu thích" : "Thêm vào yêu thích"}
                  </button>
                </div>
              </div>
            )}

            {/* Out of stock CTA */}
            {!inStock && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                    style={{ height: "52px" }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {config.outOfStock}
                  </button>
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold text-gray-400 bg-gray-100 cursor-not-allowed"
                    style={{ height: "52px" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Mua ngay
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-400"
                      }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500" : ""}`} />
                    {isWishlisted ? "Đã yêu thích" : "Thêm vào yêu thích"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Image Zoom Dialog ──────────────────────────────────────────────── */}
        {imageZoom && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setImageZoom(false)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-white/10 rounded-full p-2"
              onClick={() => setImageZoom(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative max-w-3xl max-h-[90vh] w-full h-full">
              <Image
                src={images[selectedImage]?.url || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          </div>
        )}

        {/* ── Write Review Banner ────────────────────────────────────────────── */}
        {isUnreviewed && unreviewedProduct && (
          <div className="mb-12">
            <div
              className="relative overflow-hidden rounded-3xl p-6 flex items-center justify-between gap-6"
              style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
            >
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }}
              />
              <div className="relative space-y-1">
                <h3 className="text-xl font-bold text-white">{config.unreviewedSection.title}</h3>
                <p className="text-white/80 text-sm">{config.unreviewedSection.subtitle}</p>
                <p className="text-white/60 text-xs">
                  {config.unreviewedSection.purchasedOn.replace("{date}", formatDate(unreviewedProduct.lastPurchaseDate))}
                </p>
              </div>
              <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                <DialogTrigger asChild>
                  <button className="relative flex-shrink-0 bg-white text-violet-700 font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                    {config.unreviewedSection.writeReview}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px] rounded-3xl border-0 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{config.reviewForm.title}</DialogTitle>
                    <p className="text-sm text-gray-400 mt-1">{config.reviewForm.subtitle}</p>
                  </DialogHeader>
                  <div className="space-y-5 mt-2">
                    {/* Star Rating Input */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">{config.reviewForm.rating}</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-9 h-9 transition-colors ${star <= (hoveredStar || reviewForm.rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-200 fill-gray-200"
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <Label htmlFor="review-comment" className="text-sm font-semibold mb-2 block">
                        {config.reviewForm.comment}
                      </Label>
                      <Textarea
                        id="review-comment"
                        placeholder={config.reviewForm.commentPlaceholder}
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows={4}
                        className="rounded-xl border-gray-200 resize-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    {/* Images */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">{config.reviewForm.images}</Label>
                      <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const maxFileSize = 5 * 1024 * 1024;
                            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                            const validFiles = files.filter((file) => {
                              if (file.size > maxFileSize) { alert(`File ${file.name} quá lớn (tối đa 5MB)`); return false; }
                              if (!allowedTypes.includes(file.type)) { alert(`File ${file.name} không phải là ảnh hợp lệ`); return false; }
                              return true;
                            });
                            setReviewForm({ ...reviewForm, images: [...reviewForm.images, ...validFiles] });
                          }}
                        />
                        <Plus className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Thêm ảnh (JPEG, PNG, WebP – tối đa 5MB)</span>
                      </label>
                      {reviewForm.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {reviewForm.images.map((file, index) => (
                            <div key={index} className="relative aspect-square">
                              <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100">
                                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, images: reviewForm.images.filter((_, i) => i !== index) })}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 shadow-md"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {reviewError && (
                      <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                        {reviewError}
                      </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={() => setShowReviewForm(false)} disabled={submittingReview} className="rounded-xl">
                        {config.cancel}
                      </Button>
                      <Button onClick={handleReviewSubmit} disabled={submittingReview} className="rounded-xl">
                        {submittingReview ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {config.reviewForm.submitting}
                          </div>
                        ) : config.reviewForm.submit}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* ── Tabs: Description + Reviews ─────────────────────────────────── */}
        <div className="mt-4 mb-12">
          {/* Tab headers */}
          <div className="flex border-b border-gray-200 mb-6">
            {[
              { key: "description", label: "Mô tả sản phẩm" },
              { key: "reviews", label: `Đánh giá (${product.totalReviews})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "description" | "reviews")}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Description */}
          {activeTab === "description" && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">Mô tả chi tiết</h2>
              {product.description ? (
                <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                  {product.description}
                </p>
              ) : (
                <p className="text-gray-400 italic">Chưa có mô tả chi tiết cho sản phẩm này.</p>
              )}
              {/* Additional product info */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: Truck, label: "Miễn phí vận chuyển", desc: "Cho đơn hàng từ 200.000đ", color: "text-emerald-600", bg: "bg-emerald-50" },
                  { icon: Shield, label: "Bảo hành 2 năm", desc: "Đổi mới nếu lỗi sản phẩm", color: "text-blue-600", bg: "bg-blue-50" },
                  { icon: RotateCcw, label: "Đổi trả 30 ngày", desc: "Hoàn tiền nếu không hài lòng", color: "text-violet-600", bg: "bg-violet-50" },
                ].map(({ icon: Icon, label, desc, color, bg }) => (
                  <div key={label} className={`flex items-start gap-3 ${bg} rounded-2xl p-4`}>
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />
                    <div>
                      <p className={`text-sm font-semibold ${color}`}>{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Reviews */}
          {activeTab === "reviews" && (
            <div>
              {product.reviews.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                  <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-base">Chưa có đánh giá nào cho sản phẩm này.</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Rating overview */}
                  <div>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
                      <div className="text-6xl font-black text-gray-900">
                        {product.averageRating?.toFixed(1)}
                      </div>
                      <StarRating rating={product.averageRating || 0} size="md" />
                      <p className="text-sm text-gray-400">
                        {config.basedOnReviews.replace("{n}", String(product.totalReviews))}
                      </p>
                      <div className="space-y-2">
                        {ratingCounts.map(({ star, count }) => (
                          <div key={star} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 w-4 text-right">{star}</span>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{ width: `${product.totalReviews ? (count / product.totalReviews) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-gray-400 w-6 text-left">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reviews list */}
                  <div className="lg:col-span-2 space-y-4">
                    {product.reviews.map((review, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar className="w-11 h-11 ring-2 ring-gray-100">
                            <AvatarImage src="/placeholder.svg" alt={review.user?.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                              {review.user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{review.user?.name}</span>
                              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                                {config.verifiedPurchase}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} size="sm" />
                              <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            {review.title && <h4 className="font-semibold text-gray-800">{review.title}</h4>}
                            <p className="text-gray-500 leading-relaxed text-sm">{review.comment}</p>
                            {review.images?.length > 0 && (
                              <div className="flex gap-2 flex-wrap pt-1">
                                {review.images.map((img: any, idx: number) => (
                                  <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:scale-105 transition-transform cursor-pointer">
                                    <Image src={img.url || "/placeholder.svg"} alt="" width={64} height={64} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
