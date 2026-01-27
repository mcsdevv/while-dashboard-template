/**
 * Setup page layout - Full-screen centered, no sidebar
 * No authentication required
 */
export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}
