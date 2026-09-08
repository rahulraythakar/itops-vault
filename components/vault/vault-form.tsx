"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generatePassword } from "@/lib/password-generator";
import { FolderSelect } from "@/components/folders/folder-select";

export type VaultItemInput = {
  id?: string;
  title: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags: string[];
  folderId?: string | null;
};

export function VaultForm({
  initial,
  onSubmit,
  onCancel
}: {
  initial?: Partial<VaultItemInput>;
  onSubmit: (data: VaultItemInput) => Promise<void>;
  onCancel: () => void;
}) {
  const isEdit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [folderId, setFolderId] = useState<string | null>(initial?.folderId ?? null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        id: initial?.id,
        title,
        username,
        password: password || undefined, // omit if blank on edit = keep existing
        url,
        notes,
        tags: tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        folderId
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border bg-surface p-5"
    >
      <div>
        <label className="text-sm font-bold text-ink">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          placeholder="e.g. Client A — Domain Registrar"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-ink">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-ink">
          Password {isEdit && <span className="font-normal text-muted">(leave blank to keep current)</span>}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isEdit}
            className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? "Hide" : "Show"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPassword(generatePassword(20));
              setShowPassword(true);
            }}
          >
            Generate
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-ink">URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-ink">Tags <span className="font-normal text-muted">(comma separated)</span></label>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          placeholder="client-a, hosting"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-ink">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-ink">Folder</label>
        <FolderSelect itemType="vault" value={folderId} onChange={setFolderId} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add to vault"}
        </Button>
      </div>
    </form>
  );
}
