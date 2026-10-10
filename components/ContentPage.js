import Link from "next/link";
import { Container } from "./ui";

/** Layout for static info pages: title, lead and an optional on-page table of contents. */
export default function ContentPage({ eyebrow, title, lead, toc = [], children, aside = null }) {
  return (
    <Container>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <Link href="/">Home</Link>
        <span className="mx-1.5 text-faint">/</span>
        <span>{eyebrow || title}</span>
      </nav>
      <div className="mb-6 border-b border-line pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {lead && <p className="mt-2 max-w-3xl text-[15px] text-muted">{lead}</p>}
      </div>
      <div className={`grid gap-6 ${toc.length || aside ? "lg:grid-cols-[1fr_280px]" : ""}`}>
        <article className="card doc min-w-0 px-6 py-7 sm:px-8">{children}</article>
        {(toc.length > 0 || aside) && (
          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            {toc.length > 0 && (
              <nav aria-label="On this page" className="card p-5">
                <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">On this page</p>
                <ul className="space-y-2 text-sm">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="text-ink hover:text-brand-600">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {aside}
          </aside>
        )}
      </div>
    </Container>
  );
}

export function HelpCard({ title = "Need help?", children }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <div className="mt-2 text-sm text-muted">{children}</div>
    </div>
  );
}
