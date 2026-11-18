import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import ProjectForm from "@/components/portfolio/ProjectForm";
import { card } from "@/components/portfolio/styles";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { getProjects, getTransactions, type Project } from "@/lib/portfolio/data";
import { ProjectsSkeleton } from "@/components/portfolio/Skeletons";

/** Projects tab: active projects as cards, a form to add one, archived ones folded away. */
export default async function ProjectsPage() {
  const t = await getTranslations("Portfolio");
  return (
    <div className="space-y-8">
      {/* The intro does not depend on the user, so it shows while the projects load. */}
      <p className="text-body">{t("projects.intro")}</p>
      <Suspense fallback={<ProjectsSkeleton />}>
        <Projects />
      </Suspense>
    </div>
  );
}

async function Projects() {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const t = await getTranslations("Portfolio");

  const [projects, transactions] = await Promise.all([
    getProjects(user.id, t("defaultProject")),
    getTransactions(user.id, {}, 10_000),
  ]);
  const counts = new Map<string, number>();
  for (const tx of transactions) counts.set(tx.projectId, (counts.get(tx.projectId) ?? 0) + 1);

  const active = projects.filter((p) => !p.archivedAt);
  const archived = projects.filter((p) => p.archivedAt);

  return (
    <div className="space-y-8">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} count={counts.get(project.id) ?? 0} />
          </li>
        ))}
      </ul>

      <details className={card}>
        <summary className="flex cursor-pointer items-center gap-2 font-medium text-fg">
          <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
          {t("projects.new")}
        </summary>
        <div className="mt-6">
          <ProjectForm />
        </div>
      </details>

      {archived.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-muted hover:text-fg">
            {t("projects.archivedTitle", { count: archived.length })}
          </summary>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((project) => (
              <li key={project.id} className="opacity-60 hover:opacity-100">
                <ProjectCard project={project} count={counts.get(project.id) ?? 0} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

async function ProjectCard({ project, count }: { project: Project; count: number }) {
  const t = await getTranslations("Portfolio.projects");
  return (
    <Link
      href={`/portfolio/projects/${project.id}`}
      className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 glow-card transition-colors hover:bg-surface-hover"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="font-semibold text-fg">{project.name}</span>
        {project.archivedAt && (
          <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
            {t("archivedBadge")}
          </span>
        )}
      </span>
      {project.description && (
        <span className="mt-2 line-clamp-2 text-sm text-body">{project.description}</span>
      )}
      <span className="mt-auto pt-4 text-xs text-muted">{t("transactions", { count })}</span>
      {project.tags.length > 0 && (
        <span className="mt-2 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
              {tag}
            </span>
          ))}
        </span>
      )}
    </Link>
  );
}
