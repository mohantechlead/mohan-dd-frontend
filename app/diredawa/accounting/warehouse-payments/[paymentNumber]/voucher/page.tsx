"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import { amountInWords } from "@/lib/utils";
import {
  WSP_API_URL,
  money,
  formatDate,
  type WarehouseStoragePayment,
} from "@/lib/warehouse";

function beingDescription(p: WarehouseStoragePayment): string {
  const type = p.payment_type === "full" ? "Full" : "Partial";
  const installment = p.installment_number ? ` (Installment ${p.installment_number})` : "";
  return `Warehouse storage fee payment for WSN ${p.wsn_no} — ${type} payment${installment}`;
}

function formatAmount(n: number): string {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function WarehousePaymentInvoicePage() {
  const params = useParams<{ paymentNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const paymentNumber = params.paymentNumber;
  const [payment, setPayment] = useState<WarehouseStoragePayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!paymentNumber) return;
      try {
        const res = await fetch(
          `${WSP_API_URL}/${encodeURIComponent(paymentNumber)}`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (!res.ok) {
          showToast({
            title: "Failed to load payment",
            description: formatApiErrorMessage(data),
            variant: "error",
          });
          return;
        }
        setPayment(data as WarehouseStoragePayment);
      } catch {
        showToast({
          title: "Failed to load payment",
          description: "Something went wrong.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentNumber]);

  const currency = payment?.currency || "ETB";

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #voucher-print-content, #voucher-print-content * { visibility: visible; }
          #voucher-print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
          }
          #voucher-print-content > :first-child { margin-top: 0 !important; }
        }
      `}</style>
      <div className="flex items-center justify-between print:hidden mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/accounting/warehouse-payments/display")}
        >
          Back to Payments
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading...</p>
      ) : !payment ? (
        <p className="text-center text-sm text-muted-foreground">Payment not found.</p>
      ) : (
        <div
          id="voucher-print-content"
          className="bg-white border rounded-md p-8 space-y-6 text-black"
        >
          {/* Company header */}
          <div className="text-center space-y-1">
            {/* Plain img: next/image lazy-loading can drop the logo from print output. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mohan PLC logo"
              width={80}
              height={80}
              className="mx-auto mb-2"
            />
            <h1 className="text-2xl font-bold tracking-wide">
              MOHAN Private Limited Company
            </h1>
            <p className="text-xs font-semibold">
              Dire Dawa Free Trade Zone Branch
            </p>
            <p className="text-xs">
              TEL: +251 11 662 03 29, 439 04 71 · Fax: +251 11 662 03 26
            </p>
            <p className="text-xs">1873 - Addis Ababa, Ethiopia</p>
          </div>

          {/* Invoice title + meta */}
          <div className="flex items-end justify-between border-b-2 border-black pb-2">
            <h2 className="text-lg font-bold tracking-widest uppercase">
              Payment Invoice
            </h2>
            <div className="text-xs space-y-1 text-right">
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {formatDate(payment.payment_date)}
              </p>
              <p>
                <span className="font-semibold">Invoice No:</span>{" "}
                <span className="font-mono">{payment.payment_number}</span>
              </p>
            </div>
          </div>

          {/* Pay to */}
          <div className="text-sm space-y-1">
            <p className="border-b border-gray-400 pb-1">
              <span className="font-semibold">Pay to:</span>{" "}
              <span className="font-medium">{payment.customer_name}</span>
            </p>
            <p className="text-xs text-gray-600">
              Against storage note: <span className="font-mono">{payment.wsn_no}</span>
            </p>
          </div>

          {/* Amount in words */}
          <div className="text-sm border-b border-gray-400 pb-2">
            <span className="font-semibold">The sum of {currency}:</span>{" "}
            <span className="italic">{amountInWords(payment.amount)} Only</span>
          </div>

          {/* Amount box */}
          <div className="flex justify-end">
            <table className="border-2 border-black text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="px-6 py-1 font-semibold">Currency</th>
                  <th className="px-6 py-1 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-6 py-2 text-center font-medium">{currency}</td>
                  <td className="px-6 py-2 text-right font-mono font-semibold">
                    {formatAmount(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Being */}
          <div className="text-sm space-y-1">
            <p className="border-b border-gray-400 pb-1">
              <span className="font-semibold">Being:</span> {beingDescription(payment)}
            </p>
            {payment.remark?.trim() && (
              <p className="text-xs text-gray-600">Remark: {payment.remark}</p>
            )}
            {payment.reference_number?.trim() && (
              <p className="text-xs text-gray-600">
                Reference No:{" "}
                <span className="font-mono">{payment.reference_number}</span>
              </p>
            )}
          </div>

          {/* Summary line */}
          <div className="text-xs text-gray-600 border-t border-gray-300 pt-2 grid grid-cols-3 gap-4">
            <p>
              <span className="font-semibold text-black">Storage Price:</span>{" "}
              {money(payment.storage_price, payment.currency)}
            </p>
            <p>
              <span className="font-semibold text-black">Total Paid:</span>{" "}
              {money(payment.total_paid, payment.currency)}
            </p>
            <p>
              <span className="font-semibold text-black">Remaining:</span>{" "}
              {money(payment.remaining_amount, payment.currency)}
            </p>
          </div>

          {/* Account No */}
          <div className="flex justify-end">
            <table className="border border-black text-xs">
              <tbody>
                <tr>
                  <td className="border-r border-black px-4 py-2 font-semibold">
                    Account No.
                  </td>
                  <td className="px-8 py-2 font-mono">&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature block */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-xs">
            {["Authorized by", "Paid by", "Received by"].map((label) => (
              <div key={label} className="space-y-1">
                <div className="border-b border-black h-8" />
                <p className="font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
