import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/user-context";
import ChatWidget from "@/components/chatbot/chat-widget";
import ChatWrapper from "@/components/chatbot/chat-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sổ liên lạc điện tử",
  description: "Ứng dụng sổ liên lạc điện tử cho sinh viên, giảng viên và phụ huynh.",
  icons: {
    icon: "/logo-iuh-64.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* {children} */}
        <UserProvider>
          {children}
          <ChatWrapper />
        </UserProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
