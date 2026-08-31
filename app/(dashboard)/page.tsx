import { Card } from "@/components/ui/card";

// Real placeholder content, not lorem ipsum — these numbers will come from
// live counts once the Vault/Bookmarks/Docs modules are built in later steps.
const stats = [
  { label: "Vault items", value: "0" },
  { label: "Bookmarks", value: "0" },
  { label: "Docs & SOPs", value: "0" },
  { label: "Shared links active", value: "0" }
];

export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-black text-ink">Overview</h1>
      <p className="mt-1 text-sm text-muted">
        Nothing stored yet — the Vault, Bookmarks and Docs modules ship in the
        next build steps.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-2xl font-black text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
