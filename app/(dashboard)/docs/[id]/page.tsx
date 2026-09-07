"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isStale } from "@/lib/freshness";
import { ShareButton } from "@/components/share/share-button";

type DocVersion = { id: string; content: string; editedBy: string; createdAt: string };
type DocDetail = {
  id: string;
  title: string;
  docType: string;
  content: string;
  lastReviewedAt: string | null;
  versions: DocVersion[];
};

export default function DocDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/documents/${id}`);
    const data = await res.json();
    if (res.ok) {
      setDoc(data.document);
      setContent(data.document.content);
    } else {
      setError(data.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error);
    load();
  }

  async function handleMarkReviewed() {
    const res = await fetch(`/api/documents/${id}/review`, { method: "POST" });
    if (res.ok) load();
    else setError((await res.json()).error);
  }

  async function handleRollback(versionId: string) {
    if (!confirm("Restore this older version as the current content?")) return;
    const res = await fetch(`/api/documents/${id}/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId })
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setShowHistory(false);
    load();
  }

  async function handleDelete() {
    if (!confirm("Delete this document and its entire version history? This cannot be undone.")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/docs");
    else setError((await res.json()).error);
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!doc) return <p className="text-sm text-danger">{error || "Document not found."}</p>;

  const stale = isStale(doc.lastReviewedAt);

  return (
    <div>
      <button onClick={() => router.push("/docs")} className="text-sm text-muted hover:text-ink">
        ← Back to Docs & SOPs
      </button>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-black text-ink">{doc.title}</h1>
        <div className="relative flex items-center gap-2">
          <span className={`rounded px-2 py-1 text-xs font-bold ${stale ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"}`}>
            {stale ? "Needs review" : "Reviewed recently"}
          </span>
          <Button variant="secondary" onClick={handleMarkReviewed}>Mark as reviewed</Button>
          <Button variant="secondary" onClick={() => setShowHistory((s) => !s)}>
            {showHistory ? "Hide" : "Version history"} ({doc.versions.length})
          </Button>
          <ShareButton itemType="doc" itemId={doc.id} />
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</div>
      )}

      {showHistory && (
        <Card className="mt-4 p-4">
          <p className="mb-2 text-sm font-bold text-ink">Version history</p>
          <div className="space-y-2">
            {doc.versions.map((v, i) => (
              <div key={v.id} className="flex items-center justify-between rounded-md border border-border p-2">
                <span className="text-sm text-muted">
                  {i === 0 ? "Current" : `Version from`} {new Date(v.createdAt).toLocaleString()}
                </span>
                {i !== 0 && (
                  <Button variant="secondary" onClick={() => handleRollback(v.id)}>Restore this version</Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-border bg-surface p-4 font-mono text-sm"
          placeholder="Write in Markdown…"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}
