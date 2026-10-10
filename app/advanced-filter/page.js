import Link from "next/link";
import { TxTable } from "@/components/tables";
import { Container, PageHeader, Pagination } from "@/components/ui";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { TX_TYPES, formatNumber, isAddress } from "@/lib/format";

export const metadata = { title: "Advanced Filter" };

const PAGE_SIZE = 25;
const KEYS = ["a", "dir", "method", "fb", "tb", "fd", "td", "min", "max", "status", "type"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const INT = /^\d+$/;
const NUM = /^\d*\.?\d+$/;

function readFilters(query) {
  const f = {};
  for (const key of KEYS) {
    const value = typeof query?.[key] === "string" ? query[key].trim() : "";
    if (value) f[key] = value;
  }
  return f;
}

function buildWhere(f) {
  const where = [];
  const args = [];
  const errors = [];
  if (f.a) {
    if (!isAddress(f.a)) errors.push("Address must be a 0x address with 40 hex characters.");
    else {
      const addr = f.a.toLowerCase();
      if (f.dir === "from") {
        where.push("from_addr = ?");
        args.push(addr);
      } else if (f.dir === "to") {
        where.push("(to_addr = ? OR contract_address = ?)");
        args.push(addr, addr);
      } else {
        where.push("(from_addr = ? OR to_addr = ? OR contract_address = ?)");
        args.push(addr, addr, addr);
      }
    }
  }
  if (f.method) {
    where.push("method LIKE ? ESCAPE '\\'");
    args.push(`%${f.method.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  }
  for (const [key, op] of [
    ["fb", ">="],
    ["tb", "<="],
  ]) {
    if (!f[key]) continue;
    if (!INT.test(f[key])) errors.push("Block numbers must be whole numbers.");
    else {
      where.push(`block_number ${op} ?`);
      args.push(Number(f[key]));
    }
  }
  if (f.fd) {
    if (!DATE.test(f.fd)) errors.push("Dates must be YYYY-MM-DD.");
    else {
      where.push("timestamp >= ?");
      args.push(Math.floor(Date.parse(`${f.fd}T00:00:00Z`) / 1000));
    }
  }
  if (f.td) {
    if (!DATE.test(f.td)) errors.push("Dates must be YYYY-MM-DD.");
    else {
      where.push("timestamp < ?");
      args.push(Math.floor(Date.parse(`${f.td}T00:00:00Z`) / 1000) + 86400);
    }
  }
  for (const [key, op] of [
    ["min", ">="],
    ["max", "<="],
  ]) {
    if (!f[key]) continue;
    if (!NUM.test(f[key])) errors.push("Amounts must be positive numbers.");
    else {
      where.push(`CAST(value AS REAL) / 1e18 ${op} ?`);
      args.push(Number(f[key]));
    }
  }
  if (f.status === "success") where.push("status = 1");
  else if (f.status === "failed") where.push("status = 0");
  if (f.type && INT.test(f.type)) {
    where.push("tx_type = ?");
    args.push(Number(f.type));
  }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", args, errors: [...new Set(errors)] };
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

export default async function AdvancedFilterPage({ searchParams }) {
  const query = await searchParams;
  const f = readFilters(query);
  const page = Math.max(1, Number.parseInt(query?.p, 10) || 1);
  const { sql, args, errors } = buildWhere(f);

  let total = 0;
  let txs = [];
  if (!errors.length) {
    total = db().prepare(`SELECT COUNT(*) AS n FROM txs ${sql}`).get(...args).n;
    txs = db()
      .prepare(`SELECT * FROM txs ${sql} ORDER BY block_number DESC, tx_index DESC LIMIT ? OFFSET ?`)
      .all(...args, PAGE_SIZE, (page - 1) * PAGE_SIZE);
  }
  const viewer = f.a && isAddress(f.a) ? f.a.toLowerCase() : null;
  const active = Object.keys(f).length > 0;

  return (
    <Container>
      <PageHeader
        title="Advanced Filter"
        subtitle={`Search ${config.chainName} transactions by address, method, block, date, amount, status and type.`}
      />

      <form method="get" action="/advanced-filter" className="card mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Field label="Address" htmlFor="af-a">
              <div className="flex gap-2">
                <select name="dir" defaultValue={f.dir || "any"} aria-label="Address direction" className="field w-28 shrink-0">
                  <option value="any">Any</option>
                  <option value="from">From</option>
                  <option value="to">To</option>
                </select>
                <input id="af-a" name="a" defaultValue={f.a || ""} placeholder="0x…" spellCheck={false} className="field font-mono text-[13px]" />
              </div>
            </Field>
          </div>
          <Field label="Method" htmlFor="af-method">
            <input id="af-method" name="method" defaultValue={f.method || ""} placeholder="e.g. Transfer or 0xa9059cbb" className="field" />
          </Field>
          <Field label="Type" htmlFor="af-type">
            <select id="af-type" name="type" defaultValue={f.type || ""} className="field">
              <option value="">All types</option>
              {Object.entries(TX_TYPES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Block range" htmlFor="af-fb">
            <div className="flex items-center gap-2">
              <input id="af-fb" name="fb" inputMode="numeric" defaultValue={f.fb || ""} placeholder="From" className="field" />
              <input name="tb" inputMode="numeric" aria-label="To block" defaultValue={f.tb || ""} placeholder="To" className="field" />
            </div>
          </Field>
          <Field label="Age (UTC)" htmlFor="af-fd">
            <div className="flex items-center gap-2">
              <input id="af-fd" name="fd" type="date" defaultValue={f.fd || ""} className="field" />
              <input name="td" type="date" aria-label="To date" defaultValue={f.td || ""} className="field" />
            </div>
          </Field>
          <Field label={`Amount (${config.currency})`} htmlFor="af-min">
            <div className="flex items-center gap-2">
              <input id="af-min" name="min" inputMode="decimal" defaultValue={f.min || ""} placeholder="Min" className="field" />
              <input name="max" inputMode="decimal" aria-label="Maximum amount" defaultValue={f.max || ""} placeholder="Max" className="field" />
            </div>
          </Field>
          <Field label="Status" htmlFor="af-status">
            <select id="af-status" name="status" defaultValue={f.status || ""} className="field">
              <option value="">Any status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary">
            Apply Filters
          </button>
          {active && (
            <Link href="/advanced-filter" className="text-sm text-muted hover:text-ink">
              Clear all
            </Link>
          )}
        </div>
      </form>

      {errors.length > 0 && (
        <div role="alert" className="mb-6 rounded-lg border border-bad-700/25 bg-bad-50 px-4 py-3 text-sm text-bad-700">
          {errors.join(" ")}
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="card-head">
          <p className="text-sm text-muted">
            {formatNumber(total)} transaction{total === 1 ? "" : "s"} found{active ? " matching your filters" : ""}
          </p>
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/advanced-filter" params={f} />
        </div>
        <TxTable txs={txs} viewer={viewer} emptyTitle="No matching transactions" />
        {total > PAGE_SIZE && (
          <div className="flex justify-end border-t border-line px-5 py-3">
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/advanced-filter" params={f} />
          </div>
        )}
      </section>
    </Container>
  );
}
