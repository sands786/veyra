// Copper Veil style reminder: the app is a dark editorial privacy workspace with one vermilion action accent.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoModeProvider, useDemoMode } from "./contexts/DemoModeContext";
import Home from "./pages/Home";
import PrivatePrimitives from "./pages/PrivatePrimitives";

const Launchpad = lazy(() => import("./pages/Launchpad"));
const Proof = lazy(() => import("./pages/Proof"));
const Claim = lazy(() => import("./pages/Claim"));
const DemoMode = lazy(() => import("./pages/DemoMode"));
const Documentation = lazy(() => import("./pages/Documentation"));
const PrivateMarkets = lazy(() => import("./pages/PrivateMarkets"));
const Agent = lazy(() => import("./pages/Agent"));
const SignIn = lazy(() => import("./pages/SignIn"));

function DemoModeIndicator() {
  const { isDemoMode, exitDemo } = useDemoMode();
  const [, setLocation] = useLocation();
  if (!isDemoMode) return null;
  return <div className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border border-[#F0563A]/40 bg-[#201815]/95 px-4 py-2 font-mono text-[9px] tracking-[0.1em] text-[#F0563A] shadow-2xl backdrop-blur" role="status"><span className="whitespace-nowrap">DEMO MODE / SIMULATED ONLY</span><button onClick={() => setLocation("/demo")} className="rounded-full px-2 py-1 underline underline-offset-2 transition-colors hover:bg-[#F0563A]/15" aria-label="Open demo tour">OPEN TOUR</button><button onClick={() => { exitDemo(); setLocation("/"); }} className="rounded-full px-2 py-1 text-[#CFC7BC] transition-colors hover:bg-white/10" aria-label="Exit demo mode">EXIT</button></div>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={null}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/launchpad" component={Launchpad} />
        <Route path="/demo" component={DemoMode} />
        <Route path="/docs" component={Documentation} />
        <Route path="/documentation" component={Documentation} />
        <Route path="/private-primitives" component={PrivatePrimitives} />
        <Route path="/private-markets" component={PrivateMarkets} />
        <Route path="/agent" component={Agent} />
        <Route path="/markets" component={PrivateMarkets} />
        <Route path="/sign-in" component={SignIn} />
        <Route path="/proof/:slug" component={Proof} />
        <Route path="/claim/:token" component={Claim} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <DemoModeProvider>
          <TooltipProvider>
            <Toaster theme="dark" position="bottom-right" />
            <DemoModeIndicator />
            <Router />
          </TooltipProvider>
        </DemoModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
