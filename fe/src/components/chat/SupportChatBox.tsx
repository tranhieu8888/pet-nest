'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SendHorizonal, MessageCircle, UserRound } from 'lucide-react';
import { api } from '../../../utils/axios';

interface UserLite {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: number;
}

interface ConversationItem {
  _id: string;
  partner: UserLite;
  lastMessage: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface MessageItem {
  _id: string;
  senderId: UserLite | string;
  text: string;
  createdAt: string;
}

interface NewMessagePayload {
  conversationId: string;
  message?: MessageItem;
}

let chatSocket: Socket | null = null;

function getChatSocket() {
  if (!chatSocket) {
    chatSocket = io('http://localhost:5000');
  }
  return chatSocket;
}

function parseToken() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id || payload._id,
      role: payload.role,
    } as { id: string; role: number };
  } catch {
    return null;
  }
}

function formatTime(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function SupportChatBox({ forceStaffMode = false }: { forceStaffMode?: boolean }) {
  const [me, setMe] = useState<{ id: string; role: number } | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [staffs, setStaffs] = useState<UserLite[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  const isCustomer = me ? (forceStaffMode ? false : me.role === 1) : false;

  const loadConversations = async () => {
    const res = await api.get('/chat/conversations');
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    setConversations(list);
    if (!selectedConversationId && list.length > 0) {
      setSelectedConversationId(list[0]._id);
    }
  };

  const ensureConversationForCustomer = async (customerId: string) => {
    const staffRes = await api.get('/chat/staffs');
    const staffList = Array.isArray(staffRes.data?.data) ? staffRes.data.data : [];
    setStaffs(staffList);
    if (staffList.length === 0) return;

    const firstStaff = staffList[0];
    await api.post('/chat/conversations', {
      customerId,
      staffId: firstStaff._id,
    });
  };

  const loadMessages = async (conversationId: string) => {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`);
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    setMessages(list);
    await api.patch(`/chat/conversations/${conversationId}/read`);
    await loadConversations();
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const parsed = parseToken();
        if (!parsed) throw new Error('Vui lòng đăng nhập để sử dụng chat');
        setMe(parsed);

        if (!forceStaffMode && parsed.role === 1) {
          await ensureConversationForCustomer(parsed.id);
        }

        await loadConversations();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu chat');
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [forceStaffMode]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!me?.id) return;

    const socket = getChatSocket();
    socket.emit('join', me.id);
    if (forceStaffMode) {
      socket.emit('joinStaffCare');
    }

    const onNewMessage = async (payload: NewMessagePayload) => {
      if (!payload?.conversationId) return;

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === payload.conversationId);
        if (idx === -1) return prev;

        const updated = [...prev];
        const target = updated[idx];

        const incomingText = payload.message?.text || target.lastMessage;
        const isCurrentOpen = selectedConversationId === payload.conversationId;

        updated[idx] = {
          ...target,
          lastMessage: incomingText,
          lastMessageAt: new Date().toISOString(),
          unreadCount: isCurrentOpen ? 0 : (target.unreadCount || 0) + 1,
        };

        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
        return updated;
      });

      if (selectedConversationId === payload.conversationId && payload.message) {
        setMessages((prev) => {
          const existed = prev.some((m) => m._id === payload.message?._id);
          if (existed) return prev;
          return [...prev, payload.message as MessageItem];
        });
        await api.patch(`/chat/conversations/${payload.conversationId}/read`);
      }
    };

    socket.on('newMessage', onNewMessage);

    return () => {
      socket.off('newMessage', onNewMessage);
    };
  }, [me?.id, selectedConversationId, forceStaffMode]);

  const handleSend = async () => {
    if (!selectedConversationId || !text.trim()) return;
    const content = text.trim();
    setText('');
    try {
      await api.post(`/chat/conversations/${selectedConversationId}/messages`, { text: content });
      await loadMessages(selectedConversationId);
    } catch {
      setError('Gửi tin nhắn thất bại');
    }
  };

  return (
    <div
      className={`grid h-[calc(100vh-140px)] grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur-sm ${
        isCustomer ? '' : 'md:grid-cols-[320px_1fr]'
      }`}
    >
      {!isCustomer && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Khách hàng cần hỗ trợ</h3>
            <p className="mt-0.5 text-xs text-slate-500">Danh sách hội thoại realtime</p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedConversationId(c._id)}
                className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selectedConversationId === c._id ? 'bg-emerald-50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{c.partner?.name || 'Unknown'}</p>
                    {!isCustomer && (
                      <div className="mt-0.5 space-y-0.5">
                        <p className="truncate text-[11px] text-slate-500">SĐT: {c.partner?.phone || 'Chưa có SĐT'}</p>
                        <p className="truncate text-[11px] text-slate-500">Email: {c.partner?.email || 'Chưa có email'}</p>
                      </div>
                    )}
                    <p className="line-clamp-1 text-xs text-slate-500">{c.lastMessage || 'Chưa có tin nhắn'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {c.lastMessageAt && <p className="mb-1 text-[11px] text-slate-400">{formatTime(c.lastMessageAt)}</p>}
                    {c.unreadCount > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {!loading && conversations.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500">Chưa có hội thoại nào.</div>
            )}
          </div>
        </div>
      )}

      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
              {isCustomer ? <MessageCircle className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isCustomer
                  ? 'Chat với CSKH'
                  : selectedConversation
                    ? `Chat với ${selectedConversation.partner?.name}`
                    : 'Chọn hội thoại'}
              </p>
              <p className="text-xs text-slate-500">Đang kết nối realtime</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#ffffff_50%)] p-4">
          {messages.map((m) => {
            const senderId = typeof m.senderId === 'string' ? m.senderId : m.senderId?._id;
            const mine = senderId === me?.id;
            return (
              <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? 'rounded-br-md bg-slate-900 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-slate-300' : 'text-slate-400'}`}>{formatTime(m.createdAt)}</p>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="mx-auto mt-8 max-w-sm rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
              Bắt đầu cuộc trò chuyện để được hỗ trợ nhanh chóng.
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isCustomer ? 'Nhập nội dung cần CSKH hỗ trợ...' : 'Nhập tin nhắn...'}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!selectedConversationId || !text.trim()}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizonal className="h-4 w-4" />
              Gửi
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          {isCustomer && staffs.length === 0 && !loading && (
            <p className="mt-2 text-xs text-amber-600">Hiện chưa có staff CSKH online, tin nhắn vẫn sẽ được lưu.</p>
          )}
        </div>
      </div>
    </div>
  );
}
