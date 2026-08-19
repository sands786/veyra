// Copper Veil style reminder: the app is a dark editorial privacy workspace with one vermilion action accent.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoModeProvider, useDemoMode } from "./contexts/DemoModeContext";
import Home from "./pages/Home";
import Launchpad from "./pages/Launchpad";
import Proof from "./pages/Proof";
import Claim from "./pages/Claim";
import DemoMode from "./pages/DemoMode";
import Documentation from "./pages/Documentation";
import PrivatePrimitives from "./pages/PrivatePrimitives";
import PrivateMarkets from "./pages/PrivateMarkets";

function DemoModeIndicator() {
  const { isDemoMode, exitDemo } = useDemoMode();
  if (!isDemoMode) return null;
  return <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#F0563A]/40 bg-[#201815]/95 px-4 py-2 font-mono text-[9px] tracking-[0.1em] text-[#F0563A] shadow-2xl backdrop-blur"><span>DEMO MODE / SIMULATED ONLY</span><button onClick={() => { window.location.href = "/demo"; }} className="underline">OPEN TOUR</button><button onClick={() => { exitDemo(); window.location.reload(); }} className="text-[#CFC7BC]">EXIT</button></div>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/launchpad" component={Launchpad} />
      <Route path="/demo" component={DemoMode} />
      <Route path="/docs" component={Documentation} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/private-primitives" component={PrivatePrimitives} />
      <Route path="/private-markets" component={PrivateMarkets} />
      <Route path="/proof/:slug" component={Proof} />
      <Route path="/claim/:token" component={Claim} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
