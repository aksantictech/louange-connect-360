import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Louange Connect 360",
  description:
    "Plateforme de gestion des cellules, finances, activités et patrimoine de l'Église La Louange.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Louange Connect 360",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b169b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}