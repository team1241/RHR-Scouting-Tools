import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "../components/providers";
import TopNavBar from "@/components/common/header/Header";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "REBUILT Tools",
    template: "%s | REBUILT Tools",
  },
  description: "A suite of tools to scout Rebuilt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-background">
        <Providers>
          <TopNavBar />
          <div className="min-h-screen pt-12 mx-auto max-w-7xl">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
