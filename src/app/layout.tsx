import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduMentor AI · Spațiul profesorului",
  description:
    "De la învățare la aplicare și reflecție. Explorează EduMentor prin exemple demonstrative.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
