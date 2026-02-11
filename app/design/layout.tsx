import { ThemeProvider } from "next-themes";

export const metadata = {
  title: "While Design System",
  description: "Terminal-aesthetic component library",
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </ThemeProvider>
  );
}
