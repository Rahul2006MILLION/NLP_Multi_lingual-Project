import { AnimatePresence } from "framer-motion";
import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Ambient } from "./components/layout/Ambient";
import { Footer } from "./components/layout/Footer";
import { NavBar } from "./components/layout/NavBar";
import { EmptyState, ErrorState, PageSkeleton } from "./components/ui/States";

// Pages are code-split: markdown + KaTeX only load for the pages that render them.
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, key: K) =>
  lazy(() => load().then((m) => ({ default: m[key] })));
const OverviewPage = named(() => import("./pages/OverviewPage"), "OverviewPage");
const DemoPage = named(() => import("./pages/DemoPage"), "DemoPage");
const ComparisonPage = named(() => import("./pages/ComparisonPage"), "ComparisonPage");
const CalibrationPage = named(() => import("./pages/CalibrationPage"), "CalibrationPage");
const ConsistencyPage = named(() => import("./pages/ConsistencyPage"), "ConsistencyPage");
const ExperimentsPage = named(() => import("./pages/ExperimentsPage"), "ExperimentsPage");
const ReportPage = named(() => import("./pages/ReportPage"), "ReportPage");

class PageErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <ErrorState error={this.state.error} onRetry={() => this.setState({ error: null })} />
    ) : (
      this.props.children
    );
  }
}

function NotFound() {
  return (
    <main className="pt-40">
      <EmptyState title="Page not found">
        <Link to="/" className="underline underline-offset-4">Back to overview</Link>
      </EmptyState>
    </main>
  );
}

const page = (el: ReactNode) => (
  <Suspense fallback={<div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6"><PageSkeleton /></div>}>{el}</Suspense>
);

export default function App() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Ambient />
      <NavBar />
      <PageErrorBoundary key={location.pathname}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={page(<OverviewPage />)} />
            <Route path="/demo" element={page(<DemoPage />)} />
            <Route path="/comparison" element={page(<ComparisonPage />)} />
            <Route path="/calibration" element={page(<CalibrationPage />)} />
            <Route path="/consistency" element={page(<ConsistencyPage />)} />
            <Route path="/experiments" element={page(<ExperimentsPage />)} />
            <Route path="/report" element={page(<ReportPage />)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </PageErrorBoundary>
      <Footer />
    </div>
  );
}
