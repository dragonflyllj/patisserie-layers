/**
 * Shared shell for the legal pages, so they share one layout and typography.
 *
 * @param title - Page heading.
 * @param eyebrow - Small Latin label above the heading.
 * @param children - Page body.
 */
export function LegalPage({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display text-2xl sm:text-3xl mt-3">{title}</h1>
      <div className="mt-12 text-sm leading-loose text-ink/85">{children}</div>
    </div>
  );
}

/**
 * One labelled row of the 特定商取引法 disclosure table.
 *
 * @param label - The legally-named field, e.g. "販売事業者名".
 * @param children - The value.
 */
export function LegalRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid sm:grid-cols-[11rem_1fr] gap-2 sm:gap-6 py-5 border-b border-line">
      <dt className="text-xs text-muted pt-1">{label}</dt>
      <dd className="leading-relaxed">{children}</dd>
    </div>
  );
}

/**
 * Marks a value the shop owner still has to supply.
 *
 * Rendered in a visually obvious style on purpose: these are legally required
 * fields, and shipping the site with one unfilled should be hard to miss.
 *
 * @param children - A description of what needs to go here.
 */
export function TodoValue({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-sm bg-sold/10 border border-sold/30 px-2 py-0.5 text-sold text-xs">
      要記入：{children}
    </span>
  );
}
