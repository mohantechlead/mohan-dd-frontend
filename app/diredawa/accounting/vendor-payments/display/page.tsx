"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TableSearch } from "@/components/table-search";

interface VendorPayment {
  id: string;
  payment_number: string;
  installment_number?: number;
  payment_date: string;
  purchase_number: string;
  supplier_name: string;
  payment_type: string;
  amount: number;
  remaining_amount: number;
  payment_completion_status: string;
  status: string;
}

const API_URL = "/api/accounting/vendor-payments";

export default function DisplayVendorPaymentsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<VendorPayment[]>([]);
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((x) =>
      [x.payment_number, x.purchase_number, x.supplier_name, x.payment_type, x.payment_completion_status, x.status]
        .some((v) => (v ?? "").toLowerCase().includes(q))
    );
  }, [rows, search]);

  const groupedRows = useMemo(() => {
    const map = new Map<
      string,
      {
        purchase_number: string;
        supplier_name: string;
        total_amount: number;
        remaining_amount: number;
        completion_status: string;
        payments: VendorPayment[];
      }
    >();

    for (const p of filtered) {
      const current = map.get(p.purchase_number);
      if (!current) {
        map.set(p.purchase_number, {
          purchase_number: p.purchase_number,
          supplier_name: p.supplier_name,
          total_amount: Number(p.amount ?? 0),
          remaining_amount: Number(p.remaining_amount ?? 0),
          completion_status: p.payment_completion_status,
          payments: [p],
        });
      } else {
        current.total_amount += Number(p.amount ?? 0);
        current.remaining_amount = Math.min(
          current.remaining_amount,
          Number(p.remaining_amount ?? current.remaining_amount)
        );
        current.completion_status =
          current.completion_status === "full" || p.payment_completion_status === "full"
            ? "full"
            : "partial";
        current.payments.push(p);
      }
    }

    for (const [, group] of map) {
      group.payments.sort(
        (a, b) =>
          (a.installment_number ?? 0) - (b.installment_number ?? 0)
      );
    }
    return Array.from(map.values());
  }, [filtered]);

  const fetchRows = async () => {
    try {
      const res = await fetch(API_URL, { method: "GET", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to load vendor payments", description: data?.detail || "Please try again.", variant: "error" });
        return;
      }
      setRows(Array.isArray(data) ? data : []);
    } catch {
      showToast({ title: "Failed to load vendor payments", description: "Something went wrong.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleDelete = async (paymentNumber: string) => {
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(paymentNumber)}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to delete vendor payment", description: data?.detail || "Please try again.", variant: "error" });
        return;
      }
      showToast({ title: "Vendor payment deleted", variant: "success" });
      fetchRows();
    } catch {
      showToast({ title: "Failed to delete vendor payment", description: "Something went wrong.", variant: "error" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-4 space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={() => router.push("/diredawa/accounting/vendor-payments/create")}>Create Vendor Payment</Button>
        <h1 className="text-2xl font-bold text-center flex-1">Vendor Payments</h1>
      </div>

      {loading ? (
        <p>Loading vendor payments...</p>
      ) : (
        <>
          <div className="flex justify-end">
            <TableSearch value={search} onChange={setSearch} placeholder="Search payment no, purchase, supplier..." />
          </div>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left">Purchase</th>
                  <th className="px-4 py-2 text-left">Supplier</th>
                  <th className="px-4 py-2 text-right">Total Paid</th>
                  <th className="px-4 py-2 text-right">Remaining</th>
                  <th className="px-4 py-2 text-left">Completion</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-4 text-center text-sm text-muted-foreground">No vendor payments found.</td></tr>
                ) : (
                  groupedRows.map((group) => {
                    const open = !!openGroups[group.purchase_number];
                    return (
                      <Fragment key={group.purchase_number}>
                        <tr key={`summary-${group.purchase_number}`} className="border-t">
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 hover:text-blue-600"
                              onClick={() =>
                                setOpenGroups((prev) => ({
                                  ...prev,
                                  [group.purchase_number]: !open,
                                }))
                              }
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
                              />
                              <span>{group.purchase_number}</span>
                            </button>
                          </td>
                          <td className="px-4 py-2">{group.supplier_name}</td>
                          <td className="px-4 py-2 text-right">
                            {group.total_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {group.remaining_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2 capitalize">{group.completion_status}</td>
                          <td className="px-4 py-2">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Payment Summary"
                                onClick={() =>
                                  router.push(
                                    `/diredawa/accounting/vendor-payments/purchase/${encodeURIComponent(
                                      group.purchase_number
                                    )}`
                                  )
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {Number(group.remaining_amount) > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Add Payment"
                                  onClick={() =>
                                    router.push(
                                      `/diredawa/accounting/vendor-payments/create?purchaseNumber=${encodeURIComponent(
                                        group.purchase_number
                                      )}`
                                    )
                                  }
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {open && (
                          <tr key={`details-${group.purchase_number}`} className="bg-muted/20">
                            <td colSpan={6} className="px-4 py-3">
                              <div className="rounded-md border bg-white overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/50">
                                    <tr>
                                      <th className="px-3 py-2 text-left">Payment</th>
                                      <th className="px-3 py-2 text-left">Date</th>
                                      <th className="px-3 py-2 text-left">Type</th>
                                      <th className="px-3 py-2 text-right">Amount</th>
                                      <th className="px-3 py-2 text-left">Status</th>
                                      <th className="px-3 py-2 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.payments.map((x) => (
                                      <tr key={x.id} className="border-t">
                                        <td className="px-3 py-2">
                                          <button
                                            className="text-blue-600 hover:underline"
                                            onClick={() =>
                                              router.push(`/diredawa/accounting/vendor-payments/${x.payment_number}`)
                                            }
                                          >
                                            {`Payment ${x.installment_number ?? 1}`}
                                          </button>
                                        </td>
                                        <td className="px-3 py-2">{new Date(x.payment_date).toLocaleDateString()}</td>
                                        <td className="px-3 py-2 capitalize">{x.payment_type}</td>
                                        <td className="px-3 py-2 text-right">
                                          {Number(x.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-2 capitalize">{x.status}</td>
                                        <td className="px-3 py-2">
                                          <div className="flex justify-end gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              title="Payment Summary"
                                              onClick={() =>
                                                router.push(
                                                  `/diredawa/accounting/vendor-payments/purchase/${encodeURIComponent(
                                                    x.purchase_number
                                                  )}`
                                                )
                                              }
                                            >
                                              <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                router.push(`/diredawa/accounting/vendor-payments/${x.payment_number}/edit`)
                                              }
                                            >
                                              <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDelete(x.payment_number)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
