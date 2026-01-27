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
    <div className="min-h-screen flex flex-col bg-background">
      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col">{children}</div>
    </div>
  );
}
