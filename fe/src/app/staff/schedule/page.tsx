"use client";

import { useEffect, useState } from "react";
import { api } from "../../../../utils/axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StaffSchedule = {
  _id: string;
  workDate: string;
  shiftStart: string;
  shiftEnd: string;
  isOff: boolean;
  note?: string;
};

export default function StaffSchedulePage() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const res = await api.get("/staff/schedules"); // 👈 cần API riêng

      setSchedules(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải lịch làm việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch làm việc của tôi</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-sm text-gray-500">Đang tải...</div>
        ) : schedules.length === 0 ? (
          <div className="text-sm text-gray-500">Không có lịch làm việc</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border rounded-lg">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 border">Ngày</th>
                  <th className="p-3 border">Giờ làm</th>
                  <th className="p-3 border">Trạng thái</th>
                  <th className="p-3 border">Ghi chú</th>
                </tr>
              </thead>

              <tbody>
                {schedules.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="p-3 border">
                      {new Date(s.workDate).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="p-3 border">
                      {s.isOff ? "-" : `${s.shiftStart} - ${s.shiftEnd}`}
                    </td>

                    <td className="p-3 border">
                      {s.isOff ? (
                        <span className="text-red-600 font-medium">Nghỉ</span>
                      ) : (
                        <span className="text-green-600 font-medium">
                          Làm việc
                        </span>
                      )}
                    </td>

                    <td className="p-3 border">{s.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
