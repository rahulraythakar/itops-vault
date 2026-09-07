"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ShareRow = {
  id: string;
  itemType: string;
  itemId: string;
  token: string;
  expiresAt: string;
  isOneTimeView: boolean;
  viewedAt: string | null;
  createdAt: string;
};

export default function SharesPage() {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/share");
    const data = await res.json();
    if (res.ok) setShares(data.shares);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this share link? It will stop working immediately.")) return;
    const res = await fetch(`/api/share/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-ink">Shared Links</h1>
      <p className="mt-1 text-sm text-muted">
        Every link ever created to share a Vault item, bookmark, or doc externally.
      </p>

      <div className="mt-6 space-y-2">
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {!loading && shares.length === 0 && <p className="text-sm text-muted">No share links yet.</p>}
        {shares.map((s) => {
          const expired = new Date(s.expiresAt) < new Date();
          const consumed = s.isOneTimeView && s.viewedAt;
          const inactive = expired || consumed;
          return (
            <Card key={s.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-bold text-ink">
                  {s.itemType} · {s.isOneTimeView ? "One-time view" : "Multi-view"}
                </p>
                <p className="text-sm text-muted">
                  {inactive
                    ? consumed
                      ? "Already viewed (one-time link)"
                      : "Expired"
                    : `Expires ${new Date(s.expiresAt).toLocaleString()}`}
                </p>
              </div>
              {!inactive && (
                <Button variant="danger" onClick={() => handleRevoke(s.id)}>Revoke</Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
