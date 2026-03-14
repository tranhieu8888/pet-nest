"use client";

import { Button } from "@/components/ui/button";

type Props<T> = {
  items: T[];
  itemsPerPage: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
};

export default function Pagination<T>({
  items,
  itemsPerPage,
  currentPage,
  setCurrentPage,
}: Props<T>) {
  const totalPages = Math.ceil(items.length / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        Trước
      </Button>

      <span className="text-sm text-muted-foreground">
        Trang {currentPage} / {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
      >
        Sau
      </Button>
    </div>
  );
}
