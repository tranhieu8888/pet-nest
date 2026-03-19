"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../../utils/axios";
import "../blog.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface BlogImage {
  url: string;
  public_id?: string;
}

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  description: string;
  tag: string;
  image?: BlogImage;
  createdAt: string;
}

function decodeHTML(html: string) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : ""; // lấy slug

  const [post, setPost] = useState<BlogPost | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch detail theo slug
  useEffect(() => {
    if (!slug) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/blogs/slug/${slug}`);
        setPost(res.data?.blog ?? null);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Error loading blog detail");
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug]); // KHÔNG dùng params.slug

  // Fetch all blogs để related theo tag
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get("/blogs");
        const blogs = res.data?.blogs ?? res.data ?? [];
        setAllPosts(blogs);
      } catch {
        setAllPosts([]);
      }
    };

    fetchAll();
  }, []);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return allPosts
      .filter((p) => p.tag === post.tag && p._id !== post._id)
      .slice(0, 3);
  }, [allPosts, post]);

  if (loading) {
    return (
      <div className="blog-loading">
        <div className="blog-loading-spinner"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-error">
        <div className="blog-error-content">
          <h2 className="blog-error-title">Error</h2>
          <p>{error || "Not found"}</p>
          <div style={{ marginTop: "1rem" }}>
            <Link href="/blog" className="back-link">
              ← Quay lại Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <Header />

      <div className="blog-content">
        <div className="blog-back-button">
          <Link href="/blog" className="back-link">
            ← Quay lại Blog
          </Link>
        </div>

        <h1 className="blog-card-title">{post.title}</h1>

        <p style={{ marginBottom: "1rem", color: "#6b7280" }}>
          {new Date(post.createdAt).toLocaleDateString("vi-VN")}
        </p>

        {/* 1 ảnh */}
        {post.image?.url ? (
          <div style={{ marginBottom: "2rem" }}>
            <div className="blog-card-image" style={{ height: "500px" }}>
              <Image
                src={post.image.url}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        <div dangerouslySetInnerHTML={{ __html: post.description }} />

        {/* Related */}
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
              {relatedPosts.map((rp) => (
                <article key={rp._id} className="blog-card">
                  <div className="blog-card-image">
                    {rp.image?.url ? (
                      <Image
                        src={rp.image.url}
                        alt={rp.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src="/images/blog/default.jpg"
                        alt={rp.title}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="blog-card-tag">{rp.tag}</div>
                  </div>

                  <div className="blog-card-content">
                    <h2 className="blog-card-title">
                      <Link href={`/blog/${rp.slug}`}>{rp.title}</Link>
                    </h2>

                    <p className="blog-card-description">
                      {decodeHTML(stripHtml(rp.description))}
                    </p>

                    <Link href={`/blog/${rp.slug}`} className="blog-card-link">
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
