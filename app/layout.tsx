import type { Metadata } from "next";
import { Lato, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Lato for all UI/body text (your choice). A monospace face is used
// nowhere for decoration — only later, inline, for displaying actual
// technical values like passwords, IPs and URLs where a fixed-width
// face genuinely helps you read the characters correctly.
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "IT Ops Vault",
  description: "Passwords, bookmarks, SOPs and runbooks — one place, one team."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${lato.variable} ${mono.variable}`}>
        <body className="font-sans antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
