"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface OverUnderItem {
  item_name: string;
  invoiced: number;
  delivered: number;
  variance: number;
}

interface OverUnderNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dnNo: string;
  overItems: OverUnderItem[];
  underItems: OverUnderItem[];
}

export function OverUnderNotification({
  open,
  onOpenChange,
  dnNo,
  overItems,
  underItems,
}: OverUnderNotificationProps) {
  const hasOver = overItems.length > 0;
  const hasUnder = underItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            Over / Under Delivery Notification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-base font-medium">
            Delivery Note <span className="font-bold text-primary">{dnNo}</span> has quantity variances compared to the invoice:
          </p>

          {hasOver && (
            <div className="rounded-lg border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5" />
                Over Delivery
              </h3>
              <ul className="space-y-2">
                {overItems.map((it, idx) => (
                  <li key={idx} className="text-sm font-medium">
                    <span className="text-amber-900 dark:text-amber-100">{it.item_name}</span>
                    <span className="text-amber-700 dark:text-amber-300 ml-2">
                      — Invoiced: {it.invoiced}, Delivered: {it.delivered} (over by {it.variance})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasUnder && (
            <div className="rounded-lg border-2 border-red-500/50 bg-red-50 dark:bg-red-950/20 p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5" />
                Under Delivery
              </h3>
              <ul className="space-y-2">
                {underItems.map((it, idx) => (
                  <li key={idx} className="text-sm font-medium">
                    <span className="text-red-900 dark:text-red-100">{it.item_name}</span>
                    <span className="text-red-700 dark:text-red-300 ml-2">
                      — Invoiced: {it.invoiced}, Delivered: {it.delivered} (short by {it.variance})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Acknowledge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
