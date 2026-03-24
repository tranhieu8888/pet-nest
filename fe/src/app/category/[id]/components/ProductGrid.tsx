import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "../types";

export const ProductSkeleton = () => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white animate-pulse">
      <CardContent className="p-4">
        <div className="relative mb-4">
          <div className="w-full h-48 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-full mt-4" />
      </CardContent>
    </Card>
  );
};

interface ProductGridProps {
  loading: boolean;
  products: Product[];
  itemsPerPage: number;
  wishlistItems: string[];
  wishlistLoading: Record<string, boolean>;
  handleToggleWishlist: (e: React.MouseEvent, productId: string) => void;
}

export const ProductGrid = ({
  loading,
  products,
  itemsPerPage,
  wishlistItems,
  wishlistLoading,
  handleToggleWishlist,
}: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {loading
        ? Array.from({ length: itemsPerPage }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))
        : products.map((product) => (
            <Link href={`/product/${product._id}`} key={product._id} className="h-full">
              <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="relative mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`absolute top-2 right-2 z-10 bg-white/80 hover:bg-white transition-all duration-200 ${
                        wishlistItems.includes(product._id) ? "text-red-500" : "text-gray-600"
                      }`}
                      onClick={(e) => handleToggleWishlist(e, product._id)}
                      disabled={wishlistLoading[product._id]}
                    >
                      {wishlistLoading[product._id] ? (
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Heart
                          className={`w-4 h-4 ${wishlistItems.includes(product._id) ? "fill-red-500" : ""}`}
                        />
                      )}
                    </Button>
                    <Image
                      src={product.variants?.[0]?.images?.[0]?.url || "/placeholder.svg"}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mb-1 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    {product.brand}
                  </div>
                  <h3 className="font-medium text-sm mb-3 line-clamp-3 group-hover:text-blue-600 leading-relaxed">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg text-red-600">
                        {(product.variants?.[0]?.sellPrice || 0).toLocaleString()} ₫
                      </span>
                    </div>
                    {product.variants?.[0]?.availableQuantity <= 0 && (
                      <div className="text-xs text-white bg-red-500 rounded px-2 py-1 inline-block mt-2">
                        Sản phẩm hết hàng
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
    </div>
  );
};
