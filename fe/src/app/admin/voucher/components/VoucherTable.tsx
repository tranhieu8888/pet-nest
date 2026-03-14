"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Voucher } from "../types";

interface Props {
  vouchers: Voucher[];
  currentPage: number;
  itemsPerPage: number;
  openEditDialog: (voucher: Voucher) => void;
  handleDelete: (id: string) => void;
}

export default function VoucherTable({
  vouchers,
  currentPage,
  itemsPerPage,
  openEditDialog,
  handleDelete,
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>STT</TableHead>
          <TableHead>Mã</TableHead>
          <TableHead>Giảm giá</TableHead>
          <TableHead>Giảm tối đa</TableHead>
          <TableHead>Đơn tối thiểu</TableHead>
          <TableHead>Thời gian</TableHead>
          <TableHead>Hiệu lực</TableHead>
          <TableHead>Lượt dùng</TableHead>
          <TableHead className="text-right">Hành động</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {vouchers.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="py-6 text-center text-muted-foreground"
            >
              Không có voucher phù hợp!
            </TableCell>
          </TableRow>
        ) : (
          vouchers.map((v, index) => {

            const now = new Date();
            const validFrom = new Date(v.validFrom);
            const validTo = new Date(v.validTo);

            const isUpcoming = validFrom > now;
            const isExpired = validTo < now;
            const isActive = validFrom <= now && validTo >= now;

            return (
              <TableRow key={v._id}>
                <TableCell>
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </TableCell>

                <TableCell>
                  <Badge variant="secondary">{v.code}</Badge>
                </TableCell>

                <TableCell>{v.discountPercent}%</TableCell>

                <TableCell>
                  {Number(v.maxDiscountAmount || 0).toLocaleString("vi-VN")}đ
                </TableCell>

                <TableCell>
                  {Number(v.minOrderValue || 0).toLocaleString("vi-VN")}đ
                </TableCell>

                <TableCell className="text-sm">
                  <div>
                    {format(new Date(v.validFrom), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </div>
                  <div>
                    {format(new Date(v.validTo), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      isExpired
                        ? "destructive"
                        : isUpcoming
                        ? "secondary"
                        : "default"
                    }
                  >
                    {isUpcoming
                      ? "Chưa diễn ra"
                      : isExpired
                      ? "Hết hạn"
                      : "Đang diễn ra"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge>
                    {v.usedCount}/{v.usageLimit}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(v)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(v._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
