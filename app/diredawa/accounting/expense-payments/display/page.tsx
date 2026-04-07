"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import { TableSearch } from "@/components/table-search";

interface ExpensePayment {
  id: string;
  expense_number: string;
  expense_date: string;
  payee: string;
  category: string;
  amount: number;
  status: string;
}

const API_URL = "/api/accounting/expense-payments";

export default function DisplayExpensePaymentsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExpensePayment[]>([]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((x) =>
      [x.expense_number, x.payee, x.category, x.status].some((v) => (v ?? "").toLowerCase().includes(q))
    );
  }, [items, search]);

  const fetchList = async () => {
    try {
      const res = await fetch(API_URL, { method: "GET", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to load expense payments", description: data?.detail || "Please try again.", variant: "error" });
        return;
      }
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast({ title: "Failed to load expense payments", description: "Something went wrong.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleDelete = async (expenseNumber: string) => {
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(expenseNumber)}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to delete expense payment", description: data?.detail || "Please try again.", variant: "error" });
        return;
      }
      showToast({ title: "Expense payment deleted", variant: "success" });
      fetchList();
    } catch {
      showToast({ title: "Failed to delete expense payment", description: "Something went wrong.", variant: "error" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-4 space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={() => router.push("/diredawa/accounting/expense-payments/create")}>Create Expense Payment</Button>
        <h1 className="text-2xl font-bold text-center flex-1">Expense Payments</h1>
      </div>

      {loading ? (
        <p>Loading expense payments...</p>
      ) : (
        <>
          <div className="flex justify-end">
            <TableSearch value={search} onChange={setSearch} placeholder="Search expense no, payee, category..." />
          </div>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="text-left px-4 py-2">Expense No.</th>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Payee</th>
                  <th className="text-left px-4 py-2">Category</th>
                  <th className="text-right px-4 py-2">Amount</th>
                  <th className="text-left px-4 py-2">Status</th>
                  {(auth?.isAdmin || auth?.isAccounting) && <th className="text-right px-4 py-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={(auth?.isAdmin || auth?.isAccounting) ? 7 : 6} className="px-4 py-4 text-center text-sm text-muted-foreground">
                      No expense payments found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((x) => (
                    <tr key={x.id} className="border-t">
                      <td className="px-4 py-2">
                        <button type="button" className="text-blue-600 hover:underline" onClick={() => router.push(`/diredawa/accounting/expense-payments/${x.expense_number}`)}>
                          {x.expense_number}
                        </button>
                      </td>
                      <td className="px-4 py-2">{new Date(x.expense_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{x.payee}</td>
                      <td className="px-4 py-2">{x.category}</td>
                      <td className="px-4 py-2 text-right">{Number(x.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2 capitalize">{x.status}</td>
                      {(auth?.isAdmin || auth?.isAccounting) && (
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/diredawa/accounting/expense-payments/${x.expense_number}/edit`)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(x.expense_number)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

