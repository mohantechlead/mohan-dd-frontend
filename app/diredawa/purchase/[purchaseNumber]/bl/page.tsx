"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Boxes,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Route,
  Ship,
} from "lucide-react";

const AisVesselMap = dynamic(() => import("@/components/ais-vessel-map"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-md border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
});

interface BLContainer {
  id?: string;
  container_number: string;
  size: string;
  cargo_type: string;
}

interface TrackingEvent {
  activity?: string | null;
  location?: string | null;
  terminal?: string | null;
  country?: string | null;
  country_code?: string | null;
  vessel?: string | null;
  voyage?: string | null;
  time?: string | null;
  kind?: string | null;
}

interface TrackingContainerDetail {
  container_number?: string | null;
  size?: string | null;
  type?: string | null;
  eta?: string | null;
  vessel?: string | null;
  voyage?: string | null;
  latest_event?: TrackingEvent | null;
  events?: TrackingEvent[];
}

interface TrackingDetails {
  origin?: string | null;
  destination?: string | null;
  eta?: string | null;
  vessel_name?: string | null;
  vessel_voyage?: string | null;
  last_event?: string | null;
  last_updated?: string | null;
  events?: TrackingEvent[];
  containers?: TrackingContainerDetail[];
  source?: string | null;
}

interface BillOfLading {
  id: string;
  bl_number: string;
  bl_date: string;
  declaration_number?: string | null;
  declaration_date?: string | null;
  customs_value?: number | null;
  duty_value?: number | null;
  container_count: number;
  shipping_company_name?: string | null;
  shipping_company_url?: string | null;
  transit_status: string;
  transit_status_label?: string | null;
  tracking_url?: string | null;
  status_detail?: string | null;
  status_checked_at?: string | null;
  vessel_name?: string | null;
  vessel_imo?: string | null;
  vessel_mmsi?: string | null;
  ais_lat?: number | null;
  ais_lng?: number | null;
  ais_sog?: number | null;
  ais_course?: number | null;
  ais_nav_status?: string | null;
  ais_last_seen_at?: string | null;
  tracking_details?: TrackingDetails | null;
  origin?: string | null;
  destination?: string | null;
  eta?: string | null;
  last_event?: string | null;
  vessel_voyage?: string | null;
  last_updated?: string | null;
  events?: TrackingEvent[];
  containers: BLContainer[];
}

interface PurchaseBrief {
  id: string;
  purchase_number: string;
  shipper?: string | null;
  buyer?: string | null;
  status?: string | null;
}

const BL_TRANSIT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_transit", label: "In Transit" },
  { value: "at_transhipment", label: "At Transhipment" },
  { value: "at_destination", label: "At Destination Port" },
  { value: "arrived", label: "Arrived" },
  { value: "delivered", label: "Delivered" },
];

const BL_CONTAINER_SIZES = [
  { value: "20", label: "20 ft" },
  { value: "40", label: "40 ft" },
];

const BL_CARGO_TYPES = [
  { value: "hazardous", label: "Hazardous" },
  { value: "non_hazardous", label: "Non-Hazardous" },
];

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

const formatTrackingTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  // Carrier feeds often carry day precision only (00:00 UTC). Show the date
  // instead of inventing a time in the viewer's timezone.
  if (/T00:00:00(?:\.\d+)?Z?$/.test(value)) {
    return parsed.toLocaleDateString();
  }
  return parsed.toLocaleString();
};

const formatEventPlace = (event: TrackingEvent) =>
  [event.location, event.terminal, event.country].filter(Boolean).join(", ");

/** Merge the API's flat detail fields with the raw tracking_details JSON. */
function getTrackingDetails(bl: BillOfLading): TrackingDetails {
  const raw = bl.tracking_details ?? {};
  return {
    origin: raw.origin ?? bl.origin ?? null,
    destination: raw.destination ?? bl.destination ?? null,
    eta: raw.eta ?? bl.eta ?? null,
    vessel_name: raw.vessel_name ?? bl.vessel_name ?? null,
    vessel_voyage: raw.vessel_voyage ?? bl.vessel_voyage ?? null,
    last_event: raw.last_event ?? bl.last_event ?? null,
    last_updated: raw.last_updated ?? bl.last_updated ?? null,
    events: raw.events ?? bl.events ?? [],
    containers: raw.containers ?? [],
    source: raw.source ?? null,
  };
}

export default function PurchaseBlPage() {
  const params = useParams<{ purchaseNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();
  const purchaseNumber = params.purchaseNumber;

  const canManageBl =
    auth?.isAdmin === true ||
    auth?.isLogistics === true ||
    auth?.isSales === true ||
    auth?.isTransitor === true;

  const [purchase, setPurchase] = useState<PurchaseBrief | null>(null);
  const [loadingPurchase, setLoadingPurchase] = useState(true);
  const [blLoading, setBlLoading] = useState(true);
  const [blSaving, setBlSaving] = useState(false);
  const [blExisting, setBlExisting] = useState<BillOfLading | null>(null);

  const [blNumber, setBlNumber] = useState("");
  const [blDate, setBlDate] = useState("");
  const [blDeclarationNumber, setBlDeclarationNumber] = useState("");
  const [blDeclarationDate, setBlDeclarationDate] = useState("");
  const [blCustomsValue, setBlCustomsValue] = useState("");
  const [blDutyValue, setBlDutyValue] = useState("");
  const [blContainerCount, setBlContainerCount] = useState(0);
  const [blShippingCompany, setBlShippingCompany] = useState("");
  const [blShippingUrl, setBlShippingUrl] = useState("");
  const [blVesselName, setBlVesselName] = useState("");
  const [blVesselImo, setBlVesselImo] = useState("");
  const [blVesselMmsi, setBlVesselMmsi] = useState("");
  const [blContainers, setBlContainers] = useState<BLContainer[]>([]);
  const [blTransitStatus, setBlTransitStatus] = useState("pending");
  const [blStatusDetail, setBlStatusDetail] = useState("");
  const [blSavingStatus, setBlSavingStatus] = useState(false);
  const [blCheckingStatus, setBlCheckingStatus] = useState(false);

  const loadBlIntoForm = (bl: BillOfLading) => {
    setBlExisting(bl);
    setBlNumber(bl.bl_number ?? "");
    setBlDate((bl.bl_date ?? "").slice(0, 10));
    setBlDeclarationNumber(bl.declaration_number ?? "");
    setBlDeclarationDate((bl.declaration_date ?? "").slice(0, 10));
    setBlCustomsValue(
      bl.customs_value !== null && bl.customs_value !== undefined
        ? String(bl.customs_value)
        : ""
    );
    setBlDutyValue(
      bl.duty_value !== null && bl.duty_value !== undefined
        ? String(bl.duty_value)
        : ""
    );
    setBlContainerCount(bl.container_count ?? 0);
    setBlShippingCompany(bl.shipping_company_name ?? "");
    setBlShippingUrl(bl.shipping_company_url ?? "");
    setBlVesselName(bl.vessel_name ?? "");
    setBlVesselImo(bl.vessel_imo ?? "");
    setBlVesselMmsi(bl.vessel_mmsi ?? "");
    setBlContainers(
      (bl.containers ?? []).map((c) => ({
        id: c.id,
        container_number: c.container_number ?? "",
        size: c.size ?? "40",
        cargo_type: c.cargo_type ?? "non_hazardous",
      }))
    );
    setBlTransitStatus(bl.transit_status ?? "pending");
    setBlStatusDetail(bl.status_detail ?? "");
  };

  const resetForm = () => {
    setBlExisting(null);
    setBlNumber("");
    setBlDate("");
    setBlDeclarationNumber("");
    setBlDeclarationDate("");
    setBlCustomsValue("");
    setBlDutyValue("");
    setBlContainerCount(0);
    setBlShippingCompany("");
    setBlShippingUrl("");
    setBlVesselName("");
    setBlVesselImo("");
    setBlVesselMmsi("");
    setBlContainers([]);
    setBlTransitStatus("pending");
    setBlStatusDetail("");
  };

  const loadBl = useCallback(async () => {
    setBlLoading(true);
    try {
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(purchaseNumber)}/bl`,
        { credentials: "include" }
      );
      if (res.status === 404) {
        resetForm();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Could not load existing BL",
          description:
            (data as { detail?: string })?.detail ||
            "If a BL already exists, save will switch to update mode.",
          variant: "error",
        });
        return;
      }
      loadBlIntoForm(data as BillOfLading);
    } catch {
      showToast({
        title: "Could not load existing BL",
        description:
          "If a BL already exists, save will switch to update mode automatically.",
        variant: "error",
      });
    } finally {
      setBlLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseNumber]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/purchases/${encodeURIComponent(purchaseNumber)}`,
          { credentials: "include" }
        );
        if (cancelled) return;
        if (res.ok) {
          setPurchase((await res.json()) as PurchaseBrief);
        }
      } catch {
        // still allow BL form without purchase header
      } finally {
        if (!cancelled) setLoadingPurchase(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [purchaseNumber]);

  useEffect(() => {
    loadBl();
  }, [loadBl]);

  const setBlContainerField = (
    index: number,
    field: keyof BLContainer,
    value: string
  ) => {
    setBlContainers((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleBlContainerCountChange = (raw: string) => {
    const n = Math.max(0, Math.min(99, Number(raw) || 0));
    setBlContainerCount(n);
    setBlContainers((prev) => {
      if (n < prev.length) return prev.slice(0, n);
      const next = [...prev];
      while (next.length < n) {
        next.push({ container_number: "", size: "40", cargo_type: "non_hazardous" });
      }
      return next;
    });
  };

  const saveBl = async () => {
    if (!blNumber.trim() || !blDate) {
      showToast({
        title: "BL number and date are required",
        variant: "error",
      });
      return;
    }
    setBlSaving(true);
    try {
      const body = {
        bl_number: blNumber.trim(),
        bl_date: blDate,
        declaration_number: blDeclarationNumber.trim() || null,
        declaration_date: blDeclarationDate || null,
        customs_value: blCustomsValue.trim() ? Number(blCustomsValue) : null,
        duty_value: blDutyValue.trim() ? Number(blDutyValue) : null,
        container_count: blContainerCount,
        shipping_company_name: blShippingCompany.trim() || null,
        shipping_company_url: blShippingUrl.trim() || null,
        vessel_name: blVesselName.trim() || null,
        vessel_imo: blVesselImo.trim() || null,
        vessel_mmsi: blVesselMmsi.trim() || null,
        containers: blContainers.map((c) => ({
          container_number: c.container_number.trim(),
          size: c.size,
          cargo_type: c.cargo_type,
        })),
      };
      let method = blExisting ? "PUT" : "POST";
      let res = await fetch(
        `/api/purchases/${encodeURIComponent(purchaseNumber)}/bl`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      let data = await res.json();

      if (
        !res.ok &&
        !blExisting &&
        (data as { detail?: string })?.detail?.toLowerCase().includes("already exists")
      ) {
        const loadRes = await fetch(
          `/api/purchases/${encodeURIComponent(purchaseNumber)}/bl`,
          { credentials: "include" }
        );
        if (loadRes.ok) {
          const existing = (await loadRes.json()) as BillOfLading;
          loadBlIntoForm(existing);
          method = "PUT";
          res = await fetch(
            `/api/purchases/${encodeURIComponent(purchaseNumber)}/bl`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(body),
            }
          );
          data = await res.json();
        }
      }

      if (!res.ok) {
        showToast({
          title: method === "PUT" ? "Failed to update BL" : "Failed to save BL",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      setBlExisting(data as BillOfLading);
      showToast({ title: "Bill of lading saved", variant: "success" });
    } catch {
      showToast({
        title: "Failed to save BL",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setBlSaving(false);
    }
  };

  const saveBlStatus = async () => {
    if (!blExisting) return;
    setBlSavingStatus(true);
    try {
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(purchaseNumber)}/bl/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            transit_status: blTransitStatus,
            status_detail: blStatusDetail.trim() || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to update transit status",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      setBlExisting(data as BillOfLading);
      setBlTransitStatus((data as BillOfLading).transit_status ?? "pending");
      setBlStatusDetail((data as BillOfLading).status_detail ?? "");
      showToast({ title: "Transit status updated", variant: "success" });
    } catch {
      showToast({
        title: "Failed to update transit status",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setBlSavingStatus(false);
    }
  };

  const checkBlStatusAuto = async () => {
    if (!blExisting) return;
    setBlCheckingStatus(true);
    try {
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(purchaseNumber)}/bl/check-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to check status",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      const result = data as BillOfLading & {
        scrape_source?: string | null;
        scrape_error?: string | null;
      };
      setBlExisting((prev) =>
        prev
          ? {
              ...prev,
              transit_status: result.transit_status,
              transit_status_label: result.transit_status_label,
              status_detail: result.status_detail,
              status_checked_at: result.status_checked_at,
              tracking_url: result.tracking_url ?? prev.tracking_url,
              vessel_name: result.vessel_name ?? null,
              vessel_imo: result.vessel_imo ?? null,
              vessel_mmsi: result.vessel_mmsi ?? null,
              ais_lat: result.ais_lat ?? null,
              ais_lng: result.ais_lng ?? null,
              ais_sog: result.ais_sog ?? null,
              ais_course: result.ais_course ?? null,
              ais_nav_status: result.ais_nav_status ?? null,
              ais_last_seen_at: result.ais_last_seen_at ?? null,
              tracking_details: result.tracking_details,
              origin: result.origin ?? null,
              destination: result.destination ?? null,
              eta: result.eta ?? null,
              last_event: result.last_event ?? null,
              vessel_voyage: result.vessel_voyage ?? null,
              last_updated: result.last_updated ?? null,
              events: result.events ?? [],
            }
          : prev
      );
      setBlTransitStatus(result.transit_status ?? "pending");
      setBlStatusDetail(result.status_detail ?? "");
      setBlVesselName(result.vessel_name ?? "");
      setBlVesselMmsi(result.vessel_mmsi ?? "");
      if (result.scrape_error) {
        const hasDetails = Boolean(
          result.tracking_details &&
            Object.keys(result.tracking_details).length > 0
        );
        showToast({
          title: hasDetails
            ? "Carrier details loaded — status needs review"
            : "Could not read status automatically",
          description: result.scrape_error,
          variant: hasDetails ? "success" : "error",
        });
      } else {
        const sourceLabel =
          result.scrape_source === "msc-api"
            ? "Read from MSC tracking API."
            : result.scrape_source === "maersk-api"
              ? "Read from Maersk tracking API."
              : result.scrape_source === "embedded-json"
                ? "Read from page data."
                : result.scrape_source === "browser"
                  ? "Read from the carrier tracking page in a browser."
                  : "Read from tracking page.";
        showToast({
          title: `Status updated: ${result.transit_status_label ?? result.transit_status}`,
          description: sourceLabel,
          variant: "success",
        });
      }
    } catch {
      showToast({
        title: "Failed to check status",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setBlCheckingStatus(false);
    }
  };

  const hasAisPosition =
    blExisting?.ais_lat != null && blExisting?.ais_lng != null;

  const tracking = blExisting ? getTrackingDetails(blExisting) : null;
  const trackingEvents = tracking?.events ?? [];
  const trackingContainers = tracking?.containers ?? [];
  const hasTrackingDetails = Boolean(
    tracking &&
      (tracking.origin ||
        tracking.destination ||
        tracking.eta ||
        tracking.last_event ||
        tracking.vessel_name ||
        trackingEvents.length > 0 ||
        trackingContainers.length > 0)
  );

  return (
    <div className="max-w-3xl mx-auto mt-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/diredawa/purchase/display")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Purchases
        </Button>
        <h1 className="text-xl font-bold text-center flex-1">
          Bill of Lading — {purchaseNumber}
        </h1>
        <div className="w-20" />
      </div>

      {loadingPurchase && (
        <p className="text-sm text-muted-foreground">Loading purchase...</p>
      )}
      {!loadingPurchase && purchase && (
        <p className="text-sm text-muted-foreground">
          {purchase.shipper?.trim() || purchase.buyer || ""}
          {purchase.status ? ` · ${purchase.status}` : ""}
        </p>
      )}

      {!canManageBl ? (
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              Your role does not have permission to manage bills of lading.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : blLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading BL...
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                {blExisting ? "Update BL" : "Create BL"}
              </CardTitle>
              <CardDescription>
                One BL per purchase. Save the vessel name so AIS can place the ship on the map.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">BL Number</label>
                  <input
                    type="text"
                    value={blNumber}
                    onChange={(e) => setBlNumber(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. MAEU1234567"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">BL Date</label>
                  <input
                    type="date"
                    value={blDate}
                    onChange={(e) => setBlDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">ECD / Declaration No.</label>
                  <input
                    type="text"
                    value={blDeclarationNumber}
                    onChange={(e) => setBlDeclarationNumber(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 8-000292"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Declaration Date</label>
                  <input
                    type="date"
                    value={blDeclarationDate}
                    onChange={(e) => setBlDeclarationDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Customs Value (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={blCustomsValue}
                    onChange={(e) => setBlCustomsValue(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 269280.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Duty Value</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={blDutyValue}
                    onChange={(e) => setBlDutyValue(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 11909376.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Number of Containers</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={blContainerCount}
                    onChange={(e) => handleBlContainerCountChange(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Shipping Company</label>
                  <input
                    type="text"
                    value={blShippingCompany}
                    onChange={(e) => setBlShippingCompany(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. MSC, Maersk"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">
                    Shipping Company Tracking URL
                  </label>
                  <input
                    type="url"
                    value={blShippingUrl}
                    onChange={(e) => setBlShippingUrl(e.target.value)}
                    className={inputClass}
                    placeholder="https://www.msc.com/en/track-a-shipment?bl={bl}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{bl}"} as a placeholder for the BL number.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-xs text-muted-foreground">Vessel Name</label>
                  <input
                    type="text"
                    value={blVesselName}
                    onChange={(e) => setBlVesselName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. MSC KALINA"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enough for AIS tracking — MMSI/IMO are optional.
                  </p>
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-xs text-muted-foreground">Vessel IMO (optional)</label>
                  <input
                    type="text"
                    value={blVesselImo}
                    onChange={(e) => setBlVesselImo(e.target.value)}
                    className={inputClass}
                    placeholder="IMO number"
                  />
                </div>
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-xs text-muted-foreground">Vessel MMSI (optional)</label>
                  <input
                    type="text"
                    value={blVesselMmsi}
                    onChange={(e) => setBlVesselMmsi(e.target.value)}
                    className={inputClass}
                    placeholder="9-digit MMSI (AIS)"
                  />
                </div>
              </div>

              {blContainers.length > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-semibold">Containers</p>
                  <div className="space-y-3">
                    {blContainers.map((c, i) => (
                      <div key={c.id ?? i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5 space-y-1">
                          <label className="text-xs text-muted-foreground">
                            Container Number
                          </label>
                          <input
                            type="text"
                            value={c.container_number}
                            onChange={(e) =>
                              setBlContainerField(i, "container_number", e.target.value)
                            }
                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                            placeholder="e.g. MSKU1234567"
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <label className="text-xs text-muted-foreground">Size</label>
                          <select
                            value={c.size}
                            onChange={(e) => setBlContainerField(i, "size", e.target.value)}
                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                          >
                            {BL_CONTAINER_SIZES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-4 space-y-1">
                          <label className="text-xs text-muted-foreground">
                            Cargo Type
                          </label>
                          <select
                            value={c.cargo_type}
                            onChange={(e) =>
                              setBlContainerField(i, "cargo_type", e.target.value)
                            }
                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                          >
                            {BL_CARGO_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={saveBl} disabled={blSaving}>
                  {blSaving ? "Saving..." : blExisting ? "Update BL" : "Save BL"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {blExisting && tracking && hasTrackingDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Shipment details
                </CardTitle>
                <CardDescription>
                  {tracking.source
                    ? `Live data from ${tracking.source}.`
                    : "Latest data read from the carrier tracking page."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(tracking.origin || tracking.destination) && (
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <div className="flex-1">
                      <p className="text-xs uppercase text-muted-foreground">Origin</p>
                      <p className="text-sm font-medium">{tracking.origin || "—"}</p>
                    </div>
                    <Ship className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 text-right">
                      <p className="text-xs uppercase text-muted-foreground">Destination</p>
                      <p className="text-sm font-medium">{tracking.destination || "—"}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Vessel / Voyage</p>
                    <p className="font-medium">
                      {tracking.vessel_name || "—"}
                      {tracking.vessel_voyage ? ` / ${tracking.vessel_voyage}` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">ETA</p>
                    <p className="font-medium">{formatTrackingTime(tracking.eta) || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase text-muted-foreground">Latest event</p>
                    <p className="font-medium">{tracking.last_event || "—"}</p>
                  </div>
                  {tracking.last_updated && (
                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase text-muted-foreground">Carrier updated</p>
                      <p>{formatTrackingTime(tracking.last_updated)}</p>
                    </div>
                  )}
                </div>

                {trackingEvents.length > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <Clock className="h-4 w-4" /> Event timeline
                    </p>
                    <ol className="space-y-2 border-l pl-3">
                      {[...trackingEvents].reverse().map((event, index) => (
                        <li
                          key={`${event.activity ?? "event"}-${event.time ?? index}-${index}`}
                          className="text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{event.activity || "Update"}</span>
                            {event.kind === "EXPECTED" && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                                Expected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {[
                              formatEventPlace(event),
                              event.vessel
                                ? `${event.vessel}${event.voyage ? ` / ${event.voyage}` : ""}`
                                : "",
                              formatTrackingTime(event.time) ?? "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {trackingContainers.length > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <Boxes className="h-4 w-4" /> Containers
                    </p>
                    <div className="space-y-2">
                      {trackingContainers.map((c, index) => (
                        <div
                          key={`${c.container_number ?? index}-${index}`}
                          className="rounded-md bg-muted/40 px-3 py-2 text-xs space-y-1"
                        >
                          <p className="font-semibold text-sm">
                            {c.container_number || "Container"}
                            {c.size || c.type
                              ? ` · ${[c.size, c.type].filter(Boolean).join(" ")}`
                              : ""}
                          </p>
                          {c.latest_event?.activity && (
                            <p>
                              {c.latest_event.activity}
                              {formatEventPlace(c.latest_event)
                                ? ` at ${formatEventPlace(c.latest_event)}`
                                : ""}
                              {c.latest_event.time
                                ? ` · ${formatTrackingTime(c.latest_event.time)}`
                                : ""}
                            </p>
                          )}
                          {c.eta && <p>ETA {formatTrackingTime(c.eta)}</p>}
                          {c.vessel && (
                            <p>
                              {c.vessel}
                              {c.voyage ? ` / ${c.voyage}` : ""}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {blExisting && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Transit &amp; vessel position
                </CardTitle>
                <CardDescription>
                  Manual status, automatic carrier check, and live AIS position when available.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={blTransitStatus}
                    onChange={(e) => setBlTransitStatus(e.target.value)}
                    className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    {BL_TRANSIT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={blStatusDetail}
                    onChange={(e) => setBlStatusDetail(e.target.value)}
                    className="flex h-9 flex-1 min-w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="Optional detail (e.g. vessel name, ETA)"
                  />
                  <Button size="sm" onClick={saveBlStatus} disabled={blSavingStatus}>
                    {blSavingStatus ? "Saving..." : "Update status"}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={checkBlStatusAuto}
                    disabled={blCheckingStatus}
                    title={
                      blExisting.shipping_company_url || blExisting.containers?.length
                        ? "Scrape the carrier tracking site/API and update status"
                        : "Set a shipping company tracking URL or container number first"
                    }
                  >
                    {blCheckingStatus ? "Checking..." : "Check status automatically"}
                  </Button>
                  {blCheckingStatus && (
                    <span className="text-xs text-muted-foreground">
                      Opening the carrier tracking page — this can take up to two minutes.
                    </span>
                  )}
                  {!blExisting.shipping_company_url && !blExisting.containers?.length && (
                    <span className="text-xs text-muted-foreground">
                      Add a tracking URL or container number to enable auto-check.
                    </span>
                  )}
                </div>

                {(blExisting.vessel_name || blExisting.vessel_imo || blExisting.vessel_mmsi) && (
                  <p className="text-sm text-muted-foreground">
                    Vessel: {blExisting.vessel_name || "—"}
                    {blExisting.vessel_imo ? ` · IMO ${blExisting.vessel_imo}` : ""}
                    {blExisting.vessel_mmsi ? ` · MMSI ${blExisting.vessel_mmsi}` : ""}
                  </p>
                )}

                {hasAisPosition && blExisting?.ais_lat != null && blExisting?.ais_lng != null && (
                  <div className="space-y-2">
                    <AisVesselMap
                      key={`${blExisting.ais_lat}-${blExisting.ais_lng}`}
                      lat={blExisting.ais_lat}
                      lng={blExisting.ais_lng}
                      vesselName={blExisting.vessel_name}
                      sog={blExisting.ais_sog}
                      course={blExisting.ais_course}
                      className="h-72 w-full rounded-md border overflow-hidden z-0"
                    />
                    <div className="rounded-md bg-muted/40 px-3 py-2 text-xs space-y-1">
                      <p className="font-semibold">AIS position</p>
                      <p>
                        {blExisting.ais_lat.toFixed(4)}°, {blExisting.ais_lng.toFixed(4)}°
                        {blExisting.ais_sog != null
                          ? ` · ${blExisting.ais_sog.toFixed(1)} kn`
                          : ""}
                        {blExisting.ais_course != null
                          ? ` · COG ${blExisting.ais_course.toFixed(0)}°`
                          : ""}
                      </p>
                      {blExisting.ais_nav_status && <p>Status: {blExisting.ais_nav_status}</p>}
                      {blExisting.ais_last_seen_at && (
                        <p>
                          Seen: {new Date(blExisting.ais_last_seen_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!hasAisPosition && (
                  <p className="text-xs text-muted-foreground">
                    No AIS position yet. Save the vessel name and run “Check status
                    automatically”. The ship must be within terrestrial AIS coverage
                    (Red Sea, Gulf of Aden, Indian Ocean, Mediterranean, East Asia);
                    an MMSI is only needed as a fallback.
                  </p>
                )}

                {blExisting.status_checked_at && (
                  <p className="text-xs text-muted-foreground">
                    Last checked: {new Date(blExisting.status_checked_at).toLocaleString()}
                  </p>
                )}

                {blExisting.tracking_url && (
                  <a
                    href={blExisting.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Open carrier tracking <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
