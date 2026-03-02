"use client";

import { useEffect, useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";

import { api } from "../../../../utils/axios";
import { useApi } from "../../../../utils/axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import BlogForm from "./components/BlogForm";
import BlogDetail from "./components/BlogDetail";
import Pagination from "./components/Pagination";
import { Blog } from "./types";
import toast, { Toaster } from "react-hot-toast";

export default function BlogPage() {
  const { request } = useApi();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | undefined>();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // =========================
  // FETCH BLOGS
  // =========================
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
      setError(err.message || "Không thể tải danh sách blog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // =========================
  // FILTER
  // =========================
  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // =========================
  // ADD BLOG
  // =========================
  const handleAddBlog = async (formData: FormData) => {
    try {
      const response = await request(() =>
        api.post("/blogs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      );

      if (response.success) {
        await fetchBlogs();
        toast.success("Tạo blog thành công!");
      } else {
        throw new Error(response.message || "Tạo blog thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Tạo blog thất bại");
      throw err;
    }
  };

  // =========================
  // EDIT BLOG
  // =========================
  const handleEditBlog = async (formData: FormData) => {
    if (!selectedBlog) return;

    try {
      const response = await request(() =>
        api.put(`/blogs/${selectedBlog._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      );

      if (response.success) {
        await fetchBlogs();
        // ✅ Cập nhật selectedBlog với dữ liệu mới từ response
        setSelectedBlog(response.blog);
        toast.success("Cập nhật blog thành công!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        toast.error(response.message || "Cập nhật blog thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Cập nhật blog thất bại");
    }
  };

  // =========================
  // DELETE BLOG
  // =========================
  const handleDeleteBlog = async (id: string) => {
    try {
      if (!window.confirm("Bạn có chắc muốn xoá blog này?")) return;

      const response = await request(() => api.delete(`/blogs/${id}`));

      if (response.success) {
        await fetchBlogs();
        toast.success("Xoá blog thành công!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || "Xoá blog thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Xoá blog thất bại!");
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quản lý Blog</CardTitle>
            <Button
              onClick={() => {
                setSelectedBlog(undefined);
                setIsDetailOpen(false); // đảm bảo view đóng
                setIsFormOpen(true);
              }}
            >
              Thêm Blog
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center h-32 items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">STT</TableHead>
                    <TableHead className="w-[45%]">Tiêu đề</TableHead>
                    <TableHead className="w-32 text-center">Tag</TableHead>
                    <TableHead className="w-40 text-center">Ngày tạo</TableHead>
                    <TableHead className="w-32 text-right">Hành động</TableHead>
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
                        <TableCell className="text-center">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>

                        <TableCell className="text-left truncate">
                          {blog.title}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge>{blog.tag}</Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const res = await request(() =>
                                  api.get(`/blogs/${blog._id}`)
                                );
                                if (res.success) {
                                  setSelectedBlog(res.blog);
                                  setIsDetailOpen(true);
                                }
                              }}
                            >
                              <Eye size={16} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBlog(blog);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit size={16} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDeleteBlog(blog._id)}
                            >
                              <Trash2 size={16} />
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
        }}
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
