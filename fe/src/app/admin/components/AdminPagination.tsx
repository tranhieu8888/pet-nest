"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-3 mt-4 py-2">
      <div className="text-sm text-muted-foreground mr-2">
        Hiển thị {Math.min(totalItems, itemsPerPage)} / {totalItems} kết quả
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center justify-center bg-indigo-50 text-indigo-700 font-semibold h-8 min-w-[32px] rounded-md text-sm border border-indigo-100">
          {currentPage}
        </div>

        <span className="text-sm text-muted-foreground px-1">/</span>

        <div className="text-sm font-medium mr-1">
          {totalPages}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
