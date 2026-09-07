"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import {
  WSN_API_URL,
  formatDate,
  money,
  type WarehouseItemInventory,
} from "@/lib/warehouse";

export default function WarehouseItemInventoryPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [items, setItems] = useState<WarehouseItemInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [searchCode, setSearchCode] = useState("");

  const load = async (nameFilter?: string, codeFilter?: string) => {
    try {
      const params = new URLSearchParams();
      const name = nameFilter ?? searchName;
      const code = codeFilter ?? searchCode;
      if (name.trim()) params.set("item_name", name.trim());
      if (code.trim()) params.set("code", code.trim());

      const url = `/api/inventory/warehouse-item-inventory${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to load inventory",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      setItems(data as WarehouseItemInventory[]);
    } catch {
      showToast({
        title: "Failed to load inventory",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    load();
  };

  const handleClear = () => {
    setSearchName("");
    setSearchCode("");
    setLoading(true);
    load("", "");
  };

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/inventory")}
        >
          Back to Inventory
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">Warehouse Item Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View inventory of each item across all storage notes
          </p>
        </div>
        <div className="w-[150px]" />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="border rounded-md bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="item_name">Item Name</Label>
            <Input
              id="item_name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search by item name..."
            />
          </div>
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Search by code..."
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="p-10 text-center">Loading...</div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">
          No items found.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="border rounded-md overflow-hidden bg-white">
              <div className="px-4 py-3 bg-muted/60 border-b flex items-center justify-between">
                <div>
                  <span className="font-semibold">{item.item_name}</span>
                  {item.code && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({item.code})
                    </span>
                  )}
                  {item.internal_code && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      [{item.internal_code}]
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <span>
                    Stored: <strong>{item.total_stored}</strong>
                  </span>
                  <span>
                    Released: <strong className="text-orange-600">{item.total_released}</strong>
                  </span>
                  <span>
                    Remaining: <strong className="text-green-600">{item.remaining}</strong>
                  </span>
                </div>
              </div>
              {item.storage_notes.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-2 text-left">WSN No</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-left">Contract Date</th>
                      <th className="px-4 py-2 text-right">Total Qty</th>
                      <th className="px-4 py-2 text-right">Entered</th>
                      <th className="px-4 py-2 text-right">Released</th>
                      <th className="px-4 py-2 text-right">Remaining</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.storage_notes.map((ns, nsIdx) => (
                      <tr key={nsIdx} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono text-xs">{ns.wsn_no}</td>
                        <td className="px-4 py-2">{ns.customer_name}</td>
                        <td className="px-4 py-2">{formatDate(ns.contract_date)}</td>
                        <td className="px-4 py-2 text-right">{ns.total_quantity}</td>
                        <td className="px-4 py-2 text-right">{ns.entered_quantity}</td>
                        <td className="px-4 py-2 text-right text-orange-600">{ns.released_quantity}</td>
                        <td className="px-4 py-2 text-right text-green-600">{ns.remaining_quantity}</td>
                        <td className="px-4 py-2 text-center">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/diredawa/inventory/warehouse-storage-notes/${ns.wsn_no}`
                              )
                            }
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
