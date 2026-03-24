import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import CustomerChatWidget from "@/components/chat/CustomerChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pet Nest",
  description: "Pet Nest - Your pet care companion",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

const clientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        {clientId ? (
          <GoogleOAuthProvider clientId={clientId}>
            <LanguageProvider>
              <CartProvider>{children}</CartProvider>
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={3000}
              />
              <CustomerChatWidget />
            </LanguageProvider>
          </GoogleOAuthProvider>
        ) : (
          <LanguageProvider>
            <CartProvider>{children}</CartProvider>
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={3000}
            />
            <CustomerChatWidget />
          </LanguageProvider>
        )}
      </body>
    </html>
  );
}
