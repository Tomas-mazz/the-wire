import { Suspense } from "react";
import Form from "next/form";
import { getLocale, getTranslations } from "next-intl/server";
import { input, label, primaryButton, secondaryButton } from "@/components/portfolio/styles";
import TransactionTable from "@/components/portfolio/TransactionTable";
import { TRANSACTION_TYPES, type TransactionType } from "@/domain";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import {
  getAssets,
  getProjects,
  getTimeZone,
  getTransactions,
  TRANSACTION_LIST_LIMIT,
  type TransactionFilters,
} from "@/lib/portfolio/data";
import { isUuid, zonedLocalToUtc } from "@/lib/portfolio/parse";
import { TransactionsSkeleton } from "@/components/portfolio/Skeletons";

type SearchParams = Record<string, string | string[] | undefined>;

/** Transactions tab: every transaction, newest first, with filters in the URL. */
export default async function TransactionsPage({
  searchParams,
}: PageProps<"/[locale]/portfolio/transactions">) {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      {searchParams.then((params) => (
        <Transactions params={params} />
      ))}
    </Suspense>
  );
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

/** Reads the filters from the URL, ignoring anything malformed. */
function readFilters(params: SearchParams, timeZone: string) {
  const project = one(params.project);
  const asset = one(params.asset);
  const type = one(params.type);
  const from = one(params.from);
  const to = one(params.to);

  const filters: TransactionFilters = {};
  if (isUuid(project)) filters.projectId = project;
  if (isUuid(asset)) filters.assetId = asset;
  if ((TRANSACTION_TYPES as readonly string[]).includes(type)) filters.type = type as TransactionType;
  // Whole days in the user's time zone: from 00:00 to 23:59:59.999.
  if (DATE.test(from)) filters.from = zonedLocalToUtc(`${from}T00:00`, timeZone) ?? undefined;
  if (DATE.test(to)) {
    const end = zonedLocalToUtc(`${to}T23:59`, timeZone);
    if (end) filters.to = new Date(Date.parse(end) + 59_999).toISOString();
  }
  const active = Object.keys(filters).length > 0;
  return { filters, active, raw: { project, asset, type, from, to } };
}

async function Transactions({ params }: { params: SearchParams }) {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const t = await getTranslations("Portfolio");

  const timeZone = (await getTimeZone(user.id)) ?? "UTC";
  const { filters, active, raw } = readFilters(params, timeZone);
  const [projects, assets, rows] = await Promise.all([
    getProjects(user.id, t("defaultProject")),
    getAssets(),
    getTransactions(user.id, filters),
  ]);
  const projectNames = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <Form action="" replace className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <div className="lg:col-span-2">
          <label htmlFor="f-project" className={label}>
            {t("transactions.filters.project")}
          </label>
          <select id="f-project" name="project" defaultValue={raw.project} className={input}>
            <option value="">{t("transactions.filters.all")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-asset" className={label}>
            {t("transactions.filters.asset")}
          </label>
          <select id="f-asset" name="asset" defaultValue={raw.asset} className={input}>
            <option value="">{t("transactions.filters.all")}</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.symbol}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-type" className={label}>
            {t("transactions.filters.type")}
          </label>
          <select id="f-type" name="type" defaultValue={raw.type} className={input}>
            <option value="">{t("transactions.filters.all")}</option>
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-from" className={label}>
            {t("transactions.filters.from")}
          </label>
          <input id="f-from" name="from" type="date" defaultValue={raw.from} className={input} />
        </div>
        <div>
          <label htmlFor="f-to" className={label}>
            {t("transactions.filters.to")}
          </label>
          <input id="f-to" name="to" type="date" defaultValue={raw.to} className={input} />
        </div>
        <div className="flex gap-3 sm:col-span-2 lg:col-span-6">
          <button type="submit" className={primaryButton}>
            {t("transactions.filters.apply")}
          </button>
          {active && (
            <Link href="/portfolio/transactions" className={secondaryButton}>
              {t("transactions.filters.clear")}
            </Link>
          )}
        </div>
      </Form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          {active ? t("transactions.emptyFiltered") : t("transactions.empty")}
        </p>
      ) : (
        <>
          <TransactionTable
            rows={rows}
            locale={locale}
            timeZone={timeZone}
            projectNames={projectNames}
          />
          {rows.length === TRANSACTION_LIST_LIMIT && (
            <p className="text-xs text-muted">
              {t("transactions.limitNote", { count: TRANSACTION_LIST_LIMIT })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
