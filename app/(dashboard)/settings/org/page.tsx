export default function OrgSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-black text-ink">Organization</h1>
      <p className="mt-1 text-sm text-muted">
        Member invites and role management are handled by Clerk's
        OrganizationProfile component — wired in during the RBAC build step.
      </p>
    </div>
  );
}
