import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creditology AI Pro",
  description: "Upload your report. Get the plan. Send the letters.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
