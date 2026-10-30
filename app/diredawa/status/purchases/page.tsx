"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useAuth } from "@/components/authProvider";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Purchase {
  id: string;
  purchase_number: string;
  status: string;
}

interface PurchaseDetailItem {
  item_name: string;
  price: number;
  quantity: number;
  remaining: number;
  total_price: number;
  before_vat?: number;
  hscode?: string | null;
  measurement: string;
}

interface PurchaseDetail {
  id: string;
  purchase_number: string;
  order_date: string;
  buyer: string;
  buyer_address?: string | null;
  proforma_ref_no: string;
  status?: string | null;
  approved_by?: string | null;
  approval_date?: string | null;
  completed_by?: string | null;
  completed_date?: string | null;
  cancelled_by?: string | null;
  cancelled_date?: string | null;
  status_remark?: string | null;
  shipper?: string | null;
  port_of_loading?: string | null;
  port_of_discharge?: string | null;
  mode_of_transport?: string | null;
  payment_type?: string | null;
  payment_terms?: string | null;
  shipment_type?: string | null;
  country_of_origin?: string | null;
  final_destination?: string | null;
  before_vat?: number;
  total_quantity?: number;
  remaining?: number;
  items: PurchaseDetailItem[];
}

const PURCHASES_API_URL = "/api/purchases";

export default function PurchaseStatusPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    if (auth && !auth.isAdmin) {
      router.replace("/");
    }
  }, [auth, router]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPurchaseNumber, setPopupPurchaseNumber] = useState<string | null>(null);
  const [popupAction, setPopupAction] = useState<"completed" | "cancelled">("completed");
  const [remarking, setRemarking] = useState(false);
  const [remark, setRemark] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<PurchaseDetail | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(PURCHASES_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          const detail = (data as any)?.detail;
          const message =
            Array.isArray(detail)
              ? detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(", ")
              : typeof detail === "string"
              ? detail
              : (data as any)?.message;
          showToast({
            title: "Failed to load purchases",
            description: message || "Please try again.",
            variant: "error",
          });
          return;
        }
        const approved = (data as any[]).filter(
          (p) => (p as any).status === "approved"
        );
        setPurchases(
          approved.map((p) => ({
            id: p.id,
            purchase_number: p.purchase_number,
            status: p.status,
          }))
        );
      } catch {
        showToast({
          title: "Failed to load purchases",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [showToast]);

  const openRemarkPopup = (
    purchaseNumber: string,
    action: "completed" | "cancelled"
  ) => {
    if (!auth?.userId) {
      showToast({
        title: "Login required",
        description: "Your account could not be loaded. Please refresh the page or log in again.",
        variant: "error",
      });
      return;
    }
    setPopupPurchaseNumber(purchaseNumber);
    setPopupAction(action);
    setRemark("");
    setPopupOpen(true);
  };

  const openDetails = async (purchaseNumber: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(purchaseNumber)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to load purchase details",
          description:
            (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        setDetailOpen(false);
        return;
      }
      setDetail(data as PurchaseDetail);
    } catch {
      showToast({
        title: "Failed to load purchase details",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDetailDate = (value?: string | null) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDetailDateTime = (value?: string | null) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmitRemark = async () => {
    if (!popupPurchaseNumber) return;
    try {
      setRemarking(true);
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(popupPurchaseNumber)}/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: popupAction,
            user_id: auth?.userId ?? null,
            remark: remark || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const detail = (data as any)?.detail;
        showToast({
          title: "Failed to update status",
          description: detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      setPurchases((prev) =>
        prev.filter((p) => p.purchase_number !== popupPurchaseNumber)
      );
      showToast({
        title: `Purchase ${popupAction}`,
        description: `Purchase ${popupPurchaseNumber} has been marked as ${popupAction}.`,
        variant: "success",
      });
      setPopupOpen(false);
      setPopupPurchaseNumber(null);
    } catch {
      showToast({
        title: "Failed to update status",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setRemarking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Update Purchase Status</h1>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Approved By:</Label>
          <Input
            value={auth?.username ?? ""}
            disabled
            readOnly
            className="border rounded-md px-3 py-1.5 text-sm w-48 bg-muted"
          />
        </div>
      </div>

      <div className="border rounded-md overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2 text-left">No.</th>
              <th className="px-4 py-2 text-left">Select</th>
              <th className="px-4 py-2 text-left">Purchase ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm">
                  Loading approved purchases...
                </td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm">
                  No approved purchases.
                </td>
              </tr>
            ) : (
              purchases.map((purchase, idx) => (
                <tr key={purchase.id} className="border-t">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => openDetails(purchase.purchase_number)}
                      className="text-blue-600 hover:underline"
                      title="View purchase details"
                    >
                      {purchase.purchase_number}
                    </button>
                  </td>
                  <td className="px-4 py-2 capitalize">{purchase.status}</td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/diredawa/purchase/${purchase.purchase_number}`)
                      }
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      style={{ backgroundColor: "#16a34a", color: "white" }}
                      className="hover:opacity-90"
                      onClick={() => openRemarkPopup(purchase.purchase_number, "completed")}
                    >
                      Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        openRemarkPopup(purchase.purchase_number, "cancelled")
                      }
                    >
                      Cancelled
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Purchase {detail?.purchase_number ?? ""}
              {detail?.status && (
                <span className="ml-2 text-sm font-normal capitalize text-muted-foreground">
                  ({detail.status})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading purchase details...
            </p>
          ) : !detail ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Purchase details are not available.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Order Date</p>
                  <p>{formatDetailDate(detail.order_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Buyer</p>
                  <p>{detail.buyer || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Supplier</p>
                  <p>{detail.shipper || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Proforma Ref. No.</p>
                  <p>{detail.proforma_ref_no || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Port of Loading</p>
                  <p>{detail.port_of_loading || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Port of Discharge</p>
                  <p>{detail.port_of_discharge || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Mode of Transport</p>
                  <p>{detail.mode_of_transport || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Payment Type</p>
                  <p>{detail.payment_type || detail.payment_terms || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Shipment Type</p>
                  <p>{detail.shipment_type || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Country of Origin</p>
                  <p>{detail.country_of_origin || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Final Destination</p>
                  <p>{detail.final_destination || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Before VAT</p>
                  <p>
                    {Number(detail.before_vat ?? 0).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-2 py-2 text-left">No.</th>
                      <th className="px-2 py-2 text-left">Item</th>
                      <th className="px-2 py-2 text-left">HS Code</th>
                      <th className="px-2 py-2 text-right">Price</th>
                      <th className="px-2 py-2 text-right">Quantity</th>
                      <th className="px-2 py-2 text-right">Remaining</th>
                      <th className="px-2 py-2 text-left">Unit</th>
                      <th className="px-2 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.items ?? []).map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-2 py-2">{idx + 1}</td>
                        <td className="px-2 py-2">{item.item_name}</td>
                        <td className="px-2 py-2 font-mono">{item.hscode || "—"}</td>
                        <td className="px-2 py-2 text-right">
                          {Number(item.price ?? 0).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {Number(item.quantity ?? 0).toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {Number(item.remaining ?? 0).toLocaleString()}
                        </td>
                        <td className="px-2 py-2">{item.measurement || "—"}</td>
                        <td className="px-2 py-2 text-right">
                          {Number(item.total_price ?? 0).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                    {(detail.items ?? []).length === 0 && (
                      <tr>
                        <td className="px-2 py-3 text-center text-muted-foreground" colSpan={8}>
                          No items on this purchase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td className="px-2 py-2 text-right" colSpan={7}>
                        Total
                      </td>
                      <td className="px-2 py-2 text-right">
                        {Number(detail.before_vat ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="rounded-md border p-3 space-y-1 text-xs">
                <p className="font-semibold">Approval &amp; status</p>
                <p>
                  <span className="text-muted-foreground">Status: </span>
                  <span className="capitalize">{detail.status || "pending"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Approved by: </span>
                  {detail.approved_by || "—"}
                  {detail.approval_date
                    ? ` on ${formatDetailDateTime(detail.approval_date)}`
                    : ""}
                </p>
                {detail.completed_by && (
                  <p>
                    <span className="text-muted-foreground">Completed by: </span>
                    {detail.completed_by}
                    {detail.completed_date
                      ? ` on ${formatDetailDateTime(detail.completed_date)}`
                      : ""}
                  </p>
                )}
                {detail.cancelled_by && (
                  <p>
                    <span className="text-muted-foreground">Cancelled by: </span>
                    {detail.cancelled_by}
                    {detail.cancelled_date
                      ? ` on ${formatDetailDateTime(detail.cancelled_date)}`
                      : ""}
                  </p>
                )}
                {detail.status_remark && (
                  <p>
                    <span className="text-muted-foreground">Remark: </span>
                    {detail.status_remark}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
            {detail && (
              <>
                <Button
                  style={{ backgroundColor: "#16a34a", color: "white" }}
                  className="hover:opacity-90"
                  onClick={() => {
                    setDetailOpen(false);
                    openRemarkPopup(detail.purchase_number, "completed");
                  }}
                >
                  Mark Completed
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailOpen(false);
                    openRemarkPopup(detail.purchase_number, "cancelled");
                  }}
                >
                  Mark Cancelled
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {popupAction === "completed" ? "Mark as Completed" : "Mark as Cancelled"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="remark">Remark</Label>
              <Input
                id="remark"
                placeholder="Remark (optional)"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPopupOpen(false)}
              disabled={remarking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRemark}
              disabled={remarking}
              style={
                popupAction === "completed"
                  ? { backgroundColor: "#16a34a", color: "white" }
                  : undefined
              }
              className={popupAction === "completed" ? "hover:opacity-90" : ""}
            >
              {remarking ? "Updating..." : popupAction === "completed" ? "Complete" : "Cancel Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
