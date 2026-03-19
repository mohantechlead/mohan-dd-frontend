import { Button } from "@/components/ui/button";

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function getPageCount(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, totalItems) / Math.max(1, pageSize)));
}

export function slicePage<T>(items: T[], pageIndex: number, pageSize: number) {
  const safeSize = Math.max(1, pageSize);
  const safeIndex = Math.max(0, pageIndex);
  const start = safeIndex * safeSize;
  return items.slice(start, start + safeSize);
}

export function TablePagination({
  pageIndex,
  pageSize,
  totalItems,
  onPageIndexChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: {
  pageIndex: number; // 0-based
  pageSize: number;
  totalItems: number;
  onPageIndexChange: (next: number) => void;
  onPageSizeChange: (next: number) => void;
  pageSizeOptions?: number[];
}) {
  const pageCount = getPageCount(totalItems, pageSize);
  const safeIndex = clamp(pageIndex, 0, pageCount - 1);
  const canPrev = safeIndex > 0;
  const canNext = safeIndex < pageCount - 1;
  const from = totalItems === 0 ? 0 : safeIndex * pageSize + 1;
  const to = Math.min(totalItems, (safeIndex + 1) * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">Rows</span>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground">
          Showing <span className="font-medium text-foreground">{from}</span>–
          <span className="font-medium text-foreground">{to}</span> of{" "}
          <span className="font-medium text-foreground">{totalItems}</span>
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageIndexChange(0)}
        >
          First
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageIndexChange(safeIndex - 1)}
        >
          Prev
        </Button>
        <div className="px-2 text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{safeIndex + 1}</span>{" "}
          of <span className="font-medium text-foreground">{pageCount}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageIndexChange(safeIndex + 1)}
        >
          Next
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageIndexChange(pageCount - 1)}
        >
          Last
        </Button>
      </div>
    </div>
  );
}
