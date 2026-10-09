import { Check } from "lucide-react";

export type StageValue =
  | "ecd_im8"
  | "transit_permit"
  | "closure_guarantee"
  | "done"
  | "cancelled";

export const STAGE_OPTIONS: { value: StageValue; label: string }[] = [
  { value: "ecd_im8", label: "ECD / IM8" },
  { value: "transit_permit", label: "Transit Permit" },
  { value: "closure_guarantee", label: "Closure Guarantee" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const STAGE_LABELS: Record<string, string> = {
  ecd_im8: "ECD / IM8",
  transit_permit: "Transit Permit",
  closure_guarantee: "Closure Guarantee",
  done: "Done",
  cancelled: "Cancelled",
};

export function stageLabel(stage?: string | null): string {
  const s = (stage ?? "").trim();
  if (!s) return "Not started";
  return STAGE_LABELS[s] ?? s;
}

export function getStageClasses(stage?: string | null): string {
  switch ((stage ?? "").trim()) {
    case "ecd_im8":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "transit_permit":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "closure_guarantee":
      return "bg-violet-100 text-violet-800 border-violet-300";
    case "done":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "cancelled":
      return "bg-rose-100 text-rose-800 border-rose-300";
    default:
      return "bg-slate-100 text-slate-600 border-slate-300";
  }
}

export function StagePill({ stage, className = "" }: { stage?: string | null; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStageClasses(stage)} ${className}`}
    >
      {stageLabel(stage)}
    </span>
  );
}

/** Main forward sequence a transitor can walk through. Terminal "Done"/"Cancelled" are set by sales/admin. */
const MAIN_STEPS: StageValue[] = [
  "ecd_im8",
  "transit_permit",
  "closure_guarantee",
  "done",
];

/**
 * Next stage a transitor may advance to.
 * `null` = terminal (transitor cannot move it further; sales/admin marks Done/Cancelled).
 */
export function nextTransitorStage(stage?: string | null): StageValue | null {
  switch ((stage ?? "").trim()) {
    case "":
      return "ecd_im8";
    case "ecd_im8":
      return "transit_permit";
    case "transit_permit":
      return "closure_guarantee";
    default:
      return null;
  }
}

export function StageStepper({ stage }: { stage?: string | null }) {
  const s = (stage ?? "").trim();
  const cancelled = s === "cancelled";
  const currentIdx = cancelled ? -1 : MAIN_STEPS.indexOf(s as StageValue);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {MAIN_STEPS.map((step, idx) => {
        const isDone = !cancelled && currentIdx > idx;
        const isCurrent = !cancelled && currentIdx === idx;
        return (
          <div key={step} className="flex items-center gap-1">
            {idx > 0 && (
              <span
                className={`h-px w-4 ${isDone || isCurrent ? "bg-blue-500" : "bg-slate-300"}`}
              />
            )}
            <span
              className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium ${
                isCurrent
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : isDone
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-slate-50 text-slate-400"
              }`}
            >
              {isDone && <Check className="h-3 w-3" />}
              {stageLabel(step)}
            </span>
          </div>
        );
      })}
      {cancelled && (
        <span className="inline-flex h-6 items-center rounded-full border border-rose-400 bg-rose-50 px-2 text-[11px] font-medium text-rose-700">
          Cancelled
        </span>
      )}
    </div>
  );
}
