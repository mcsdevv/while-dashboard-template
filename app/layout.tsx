import { Providers } from "@/components/providers";
import { auth } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/env";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notion-GCal Sync Dashboard",
  description: "Real-time bidirectional sync between Notion and Google Calendar",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = isAuthConfigured() ? await auth() : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} flex flex-col min-h-screen antialiased`}>
        <Providers session={session}>
          <div className="flex flex-1 flex-col">
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
