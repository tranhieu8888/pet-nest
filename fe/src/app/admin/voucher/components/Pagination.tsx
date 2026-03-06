"use client";

import { Button } from "@/components/ui/button";
import { Voucher } from "../types";

interface PaginationProps {
  filteredVouchers: Voucher[];
  itemsPerPage: number;
  currentPage: number;
  setCurrentPage: (value: number) => void;
}

export default function Pagination({
  filteredVouchers,
  itemsPerPage,
  currentPage,
  setCurrentPage,
}: PaginationProps) {
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  return (
    <div className="flex items-center justify-end mt-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Trước
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
