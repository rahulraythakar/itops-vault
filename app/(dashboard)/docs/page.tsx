"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isStale } from "@/lib/freshness";
import { FolderTree } from "@/components/folders/folder-tree";
import { FolderSelect } from "@/components/folders/folder-select";

type DocSummary = {
  id: string;
  title: string;
  docType: "SOP" | "KB" | "RUNBOOK" | "DOC";
  lastReviewedAt: string | null;
  updatedAt: string;
  folderId: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  SOP: "SOP",
  KB: "Knowledge Base",
  RUNBOOK: "Runbook",
  DOC: "Doc"
};

export default function DocsPage() {
  const router = useRouter();
  const [items, setItems] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("DOC");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    const res = await fetch("/api/documents");
    const data = await res.json();
    if (res.ok) setItems(data.items);
    else setError(data.error);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, docType, folderId })
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    router.push(`/docs/${data.document.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Docs & SOPs</h1>
          <p className="mt-1 text-sm text-muted">
            SOPs, runbooks, and knowledge base articles — with version history.
          </p>
        </div>
        {!creating && (
          <Button
            onClick={() => {
              setFolderId(selectedFolderId);
              setCreating(true);
            }}
          >
            + New document
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {creating && (
        <form onSubmit={handleCreate} className="mt-4 space-y-3 rounded-lg border border-border bg-surface p-5">
          <div>
            <label className="text-sm font-bold text-ink">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              placeholder="e.g. New Employee Onboarding SOP"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-ink">Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="DOC">Doc</option>
              <option value="SOP">SOP</option>
              <option value="KB">Knowledge Base</option>
              <option value="RUNBOOK">Runbook</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-ink">Folder</label>
            <FolderSelect itemType="doc" value={folderId} onChange={setFolderId} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit">Create & start writing</Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex gap-6">
        <FolderTree itemType="doc" selectedFolderId={selectedFolderId} onSelect={setSelectedFolderId} />
        <div className="flex-1 space-y-2">
          {loading && <p className="text-sm text-muted">Loading…</p>}
          {!loading &&
            items.filter((d) => selectedFolderId === null || d.folderId === selectedFolderId).length === 0 && (
              <p className="text-sm text-muted">Nothing here yet.</p>
            )}
          {items
            .filter((d) => selectedFolderId === null || d.folderId === selectedFolderId)
            .map((doc) => {
              const stale = isStale(doc.lastReviewedAt);
              return (
                <Card
                  key={doc.id}
                  className="flex cursor-pointer items-center justify-between p-4 hover:bg-background"
                  onClick={() => router.push(`/docs/${doc.id}`)}
                >
                  <div>
                    <p className="font-bold text-ink">{doc.title}</p>
                    <p className="text-sm text-muted">
                      {TYPE_LABELS[doc.docType]} · Updated {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-bold ${
                      stale ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"
                    }`}
                  >
                    {stale ? "Needs review" : "Reviewed recently"}
                  </span>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
