"use client";

import { useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { AiVisualization } from "@/lib/ai-assistant";
import type { UseAiChat } from "@/hooks/use-ai-chat";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MAX_TABLE_ROWS = 50;

const PIE_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Minimal safe markdown: headings, bold, italic, inline/block code, lists, links, line breaks. */
export function AiMarkdown({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.split("\n");
    const out: React.ReactNode[] = [];
    let listBuf: string[] = [];
    const codeLines: string[] = [];
    let inCode = false;

    const flushList = () => {
      if (listBuf.length > 0) {
        out.push(
          <ul key={`ul-${out.length}`} className="ml-4 list-disc space-y-1">
            {listBuf.map((item, i) => (
              <li key={i}>{inline(item)}</li>
            ))}
          </ul>
        );
        listBuf = [];
      }
    };

    lines.forEach((line) => {
      if (line.trim().startsWith("```")) {
        if (!inCode) {
          flushList();
          codeLines.length = 0;
          inCode = true;
        } else {
          out.push(
            <pre key={`pre-${out.length}`} className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
              <code>{codeLines.join("\n")}</code>
            </pre>
          );
          inCode = false;
        }
        return;
      }
      if (inCode) {
        codeLines.push(line);
        return;
      }
      const heading = line.match(/^(#{1,4})\s+(.*)$/);
      if (heading) {
        flushList();
        const level = heading[1].length;
        const cls = level === 1 ? "text-base font-bold" : level === 2 ? "text-sm font-bold" : "text-sm font-semibold";
        out.push(
          <p key={`h-${out.length}`} className={cls}>
            {inline(heading[2])}
          </p>
        );
        return;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        listBuf.push(line.replace(/^\s*[-*]\s+/, ""));
        return;
      }
      if (line.trim() === "") {
        flushList();
        out.push(<div key={`sp-${out.length}`} className="h-2" />);
        return;
      }
      flushList();
      out.push(
        <p key={`p-${out.length}`} className="whitespace-pre-wrap break-words">
          {inline(line)}
        </p>
      );
    });
    flushList();
    if (inCode) {
      out.push(
        <pre key="pre-unclosed" className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    }
    return out;
  }, [text]);

  return <div className="space-y-1.5 text-sm leading-relaxed">{blocks}</div>;
}

function inline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      parts.push(
        <code key={k++} className="rounded bg-muted px-1 py-0.5 text-xs">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("**")) {
      parts.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("*")) {
      parts.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    } else {
      const lm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) {
        parts.push(
          <a key={k++} href={lm[2]} target="_blank" rel="noreferrer" className="text-primary underline">
            {lm[1]}
          </a>
        );
      } else {
        parts.push(tok);
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function AiChart({ visualization }: { visualization: AiVisualization | null | undefined }) {
  const series = useMemo(() => {
    if (!visualization || visualization.type === "none") return [];
    // Use backend series exactly as returned. Never synthesize points.
    return Array.isArray(visualization.series) ? visualization.series : [];
  }, [visualization]);

  if (!visualization || visualization.type === "none" || series.length === 0) return null;

  const title = visualization.title || null;
  const subtitle =
    visualization.x_key || visualization.y_key
      ? `${visualization.x_key ?? "x"} → ${visualization.y_key ?? "y"}`
      : null;

  return (
    <div className="mt-3 rounded-md border bg-white p-3">
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-2 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {visualization.type === "bar" ? (
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="y" fill="#2563eb" />
            </BarChart>
          ) : visualization.type === "line" ? (
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="y" stroke="#2563eb" dot={false} />
            </LineChart>
          ) : visualization.type === "pie" ? (
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={series} dataKey="y" nameKey="x" outerRadius={90} label>
                {series.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 12 }} name="x" />
              <YAxis dataKey="y" tick={{ fontSize: 12 }} name="y" />
              <Tooltip />
              <Legend />
              <Scatter data={series} fill="#2563eb" />
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Based on {series.length} result{series.length === 1 ? "" : "s"} from your data.
      </p>
    </div>
  );
}

export function AiDataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [rows]);

  if (rows.length === 0) return null;
  const shown = rows.slice(0, MAX_TABLE_ROWS);

  return (
    <div className="mt-3 overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-2 py-1.5 text-left font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className="border-t">
                {columns.map((c) => (
                  <td key={c} className="max-w-60 truncate px-2 py-1.5" title={String(row[c] ?? "")}>
                    {row[c] == null ? "—" : typeof row[c] === "object" ? JSON.stringify(row[c]) : String(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > MAX_TABLE_ROWS ? (
        <p className="border-t bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground">
          Showing {MAX_TABLE_ROWS} of {rows.length} rows. Export CSV for full data.
        </p>
      ) : (
        <p className="border-t bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground">{rows.length} rows</p>
      )}
    </div>
  );
}

/** Shared chat thread: message list + input. Used by the full page and the floating widget. */
export function AiChatThread({ chat, compact }: { chat: UseAiChat; compact?: boolean }) {
  const { showToast } = useToast();
  const { messages, input, setInput, sending, send } = chat;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const copyText = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      showToast({ title: "Copied", variant: "success" });
    } catch {
      showToast({ title: "Copy failed", variant: "error" });
    }
  };

  return (
    <>
      <div className={`flex-1 space-y-4 overflow-y-auto ${compact ? "p-3" : "p-4"}`}>
        {messages.length === 0 ? (
          <div className="mx-auto max-w-md space-y-3 py-10 text-center">
            <p className="text-sm font-semibold">Ask about sales, purchases, inventory, payments</p>
            <p className="text-xs text-muted-foreground">
              Examples: “Top 5 buyers by amount this year”, “Monthly sales trend”, “Low stock items”.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Top 5 buyers by amount", "Monthly sales trend", "Show recent shipping invoices"].map((ex) => (
                <Button key={ex} variant="outline" size="sm" onClick={() => send(ex)} disabled={sending}>
                  {ex}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start">
                <div className="w-full max-w-[95%] rounded-lg border bg-background px-3 py-2">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Assistant
                  </p>
                  {m.error ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm">
                      <p className="font-semibold">Something went wrong</p>
                      <p className="text-muted-foreground">{m.error}</p>
                    </div>
                  ) : (
                    <>
                      <AiMarkdown text={m.content || "(empty response)"} />
                      {m.data && m.data.length > 0 ? (
                        <>
                          <AiDataTable rows={m.data} />
                          <div className="mt-2 flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => copyText(m.content)}>
                              Copy response
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadCsv(`ai-data-${m.id}.csv`, m.data ?? [])}
                            >
                              Export CSV
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="mt-2">
                          <Button variant="outline" size="sm" onClick={() => copyText(m.content)}>
                            Copy response
                          </Button>
                        </div>
                      )}
                      <AiChart visualization={m.visualization} />
                    </>
                  )}
                </div>
              </div>
            )
          )
        )}
        {sending ? (
          <div className="flex justify-start">
            <div className="animate-pulse rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        className={`flex gap-2 border-t ${compact ? "p-2" : "p-3"}`}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question… (Enter to send)"
          className="h-10 flex-1 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          {sending ? "Sending…" : "Send"}
        </Button>
      </form>
    </>
  );
}
