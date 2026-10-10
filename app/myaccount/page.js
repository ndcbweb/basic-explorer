import { redirect } from "next/navigation";
import { ApiKeysPanel, LogoutButton, TagsPanel, WatchlistPanel } from "@/components/AccountPanels";
import { Container, LinkTabs, PageHeader } from "@/components/ui";
import { LIMITS, currentUser, listApiKeys, listTags, listWatchlist } from "@/lib/auth";
import { config } from "@/lib/config";
import { formatAmount } from "@/lib/format";
import { rpcBatch } from "@/lib/rpc";

export const metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "watchlist", label: "Watch List" },
  { id: "tags", label: "Private Name Tags" },
  { id: "apikeys", label: "API Keys" },
];

const formatDay = (seconds) =>
  new Date(seconds * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

async function withBalances(items) {
  if (!items.length) return [];
  let balances = [];
  try {
    balances = await rpcBatch(items.map((item) => ["eth_getBalance", [item.address, "latest"]]));
  } catch {
    balances = [];
  }
  return items.map((item, i) => ({
    address: item.address,
    note: item.note,
    balance: balances[i] != null ? formatAmount(balances[i], 18, 6) : null,
  }));
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-cap">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

export default async function MyAccountPage({ searchParams }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/myaccount");

  const params = await searchParams;
  const tab = TABS.some((t) => t.id === params?.tab) ? params.tab : "watchlist";
  const watchlist = listWatchlist(user.id);
  const tags = listTags(user.id);
  const apiKeys = listApiKeys(user.id);

  return (
    <Container>
      <PageHeader title="My Account" subtitle={`Manage your ${config.chainName} Explorer account.`}>
        <LogoutButton />
      </PageHeader>

      <section className="card mb-6">
        <div className="card-head">
          <h2 className="card-title">Account Overview</h2>
        </div>
        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Username" value={user.username} />
          <Stat label="Email" value={user.email || <span className="text-faint">Not provided</span>} />
          <Stat label="Member Since" value={formatDay(user.createdAt)} />
          <Stat label="Watch List" value={`${watchlist.length} / ${LIMITS.watchlist} addresses`} />
          <Stat label="API Keys" value={`${apiKeys.length} / ${LIMITS.apiKeys} keys`} />
        </dl>
      </section>

      <LinkTabs
        tabs={TABS.map((t) => ({ ...t, href: t.id === "watchlist" ? "/myaccount" : `/myaccount?tab=${t.id}` }))}
        active={tab}
      />

      {tab === "watchlist" && (
        <WatchlistPanel items={await withBalances(watchlist)} limit={LIMITS.watchlist} currency={config.currency} />
      )}
      {tab === "tags" && <TagsPanel items={tags} limit={LIMITS.tags} />}
      {tab === "apikeys" && (
        <ApiKeysPanel items={apiKeys.map((k) => ({ ...k, created: formatDay(k.createdAt) }))} limit={LIMITS.apiKeys} />
      )}
    </Container>
  );
}
