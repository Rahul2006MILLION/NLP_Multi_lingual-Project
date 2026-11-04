import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Download, FileJson, FileSpreadsheet, FileText, Ruler, TriangleAlert, BarChart3 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { ButtonLink } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import { Markdown } from "../components/ui/Markdown";
import { PageHero, PageIntro, SectionMarker } from "../components/ui/PageHero";
import { Segmented } from "../components/ui/Segmented";
import { EmptyState, ErrorState, Spinner } from "../components/ui/States";
import { useApi } from "../hooks/useApi";
import { ease, stagger } from "../lib/motion";
import { api, assetUrl } from "../services/api";
import type { DocSummary, DownloadItem } from "../services/types";

const DOC_ICONS: Record<string, typeof BookOpen> = { paper: BookOpen, methodology: Ruler, results: BarChart3, limitations: TriangleAlert };
const DL_ICONS: Record<string, typeof FileText> = { metrics_csv: FileSpreadsheet, metrics_json: FileJson, paper_md: FileText };

function DocViewer({ slug }: { slug: string }) {
  const state = useApi((s) => api.doc(slug, s), [slug]);
  return (
    <GlassCard className="min-h-[50vh] p-6 sm:p-10 lg:p-14">
      <AnimatePresence mode="wait">
        <motion.div key={slug + String(state.loading)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease } }} exit={{ opacity: 0 }}>
          {state.loading ? (
            <div className="flex justify-center py-24 text-fg-3"><Spinner className="size-5" /></div>
          ) : state.error ? (
            <ErrorState error={state.error} onRetry={state.reload} />
          ) : state.data?.available && state.data.markdown ? (
            <Markdown className="mx-auto max-w-3xl">{state.data.markdown}</Markdown>
          ) : (
            <EmptyState title={state.data?.missing_note ?? "This document is not available yet."} />
          )}
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
}

function Downloads({ items }: { items: DownloadItem[] }) {
  const available = items.filter((i) => i.available);
  if (!available.length) return <EmptyState title="No export files found" />;
  return (
    <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-4 md:grid-cols-3">
      {available.map((d) => {
        const Icon = DL_ICONS[d.key] ?? FileText;
        return (
          <GlassCard key={d.key} interactive className="flex flex-col p-6">
            <Icon className="size-5 text-fg-2" strokeWidth={1.5} />
            <p className="mt-5 font-medium">{d.label.replace(/^Download /, "")}</p>
            <p className="mt-1 font-mono text-xs text-fg-3">{d.filename}</p>
            <ButtonLink href={assetUrl(d.url)} download={d.filename} className="mt-6 w-full" icon={<Download className="size-4" />}>
              Download
            </ButtonLink>
          </GlassCard>
        );
      })}
    </motion.div>
  );
}

function ReportBody({ docs, downloads }: { docs: DocSummary[]; downloads: DownloadItem[] }) {
  const [params, setParams] = useSearchParams();
  const slug = docs.some((d) => d.slug === params.get("doc")) ? params.get("doc")! : docs[0].slug;
  return (
    <>
      <PageHero word="Report" eyebrow="Publication-ready reports, empirical ledgers & metrics">
        <div className="mx-auto mb-4 w-fit max-w-full overflow-x-auto rounded-full">
          <Segmented
            id="doc"
            label="Document"
            value={slug}
            onChange={(v) => setParams({ doc: v }, { replace: true })}
            className="bg-black/60 backdrop-blur-2xl [&_button]:px-4"
            options={docs.map((d) => {
              const Icon = DOC_ICONS[d.slug] ?? FileText;
              return { value: d.slug, label: <span className="inline-flex items-center gap-2"><Icon className="size-3.5" />{d.label}</span> };
            })}
          />
        </div>
        <DocViewer slug={slug} />
      </PageHero>
      <PageIntro title="Complete Research Documentation & Paper" subtitle="Download publication-ready reports, empirical ledgers, and metrics" />
      <SectionMarker label="Export & Download Center" />
      <Downloads items={downloads} />
    </>
  );
}

export function ReportPage() {
  const state = useApi((s) => Promise.all([api.docs(s), api.downloads(s)]));
  return <PageShell state={state}>{([docs, downloads]) => <ReportBody docs={docs} downloads={downloads} />}</PageShell>;
}
