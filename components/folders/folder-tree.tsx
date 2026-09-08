"use client";

import { useEffect, useState } from "react";
import { Folder as FolderIcon, FolderPlus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";

type FolderRow = { id: string; name: string; parentFolderId: string | null };
type FolderNode = FolderRow & { children: FolderNode[] };

function buildTree(rows: FolderRow[]): FolderNode[] {
  const byId = new Map<string, FolderNode>(rows.map((r) => [r.id, { ...r, children: [] }]));
  const roots: FolderNode[] = [];
  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parentFolderId && byId.has(row.parentFolderId)) {
      byId.get(row.parentFolderId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function FolderTree({
  itemType,
  selectedFolderId,
  onSelect,
  reloadToken
}: {
  itemType: "vault" | "bookmark" | "doc";
  selectedFolderId: string | null;
  onSelect: (id: string | null) => void;
  reloadToken?: number;
}) {
  const [rows, setRows] = useState<FolderRow[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function load() {
    const res = await fetch(`/api/folders?itemType=${itemType}`);
    const data = await res.json();
    if (res.ok) setRows(data.folders);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType, reloadToken]);

  async function handleCreate(parentFolderId: string | null) {
    const name = prompt(parentFolderId ? "New subfolder name:" : "New folder name:");
    if (!name) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, itemType, parentFolderId })
    });
    if (res.ok) {
      if (parentFolderId) setExpanded((s) => new Set(s).add(parentFolderId));
      load();
    }
  }

  async function handleRename(folder: FolderRow) {
    const name = prompt("Rename folder:", folder.name);
    if (!name || name === folder.name) return;
    const res = await fetch(`/api/folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (res.ok) load();
  }

  async function handleDelete(folder: FolderRow) {
    if (!confirm(`Delete "${folder.name}"? Items and subfolders inside will move up one level, not be deleted.`)) return;
    const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    if (res.ok) {
      if (selectedFolderId === folder.id) onSelect(null);
      load();
    }
  }

  function toggle(id: string) {
    setExpanded((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function renderNode(node: FolderNode, depth: number) {
    const isOpen = expanded.has(node.id);
    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm ${
            selectedFolderId === node.id ? "bg-accent/10 text-accent font-bold" : "text-ink hover:bg-background"
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {node.children.length > 0 ? (
            <button onClick={() => toggle(node.id)} className="shrink-0">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <button onClick={() => onSelect(node.id)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
            <FolderIcon size={14} className="shrink-0" />
            <span className="truncate">{node.name}</span>
          </button>
          <div className="hidden shrink-0 gap-1 group-hover:flex">
            <button title="New subfolder" onClick={() => handleCreate(node.id)}><FolderPlus size={13} /></button>
            <button title="Rename" onClick={() => handleRename(node)}><Pencil size={13} /></button>
            <button title="Delete" onClick={() => handleDelete(node)}><Trash2 size={13} /></button>
          </div>
        </div>
        {isOpen && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  const tree = buildTree(rows);

  return (
    <div className="w-56 shrink-0 border-r border-border pr-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-muted">Folders</p>
        <button title="New root folder" onClick={() => handleCreate(null)}>
          <FolderPlus size={15} className="text-muted hover:text-accent" />
        </button>
      </div>
      <button
        onClick={() => onSelect(null)}
        className={`mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm ${
          selectedFolderId === null ? "bg-accent/10 font-bold text-accent" : "text-ink hover:bg-background"
        }`}
      >
        All items
      </button>
      {tree.map((node) => renderNode(node, 0))}
    </div>
  );
}
