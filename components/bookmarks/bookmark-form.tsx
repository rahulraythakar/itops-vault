"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderSelect } from "@/components/folders/folder-select";

export type BookmarkInput = {
  id?: string;
  title: string;
  url: string;
  faviconUrl?: string;
  tags: string[];
  folderId?: string | null;
};

export function BookmarkForm({
  initial,
  onSubmit,
  onCancel
}: {
  initial?: Partial<BookmarkInput>;
  onSubmit: (data: BookmarkInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(initial?.url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initial?.faviconUrl ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [folderId, setFolderId] = useState<string | null>(initial?.folderId ?? null);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFetchInfo() {
    if (!url) return;
    setFetching(true);
    try {
      const res = await fetch("/api/bookmarks/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (res.ok) {
        setTitle(data.title);
        setFaviconUrl(data.faviconUrl);
      }
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        id: initial?.id,
        title,
        url,
        faviconUrl,
        tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
        folderId
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-surface p-5">
      <div>
        <label className="text-sm font-bold text-ink">URL</label>
        <div className="mt-1 flex gap-2">
          <input
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <Button type="button" variant="secondary" onClick={handleFetchInfo} disabled={fetching || !url}>
            {fetching ? "Fetching…" : "Fetch info"}
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-ink">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-ink">Tags <span className="font-normal text-muted">(comma separated)</span></label>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          placeholder="client-a, docs"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-ink">Folder</label>
        <FolderSelect itemType="bookmark" value={folderId} onChange={setFolderId} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : initial?.id ? "Save changes" : "Add bookmark"}</Button>
      </div>
    </form>
  );
}
