'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SupportChatBox from '@/components/chat/SupportChatBox';

export default function CustomerMessagesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Hỗ trợ khách hàng</h1>
        <SupportChatBox />
      </main>
      <Footer />
    </div>
  );
}
