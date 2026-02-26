'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react";
import { useApi } from "../../../../utils/axios";
import { api } from "../../../../utils/axios";
import { AxiosProgressEvent } from "axios";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Eye, Image, Trash2 } from "lucide-react";
import NextImage from "next/image";
import { log } from "console";


interface Blog {
  _id: string;
  title: string;
  description: string;
  tag: string;
  images: { url: string }[];
  createdAt: string;
}

interface BlogFormProps {
  blog?: Blog;
  onSubmit: (data: FormData) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
}

function BlogForm({
  blog,
  onSubmit,
  isOpen,
  onClose,
  uploadProgress,
  setUploadProgress,
}: BlogFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tag: "",
  });
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string }[]>([]);
  const { request } = useApi();

  useEffect(() => {
    if (isOpen) {
      if (blog) {
        setFormData({
          title: blog.title,
          description: blog.description,
          tag: blog.tag,
        });
        setExistingImages(blog.images);
        setImagePreview(blog.images.map((img) => img.url));
      } else {
        setFormData({
          title: "",
          description: "",
          tag: "",
        });
        setImagePreview([]);
        setSelectedFiles([]);
        setExistingImages([]);
      }
    }
  }, [isOpen, blog]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreview((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreview((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingImages.length;
      setSelectedFiles((prev) => prev.filter((_, i) => i !== newIndex));
      setImagePreview((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("tag", formData.tag);

      existingImages.forEach((image) => {
        formDataToSend.append("existingImages", image.url);
      });

      selectedFiles.forEach((file) => {
        formDataToSend.append("images", file);
      });

      await onSubmit(formDataToSend);
      onClose();
    } catch (error: any) {
      console.error("Error saving blog:", error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFiles([]);
      setImagePreview([]);
      setExistingImages([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {blog ? "Chỉnh sửa bài viết" : "Thêm bài viết"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Mô tả <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">
              Tag <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tag"
              value={formData.tag}
              onChange={(e) =>
                setFormData({ ...formData, tag: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Hình ảnh</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={isUploading}
            />

            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  Đang upload: {uploadProgress}%
                </p>
              </div>
            )}

            {imagePreview.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {imagePreview.map((url, index) => (
                  <div key={index} className="relative w-full h-32 group">
                    <NextImage
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveImage(index, index < existingImages.length)
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading
                ? `Đang upload ${uploadProgress}%`
                : blog
                ? "Lưu"
                : "Thêm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface BlogDetailProps {
  blog: Blog;
  isOpen: boolean;
  onClose: () => void;
}

function BlogDetail({ blog, isOpen, onClose }: BlogDetailProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chi tiết bài viết</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <p className="text-sm text-gray-700">{blog.title}</p>
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {blog.description}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tag</Label>
            <Badge variant="secondary">{blog.tag}</Badge>
          </div>

          <div className="space-y-2">
            <Label>Ngày tạo</Label>
            <p className="text-sm text-gray-700">
              {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Hình ảnh</Label>
            <div className="grid grid-cols-2 gap-2">
              {blog.images.map((image, index) => (
                <div key={index} className="relative w-full h-32">
                  <NextImage
                    src={image.url}
                    alt={`Blog image ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PaginationProps {
  filteredBlogs: Blog[];
  itemsPerPage: number;
  currentPage: number;
  setCurrentPage: (value: number) => void;
}

function Pagination({
  filteredBlogs,
  itemsPerPage,
  currentPage,
  setCurrentPage,
}: PaginationProps) {
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredBlogs.slice(startIndex, endIndex);

  return (
    <div className="flex items-center justify-end mt-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Trước
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | undefined>();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { request } = useApi();

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await request(() => api.get("/blogs"));
      if (response.success) {
        setBlogs(response.blogs || []);
      } else {
        setError("Không thể tải danh sách blog");
      }
    } catch (err: any) {
      console.error("Error fetching blogs:", err);
      setError(err.message || "Không thể tải danh sách blog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBlog = async (formData: FormData) => {
    try {
      const response = await request(() =>
        api.post("/blogs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          },
        })
      );

      if (response.success && response.blog) {
        await fetchBlogs();
        return response.blog;
      } else {
        throw new Error(response.message || "Tạo blog thất bại");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Tạo blog thất bại"
      );
      throw err;
    }
  };

  const handleEditBlog = async (formData: FormData) => {
    if (!selectedBlog) return;
    try {
      const response = await request(() =>
        api.put(`/blogs/${selectedBlog._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          },
        })
      );

      if (response.success) {
        setBlogs((prev) =>
          prev.map((blog) =>
            blog._id === selectedBlog._id
              ? { ...response.blog, createdAt: blog.createdAt }
              : blog
          )
        );
        setIsFormOpen(false);
        setSelectedBlog(undefined);
        setSuccessMessage("Cập nhật blog thành công!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || "Cập nhật blog thất bại");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Cập nhật blog thất bại"
      );
    }
  };

  const handleDeleteBlog = async (id: string) => {
    try {
      if (!window.confirm("Bạn có chắc muốn xoá blog này?")) return;

      const response = await request(() => api.delete(`/blogs/${id}`));
      if (response.success) {
        await fetchBlogs();
      } else {
        setError(response.message || "Xoá blog thất bại");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Xoá blog thất bại"
      );
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quản lý Blog</CardTitle>
            <Button
              onClick={() => {
                setSelectedBlog(undefined);
                setIsFormOpen(true);
              }}
            >
              Thêm Blog
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-md">
              {successMessage}
            </div>
          )}

          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Tìm kiếm theo tiêu đề, mô tả hoặc tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlogs
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((blog, index) => (
                      <TableRow key={blog._id}>
                        <TableCell>
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell>{blog.title}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {blog.description}
                        </TableCell>
                        <TableCell>
                          <Badge>{blog.tag}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBlog(blog);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBlog(blog);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteBlog(blog._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <Pagination
                filteredBlogs={filteredBlogs}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <BlogForm
        blog={selectedBlog}
        onSubmit={selectedBlog ? handleEditBlog : handleAddBlog}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedBlog(undefined);
          setUploadProgress(0);
        }}
        uploadProgress={uploadProgress}
        setUploadProgress={setUploadProgress}
      />

      {selectedBlog && (
        <BlogDetail
          blog={selectedBlog}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedBlog(undefined);
          }}
        />
      )}
    </div>
  );
}