"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// No sidebar, no ClerkProvider auth-gating for content — this page is
// reached by people with no account. It only ever calls the public
// /api/share/token/[token] endpoint, never anything under the
// authenticated app.
export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/token/${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) setError(json.error);
        else setData(json);
      })
      .catch(() => setError("Something went wrong loading this link."));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6">
        {error && <p className="text-danger">{error}</p>}

        {!error && !data && <p className="text-muted">Loading…</p>}

        {data && (
          <>
            <h1 className="text-xl font-black text-ink">{data.title}</h1>
            {data.isOneTimeView && (
              <p className="mt-1 text-xs font-bold text-danger">
                This is a one-time view — this link won't work again after you leave this page.
              </p>
            )}

            {data.itemType === "vault" && (
              <div className="mt-4 space-y-2 text-sm">
                {data.content.username && (
                  <p><span className="font-bold">Username:</span> {data.content.username}</p>
                )}
                <p className="font-mono"><span className="font-bold font-sans">Password:</span> {data.content.password}</p>
                {data.content.url && (
                  <p><span className="font-bold">URL:</span> {data.content.url}</p>
                )}
                {data.content.notes && (
                  <p><span className="font-bold">Notes:</span> {data.content.notes}</p>
                )}
              </div>
            )}

            {data.itemType === "bookmark" && (
              <p className="mt-4 text-sm">
                <a href={data.content.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                  {data.content.url}
                </a>
              </p>
            )}

            {data.itemType === "doc" && (
              <pre className="mt-4 whitespace-pre-wrap text-sm text-ink">{data.content.markdown}</pre>
            )}
          </>
        )}
      </div>
    </div>
  );
}
