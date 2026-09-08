"use client";

import { useEffect, useState } from "react";

type FolderRow = { id: string; name: string; parentFolderId: string | null };

// Flattens the folder tree into an indented list for a plain <select> —
// simpler and more accessible than a nested dropdown for choosing a
// single destination folder while editing an item.
function flatten(rows: FolderRow[], parentId: string | null = null, depth = 0): { id: string; label: string }[] {
  return rows
    .filter((r) => r.parentFolderId === parentId)
    .flatMap((r) => [
      { id: r.id, label: `${"— ".repeat(depth)}${r.name}` },
      ...flatten(rows, r.id, depth + 1)
    ]);
}

export function FolderSelect({
  itemType,
  value,
  onChange
}: {
  itemType: "vault" | "bookmark" | "doc";
  value: string | null | undefined;
  onChange: (folderId: string | null) => void;
}) {
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    fetch(`/api/folders?itemType=${itemType}`)
      .then((res) => res.json())
      .then((data) => setOptions(flatten(data.folders || [])));
  }, [itemType]);

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
    >
      <option value="">No folder</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </select>
  );
}
