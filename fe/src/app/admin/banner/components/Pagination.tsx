"use client";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  setCurrentPage: (value: number) => void;
}

export default function Pagination({
  totalItems,
  currentPage,
  setCurrentPage,
}: PaginationProps) {
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className="flex items-center justify-end gap-2 px-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        Trước
      </Button>

      <Button variant="default" size="sm" className="min-w-9">
        {currentPage}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        Sau
      </Button>
    </div>
  );
}
