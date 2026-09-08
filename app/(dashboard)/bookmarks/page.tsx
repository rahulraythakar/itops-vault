"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, Rows3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkForm, type BookmarkInput } from "@/components/bookmarks/bookmark-form";
import { ShareButton } from "@/components/share/share-button";
import { FolderTree } from "@/components/folders/folder-tree";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  faviconUrl: string | null;
  tags: string[];
  folderId: string | null;
};

function Favicon({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return <div className="h-4 w-4 shrink-0 rounded-sm bg-border" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="h-4 w-4 shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

export default function BookmarksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <BookmarksPageInner />
    </Suspense>
  );
}

function BookmarksPageInner() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [items, setItems] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "add" | { edit: Partial<BookmarkInput> & { id: string } }>("list");
  const [query, setQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewStyle, setViewStyle] = useState<"grid" | "rows">("grid");

  // Remember the user's preferred view across visits. Reused pattern —
  // Docs and Vault will get the same toggle later using this same approach.
  useEffect(() => {
    const saved = localStorage.getItem("bookmarksViewStyle");
    if (saved === "grid" || saved === "rows") setViewStyle(saved);
  }, []);

  function updateViewStyle(style: "grid" | "rows") {
    setViewStyle(style);
    localStorage.setItem("bookmarksViewStyle", style);
  }

  async function loadItems() {
    setLoading(true);
    const res = await fetch("/api/bookmarks");
    const data = await res.json();
    if (res.ok) setItems(data.items);
    else setError(data.error);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  // Folder selection and quick search both narrow the same list — folder
  // first, then text search on top of whatever the folder already shows.
  const filtered = useMemo(() => {
    const inFolder = items.filter(
      (b) => selectedFolderId === null || b.folderId === selectedFolderId
    );
    const q = query.trim().toLowerCase();
    if (!q) return inFolder;
    return inFolder.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [items, query, selectedFolderId]);

  async function handleCreate(data: BookmarkInput) {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) return setError(result.error);
    setMode("list");
    loadItems();
  }

  async function handleUpdate(data: BookmarkInput) {
    const res = await fetch(`/api/bookmarks/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) return setError(result.error);
    setMode("list");
    loadItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bookmark?")) return;
    const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
    if (res.ok) loadItems();
    else setError((await res.json()).error);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Bookmarks</h1>
          <p className="mt-1 text-sm text-muted">Shared links, organized by tag.</p>
        </div>
        {mode === "list" && <Button onClick={() => setMode("add")}>+ Add bookmark</Button>}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {mode === "add" && (
        <div className="mt-4">
          <BookmarkForm onSubmit={handleCreate} onCancel={() => setMode("list")} />
        </div>
      )}

      {typeof mode === "object" && (
        <div className="mt-4">
          <BookmarkForm initial={mode.edit} onSubmit={handleUpdate} onCancel={() => setMode("list")} />
        </div>
      )}

      {mode === "list" && (
        <>
          <div className="mt-4 flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Quick search title, URL, or tag…"
              className="w-full max-w-md rounded-md border border-border px-3 py-2 text-sm"
            />
            <div className="flex rounded-md border border-border p-0.5">
              <button
                onClick={() => updateViewStyle("grid")}
                aria-label="Tile view"
                className={`rounded p-1.5 ${viewStyle === "grid" ? "bg-accent/10 text-accent" : "text-muted"}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => updateViewStyle("rows")}
                aria-label="List view"
                className={`rounded p-1.5 ${viewStyle === "rows" ? "bg-accent/10 text-accent" : "text-muted"}`}
              >
                <Rows3 size={16} />
              </button>
            </div>
          </div>

          <div
            className={
              viewStyle === "grid"
                ? "mt-4 flex gap-6"
                : "mt-4 flex gap-6"
            }
          >
            <FolderTree itemType="bookmark" selectedFolderId={selectedFolderId} onSelect={setSelectedFolderId} />
            <div
              className={
                viewStyle === "grid"
                  ? "grid flex-1 grid-cols-1 gap-2 self-start sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-1 flex-col gap-2 self-start"
              }
            >
            {loading && <p className="text-sm text-muted">Loading…</p>}
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-muted">No bookmarks match.</p>
            )}
            {filtered.map((b) =>
              viewStyle === "grid" ? (
                <Card key={b.id} className={`p-4 ${b.id === highlightId ? "ring-2 ring-accent" : ""}`}>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <Favicon url={b.faviconUrl} />
                    <span className="truncate font-bold text-ink">{b.title}</span>
                  </a>
                  <p className="mt-1 truncate text-xs text-muted">{b.url}</p>
                  {b.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {b.tags.map((tag) => (
                        <span key={tag} className="rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative mt-3 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setMode({ edit: { id: b.id, title: b.title, url: b.url, faviconUrl: b.faviconUrl ?? undefined, tags: b.tags, folderId: b.folderId } })}
                    >
                      Edit
                    </Button>
                    <ShareButton itemType="bookmark" itemId={b.id} />
                    <Button variant="danger" onClick={() => handleDelete(b.id)}>Delete</Button>
                  </div>
                </Card>
              ) : (
                <Card key={b.id} className={`flex items-center justify-between p-3 ${b.id === highlightId ? "ring-2 ring-accent" : ""}`}>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2">
                    <Favicon url={b.faviconUrl} />
                    <span className="truncate font-bold text-ink">{b.title}</span>
                    <span className="truncate text-xs text-muted">{b.url}</span>
                    {b.tags.map((tag) => (
                      <span key={tag} className="shrink-0 rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                        {tag}
                      </span>
                    ))}
                  </a>
                  <div className="relative flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setMode({ edit: { id: b.id, title: b.title, url: b.url, faviconUrl: b.faviconUrl ?? undefined, tags: b.tags, folderId: b.folderId } })}
                    >
                      Edit
                    </Button>
                    <ShareButton itemType="bookmark" itemId={b.id} />
                    <Button variant="danger" onClick={() => handleDelete(b.id)}>Delete</Button>
                  </div>
                </Card>
              )
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
