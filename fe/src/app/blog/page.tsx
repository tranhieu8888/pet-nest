"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  public_id?: string;
}

interface Author {
  name: string;
  email: string;
}

interface BlogPost {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  tag: string;
  image?: BlogImage;
  author: Author | null;
  createdAt: string;
}

export default function BlogPage() {
  const { lang } = useLanguage();
  const pagesConfig = lang === "vi" ? viConfig : enConfig;
  const blogConfig = pagesConfig.blog;

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // ================= FETCH ALL BLOGS =================
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get("/blogs");
        // axios thường trả response.data
        const blogs = response.data?.blogs ?? response.data ?? [];
        setPosts(blogs);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Error loading posts");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

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

  // ================= LIST VIEW =================

  const filteredPosts = posts.filter((post) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      post.title?.toLowerCase().includes(q) ||
      post.description?.toLowerCase().includes(q);

    const matchesTag = selectedTag === "" || post.tag === selectedTag;

    return matchesQuery && matchesTag;
  });

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const allTags = Array.from(new Set(posts.map((p) => p.tag).filter(Boolean)));

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

          {allTags.map((tag) => (
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
          {paginatedPosts.map((post) => {
            const detailSlug = post.slug || post._id;
            return (
            <article key={post._id} className="blog-card">
              <div className="blog-card-image">
                {post.image?.url ? (
                  <Image
                    src={post.image.url}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
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
                  <Link href={`/blog/${detailSlug}`}>{post.title}</Link>
                </h2>

                <p className="blog-card-description">
                  {decodeHTML(stripHtml(post.description))}
                </p>

                <Link href={`/blog/${detailSlug}`} className="blog-card-link">
                  {blogConfig.readMore} →
                </Link>
              </div>
            </article>
            );
          })}
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
