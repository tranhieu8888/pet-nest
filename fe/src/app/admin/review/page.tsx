"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../../utils/axios";
import { Star, MessageSquare, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '@/context/LanguageContext';
import pagesConfigEn from '../../../../utils/petPagesConfig.en';
import pagesConfigVi from '../../../../utils/petPagesConfig.vi';

interface ReviewStats {
  productId: string;
  productName: string;
  averageRating: string;
  totalComments: number;
}

interface Comment {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  comment: string;
  rating: number;
  createdAt: string;
}

interface PaginationProps {
  filteredReviews: ReviewStats[];
  itemsPerPage: number;
  currentPage: number;
  setCurrentPage: (value: number) => void;
}

function Pagination({ filteredReviews, itemsPerPage, currentPage, setCurrentPage }: PaginationProps) {
  const { lang } = useLanguage();
  const config = lang === 'en' ? pagesConfigEn.reviewManagement : pagesConfigVi.reviewManagement;
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredReviews.length);

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-500">
        {config.pagination.showing
          .replace('{start}', (startIndex + 1).toString())
          .replace('{end}', endIndex.toString())
          .replace('{total}', filteredReviews.length.toString())}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          {config.pagination.previous}
        </Button>
        <div className="flex items-center gap-1">
          {[...Array(totalPages)].map((_, index) => (
            <Button
              key={index}
              variant={currentPage === index + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          {config.pagination.next}
        </Button>
      </div>
    </div>
  );
}

export default function ReviewManagement() {
  const { lang } = useLanguage();
  const config = lang === 'en' ? pagesConfigEn.reviewManagement : pagesConfigVi.reviewManagement;
  const [reviews, setReviews] = useState<ReviewStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductComments, setSelectedProductComments] = useState<Comment[]>([]);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [commentRatingFilter, setCommentRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await api.get("/reviews");
      const reviewsData = response.data.data;
      
      // Process reviews to get stats per product
      const productStats = reviewsData.reduce((acc: any, review: any) => {
        if (!review.productId || !review.productId.name) return acc;
        const productId = review.productId._id;
        if (!acc[productId]) {
          acc[productId] = {
            productId,
            productName: review.productId.name,
            totalRating: 0,
            ratingCount: 0,
            totalComments: 0
          };
        }
        
        acc[productId].totalRating += review.rating;
        acc[productId].ratingCount += 1;
        if (review.comment) {
          acc[productId].totalComments += 1;
        }
        
        return acc;
      }, {});

      // Calculate averages and format data
      const formattedStats = Object.values(productStats).map((stat: any) => ({
        productId: stat.productId,
        productName: stat.productName,
        averageRating: (stat.totalRating / stat.ratingCount).toFixed(1),
        totalComments: stat.totalComments
      }));

      setReviews(formattedStats);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductComments = async (productId: string, productName: string) => {
    try {
      const response = await api.get(`/reviews/product/${productId}`);
      setSelectedProductComments(
        response.data.data.filter((review: any) => review.comment && review.userId)
      );
      setSelectedProductName(productName);
      setCommentRatingFilter("all"); // Reset comment rating filter when opening new product
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Filter comments based on rating
  const filteredComments = selectedProductComments.filter(comment => {
    if (commentRatingFilter === "all") return true;
    const rating = parseInt(commentRatingFilter);
    return comment.rating === rating;
  });

  const renderStars = (rating: string) => {
    const numericRating = parseFloat(rating);
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${
              index < Math.floor(numericRating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter reviews based on search query and rating filter
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === "all" || 
      (ratingFilter === "4+" && parseFloat(review.averageRating) >= 4) ||
      (ratingFilter === "3+" && parseFloat(review.averageRating) >= 3) ||
      (ratingFilter === "2+" && parseFloat(review.averageRating) >= 2) ||
      (ratingFilter === "1+" && parseFloat(review.averageRating) >= 1);
    return matchesSearch && matchesRating;
  });

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{config.title}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={config.search.placeholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <Select
                value={ratingFilter}
                onValueChange={(value) => {
                  setRatingFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={config.search.ratingPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{config.commentsDialog.ratingFilter.all}</SelectItem>;
                  <SelectItem value="4+">4+ {config.commentsDialog.ratingFilter.four}</SelectItem>;
                  <SelectItem value="3+">3+ {config.commentsDialog.ratingFilter.three}</SelectItem>;
                  <SelectItem value="2+">2+ {config.commentsDialog.ratingFilter.two}</SelectItem>;
                  <SelectItem value="1+">1+ {config.commentsDialog.ratingFilter.one}</SelectItem>;
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{config.table.headers.productName}</TableHead>
                    <TableHead>{config.table.headers.averageRating}</TableHead>
                    <TableHead>{config.table.headers.totalComments}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReviews.map((review) => (
                    <TableRow key={review.productId}>
                      <TableCell className="font-medium">
                        {review.productName}
                      </TableCell>
                      <TableCell>{renderStars(review.averageRating)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() => fetchProductComments(review.productId, review.productName)}
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>{review.totalComments}</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{config.commentsDialog.title} {selectedProductName}</DialogTitle>
                            </DialogHeader>
                            <div className="mb-4">
                              <Select
                                value={commentRatingFilter}
                                onValueChange={setCommentRatingFilter}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder={config.search.ratingPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">{config.commentsDialog.ratingFilter.all}</SelectItem>
                                  <SelectItem value="5">{config.commentsDialog.ratingFilter.five}</SelectItem>
                                  <SelectItem value="4">{config.commentsDialog.ratingFilter.four}</SelectItem>
                                  <SelectItem value="3">{config.commentsDialog.ratingFilter.three}</SelectItem>
                                  <SelectItem value="2">{config.commentsDialog.ratingFilter.two}</SelectItem>
                                  <SelectItem value="1">{config.commentsDialog.ratingFilter.one}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto pr-4">
                              <div className="space-y-4">
                                {filteredComments.map((comment) => (
                                  <div key={comment._id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-semibold">{comment.userId?.name || "Unknown User"}</p>
                                        <p className="text-sm text-gray-500">{comment.userId?.email || "No email"}</p>
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {formatDate(comment.createdAt)}
                                      </div>
                                    </div>
                                    <div className="flex items-center mb-2">
                                      {renderStars(comment.rating.toString())}
                                    </div>
                                    <p className="text-gray-700">{comment.comment}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                filteredReviews={filteredReviews}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
