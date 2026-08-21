// Copper Veil style reminder: the app is a dark editorial privacy workspace with one vermilion action accent.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoModeProvider, useDemoMode } from "./contexts/DemoModeContext";
import Home from "./pages/Home";

const Launchpad = lazy(() => import("./pages/Launchpad"));
const Proof = lazy(() => import("./pages/Proof"));
const Claim = lazy(() => import("./pages/Claim"));
const DemoMode = lazy(() => import("./pages/DemoMode"));
const Documentation = lazy(() => import("./pages/Documentation"));
const PrivatePrimitives = lazy(() => import("./pages/PrivatePrimitives"));
const PrivateMarkets = lazy(() => import("./pages/PrivateMarkets"));
const SignIn = lazy(() => import("./pages/SignIn"));

function RouteLoadingBoundary() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#111210] px-6 text-[#F3EEE5]">
      <div className="rounded-[18px] border border-white/15 bg-[#151D21] px-6 py-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <div className="font-mono text-[10px] tracking-[0.16em] text-[#F0563A]">VEYRA / SECURE ROUTE</div>
        <p className="mt-2 text-sm text-[#AEB8BE]">Preparing your private workspace…</p>
      </div>
    </main>
  );
}

function DemoModeIndicator() {
  const { isDemoMode, exitDemo } = useDemoMode();
  if (!isDemoMode) return null;
  return <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#F0563A]/40 bg-[#201815]/95 px-4 py-2 font-mono text-[9px] tracking-[0.1em] text-[#F0563A] shadow-2xl backdrop-blur"><span>DEMO MODE / SIMULATED ONLY</span><button onClick={() => { window.location.href = "/demo"; }} className="underline">OPEN TOUR</button><button onClick={() => { exitDemo(); window.location.reload(); }} className="text-[#CFC7BC]">EXIT</button></div>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoadingBoundary />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/launchpad" component={Launchpad} />
        <Route path="/demo" component={DemoMode} />
        <Route path="/docs" component={Documentation} />
        <Route path="/documentation" component={Documentation} />
        <Route path="/private-primitives" component={PrivatePrimitives} />
        <Route path="/private-markets" component={PrivateMarkets} />
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
