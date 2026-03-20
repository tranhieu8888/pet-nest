"use client";

import { useEffect, useState } from "react";
import { api } from "../../../utils/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import viConfig from "../../../utils/petPagesConfig.vi";
import enConfig from "../../../utils/petPagesConfig.en";

interface Product {
  _id: string;
  name: string;
  description: string;
  variants: any[];
  image?: string;
  brand?: string;
}

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingItems, setRemovingItems] = useState<Record<string, boolean>>(
    {}
  );
  const { lang } = useLanguage();
  const config = lang === "vi" ? viConfig : enConfig;

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const res = await api.get("/wishlist");
        if (res.data.success) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (productId: string) => {
    setRemovingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      await api.post("/wishlist/remove", { productId });
      setProducts((prev) =>
        prev.filter((product) => product._id !== productId)
      );
    } catch (err) {
      console.error("Error removing from wishlist:", err);
    } finally {
      setRemovingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 rounded-2xl border border-red-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {lang === "vi" ? "Sản phẩm yêu thích" : "Wishlist"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {lang === "vi"
                    ? "Danh sách các sản phẩm bạn đã lưu"
                    : "Products you have saved"}
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-red-100 text-red-800 text-sm font-medium px-4 py-2">
              {products.length} {lang === "vi" ? "sản phẩm" : "items"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {lang === "vi"
                ? "Chưa có sản phẩm yêu thích"
                : "No wishlist items yet"}
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto px-4">
              {lang === "vi"
                ? "Bạn chưa có sản phẩm yêu thích nào. Hãy khám phá và thêm sản phẩm vào danh sách yêu thích!"
                : "You haven't added any products to your wishlist yet. Explore and add products to your favorites!"}
            </p>
            <Link href="/products/best-selling">
              <Button className="bg-red-600 hover:bg-red-700 rounded-xl">
                {lang === "vi" ? "Khám phá sản phẩm" : "Explore Products"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product._id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {product.name}
                    </CardTitle>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                      onClick={() => handleRemoveFromWishlist(product._id)}
                      disabled={removingItems[product._id]}
                    >
                      {removingItems[product._id] ? (
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex flex-col h-full">
                  {product.image && (
                    <div className="relative mb-4 overflow-hidden rounded-xl bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </div>
                    </div>
                  )}

                  {product.brand && (
                    <div className="mb-2 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                      {product.brand}
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[60px]">
                    {product.description}
                  </p>

                  {product.variants?.[0]?.sellPrice && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-400 mb-1">
                        {lang === "vi" ? "Giá từ" : "Starting from"}
                      </div>
                      <div className="text-xl font-bold text-red-600">
                        {formatPrice(product.variants[0].sellPrice)}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl border-gray-300 hover:border-red-300 hover:text-red-600"
                      asChild
                    >
                      <Link href={`/product/${product._id}`}>
                        {lang === "vi" ? "Xem chi tiết" : "View Details"}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
