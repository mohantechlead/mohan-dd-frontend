"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import GuaranteeLetter from "@/components/guarantee-letter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/authProvider";
import {
  TransitDocument,
  TransitDocumentType,
  transitDocumentLabel,
} from "@/lib/transit-documents";

interface PurchaseWithDocuments {
  purchase_number: string;
  transit_documents?: TransitDocument[];
  advance?: { status?: string | null } | null;
}

function PrintContent() {
  const params = useParams<{ purchaseNumber: string }>();
  const searchParams = useSearchParams();
  const purchaseNumber = params.purchaseNumber;
  const typesParam = searchParams.get("types") ?? "";
  const autoPrint = searchParams.get("auto") === "1";

  const [purchase, setPurchase] = useState<PurchaseWithDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const auth = useAuth();

  // The backend hides letters from transitors until the advance is approved.
  const lettersLocked =
    Boolean(auth?.isTransitor) && purchase?.advance?.status !== "approved";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/purchases/${encodeURIComponent(purchaseNumber)}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(
            (data as { detail?: string })?.detail ||
              "Could not load the purchase letters."
          );
          return;
        }
        setPurchase(data as PurchaseWithDocuments);
      } catch {
        if (!cancelled) setError("Could not load the purchase letters.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [purchaseNumber]);

  const documents = useMemo(() => {
    const all = purchase?.transit_documents ?? [];
    const requested = typesParam
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean) as TransitDocumentType[];
    if (requested.length === 0) return all;
    return requested
      .map((type) => all.find((document) => document.document_type === type))
      .filter((document): document is TransitDocument => Boolean(document));
  }, [purchase, typesParam]);

  const missingTypes = useMemo(() => {
    const requested = typesParam
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean) as TransitDocumentType[];
    if (requested.length === 0) return [];
    const available = new Set(
      documents.map((document) => document.document_type)
    );
    return requested.filter((type) => !available.has(type));
  }, [documents, typesParam]);

  // Reset the sequence when the requested document set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [typesParam]);

  const activeDocument = documents[activeIndex] ?? documents[0];

  // Print one letter per print job. When the print dialog closes, advance to
  // the next requested letter so the documents are printed separately.
  useEffect(() => {
    if (!autoPrint || loading || missingTypes.length > 0) return;
    if (!documents[activeIndex]) return;
    const timer = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(timer);
  }, [autoPrint, activeIndex, documents, loading, missingTypes.length]);

  useEffect(() => {
    if (!autoPrint) return;
    const handleAfterPrint = () => {
      setActiveIndex((current) =>
        current + 1 < documents.length ? current + 1 : current
      );
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [autoPrint, documents.length]);

  return (
    <div
      data-print-doc="guarantee"
      className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0"
    >
      <style>{`@page { size: A4; margin: 0; }`}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2 px-2 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href="/diredawa/transit">
            <ArrowLeft className="mr-1 h-4 w-4" /> Checkpoints
          </Link>
        </Button>
        <div className="text-sm font-medium text-slate-600">
          {purchaseNumber}
          {autoPrint && documents.length > 1 && activeDocument && (
            <span className="ml-2 text-xs font-normal text-slate-500">
              Letter {activeIndex + 1} of {documents.length} ·{" "}
              {transitDocumentLabel(activeDocument.document_type)}
            </span>
          )}
        </div>
        {autoPrint && activeIndex + 1 < documents.length && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveIndex(activeIndex + 1)}
          >
            Next letter
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => window.print()}
          disabled={documents.length === 0}
        >
          <Printer className="mr-1 h-4 w-4" /> Print
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading letters…
        </p>
      ) : error ? (
        <p className="text-center text-sm text-red-600">{error}</p>
      ) : documents.length === 0 ? (
        lettersLocked ? (
          <p className="mx-auto max-w-[210mm] rounded-md border border-amber-300 bg-amber-50 px-6 py-10 text-center text-sm text-amber-800">
            These guarantee letters are locked until the admin approves this
            transit&apos;s advance. Once approved, they will appear here for
            printing.
          </p>
        ) : (
          <p className="mx-auto max-w-[210mm] rounded-md border bg-white px-6 py-10 text-center text-sm text-slate-600">
            No guarantee letters have been generated for this purchase yet.
            Advance the checkpoint to create them.
          </p>
        )
      ) : (
        <div className="space-y-6 print:space-y-0">
          {missingTypes.length > 0 && (
            <p className="mx-auto max-w-[210mm] rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 print:hidden">
              Not generated yet:{" "}
              {missingTypes.map(transitDocumentLabel).join(", ")}.
            </p>
          )}
          {autoPrint ? (
            activeDocument ? (
              <GuaranteeLetter
                key={activeDocument.id}
                document={activeDocument}
              />
            ) : null
          ) : (
            documents.map((document) => (
              <GuaranteeLetter key={document.id} document={document} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function GuaranteePrintPage() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-center text-sm text-muted-foreground">
          Loading letters…
        </p>
      }
    >
      <PrintContent />
    </Suspense>
  );
}
