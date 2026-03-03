import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Category } from "../types";

interface CategoryBreadcrumbProps {
  categoryPageConfig: any;
  breadcrumbHistory: Category[];
  setBreadcrumbHistory: (history: Category[]) => void;
  routerParams: { id: string };
  handleBreadcrumbClick: (history: Category[], catId?: string) => void;
}

export const CategoryBreadcrumb = ({
  categoryPageConfig,
  breadcrumbHistory,
  setBreadcrumbHistory,
  routerParams,
  handleBreadcrumbClick,
}: CategoryBreadcrumbProps) => {
  return (
    <div className="bg-gray-50 py-3">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link
            href="/"
            className="hover:text-blue-600"
            onClick={() => {
              setBreadcrumbHistory([]);
              localStorage.removeItem("breadcrumbHistory");
            }}
          >
            {categoryPageConfig.breadcrumb.home}
          </Link>
          {breadcrumbHistory.map((cat, idx) => (
            <React.Fragment key={cat._id}>
              <ChevronRight className="w-4 h-4" />
              {idx < breadcrumbHistory.length - 1 ? (
                <Link
                  href={`/category/${cat._id}`}
                  className="hover:text-blue-600"
                  onClick={(e) => {
                    e.preventDefault();
                    const newHistory = breadcrumbHistory.slice(0, idx + 1);
                    handleBreadcrumbClick(newHistory, cat._id);
                  }}
                >
                  {cat.name}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{cat.name}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
