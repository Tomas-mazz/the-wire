"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { deleteTransaction, type TransactionFormState } from "@/app/[locale]/portfolio/actions";
import { secondaryButton } from "./styles";

const initialState: TransactionFormState = { status: "idle" };

/** Asks for confirmation, then deletes. The audit trail keeps a copy. */
export default function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  const f = useTranslations("Portfolio.transactionForm");
  const locale = useLocale();
  const [state, action, pending] = useActionState(
    deleteTransaction.bind(null, locale, transactionId),
    initialState,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(f("confirmDelete"))) e.preventDefault();
      }}
    >
      <button type="submit" disabled={pending} className={`${secondaryButton} hover:text-down`}>
        <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
        {pending ? f("deleting") : f("delete")}
      </button>
      {state.status === "error" && state.message && (
        <p role="alert" className="mt-2 text-sm text-down">
          {f(`messages.${state.message}`)}
        </p>
      )}
    </form>
  );
}
