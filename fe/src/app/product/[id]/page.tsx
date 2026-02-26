"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Heart,
  Star,
  ThumbsUp,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const { lang } = useLanguage();
  const config =
    lang === "vi" ? viConfig.productDetail : enConfig.productDetail;
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Review form states
  const [unreviewedData, setUnreviewedData] = useState<UnreviewedData | null>(
    null,
  );
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: "",
    images: [] as File[],
  });
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
        console.error("Error fetching product:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching product",
        );
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  // Fetch unreviewed products
  useEffect(() => {
    const fetchUnreviewedProducts = async () => {
      try {
        const response = await api.get(`/reviews/unreviewed/${params.id}`);
        if (response.data.success) {
          setUnreviewedData(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching unreviewed products:", err);
      }
    };

    if (params.id) {
      fetchUnreviewedProducts();
    }
  }, [params.id]);

  // Kiểm tra sản phẩm đã trong wishlist chưa
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await api.get("/wishlist");
        if (res.data.success && res.data.products) {
          setIsWishlisted(
            res.data.products.some((p: any) => p._id === product?._id),
          );
        }
      } catch {}
    };
    if (product?._id) fetchWishlist();
  }, [product?._id]);

  const handleAddToCart = async () => {
    if (!product) {
      setAddToCartError(config.productNotFound);
      return;
    }

    if (!product.variants[selectedVariant]) {
      setAddToCartError(config.selectedVariantNotFound);
      return;
    }

    if (quantity <= 0) {
      setAddToCartError(config.quantityGreaterThanZero);
      return;
    }

    try {
      setAddingToCart(true);
      setAddToCartError(null);
      const response = await api.post("/cart/addtocart", {
        productId: product._id,
        productVariantId: product.variants[selectedVariant]._id,
        quantity: quantity,
      });

      if (response.data.success) {
        // Show success message
        alert(config.addToCartSuccess);
        // Phát sự kiện custom để thông báo giỏ hàng đã thay đổi
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        throw new Error(response.data.message || config.addToCartFail);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      setAddToCartError(
        err instanceof Error ? err.message : config.addToCartFail,
      );
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
    } catch {}
    setWishlistLoading(false);
  };

  const handleReviewSubmit = async () => {
    if (!product) return;

    // Validation
    if (reviewForm.rating === 0) {
      setReviewError(config.reviewForm.minRating);
      return;
    }

    if (reviewForm.comment.length < 10) {
      setReviewError(config.reviewForm.minCommentLength);
      return;
    }

    // Validate images
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    for (const image of reviewForm.images) {
      if (image.size > maxFileSize) {
        setReviewError("Kích thước file không được vượt quá 5MB");
        return;
      }
      if (!allowedTypes.includes(image.type)) {
        setReviewError("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)");
        return;
      }
    }

    try {
      setSubmittingReview(true);
      setReviewError(null);

      let response;

      // If no images, send as JSON
      if (reviewForm.images.length === 0) {
        response = await api.post("/reviews", {
          productId: product._id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
      } else {
        // If has images, send as FormData
        const formData = new FormData();
        formData.append("productId", product._id);
        formData.append("rating", reviewForm.rating.toString());
        formData.append("comment", reviewForm.comment);

        // Append images
        reviewForm.images.forEach((image, index) => {
          formData.append("images", image);
        });

        // Debug logging
        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
          console.log(key, value);
        }
        console.log("Number of images:", reviewForm.images.length);

        response = await api.post("/reviews", formData);
      }

      if (response.data.success) {
        alert(config.reviewForm.success);
        setShowReviewForm(false);
        setReviewForm({ rating: 0, comment: "", images: [] });
        // Refresh the page to show the new review
        window.location.reload();
      } else {
        throw new Error(response.data.message || config.reviewForm.error);
      }
    } catch (err: any) {
      console.error("Error submitting review:", err);
      console.error("Error response:", err.response?.data);

      // Handle specific error cases
      if (err.response?.status === 413) {
        setReviewError("File ảnh quá lớn. Vui lòng chọn file nhỏ hơn.");
      } else if (err.response?.status === 400) {
        setReviewError(err.response.data.message || "Dữ liệu không hợp lệ");
      } else if (err.response?.status === 500) {
        setReviewError("Lỗi server. Vui lòng thử lại sau.");
      } else {
        setReviewError(
          err instanceof Error ? err.message : config.reviewForm.error,
        );
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      lang === "vi" ? "vi-VN" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              <div className="space-y-6">
                <div className="aspect-square rounded-xl bg-muted" />
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-muted"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-red-600">
            {error || config.productNotFound}
          </div>
        </div>
      </div>
    );
  }

  const variant = product.variants[selectedVariant] || {};
  const discount =
    variant?.importBatches &&
    variant.importBatches.length > 0 &&
    variant.importBatches[0]?.costPrice
      ? Math.round(
          (1 - variant.sellPrice / variant.importBatches[0].costPrice) * 100,
        )
      : 0;

  // Lấy tất cả các attribute cha (parentId: null)
  const parentAttributes = product.variants
    .flatMap((v) => v.attributes || [])
    .filter((attr) => attr.parentId === null)
    .reduce(
      (acc, attr) => {
        acc[attr._id] = attr.value;
        return acc;
      },
      {} as Record<string, string>,
    );

  // Nhóm các attribute con theo parentId
  const attributeOptions: Record<
    string,
    { value: string; variantIndex: number }[]
  > = {};
  product.variants.forEach((variant, idx) => {
    (variant.attributes || []).forEach((attr) => {
      if (attr.parentId && parentAttributes[attr.parentId]) {
        if (!attributeOptions[attr.parentId])
          attributeOptions[attr.parentId] = [];
        // Tránh trùng lặp value
        if (
          !attributeOptions[attr.parentId].some(
            (opt) => opt.value === attr.value,
          )
        ) {
          attributeOptions[attr.parentId].push({
            value: attr.value,
            variantIndex: idx,
          });
        }
      }
    });
  });

  // Check if current product is in unreviewed list
  const isUnreviewed = unreviewedData?.unreviewedProducts?.some(
    (p) => p._id === product._id,
  );
  const unreviewedProduct = unreviewedData?.unreviewedProducts?.find(
    (p) => p._id === product._id,
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        {/* Product Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted shadow-lg">
              <Image
                src={variant?.images?.[0]?.url || "/placeholder.svg"}
                alt={product.name || "Product image"}
                width={600}
                height={600}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {variant?.images?.map((image, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-all duration-300 hover:shadow-md"
                >
                  <Image
                    src={image?.url || "/placeholder.svg"}
                    alt={`${product.name} - Image ${i + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              {product.category && product.category.length > 0 ? (
                product.category.map((cat, idx) => (
                  <Badge
                    key={cat.id || idx}
                    variant="secondary"
                    className="mb-3 text-sm px-3 py-1 mr-2"
                  >
                    {cat.name}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="mb-3 text-sm px-3 py-1">
                  {config.uncategorized}
                </Badge>
              )}
              <h1 className="text-4xl font-bold mb-3">{product.name}</h1>
              {Object.entries(attributeOptions).map(([parentId, options]) => (
                <div key={parentId} className="mb-4">
                  <div className="font-semibold mb-2">
                    {parentAttributes[parentId][0].toUpperCase() +
                      parentAttributes[parentId].slice(1)}
                    :
                    <span className="font-bold ml-2">
                      {
                        options.find(
                          (opt) => opt.variantIndex === selectedVariant,
                        )?.value
                      }
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {options.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={
                          selectedVariant === opt.variantIndex
                            ? "outline"
                            : "ghost"
                        }
                        className={
                          selectedVariant === opt.variantIndex
                            ? "border-primary text-primary"
                            : ""
                        }
                        onClick={() => setSelectedVariant(opt.variantIndex)}
                      >
                        {opt.value}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-primary">
                  {variant.sellPrice}đ
                </span>
                {variant.availableQuantity <= 0 ? (
                  <span className="text-base text-red-500 ml-4 font-semibold">
                    {config.outOfStock}
                  </span>
                ) : (
                  <span className="text-base text-muted-foreground ml-4">
                    {config.left} <b>{variant.availableQuantity}</b>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-muted-foreground text-lg leading-relaxed">
                {product.description}
              </p>

              {/* Quantity */}
              {variant.availableQuantity > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    {config.quantity}
                  </Label>
                  <Select
                    value={quantity.toString()}
                    onValueChange={(value) => setQuantity(parseInt(value))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: Math.min(5, variant.availableQuantity) },
                        (_, i) => i + 1,
                      ).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  size="lg"
                  className="flex-1 h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
                  onClick={handleAddToCart}
                  disabled={addingToCart || variant.availableQuantity <= 0}
                >
                  {addingToCart ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {config.adding}
                    </div>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {config.addToCart}
                    </>
                  )}
                </Button>
                {addToCartError && (
                  <div className="text-sm text-red-500 mt-2">
                    {addToCartError}
                  </div>
                )}
                <Button
                  size="lg"
                  variant={isWishlisted ? "default" : "outline"}
                  className="h-12 w-12 shadow-md hover:shadow-lg transition-shadow flex items-center justify-center"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  aria-label="Yêu thích"
                >
                  <Heart
                    className={
                      "w-5 h-5 " +
                      (isWishlisted ? "fill-red-500 text-red-500" : "")
                    }
                  />
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t">
                <div className="flex items-center gap-3 text-sm bg-muted/50 p-4 rounded-lg">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="font-medium">{config.freeShipping}</span>
                </div>
                <div className="flex items-center gap-3 text-sm bg-muted/50 p-4 rounded-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-medium">{config.warranty}</span>
                </div>
                <div className="flex items-center gap-3 text-sm bg-muted/50 p-4 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  <span className="font-medium">{config.returns}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unreviewed Section */}
        {isUnreviewed && unreviewedProduct && (
          <div className="mb-16">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-primary">
                      {config.unreviewedSection.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {config.unreviewedSection.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {config.unreviewedSection.purchasedOn.replace(
                        "{date}",
                        formatDate(unreviewedProduct.lastPurchaseDate),
                      )}
                    </p>
                  </div>
                  <Dialog
                    open={showReviewForm}
                    onOpenChange={setShowReviewForm}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90">
                        {config.unreviewedSection.writeReview}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>{config.reviewForm.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {config.reviewForm.subtitle}
                          </p>
                        </div>

                        {/* Rating */}
                        <div className="space-y-3">
                          <Label>{config.reviewForm.rating}</Label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setReviewForm({ ...reviewForm, rating: star })
                                }
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`w-8 h-8 transition-colors ${
                                    star <= reviewForm.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300 hover:text-yellow-400"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                          <Label htmlFor="review-comment">
                            {config.reviewForm.comment}
                          </Label>
                          <Textarea
                            id="review-comment"
                            placeholder={config.reviewForm.commentPlaceholder}
                            value={reviewForm.comment}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                comment: e.target.value,
                              })
                            }
                            rows={4}
                          />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                          <Label>{config.reviewForm.images}</Label>
                          <div className="space-y-3">
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                // Validate files before adding
                                const maxFileSize = 5 * 1024 * 1024; // 5MB
                                const allowedTypes = [
                                  "image/jpeg",
                                  "image/jpg",
                                  "image/png",
                                  "image/webp",
                                ];

                                const validFiles = files.filter((file) => {
                                  if (file.size > maxFileSize) {
                                    alert(
                                      `File ${file.name} quá lớn (tối đa 5MB)`,
                                    );
                                    return false;
                                  }
                                  if (!allowedTypes.includes(file.type)) {
                                    alert(
                                      `File ${file.name} không phải là ảnh hợp lệ`,
                                    );
                                    return false;
                                  }
                                  return true;
                                });

                                setReviewForm({
                                  ...reviewForm,
                                  images: [...reviewForm.images, ...validFiles],
                                });
                              }}
                              className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">
                              Chấp nhận: JPEG, PNG, WebP. Tối đa 5MB mỗi file.
                            </p>
                            {reviewForm.images.length > 0 && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  {reviewForm.images.map((file, index) => (
                                    <div key={index} className="relative">
                                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt={`Preview ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newImages =
                                            reviewForm.images.filter(
                                              (_, i) => i !== index,
                                            );
                                          setReviewForm({
                                            ...reviewForm,
                                            images: newImages,
                                          });
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Đã chọn {reviewForm.images.length} ảnh
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {reviewError && (
                          <div className="text-sm text-red-500">
                            {reviewError}
                          </div>
                        )}

                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setShowReviewForm(false)}
                            disabled={submittingReview}
                          >
                            {config.cancel}
                          </Button>
                          <Button
                            onClick={handleReviewSubmit}
                            disabled={submittingReview}
                          >
                            {submittingReview ? (
                              <div className="flex items-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                {config.reviewForm.submitting}
                              </div>
                            ) : (
                              config.reviewForm.submit
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reviews Section */}
        {product.reviews.length > 0 && (
          <div className="space-y-10">
            <h2 className="text-3xl font-bold">{config.customerReviews}</h2>

            <div className="grid lg:grid-cols-3 gap-10">
              {/* Rating Overview */}
              <div className="lg:col-span-1">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {config.ratingOverview}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold mb-3">
                        {product.averageRating}
                      </div>
                      <div className="flex justify-center mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-6 h-6 ${
                              product.averageRating &&
                              star <= Math.floor(product.averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : product.averageRating &&
                                    star === Math.ceil(product.averageRating)
                                  ? "fill-yellow-400/50 text-yellow-400"
                                  : "fill-muted text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {config.basedOnReviews.replace(
                          "{n}",
                          String(product.totalReviews),
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-6">
                {product.reviews.map((review, index) => (
                  <Card
                    key={index}
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={"/placeholder.svg"}
                            alt={review.user?.name || config.userFallback}
                          />
                          <AvatarFallback>
                            {review.user?.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || config.avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-lg">
                                  {review.user?.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {config.verifiedPurchase}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "fill-muted text-muted-foreground"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(
                                    review.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            {review.title && (
                              <h4 className="font-medium text-lg mb-2">
                                {review.title}
                              </h4>
                            )}
                            <p className="text-muted-foreground leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-3">
                              {review.images.map((img: any, idx: any) => (
                                <div
                                  key={idx}
                                  className="w-20 h-20 rounded-lg overflow-hidden bg-muted shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <Image
                                    src={img.url || "/placeholder.svg"}
                                    alt={`${config.reviewImageAlt} ${idx + 1}`}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
