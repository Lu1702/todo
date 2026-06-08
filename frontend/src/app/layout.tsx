import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({ 
  subsets: ['latin', 'vietnamese'], 
  weight: ['300', '400', '500', '600', '700'], 
});

export const metadata: Metadata = {
  title: "Todo Website",
  description: "Create your todo list",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={quicksand.className}>
        {children}
      </body>    
    </html>
  );
}