"use client";

import React from "react";
import { ButtonCore } from "./ButtonCore";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationCoreProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  showingLabel?: string; // Format: "Showing {start} to {end} of {total}"
  className?: string;
}

export const PaginationCore: React.FC<PaginationCoreProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  previousLabel = "Previous",
  nextLabel = "Next",
  showingLabel = "Showing {start} to {end} of {total} results",
  className,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 0) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Generate page numbers to display (with ellipsis)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first, last, and pages around current
      pages.push(1);
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) pages.push("...");
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  const formattedShowingLabel = (showingLabel || "")
    .replace("{start}", (totalItems === 0 ? "0" : (startIndex + 1).toString()))
    .replace("{end}", endIndex.toString())
    .replace("{total}", totalItems.toString());

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 mt-6", className)}>
      <div className="text-sm text-gray-500 font-medium italic">
        {formattedShowingLabel}
      </div>
      
      <div className="flex items-center gap-1.5">
        <ButtonCore
          variantType="outline"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="h-10 px-3 min-w-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">{previousLabel}</span>
        </ButtonCore>

        <div className="flex items-center gap-1.5">
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <div key={`ellipsis-${index}`} className="w-8 h-10 flex items-center justify-center text-gray-400">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              );
            }

            const pageNum = page as number;
            return (
              <ButtonCore
                key={pageNum}
                variantType={currentPage === pageNum ? "primary" : "outline"}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-10 h-10 p-0 min-w-0 flex items-center justify-center transition-all duration-200 text-sm",
                  currentPage === pageNum ? "shadow-md shadow-gray-200 scale-105" : "hover:border-gray-400"
                )}
              >
                {pageNum}
              </ButtonCore>
            );
          })}
        </div>

        <ButtonCore
          variantType="outline"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="h-10 px-3 min-w-0"
        >
          <span className="hidden sm:inline mr-1">{nextLabel}</span>
          <ChevronRight className="w-4 h-4" />
        </ButtonCore>
      </div>
    </div>
  );
};
