"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Bookmark, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

type SearchResult = {
  type: "vault" | "bookmark" | "doc";
  id: string;
  title: string;
  snippet: string;
  updatedAt: string;
};

const TYPE_META = {
  vault: { icon: KeyRound, label: "Vault", href: (id: string) => "/vault" },
  bookmark: { icon: Bookmark, label: "Bookmark", href: (id: string) => "/bookmarks" },
  doc: { icon: FileText, label: "Doc", href: (id: string) => `/docs/${id}` }
};

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search — waits 300ms after typing stops before hitting the
  // API, so we're not firing a request on every keystroke.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok) setResults(data.results);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function goTo(result: SearchResult) {
    const meta = TYPE_META[result.type];
    // Vault/Bookmarks don't have individual pages, so we pass the id as a
    // highlight param and those pages scroll to + briefly highlight it.
    const href =
      result.type === "doc" ? meta.href(result.id) : `${meta.href(result.id)}?highlight=${result.id}`;
    router.push(href);
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-ink">Search</h1>
      <p className="mt-1 text-sm text-muted">
        Search across your Vault, Bookmarks, and Docs & SOPs — all in one place.
      </p>

      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search everything…"
        className="mt-4 w-full max-w-xl rounded-md border border-border px-3 py-2 text-sm"
      />

      <div className="mt-6 space-y-2">
        {loading && <p className="text-sm text-muted">Searching…</p>}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <p className="text-sm text-muted">No matches.</p>
        )}
        {results.map((r) => {
          const Icon = TYPE_META[r.type].icon;
          return (
            <Card
              key={`${r.type}-${r.id}`}
              className="flex cursor-pointer items-center gap-3 p-4 hover:bg-background"
              onClick={() => goTo(r)}
            >
              <Icon size={18} className="shrink-0 text-accent" strokeWidth={2.5} />
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{r.title}</p>
                <p className="truncate text-sm text-muted">
                  {TYPE_META[r.type].label} · {r.snippet}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
