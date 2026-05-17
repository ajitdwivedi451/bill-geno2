import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceMono = Space_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "700"], 
  variable: "--font-mono" 
});

export const metadata: Metadata = {
  title: "Elite Bill Generator Machine",
  description: "Generate professional restaurant, hotel, fuel, and travel bills instantly.",
};

export interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className={`${inter.variable} ${spaceMono.variable} font-sans antialiased h-full`}>
        {children}
      </body>
    </html>
  );
}