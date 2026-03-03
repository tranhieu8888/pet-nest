"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../utils/axios";
import "./blog.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import viConfig from "../../../utils/petPagesConfig.vi";
import enConfig from "../../../utils/petPagesConfig.en";

function decodeHTML(html: string) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

interface BlogImage {
  url: string;
}

interface Author {
  name: string;
  email: string;
}

interface BlogPost {
  _id: string;
  title: string;
  description: string;
  tag: string;
  images: BlogImage[];
  author: Author | null;
  createdAt: string;
}

export default function BlogPage() {
  const { lang } = useLanguage();
  const pagesConfig = lang === "vi" ? viConfig : enConfig;
  const blogConfig = pagesConfig.blog;

  const searchParams = useSearchParams();
  const blogId = searchParams.get("id");

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // ================= FETCH ALL BLOGS (luôn fetch để dùng cho related) =================
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get("/blogs");
        setPosts(response.data.blogs);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Error loading posts");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // ================= FETCH DETAIL =================
  useEffect(() => {
    if (!blogId) {
      setSelectedPost(null);
      return;
    }

    const fetchBlogDetail = async () => {
      try {
        const response = await api.get(`/blogs/${blogId}`);
        setSelectedPost(response.data.blog);
      } catch (err) {
        setError("Error loading blog detail");
      }
    };

    fetchBlogDetail();
  }, [blogId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag]);

  if (loading) {
    return (
      <div className="blog-loading">
        <div className="blog-loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-error">
        <div className="blog-error-content">
          <h2 className="blog-error-title">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ================= DETAIL VIEW =================
  if (blogId && selectedPost) {
    const relatedPosts = posts.filter(
      (post) => post.tag === selectedPost.tag && post._id !== selectedPost._id
    );

    return (
      <div className="blog-container">
        <Header />

        <div className="blog-content">
          <div className="blog-back-button">
            <Link href="/blog" className="back-link">
              ← {blogConfig.backToHome}
            </Link>
          </div>

          <h1 className="blog-card-title">{selectedPost.title}</h1>

          <p style={{ marginBottom: "1rem", color: "#6b7280" }}>
            {new Date(selectedPost.createdAt).toLocaleDateString("vi-VN")}
          </p>

          {/* Multi images detail */}
          {selectedPost.images.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <div className="blog-card-image" style={{ height: "400px" }}>
                <Image
                  src={selectedPost.images[0].url}
                  alt={selectedPost.title}
                  fill
                  className="object-cover"
                />
              </div>

              {selectedPost.images.length > 1 && (
                <div className="blog-multi-images" style={{ height: "200px" }}>
                  {selectedPost.images.slice(1).map((img, index) => (
                    <div key={index} className="blog-multi-image">
                      <Image
                        src={img.url}
                        alt={selectedPost.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            dangerouslySetInnerHTML={{
              __html: selectedPost.description,
            }}
          />

          {/* RELATED POSTS */}
          {relatedPosts.length > 0 && (
            <div style={{ marginTop: "3rem" }}>
              <h3
                style={{
                  marginBottom: "1.5rem",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                Bài viết liên quan
              </h3>

              <div className="blog-grid">
                {relatedPosts.slice(0, 3).map((post) => (
                  <article key={post._id} className="blog-card">
                    <div className="blog-card-image">
                      {post.images.length > 0 ? (
                        <div className="blog-multi-images">
                          {post.images.slice(0, 3).map((img, index) => (
                            <div key={index} className="blog-multi-image">
                              <Image
                                src={img.url}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Image
                          src="/images/blog/default.jpg"
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      )}

                      <div className="blog-card-tag">{post.tag}</div>
                    </div>

                    <div className="blog-card-content">
                      <h2 className="blog-card-title">
                        <Link href={`/blog?id=${post._id}`}>{post.title}</Link>
                      </h2>

                      <p className="blog-card-description">
                        {decodeHTML(stripHtml(post.description))}
                      </p>

                      <Link
                        href={`/blog?id=${post._id}`}
                        className="blog-card-link"
                      >
                        Đọc thêm →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    );
  }

  // ================= LIST VIEW =================

  const filteredPosts = posts.filter(
    (post) =>
      (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedTag === "" || post.tag === selectedTag)
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  return (
    <div className="blog-container">
      <Header />

      <div className="blog-content">
        {/* SEARCH */}
        <div className="blog-search">
          <div className="blog-search-container">
            <input
              type="text"
              placeholder={blogConfig.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="blog-search-input"
            />
          </div>
        </div>

        {/* TAG FILTER */}
        <div className="blog-tags-container">
          <button
            onClick={() => setSelectedTag("")}
            className={`blog-tag-button ${selectedTag === "" ? "active" : ""}`}
          >
            All
          </button>

          {Array.from(new Set(posts.map((post) => post.tag))).map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`blog-tag-button ${
                selectedTag === tag ? "active" : ""
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* BLOG GRID */}
        <div className="blog-grid">
          {paginatedPosts.map((post) => (
            <article key={post._id} className="blog-card">
              <div className="blog-card-image">
                {post.images.length > 0 ? (
                  <div className="blog-multi-images">
                    {post.images.slice(0, 3).map((img, index) => (
                      <div key={index} className="blog-multi-image">
                        <Image
                          src={img.url}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Image
                    src="/images/blog/default.jpg"
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                )}

                <div className="blog-card-tag">{post.tag}</div>
              </div>

              <div className="blog-card-content">
                <h2 className="blog-card-title">
                  <Link href={`/blog?id=${post._id}`}>{post.title}</Link>
                </h2>

                <p className="blog-card-description">
                  {decodeHTML(stripHtml(post.description))}
                </p>

                <Link href={`/blog?id=${post._id}`} className="blog-card-link">
                  {blogConfig.readMore} →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="blog-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="page-btn"
            >
              ← Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="page-btn"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
