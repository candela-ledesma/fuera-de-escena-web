import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/config";
import { getAuthorReviewStats, getReviewsByAuthor } from "@/features/reviews/queries";

import { PanelListing } from "./panel-listing";
import { parsePanelTab } from "./panel-tabs";
import { SavedToast } from "./saved-toast";

export const metadata: Metadata = {
  title: "Panel",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PanelPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const tab = parsePanelTab(first(params.tab));
  const toast = <SavedToast tab={tab} saved={first(params.saved)} id={first(params.id)} />;

  // Solo se consulta la tab activa.
  if (tab === "entrevistas") {
    const [stats, items] = await Promise.all([
      getAuthorReviewStats(session.user.id, "entrevista"),
      getReviewsByAuthor(session.user.id, "entrevista"),
    ]);

    return (
      <>
        {toast}
        <PanelListing tab="entrevistas" stats={stats} items={items} />
      </>
    );
  }

  const [stats, items] = await Promise.all([
    getAuthorReviewStats(session.user.id, "critica"),
    getReviewsByAuthor(session.user.id, "critica"),
  ]);

  return (
    <>
      {toast}
      <PanelListing tab="criticas" stats={stats} items={items} />
    </>
  );
}
