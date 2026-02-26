"use client";

import { Button } from "@/components/ui/button";
import { Blog } from "../types";

interface Props {
  filteredBlogs: Blog[];
  itemsPerPage: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export default function Pagination({
  filteredBlogs,
  itemsPerPage,
  currentPage,
  setCurrentPage,
}: Props) {
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);

  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        Trước
      </Button>

      <span>
        {currentPage} / {totalPages}
      </span>

      <Button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
      >
        Sau
      </Button>
    </div>
  );
}
