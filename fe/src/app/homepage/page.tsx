'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Truck, Clock, Shield, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../../utils/axios';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { AxiosError } from 'axios';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../utils/petPagesConfig.vi';
import enConfig from '../../../utils/petPagesConfig.en';
import ChatBot from '@/components/chatbot/ChatBot';

interface Category {
  _id: string;
  name: string;
  description: string;
  totalOrders: number;
  image?: string;
  parentCategory?: string | null;
}

interface ParentCategory {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

interface Banner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  link: string;
  status:string
}

interface ProductVariant {
  _id: string;
  images: { url: string }[];
  sellPrice: number;
  importedQuantity: number;
  orderedQuantity: number;
  availableQuantity: number;
}

interface ReviewUser {
  _id: string;
  name: string;
  avatar?: string;
}

interface ProductReview {
  _id: string;
  userId: ReviewUser | null;
  productId: string;
  rating: number;
  comment: string;
  images: { url: string }[];
  createdAt: string;
  updatedAt: string;
}

interface TopSellingProduct {
  _id: string;
  name: string;
  description: string;
  brand: string;
  category: Category[];
  createAt: string;
  updateAt: string;
  variants: ProductVariant[];
  reviews: ProductReview[];
}

export default function HomePage() {
  const { lang } = useLanguage();
  const pagesConfig = lang === 'vi' ? viConfig : enConfig;
  const homepageConfig = pagesConfig.homepage;
  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingParents, setIsLoadingParents] = useState(true);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isLoadingTopSelling, setIsLoadingTopSelling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentError, setParentError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [topSellingError, setTopSellingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularCategories = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/categories/popular');
        // Ensure response.data is an array
        const data = Array.isArray(response.data) ? response.data : [];
        setPopularCategories(data as Category[]);
      } catch (err: unknown) {
        console.error('Error fetching popular categories:', err);
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || err.message || 'An error occurred while fetching categories');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred while fetching categories');
        }
        // Set empty array on error to prevent map errors
        setPopularCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularCategories();
  }, []);

  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        setIsLoadingParents(true);
        const response = await api.get('/categories/parent');
        // Ensure response.data is an array
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        
        setParentCategories(data as ParentCategory[]);
      } catch (err: unknown) {
        console.error('Error fetching parent categories:', err);
        if (err instanceof AxiosError) {
          setParentError(err.response?.data?.message || err.message || 'An error occurred while fetching parent categories');
        } else if (err instanceof Error) {
          setParentError(err.message);
        } else {
          setParentError('An error occurred while fetching parent categories');
        }
        // Set empty array on error to prevent map errors
        setParentCategories([]);
      } finally {
        setIsLoadingParents(false);
      }
    };

    fetchParentCategories();
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoadingBanners(true);
        const response = await api.get('/banners');
        // Ensure response.data is an array
        const bannersData = Array.isArray(response.data) ? response.data : [];
        // Filter active banners based on date
        const now = new Date();
        const activeBanners = bannersData.filter(banner => {
          const startDate = new Date(banner.startDate);
          const endDate = new Date(banner.endDate);
          return banner.status === "active" && now >= startDate && now <= endDate;
        });
        setBanners(activeBanners);
      } catch (err: unknown) {
        console.error('Error fetching banners:', err);
        if (err instanceof AxiosError) {
          setBannerError(err.response?.data?.message || err.message || 'An error occurred while fetching banners');
        } else if (err instanceof Error) {
          setBannerError(err.message);
        } else {
          setBannerError('An error occurred while fetching banners');
        }
        // Set empty array on error to prevent map errors
        setBanners([]);
      } finally {
        setIsLoadingBanners(false);
      }
    };

    void fetchBanners();
  }, []);

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        setIsLoadingTopSelling(true);
        const response = await api.get('/products/best-selling');
        if (response.data.success) {
          // Ensure response.data.data is an array
          const productsData = Array.isArray(response.data.data) ? response.data.data : [];
          setTopSellingProducts(productsData);
        } else {
          throw new Error('Failed to fetch top selling products');
        }
      } catch (err: unknown) {
        console.error('Error fetching top selling products:', err);
        if (err instanceof AxiosError) {
          setTopSellingError(err.response?.data?.message || err.message || 'An error occurred while fetching top selling products');
        } else if (err instanceof Error) {
          setTopSellingError(err.message);
        } else {
          setTopSellingError('An error occurred while fetching top selling products');
        }
        // Set empty array on error to prevent map errors
        setTopSellingProducts([]);
      } finally {
        setIsLoadingTopSelling(false);
      }
    };

    void fetchTopSellingProducts();
  }, []);



  return (
    <div className="min-h-screen bg-white">
      <Header />
              {/* Banner Carousel */}
      <section className="relative w-full h-[600px] overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {isLoadingBanners ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-600 border-t-transparent"></div>
          </div>
        ) : bannerError ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-50 p-6 rounded-xl shadow-lg">
              <p className="text-red-600 text-lg font-medium">Có lỗi xảy ra khi tải banner. Vui lòng thử lại sau.</p>
            </div>
          </div>
        ) : banners.length > 0 ? (
          <>
            {/* Carousel Container */}
            <div className="relative w-full h-full">
              {Array.isArray(banners) && banners.map((banner, index) => (
                <motion.div
                  key={banner._id}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ 
                    opacity: currentBannerIndex === index ? 1 : 0,
                    scale: currentBannerIndex === index ? 1 : 1.1,
                    x: `${(index - currentBannerIndex) * 100}%`
                  }}
                  transition={{ 
                    duration: 0.7,
                    ease: "easeInOut"
                  }}
                  className="absolute top-0 left-0 w-full h-full"
                >
                  <Link href={banner.link} className="block w-full h-full group">
                    <div className="relative w-full h-full">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        fill
                        className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent">
                        <div className="container mx-auto px-4 h-full flex items-center">
                          <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="max-w-2xl text-white"
                          >
                            <motion.h2 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4, duration: 0.5 }}
                              className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
                            >
                              {banner.title}
                            </motion.h2>
                            <motion.p 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5, duration: 0.5 }}
                              className="text-xl md:text-2xl mb-8 text-gray-100 leading-relaxed"
                            >
                              {banner.description}
                            </motion.p>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6, duration: 0.5 }}
                            >
                              <button className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-lg font-semibold flex items-center gap-2 group">
                                Xem ngay
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" 
                                  viewBox="0 0 20 20" 
                                  fill="currentColor"
                                >
                                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </motion.div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-8 z-10">
              <button
                onClick={() => setCurrentBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
                className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl backdrop-blur-sm"
                aria-label="Previous slide"
              >
                <ArrowBackIosNewIcon className="text-2xl" />
              </button>
              <button
                onClick={() => setCurrentBannerIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1))}
                className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl backdrop-blur-sm"
                aria-label="Next slide"
              >
                <ArrowForwardIosIcon className="text-2xl" />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
              {Array.isArray(banners) && banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 transform hover:scale-125 ${
                    currentBannerIndex === index 
                      ? 'bg-pink-600 scale-110 shadow-lg shadow-pink-600/50' 
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200/30">
              <motion.div
                className="h-full bg-pink-600"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 5, ease: "linear" }}
                onAnimationComplete={() => {
                  setCurrentBannerIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
                }}
                key={currentBannerIndex}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg text-center">
              <p className="text-gray-600 text-lg">Không có banner nào để hiển thị</p>
            </div>
          </div>
        )}
      </section>

      {/* Shop by Pet Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">{homepageConfig.shopByPet.title}</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">{homepageConfig.shopByPet.description}</p>
          
          {isLoadingParents ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải danh mục...</p>
            </div>
          ) : parentError ? (
            <div className="text-center py-10">
              <p className="text-red-600">Có lỗi xảy ra khi tải danh mục. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {Array.isArray(parentCategories) && parentCategories.map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <Link href={`/category/${category._id}`} className="block">
                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Image
                        src={getValidImageUrl(category.image)}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="text-3xl font-bold text-white transform group-hover:scale-105 transition-transform">{category.name}</h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">{homepageConfig.popularCategories.title}</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">{homepageConfig.popularCategories.description}</p>
          
          {isLoading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải danh mục...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-600">Có lỗi xảy ra khi tải danh mục. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(popularCategories) && popularCategories.length > 0 ? (
                popularCategories.map((category) => (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="group"
                  >
                    <Link 
                      href={`/category/${category._id}`} 
                      className="block bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden mb-4">
                        <Image
                          src={getValidImageUrl(category.image)}
                          alt={category.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-pink-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {category.description}
                        </p>
                      
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-600">Không có danh mục phổ biến nào để hiển thị</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Best Selling Products */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-10">
            {/* Promotional Banner */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full md:w-1/3 flex-shrink-0 rounded-2xl overflow-hidden shadow-xl"
            >
              <div className="relative h-96">
                <Image
                  src="https://petshopsaigon.vn/wp-content/uploads/2019/08/pet-shop-sai-gon-1.jpg"
                  alt="Sản phẩm bán chạy nhất"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <h3 className="text-3xl font-bold mb-3">{homepageConfig.bestSelling.title}</h3>
                  <p className="text-base mb-6 opacity-90">{homepageConfig.bestSelling.description}</p>
                  <Link href="/products/best-selling" className="inline-flex items-center text-white font-bold hover:underline group">
                    {homepageConfig.bestSelling.linkText}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Product List */}
            <div className="flex-1 overflow-x-auto pb-6 no-scrollbar">
              {isLoadingTopSelling ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                </div>
              ) : topSellingError ? (
                <div className="text-center py-10">
                  <p className="text-red-600">Có lỗi xảy ra khi tải sản phẩm. Vui lòng thử lại sau.</p>
                </div>
              ) : (
                <div className="flex space-x-8 pr-4">
                  {Array.isArray(topSellingProducts) && topSellingProducts.map((product, index) => {
                    // Lấy variant có giá thấp nhất và có ảnh
                    const minPriceVariant = Array.isArray(product.variants) && product.variants.length > 0
                      ? product.variants.reduce((min, v) => v.sellPrice < min.sellPrice ? v : min, product.variants[0])
                      : null;

                    // Lấy ảnh đầu tiên tìm được trong các variants
                    let firstImage = '/images/placeholder.jpg';
                    if (Array.isArray(product.variants)) {
                      for (const v of product.variants) {
                        if (Array.isArray(v.images) && v.images.length > 0 && v.images[0].url && v.images[0].url.trim() !== "") {
                          firstImage = v.images[0].url;
                          break;
                        }
                      }
                    }
                    // Kiểm tra hết hàng: tất cả variant đều availableQuantity <= 0
                    const isOutOfStock = Array.isArray(product.variants) && product.variants.length > 0
                      ? product.variants.every(v => v.availableQuantity <= 0)
                      : false;
                    // Lấy nhãn phụ từ category đầu tiên (nếu có)
                    const mainCategory = Array.isArray(product.category) && product.category.length > 0 ? product.category[0] : null;
                    // Lấy mô tả phụ từ description hoặc category
                    const subDescription = mainCategory?.description || product.description;
                    return (
                      <div
                        key={product._id}
                        className="w-80 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col relative group border border-gray-100 hover:shadow-2xl hover:border-pink-400 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
                      >
                        <div className="relative w-full h-52 flex items-center justify-center bg-gradient-to-tr from-pink-50 via-white to-blue-50">
                          {isOutOfStock && (
                            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded z-20 shadow-lg">
                              Hết hàng
                            </span>
                          )}
                          <Image
                            src={getValidImageUrl(firstImage, '/images/placeholder.jpg')}
                            alt={product.name}
                            fill
                            className="object-contain p-6 drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Nhãn phụ */}
                          {mainCategory && (
                            <span className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow z-10 border-2 border-white">{mainCategory.name}</span>
                          )}
                        </div>
                        {/* Mô tả phụ dưới ảnh */}
                        {subDescription && (
                          <div className="text-center text-xs text-gray-700 font-medium px-3 pt-2 pb-1 truncate italic opacity-80">
                            {subDescription}
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-between p-5">
                          {/* Brand */}
                          <div className="uppercase text-xs text-pink-500 font-bold mb-1 tracking-widest">{product.brand}</div>
                          {/* Tên sản phẩm */}
                          <Link href={`/product/${product._id}`} className="block font-bold text-lg text-blue-800 hover:text-pink-600 hover:underline leading-tight mb-1 line-clamp-2 transition-colors duration-200">
                            {product.name}
                          </Link>
                          {/* Mô tả ngắn */}
                          <div className="text-sm text-gray-500 mb-2 line-clamp-2 italic">{product.description}</div>
                          {/* Giá */}
                          <div className="text-xl font-extrabold text-pink-600 mt-auto flex items-end gap-1">
                            {minPriceVariant && minPriceVariant.sellPrice
                              ? minPriceVariant.sellPrice.toLocaleString('vi-VN')
                              : 'N/A'}
                            <span className="text-base font-normal text-gray-500 pb-0.5">đ</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why Shop With Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">{homepageConfig.whyShop.title}</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">{homepageConfig.whyShop.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="text-pink-600 mb-6 flex justify-center transform group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      
      <ChatBot/>
    </div>
   
  );
}

// Data

const benefits = [
  {
    icon: <Truck size={32} />,
    title: "Giao hàng nhanh chóng",
    description: "Miễn phí vận chuyển cho đơn hàng từ 500.000đ"
  },
  {
    icon: <Clock size={32} />,
    title: "Giao hàng đúng giờ",
    description: "Cam kết giao hàng trong vòng 24h"
  },
  {
    icon: <Shield size={32} />,
    title: "Sản phẩm chính hãng",
    description: "100% sản phẩm được bảo hành chính hãng"
  },
  {
    icon: <Heart size={32} />,
    title: "Chăm sóc khách hàng",
    description: "Hỗ trợ 24/7 với đội ngũ tư vấn chuyên nghiệp"
  }
];

// Helper to ensure valid image URL
function getValidImageUrl(url?: string, fallback = '/images/category-placeholder.jpg') {
  return url && url.trim() ? url : fallback;
}

