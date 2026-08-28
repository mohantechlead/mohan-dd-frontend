"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import { WRN_API_URL, formatDate, type WarehouseReleaseNote } from "@/lib/warehouse";

export default function ReleaseNoteDetailPage() {
  const params = useParams<{ releaseNoteId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.releaseNoteId;

  const [note, setNote] = useState<WarehouseReleaseNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await fetch(`${WRN_API_URL}/${encodeURIComponent(id)}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          showToast({
            title: "Failed to load Release Note",
            description: formatApiErrorMessage(data),
            variant: "error",
          });
          return;
        }
        setNote(data as WarehouseReleaseNote);
      } catch {
        showToast({
          title: "Failed to load Release Note",
          description: "Something went wrong.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, showToast]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!note) return <div className="p-10 text-center">Release note not found.</div>;

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() =>
            router.push("/diredawa/inventory/warehouse-release-notes/display")
          }
        >
          Back to Release Notes
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">Release Note Detail</h1>
          <p className="text-sm text-muted-foreground mt-1">{note.wrn_no}</p>
        </div>
        <div className="w-[150px]" />
      </div>

      <div className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
          Release Details
        </h2>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="px-4 py-2 text-muted-foreground w-52">
                Release Note No
              </td>
              <td className="px-4 py-2">{note.wrn_no}</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">
                Source Storage Note
              </td>
              <td className="px-4 py-2">
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() =>
                    router.push(
                      `/diredawa/inventory/warehouse-storage-notes/${encodeURIComponent(
                        note.storage_note_id,
                      )}`,
                    )
                  }
                >
                  {note.wsn_no || note.storage_note_id}
                </button>
              </td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">Customer</td>
              <td className="px-4 py-2">{note.customer_name}</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">Date</td>
              <td className="px-4 py-2">{formatDate(note.date)}</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground align-top">Remark</td>
              <td className="px-4 py-2 whitespace-pre-wrap">
                {note.remark?.trim() ? note.remark : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
          Released Items ({note.items?.length ?? 0})
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2 text-left">Item Name</th>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-right">Quantity</th>
              <th className="px-4 py-2 text-left">Unit</th>
              <th className="px-4 py-2 text-right">Bags</th>
            </tr>
          </thead>
          <tbody>
            {(note.items ?? []).map((item, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{item.item_name}</td>
                <td className="px-4 py-2">{item.code || item.internal_code || "—"}</td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatQuantityDisplay(item.quantity)}
                </td>
                <td className="px-4 py-2">{item.unit_measurement || "—"}</td>
                <td className="px-4 py-2 text-right">
                  {item.bags != null ? formatQuantityDisplay(item.bags) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
