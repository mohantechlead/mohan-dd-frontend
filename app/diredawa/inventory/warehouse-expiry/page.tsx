"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  WSN_API_URL,
  EXPIRY_CHECK_URL,
  formatDate,
  money,
  type WarehouseStorageNote,
} from "@/lib/warehouse";

export default function WarehouseExpiryPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [runningCheck, setRunningCheck] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<WarehouseStorageNote[]>(
    WSN_API_URL,
    fetcher,
  );

  useEffect(() => {
    if (error?.status === 401) auth?.loginRequiredRedirect();
  }, [auth, error]);

  const notes = useMemo(() => data || [], [data]);

  const expired = useMemo(
    () =>
      notes
        .filter((n) => String(n.status).toLowerCase() === "expired")
        .sort((a, b) => String(a.wsn_no).localeCompare(String(b.wsn_no))),
    [notes],
  );

  const expiring = useMemo(
    () =>
      notes
        .filter((n) => String(n.status).toLowerCase() !== "expired")
        .filter((n) => Boolean(n.current_expiry_date))
        .sort((a, b) =>
          String(a.current_expiry_date).localeCompare(String(b.current_expiry_date)),
        ),
    [notes],
  );

  const runExpiryCheck = async () => {
    if (runningCheck) return;
    setRunningCheck(true);
    try {
      const res = await fetch(EXPIRY_CHECK_URL, {
        method: "GET",
        credentials: "include",
      });
      const rawText = await res.text();
      let data: unknown = {};
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { detail: rawText.slice(0, 500) };
        }
      }
      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null
            ? (data as { detail?: string | string[] })
            : {};
        const detail = Array.isArray(message.detail)
          ? message.detail.join(". ")
          : message.detail;
        showToast({
          title: "Expiry check failed",
          description: detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({
        title: "Expiry check complete",
        description: "The expiry scan has run and notifications were sent.",
        variant: "success",
      });
      mutate();
    } catch {
      showToast({
        title: "Expiry check failed",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setRunningCheck(false);
    }
  };

  const openNote = (note: WarehouseStorageNote) => {
    router.push(
      `/diredawa/inventory/warehouse-storage-notes/${encodeURIComponent(note.id)}`,
    );
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expired / Expiring Storage Notes</h1>
        <Button onClick={runExpiryCheck} disabled={runningCheck}>
          {runningCheck ? "Running..." : "Run Expiry Check"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Storage notes that have passed their storage (and grace) period incur a
        tiered expiration fee. The fee currently applying is shown for each
        expired note.
      </p>

      <section className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-red-50 border-b text-red-900">
          Expired ({expired.length})
        </h2>
        {expired.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No expired storage notes.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-red-50/60">
              <tr>
                <th className="px-4 py-2 text-left">WSN #</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Expiry Date</th>
                <th className="px-4 py-2 text-right">Periods Past</th>
                <th className="px-4 py-2 text-right">Current Fee</th>
              </tr>
            </thead>
            <tbody>
              {expired.map((n) => (
                <tr
                  key={n.id}
                  className="border-t cursor-pointer hover:bg-muted/40"
                  onClick={() => openNote(n)}
                >
                  <td className="px-4 py-2 text-primary font-medium">
                    {n.wsn_no}
                  </td>
                  <td className="px-4 py-2">{n.customer_name}</td>
                  <td className="px-4 py-2">
                    {formatDate(n.current_expiry_date)}
                  </td>
                  <td className="px-4 py-2 text-right">{n.periods_expired}</td>
                  <td className="px-4 py-2 text-right font-semibold text-red-700">
                    {money(n.current_expiration_fee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-amber-50 border-b text-amber-900">
          Expiring Soon ({expiring.length})
        </h2>
        {expiring.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No storage notes expiring.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-amber-50/60">
              <tr>
                <th className="px-4 py-2 text-left">WSN #</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Expiry Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {expiring.map((n) => (
                <tr
                  key={n.id}
                  className="border-t cursor-pointer hover:bg-muted/40"
                  onClick={() => openNote(n)}
                >
                  <td className="px-4 py-2 text-primary font-medium">
                    {n.wsn_no}
                  </td>
                  <td className="px-4 py-2">{n.customer_name}</td>
                  <td className="px-4 py-2">
                    {formatDate(n.current_expiry_date)}
                  </td>
                  <td className="px-4 py-2 capitalize">{n.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
