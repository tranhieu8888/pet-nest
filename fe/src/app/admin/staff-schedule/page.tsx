"use client";

import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { api } from "../../../../utils/axios";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

type StaffRef = {
  _id: string;
  name: string;
};

interface StaffSchedule {
  _id?: string;
  staffId: string | StaffRef;
  staffName?: string;
  workDate: string;
  shiftStart: string;
  shiftEnd: string;
  isOff: boolean;
  note: string;
  overtimeHours?: number;
}

interface ScheduleListResponse {
  data: StaffSchedule[];
  total: number;
  page: number;
  limit: number;
}

const defaultForm: StaffSchedule = {
  staffId: "",
  workDate: "",
  shiftStart: "08:00",
  shiftEnd: "17:00",
  isOff: false,
  note: "",
  overtimeHours: 0,
};

function getStaffIdValue(staffId: string | StaffRef | undefined) {
  if (!staffId) return "";
  if (typeof staffId === "string") return staffId;
  return staffId._id || "";
}

function normalizeScheduleForForm(editing: StaffSchedule): StaffSchedule {
  return {
    _id: editing._id,
    staffId: getStaffIdValue(editing.staffId),
    staffName: editing.staffName || "",
    workDate: editing.workDate ? editing.workDate.slice(0, 10) : "",
    shiftStart: editing.shiftStart || "08:00",
    shiftEnd: editing.shiftEnd || "17:00",
    isOff: !!editing.isOff,
    note: editing.note || "",
    overtimeHours: editing.overtimeHours || 0,
  };
}

export default function StaffSchedulePage() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffSchedule | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchSchedules = async (customPage?: number, customLimit?: number) => {
    const currentPage = customPage ?? page;
    const currentLimit = customLimit ?? limit;

    setLoading(true);
    try {
      const res = await api.get("/admin/staff-schedules", {
        params: {
          page: currentPage,
          limit: currentLimit,
        },
      });

      const payload = res.data as ScheduleListResponse;

      setSchedules(Array.isArray(payload?.data) ? payload.data : []);
      setTotal(payload?.total || 0);
    } catch (error) {
      console.error("Fetch schedules error:", error);
      toast.error("Không thể tải dữ liệu lịch làm việc nhân viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [page, limit]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xoá lịch làm việc này?")) return;

    try {
      await api.delete(`/admin/staff-schedules/${id}`);
      toast.success("Đã xoá thành công");

      const remainingAfterDelete = total - 1;
      const totalPagesAfterDelete = Math.max(
        1,
        Math.ceil(remainingAfterDelete / limit)
      );

      if (page > totalPagesAfterDelete) {
        setPage(totalPagesAfterDelete);
      } else {
        fetchSchedules(page, limit);
      }
    } catch (error) {
      console.error("Delete schedule error:", error);
      toast.error("Xoá thất bại");
    }
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return schedules;

    return schedules.filter((s) => {
      const staffName = s.staffName?.toLowerCase() || "";
      const note = s.note?.toLowerCase() || "";
      return staffName.includes(keyword) || note.includes(keyword);
    });
  }, [schedules, search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý lịch làm việc nhân viên</CardTitle>

        <div className="flex flex-col gap-2 mt-2 md:flex-row">
          <Input
            placeholder="Tìm theo tên nhân viên hoặc ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:flex-1"
          />

          <Button
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
          >
            Thêm mới
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            Tổng bản ghi: <b>{total}</b>
          </div>

          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              className="border rounded px-2 py-1 bg-white"
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setPage(1);
                setLimit(newLimit);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>dòng / trang</span>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-sm text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Ngày làm</TableHead>
                  <TableHead>Bắt đầu</TableHead>
                  <TableHead>Kết thúc</TableHead>
                  <TableHead>Nghỉ</TableHead>
                  <TableHead>Làm thêm</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell>
                        {s.staffName || getStaffIdValue(s.staffId)}
                      </TableCell>
                      <TableCell>
                        {s.workDate
                          ? new Date(s.workDate).toLocaleDateString("vi-VN")
                          : ""}
                      </TableCell>
                      <TableCell>{s.isOff ? "-" : s.shiftStart}</TableCell>
                      <TableCell>{s.isOff ? "-" : s.shiftEnd}</TableCell>
                      <TableCell>{s.isOff ? "Có" : "Không"}</TableCell>
                      <TableCell>
                        {s.overtimeHours ? `+${s.overtimeHours} giờ` : "-"}
                      </TableCell>
                      <TableCell>{s.note || "-"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(s);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(s._id!)}
                          className="ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-muted-foreground">
                Trang <b>{page}</b> / <b>{totalPages}</b>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Trước
                </Button>

                <Button
                  variant="outline"
                  disabled={loading || page >= totalPages}
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

      <StaffScheduleForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchSchedules(page, limit);
        }}
        editing={editing}
      />
    </Card>
  );
}

function StaffScheduleForm({
  open,
  onClose,
  onSuccess,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing: StaffSchedule | null;
}) {
  const [form, setForm] = useState<StaffSchedule>(defaultForm);
  const [staffList, setStaffList] = useState<StaffRef[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm(normalizeScheduleForForm(editing));
      } else {
        setForm(defaultForm);
      }
    }
  }, [editing, open]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get("/admin/users?role=STAFF");
        setStaffList(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Fetch staff error:", error);
        toast.error("Không thể tải danh sách nhân viên");
      }
    };

    if (open) {
      fetchStaff();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!getStaffIdValue(form.staffId)) {
      toast.error("Vui lòng chọn nhân viên");
      return;
    }

    if (!form.workDate) {
      toast.error("Vui lòng chọn ngày làm");
      return;
    }

    if (!form.isOff) {
      if (!form.shiftStart || !form.shiftEnd) {
        toast.error("Vui lòng nhập giờ bắt đầu và giờ kết thúc");
        return;
      }

      if (form.shiftStart >= form.shiftEnd) {
        toast.error("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
        return;
      }
    }

    setLoading(true);

    const payload = {
      staffId: getStaffIdValue(form.staffId),
      workDate: form.workDate,
      shiftStart: form.isOff ? "" : form.shiftStart,
      shiftEnd: form.isOff ? "" : form.shiftEnd,
      isOff: form.isOff,
      note: form.note?.trim() || "",
      overtimeHours: form.overtimeHours || 0,
    };

    try {
      if (editing?._id) {
        await api.put(`/admin/staff-schedules/${editing._id}`, payload);
        toast.success("Cập nhật thành công");
      } else {
        await api.post("/admin/staff-schedules", payload);
        toast.success("Tạo mới thành công");
      }

      onSuccess();
    } catch (error) {
      console.error("Save schedule error:", error);

      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || "Lưu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Cập nhật" : "Thêm mới"} lịch làm việc
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nhân viên</Label>
            <select
              className="w-full border rounded px-3 py-2 bg-white mt-3"
              value={getStaffIdValue(form.staffId)}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, staffId: e.target.value }))
              }
              required
            >
              <option value="">Chọn nhân viên</option>
              {staffList.map((staff) => (
                <option key={staff._id} value={staff._id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Ngày làm</Label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 mt-3"
              value={form.workDate ? form.workDate.slice(0, 10) : ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, workDate: e.target.value }))
              }
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isOff"
              type="checkbox"
              checked={form.isOff}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isOff: e.target.checked,
                  shiftStart: e.target.checked
                    ? ""
                    : prev.shiftStart || "08:00",
                  shiftEnd: e.target.checked ? "" : prev.shiftEnd || "17:00",
                }))
              }
            />
            <Label htmlFor="isOff">Nghỉ trong ngày</Label>
          </div>

          {!form.isOff && (
            <div className="space-y-3 rounded-xl border bg-gray-50 p-3">
              <Label className="text-xs font-semibold uppercase text-gray-500">
                Chọn nhanh ca làm việc
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Ca sáng", start: "08:00", end: "12:00" },
                  { name: "Ca trưa", start: "12:00", end: "17:00" },
                  { name: "Ca chiều", start: "17:00", end: "22:00" },
                ].map((shift) => (
                  <Button
                    key={shift.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        shiftStart: shift.start,
                        shiftEnd: shift.end,
                        note: shift.name,
                      }))
                    }
                  >
                    {shift.name} ({shift.start}-{shift.end})
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Khi chọn <b>Nghỉ trong ngày</b>, nhân viên sẽ được xem là nghỉ cả
            ngày đó và không có ca làm việc. Lúc này giờ bắt đầu và giờ kết thúc
            sẽ không cần nhập.
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Bắt đầu</Label>
              <input
                type="time"
                className="w-full border rounded px-3 py-2 mt-3"
                value={form.shiftStart}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shiftStart: e.target.value }))
                }
                required={!form.isOff}
                disabled={form.isOff}
              />
            </div>

            <div className="flex-1">
              <Label>Kết thúc</Label>
              <input
                type="time"
                className="w-full border rounded px-3 py-2 mt-3"
                value={form.shiftEnd}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shiftEnd: e.target.value }))
                }
                required={!form.isOff}
                disabled={form.isOff}
              />
            </div>
          </div>

          {!form.isOff && (
            <div>
              <Label>Giờ làm thêm</Label>
              <div className="flex gap-4 mt-2">
                {[0, 1, 2].map((hours) => (
                  <label
                    key={hours}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="overtimeHours"
                      value={hours}
                      checked={form.overtimeHours === hours}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          overtimeHours: Number(e.target.value),
                        }))
                      }
                    />
                    <span className="text-sm">
                      {hours === 0 ? "Không" : `+${hours} giờ`}
                    </span>
                  </label>
                ))}
              </div>
              {form.overtimeHours! > 0 && (
                <div className="text-xs text-amber-600 mt-1 italic">
                  * Nhân viên sẽ thấy thông báo có thể làm thêm{" "}
                  {form.overtimeHours} giờ cho ca này.
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Ghi chú</Label>
            <Input
            className="mt-3"
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="Ghi chú thêm (nếu có)"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Huỷ
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
