import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Louange Connect 360",
  description:
    "Plateforme de gestion des cellules, finances, activités et patrimoine de l'Église La Louange.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}