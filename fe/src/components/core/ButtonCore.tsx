"use client";

import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { type VariantProps } from "class-variance-authority";

interface ButtonCoreProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variantType?: "primary" | "danger" | "success" | "warning" | "info" | "outline" | "ghost";
}

export const ButtonCore: React.FC<ButtonCoreProps> = ({
  children,
  className,
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  variantType = "primary",
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variantType) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 border-none";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 border-none";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 border-none";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 border-none";
      case "outline":
        return "bg-white border-2 border-gray-200 hover:border-gray-900 text-gray-900 hover:bg-gray-50";
      case "ghost":
        return "bg-transparent hover:bg-gray-100/50 text-gray-500 hover:text-gray-900";
      default:
        // Primary
        return "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200 border-none";
    }
  };

  return (
    <Button
      disabled={isLoading || disabled}
      className={cn(
        "relative rounded-2xl h-12 px-6 font-bold transition-all duration-300 active:scale-[0.97] disabled:opacity-70 flex items-center justify-center gap-2 overflow-hidden group border-none capitalize cursor-pointer",
        getVariantStyles(),
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="transition-transform group-hover:-translate-x-0.5">{leftIcon}</span>}
          <span className="relative z-10">{children}</span>
          {rightIcon && <span className="transition-transform group-hover:translate-x-0.5">{rightIcon}</span>}
        </>
      )}
      
      {/* Subtle hover overlay */}
      {!disabled && !isLoading && (
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </Button>
  );
};
