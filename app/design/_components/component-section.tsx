interface ComponentSectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ComponentSection({
  id,
  title,
  description,
  children,
}: ComponentSectionProps) {
  return (
    <section id={id} className="border border-border p-6 terminal-corners scroll-mt-20">
      <div className="mb-6">
        <h2 className="terminal-label text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export function ComponentRow({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && <p className="terminal-label mb-3">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function ComponentGrid({
  label,
  cols = 4,
  children,
}: {
  label?: string;
  cols?: number;
  children: React.ReactNode;
}) {
  const gridCols =
    cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : cols === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div>
      {label && <p className="terminal-label mb-3">{label}</p>}
      <div className={`grid gap-4 ${gridCols}`}>{children}</div>
    </div>
  );
}
