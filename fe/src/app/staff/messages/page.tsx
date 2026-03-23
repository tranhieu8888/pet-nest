'use client';

import SupportChatBox from '@/components/chat/SupportChatBox';

export default function StaffMessagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tin nhắn CSKH</h1>
        <p className="text-sm text-slate-500">Trao đổi trực tiếp với khách hàng.</p>
      </div>
      <SupportChatBox forceStaffMode />
    </div>
  );
}
