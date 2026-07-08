import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "Resume Buddy - AI Resume Operating System",
  description: "Build, analyze, and optimize your ATS-friendly resume with recruiter-simulated AI checks, STAR/XYZ bullet rewrites, and keyword gap reviews.",
  keywords: ["AI Resume Builder", "ATS Checker", "Resume Optimizer", "Career Assistant", "Mock Interview", "Cover Letter Generator"],
  authors: [{ name: "Resume Buddy Team" }],
  openGraph: {
    title: "Resume Buddy - AI Resume Operating System",
    description: "Build, analyze, and optimize your ATS-friendly resume with recruiter-simulated AI checks.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
