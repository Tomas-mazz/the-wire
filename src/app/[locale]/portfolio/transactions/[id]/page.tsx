import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import DeleteTransactionButton from "@/components/portfolio/DeleteTransactionButton";
import { card } from "@/components/portfolio/styles";
import TransactionForm from "@/components/portfolio/TransactionForm";
import { requireUser } from "@/lib/auth";
import { getAssets, getProjects, getTimeZone, getTransaction } from "@/lib/portfolio/data";
import { isUuid, utcToZonedLocal } from "@/lib/portfolio/parse";
import { FormSkeleton } from "@/components/portfolio/Skeletons";

/** Edit or delete one transaction. */
export default async function EditTransactionPage({
  params,
}: PageProps<"/[locale]/portfolio/transactions/[id]">) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      {params.then(({ id }) => (
        <EditTransaction id={id} />
      ))}
    </Suspense>
  );
}

async function EditTransaction({ id }: { id: string }) {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const t = await getTranslations("Portfolio");

  const transaction = isUuid(id) ? await getTransaction(user.id, id) : null;
  if (!transaction) return <p className={card}>{t("notFound")}</p>;

  const [projects, assets, savedTimeZone] = await Promise.all([
    getProjects(user.id, t("defaultProject")),
    getAssets(),
    getTimeZone(user.id),
  ]);
  // Prefill and save in the same zone, so editing never shifts the time.
  const timeZone = savedTimeZone ?? "UTC";
  const choices = projects
    .filter((p) => !p.archivedAt || p.id === transaction.projectId)
    .map(({ id: projectId, name }) => ({ id: projectId, name }));

  return (
    <section aria-labelledby="edit-transaction" className={`${card} max-w-3xl`}>
      <h2 id="edit-transaction" className="text-xl font-bold text-fg">
        {t("transactionForm.editTitle")}
      </h2>
      <p className="mt-2 mb-8 text-sm text-muted">{t("transactionForm.intro")}</p>
      <TransactionForm
        transactionId={transaction.id}
        projects={choices}
        assets={assets}
        timeZone={timeZone}
        initial={{
          projectId: transaction.projectId,
          type: transaction.type,
          assetId: transaction.assetId,
          executedAt: utcToZonedLocal(transaction.executedAt, timeZone),
          quantity: transaction.quantity,
          unitPrice: transaction.unitPrice,
          fee: transaction.fee ?? "",
          broker: transaction.broker ?? "",
          note: transaction.note ?? "",
        }}
      />
      <div className="mt-8 border-t border-line pt-6">
        <DeleteTransactionButton transactionId={transaction.id} />
      </div>
    </section>
  );
}
