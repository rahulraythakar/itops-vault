"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareButton({
  itemType,
  itemId
}: {
  itemType: "vault" | "bookmark" | "doc";
  itemId: string;
}) {
  const [open, setOpen] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState("24");
  const [isOneTimeView, setIsOneTimeView] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType, itemId, expiresInHours, isOneTimeView })
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) return setError(data.error);
    setLink(`${window.location.origin}/share/${data.share.token}`);
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Share
      </Button>
    );
  }

  return (
    <div className="absolute z-10 mt-2 w-72 rounded-lg border border-border bg-surface p-4 shadow-lg">
      {!link && (
        <>
          <label className="text-sm font-bold text-ink">Expires in</label>
          <select
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(e.target.value)}
            className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
          >
            <option value="1">1 hour</option>
            <option value="24">24 hours</option>
            <option value="168">7 days</option>
          </select>
          <label className="mt-3 flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={isOneTimeView} onChange={(e) => setIsOneTimeView(e.target.checked)} />
            One-time view only
          </label>
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "Create link"}
            </Button>
          </div>
        </>
      )}
      {link && (
        <>
          <p className="text-sm font-bold text-ink">Link created</p>
          <input readOnly value={link} className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-xs font-mono" />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(link)}>Copy</Button>
            <Button variant="ghost" onClick={() => { setOpen(false); setLink(null); }}>Done</Button>
          </div>
        </>
      )}
    </div>
  );
}
