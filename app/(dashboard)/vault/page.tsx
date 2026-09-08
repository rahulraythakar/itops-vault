"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VaultForm, type VaultItemInput } from "@/components/vault/vault-form";
import { ShareButton } from "@/components/share/share-button";
import { FolderTree } from "@/components/folders/folder-tree";

type VaultItem = {
  id: string;
  title: string;
  username: string | null;
  url: string | null;
  tags: string[];
  folderId: string | null;
  updatedAt: string;
};

export default function VaultPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <VaultPageInner />
    </Suspense>
  );
}

function VaultPageInner() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<
    "list" | "add" | { edit: Partial<VaultItemInput> & { id: string } }
  >("list");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    const res = await fetch("/api/vault");
    const data = await res.json();
    if (res.ok) setItems(data.items);
    else setError(data.error);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleCreate(data: VaultItemInput) {
    const res = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error);
      return;
    }
    setMode("list");
    loadItems();
  }

  async function handleUpdate(data: VaultItemInput) {
    const res = await fetch(`/api/vault/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error);
      return;
    }
    setMode("list");
    loadItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this vault item? This cannot be undone.")) return;
    const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
    if (res.ok) loadItems();
    else setError((await res.json()).error);
  }

  async function handleCopy(id: string) {
    const res = await fetch(`/api/vault/${id}/reveal`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    await navigator.clipboard.writeText(data.password);
    setCopiedId(id);
    // Auto-clear the clipboard 20 seconds after copying, so a password
    // left on the clipboard doesn't linger indefinitely.
    setTimeout(async () => {
      try {
        const current = await navigator.clipboard.readText();
        if (current === data.password) {
          await navigator.clipboard.writeText("");
        }
      } catch {
        // Clipboard read permission can be denied by the browser — safe to ignore.
      }
      setCopiedId((c) => (c === id ? null : c));
    }, 20000);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Vault</h1>
          <p className="mt-1 text-sm text-muted">
            Passwords are encrypted at rest and only decrypted for a moment when you click Copy.
          </p>
        </div>
        {mode === "list" && (
          <Button onClick={() => setMode("add")}>+ Add item</Button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {mode === "add" && (
        <div className="mt-4">
          <VaultForm
            onSubmit={handleCreate}
            onCancel={() => setMode("list")}
          />
        </div>
      )}

      {typeof mode === "object" && (
        <div className="mt-4">
          <VaultForm
            initial={mode.edit}
            onSubmit={handleUpdate}
            onCancel={() => setMode("list")}
          />
        </div>
      )}

      {mode === "list" && (
        <div className="mt-6 flex gap-6">
          <FolderTree itemType="vault" selectedFolderId={selectedFolderId} onSelect={setSelectedFolderId} />
          <div className="flex-1 space-y-2">
            {loading && <p className="text-sm text-muted">Loading…</p>}
            {!loading && items.filter((i) => selectedFolderId === null || i.folderId === selectedFolderId).length === 0 && (
              <p className="text-sm text-muted">Nothing here yet.</p>
            )}
            {items
              .filter((i) => selectedFolderId === null || i.folderId === selectedFolderId)
              .map((item) => (
            <Card
              key={item.id}
              className={`flex items-center justify-between p-4 ${
                item.id === highlightId ? "ring-2 ring-accent" : ""
              }`}
            >
              <div>
                <p className="font-bold text-ink">{item.title}</p>
                <p className="text-sm text-muted">
                  {item.username} {item.url && `· ${item.url}`}
                </p>
                {item.tags.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex gap-2">
                <Button variant="secondary" onClick={() => handleCopy(item.id)}>
                  {copiedId === item.id ? "Copied! (clears in 20s)" : "Copy password"}
                </Button>
                <ShareButton itemType="vault" itemId={item.id} />
                <Button
                  variant="secondary"
                  onClick={() =>
                    setMode({
                      edit: {
                        ...item,
                        username: item.username ?? undefined,
                        url: item.url ?? undefined
                      }
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(item.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
