"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../../../utils/axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type StaffSchedule = {
  _id: string;
  workDate: string;
  shiftStart: string;
  shiftEnd: string;
  isOff: boolean;
  note?: string;
  overtimeHours?: number;
};

function formatDateVN(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}

export default function StaffSchedulePage() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchSchedules = async () => {
    setLoading(true);

    try {
      const res = await api.get("/staff/schedules");

      const rawData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setSchedules(rawData);
    } catch (error) {
      console.error("Fetch staff schedules error:", error);
      toast.error("Không thể tải lịch làm việc");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const filteredSchedules = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return schedules;

    return schedules.filter((s) => {
      const workDate = formatDateVN(s.workDate).toLowerCase();
      const timeText = s.isOff ? "nghỉ" : `${s.shiftStart} ${s.shiftEnd}`;
      const statusText = s.isOff ? "nghỉ" : "làm việc";
      const noteText = (s.note || "").toLowerCase();

      return (
        workDate.includes(keyword) ||
        timeText.toLowerCase().includes(keyword) ||
        statusText.includes(keyword) ||
        noteText.includes(keyword)
      );
    });
  }, [schedules, search]);

  const total = filteredSchedules.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const paginatedSchedules = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredSchedules.slice(startIndex, startIndex + limit);
  }, [filteredSchedules, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch làm việc của tôi</CardTitle>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Tìm theo ngày, giờ làm, trạng thái, ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-sm"
          />

          <div className="flex items-center gap-2 text-sm">
            <span>Hiển thị</span>
            <select
              className="border rounded px-2 py-2 bg-white"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>dòng / trang</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-sm text-gray-500">Đang tải...</div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-sm text-gray-500">
            {search.trim()
              ? "Không tìm thấy lịch làm việc phù hợp"
              : "Không có lịch làm việc"}
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>
                Tổng bản ghi: <b>{total}</b>
              </div>

              <div>
                Trang <b>{page}</b> / <b>{totalPages}</b>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3 border">Ngày</th>
                    <th className="p-3 border">Giờ làm</th>
                    <th className="p-3 border">Trạng thái</th>
                    <th className="p-3 border">Ghi chú</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSchedules.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="p-3 border">{formatDateVN(s.workDate)}</td>

                      <td className="p-3 border">
                        {s.isOff ? "-" : `${s.shiftStart} - ${s.shiftEnd}`}
                        {!s.isOff && s.overtimeHours ? (
                          <div className="text-xs text-amber-600 font-semibold mt-1">
                            (Có thể làm thêm {s.overtimeHours} giờ)
                          </div>
                        ) : null}
                      </td>

                      <td className="p-3 border">
                        {s.isOff ? (
                          <span className="font-medium text-red-600">Nghỉ</span>
                        ) : (
                          <span className="font-medium text-green-600">
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

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-muted-foreground">
                Hiển thị <b>{total === 0 ? 0 : (page - 1) * limit + 1}</b> -{" "}
                <b>{Math.min(page * limit, total)}</b> trên <b>{total}</b> bản
                ghi
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Trước
                </Button>

                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
