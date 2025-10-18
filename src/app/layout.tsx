import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ContextProvider from "@/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || 'https://your-domain.com';

  return {
    title: "iExec DataProtector Mini App",
    description: "Protect your data with iExec DataProtector. Encrypt, store, and grant access to your data securely on the blockchain.",
    other: {
      'fc:miniapp': JSON.stringify({
        version: 'next',
        imageUrl: `${URL}/embed-image.png`,
        button: {
          title: 'Launch DataProtector',
          action: {
            type: 'launch_miniapp',
            name: 'iExec DataProtector',
            url: URL,
            splashImageUrl: `${URL}/splash.png`,
            splashBackgroundColor: '#F4F7FC',
          },
        },
      }),
    },
  };
}

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
        <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  );
}
