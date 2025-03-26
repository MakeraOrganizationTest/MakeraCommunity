import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/themes.css";

import ThemeProvider from "@/components/provider/theme-provider"
import AuthProvider from "@/components/provider/auth-provider"
import ModalProvider from "@/components/provider/modal-provider"
import ToasterProvider from "@/components/provider/toaster-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Makera Community",
  description: "A community platform for makers and creators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="theme-violet" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToasterProvider />
          <AuthProvider>
            <ModalProvider />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
