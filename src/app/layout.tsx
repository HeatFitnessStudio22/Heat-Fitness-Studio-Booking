import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "HEAT The Fitness Studio | Κράτηση Ραντεβού",
  description: "Κράτηση ραντεβού - HEAT The Fitness Studio, Δεληγιώργη 119-121, Πειραιάς",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body className="min-h-screen bg-heatBlack font-display">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

