'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../../utils/axios';
import './blog.css';
import Header from '@/components/layout/Header';
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../utils/petPagesConfig.vi';
import enConfig from '../../../utils/petPagesConfig.en';

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
  const pagesConfig = lang === 'vi' ? viConfig : enConfig;
  const blogConfig = pagesConfig.blog;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get('/blogs');
        setPosts(response.data.blogs);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Error loading posts');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

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

  return (
    <div className="blog-container">
      <Header></Header>
      <div className="blog-content">
        {/* Back Button */}
        <div className="blog-back-button">
          <Link href="/homepage" className="back-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {blogConfig.backToHome}
          </Link>
        </div>

        {/* Search Bar */}
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

        {/* Tag Filter */}
        <div className="blog-tags">
          <div className="blog-tags-container">
            <button
              onClick={() => setSelectedTag('')}
              className={`blog-tag-button ${selectedTag === '' ? 'active' : ''}`}
            >
              All
            </button>
            {Array.from(new Set(posts.map(post => post.tag))).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`blog-tag-button ${selectedTag === tag ? 'active' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="blog-grid">
          {posts
            .filter(post => 
              (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              post.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
              (selectedTag === '' || post.tag === selectedTag)
            )
            .map((post) => (
            <article key={post._id} className="blog-card">
              <div className="blog-card-image">
                <Image
                  src={post.images[0]?.url || '/images/blog/default.jpg'}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
                <div className="blog-card-tag">
                  {post.tag}
                </div>
              </div>
              <div className="blog-card-content">
                <span className="blog-card-date">
                  {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <h2 className="blog-card-title">
                  <Link href={`/blog/${post._id}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className="blog-card-description">{post.description}</p>
                <div className="blog-card-footer">
                  <Link 
                    href={`/blog/${post._id}`}
                    className="blog-card-link"
                  >
                    {blogConfig.readMore}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      
    </div>
  );
}
