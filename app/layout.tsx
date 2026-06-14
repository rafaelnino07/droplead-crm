import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import CopilotWidget from "./components/revenue-copilot/copilot-widget";

const geist = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "Droplead CRM",
  description: "CRM interno de Droplead",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
        <CopilotWidget />
      </body>
    </html>
  );
}