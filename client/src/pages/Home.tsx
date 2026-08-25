// Copper Veil style reminder: editorial brutalism, graphite canvas, ivory surfaces, Veil Vermilion #F0563A, Space Grotesk + IBM Plex Mono, visible privacy state.
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { prepareRouteEdit } from "@/lib/routeEdit";
import {
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageSet,
} from "@/lib/safeStorage";
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  Blocks,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  EyeOff,
  ExternalLink,
  Fingerprint,
  KeyRound,
  LineChart,
  Link2,
  LockKeyhole,
  Menu,
  Minus,
  PlayCircle,
  Plus,
  QrCode,
  Shield,
  Sparkles,
  UserCheck,
  WalletCards,
  Workflow,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  connectVeilWallet,
  describeStrk20Readiness,
  describeStrk20SubmissionError,
  
  discoverStarknetWallets,
  explorerUrl,
  networkFromChainId,
  networkLabel,
  onchainCapability,
  requestWalletQrConnection,
  submitShieldedRoute,
  STRK20_ASSETS,
  strk20TokenAddressForSymbol,
  strk20TokenDecimalsForSymbol,
  type StarknetWalletOption,
  type VeilNetwork,
  type VeilWallet,
} from "@/lib/strk20";
import {
  canCreateRecipientClaim,
  canScheduleRoute,
  decimalToScaledBigInt,
  isValidStarknetAddress,
  isWalletActionLocked,
  normalizeAmountInput,
} from "@shared/operations";
import { copyText } from "@/lib/clipboard";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { VeyraBrand } from "@/components/VeyraBrand";
import * as QRCode from "qrcode";

const walletInstallLinks = [
  { name: "Argent X", href: "https://www.argent.xyz/argent-x/" },
  { name: "Braavos", href: "https://braavos.app/" },
];

const stages = [
  { label: "DRAFT", note: "Recipients and amounts stay in your workspace." },
  {
    label: "READY TO SIGN",
    note: "The saved intent is ready for a wallet action. No private action has been submitted.",
  },
  { label: "ROUTED", note: "A private transfer route is ready to sign." },
  {
    label: "CONFIRMED",
    note: "A wallet-signed transaction and receipt close the loop.",
  },
];

const activity = [
  {
    id: "DEMO-019",
    routeId: undefined,
    title: "March contractor run",
    detail: "DEMO · 6 recipients · USDC",
    state: "DEMO / PROOF READY",
    time: "8 min ago",
  },
  {
    id: "DEMO-018",
    routeId: undefined,
    title: "Design retainer split",
    detail: "DEMO · 3 recipients · STRK",
    state: "DEMO / SHIELDED",
    time: "Yesterday",
  },
  {
    id: "DEMO-017",
    routeId: undefined,
    title: "Ops reimbursement",
    detail: "DEMO · 2 recipients · ETH",
    state: "DEMO / CONFIRMED",
    time: "Apr 04",
  },
];

const productSurfaces = [
  {
    group: "WORKSPACE",
    title: "Payment routes",
    copy: "Build governed STRK20 payment intents while recipient rosters stay inside the workspace boundary.",
    signal: "CORE FLOW",
    action: "OPEN PAYMENT ROUTES",
    icon: WalletCards,
    shape: "circle",
    targetType: "section",
    target: "routes",
  },
  {
    group: "PROOF",
    title: "Proof ledger",
    copy: "Inspect public receipt states, transaction evidence, and shareable proof metadata without exposing the roster.",
    signal: "RECEIPT-FIRST",
    action: "OPEN PROOF LEDGER",
    icon: Shield,
    shape: "circle",
    targetType: "section",
    target: "ledger",
  },
  {
    group: "WORKSPACE",
    title: "Identity keys",
    copy: "Review the connected wallet boundary, network context, and signing readiness before any production action.",
    signal: "WALLET CONTEXT",
    action: "OPEN IDENTITY KEYS",
    icon: KeyRound,
    shape: "circle",
    targetType: "section",
    target: "identity",
  },
  {
    group: "CONTROL",
    title: "Operations",
    copy: "Run governance, operational analytics, audit export, and unresolved-receipt monitoring from one control surface.",
    signal: "OPERATING LAYER",
    action: "OPEN OPERATIONS",
    icon: Workflow,
    shape: "circle",
    targetType: "section",
    target: "operations",
  },
  {
    group: "CONTROL",
    title: "Treasury",
    copy: "Set policy limits, approval rules, network constraints, and dry-run checks before a wallet signs.",
    signal: "POLICY BEFORE CAPITAL",
    action: "OPEN TREASURY",
    icon: LockKeyhole,
    shape: "circle",
    targetType: "section",
    target: "treasury",
  },
  {
    group: "CONTROL",
    title: "Claims",
    copy: "Create expiring private claim links so recipients can reconcile their route without publishing the roster.",
    signal: "PRIVATE CLAIMS",
    action: "OPEN CLAIMS",
    icon: Link2,
    shape: "circle",
    targetType: "section",
    target: "claims",
  },
  {
    group: "PROTOCOL",
    title: "Private primitives",
    copy: "Keep the official STRK20 wallet boundary explicit: the wallet signs, the chain returns a public receipt.",
    signal: "WALLET-NATIVE",
    action: "VIEW PRIMITIVES",
    icon: Blocks,
    shape: "circle",
    targetType: "route",
    target: "/private-primitives",
  },
  {
    group: "PROTOCOL",
    title: "Private markets",
    copy: "Coordinate sealed-bid market workflows with a deployed Mainnet escrow and observable settlement state.",
    signal: "MAINNET ESCROW",
    action: "VIEW PRIVATE MARKETS",
    icon: LineChart,
    shape: "circle",
    targetType: "route",
    target: "/private-markets",
  },
  {
    group: "PROTOCOL",
    title: "Launchpad",
    copy: "Move from project room to milestone release with a deployed Starknet escrow and wallet-reviewed actions.",
    signal: "MILESTONE ESCROW",
    action: "VIEW LAUNCHPAD",
    icon: Sparkles,
    shape: "circle",
    targetType: "route",
    target: "/launchpad",
  },
  {
    group: "PROTOCOL",
    title: "Veyra Agent",
    copy: "Coordinate a decision with commit–reveal: commit first, reveal later, and verify every state transition.",
    signal: "COMMIT–REVEAL",
    action: "VIEW AGENT",
    icon: Bot,
    shape: "circle",
    targetType: "route",
    target: "/agent",
  },
] as const;

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  const { user, loading, error, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { isDemoMode } = useDemoMode();
  const selectedNetwork = "mainnet" as const;
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(
    () => {
      if (typeof window === "undefined") return null;
      const stored = Number(safeLocalStorageGet("veilpay-active-workspace"));
      return Number.isInteger(stored) && stored > 0 ? stored : null;
    }
  );
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [routeCreateRequestId, setRouteCreateRequestId] = useState(() =>
    crypto.randomUUID()
  );
  const [claimWalletActionPending, setClaimWalletActionPending] =
    useState(false);
  const [recoveryHash, setRecoveryHash] = useState("");
  const workspaceListQuery = trpc.workspace.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const overviewQuery = trpc.workspace.overview.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const liveRoutes = overviewQuery.data?.routes ?? [];
  const recipientsQuery = trpc.recipients.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const auditQuery = trpc.audit.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const transactionsQuery = trpc.transactions.listRoute.useQuery(
    { routeId: selectedRouteId ?? 0 },
    { enabled: isAuthenticated && selectedRouteId !== null, retry: false }
  );
  const routeRecipientIdsQuery = trpc.routes.recipients.useQuery(
    { routeId: editingRouteId ?? 0 },
    { enabled: isAuthenticated && editingRouteId !== null, retry: false }
  );
  const routeRecipientReviewQuery = trpc.routes.recipientReview.useQuery(
    { routeId: selectedRouteId ?? 0 },
    { enabled: isAuthenticated && selectedRouteId !== null, retry: false }
  );
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  const utils = trpc.useUtils();
  const createRecipientMutation = trpc.recipients.create.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => createRecipientMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.recipients.list.invalidate();
      await utils.workspace.overview.invalidate();
      setRecipientName("");
      setRecipientWallet("");
      toast("Recipient added to the private roster.");
    },
  });
  const createRouteMutation = trpc.routes.create.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => createRouteMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.routes.list.invalidate();
      await utils.workspace.overview.invalidate();
    },
  });
  const recordTransactionMutation =
    trpc.transactions.recordSubmission.useMutation({
      onError: (error, input) => {
        setMutationError(error.message);
        setRetryAction(() => () => recordTransactionMutation.mutate(input));
      },
      onSuccess: async (_result, input) => {
        await utils.routes.list.invalidate();
        await utils.workspace.overview.invalidate();
        await utils.transactions.listRoute.invalidate({
          routeId: input.routeId,
        });
      },
    });
  const recoverTransactionMutation =
    trpc.transactions.recoverSubmission.useMutation({
      onError: (error, input) => {
        setMutationError(error.message);
        setRetryAction(() => () => recoverTransactionMutation.mutate(input));
      },
      onSuccess: async (_result, input) => {
        safeLocalStorageRemove(`veyra-submission-${input.routeId}`);
        setRecoveryHash("");
        await Promise.all([
          utils.routes.list.invalidate(),
          utils.workspace.overview.invalidate(),
          utils.transactions.listRoute.invalidate({ routeId: input.routeId }),
        ]);
        toast("Existing wallet hash recorded.", {
          description:
            "No new wallet action was requested. Verify the receipt before treating settlement as confirmed.",
        });
      },
    });
  const archiveRecipientMutation = trpc.recipients.archive.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => archiveRecipientMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.recipients.list.invalidate();
      await utils.workspace.overview.invalidate();
      toast("Recipient archived.");
    },
  });
  const updateRecipientMutation = trpc.recipients.update.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => updateRecipientMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.recipients.list.invalidate();
      await utils.workspace.overview.invalidate();
      setEditingRecipientId(null);
      setRecipientName("");
      setRecipientWallet("");
      toast("Recipient updated.");
    },
  });
  const transitionRouteMutation = trpc.routes.transition.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => transitionRouteMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.routes.list.invalidate();
      await utils.workspace.overview.invalidate();
      toast("Route status updated.");
    },
  });
  const updateRouteMutation = trpc.routes.update.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => updateRouteMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.routes.list.invalidate();
      await utils.workspace.overview.invalidate();
      toast("Draft route updated.");
    },
  });
  const restoreRecipientMutation = trpc.recipients.restore.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => restoreRecipientMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.recipients.list.invalidate();
      await utils.workspace.overview.invalidate();
      toast("Recipient restored.");
    },
  });
  const confirmTransactionMutation = trpc.transactions.confirm.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => confirmTransactionMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.routes.list.invalidate();
      await utils.workspace.overview.invalidate();
      toast("Receipt status confirmed.");
    },
  });
  const schedulesQuery = trpc.schedules.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const analyticsQuery = trpc.analytics.summary.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const healthQuery = trpc.analytics.health.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const policiesQuery = trpc.treasury.policies.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const balancesQuery = trpc.treasury.balances.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const approvalsQuery = trpc.approvals.list.useQuery(
    { routeId: selectedRouteId ?? 0 },
    { enabled: isAuthenticated && selectedRouteId !== null, retry: false }
  );
  const scheduleCreateMutation = trpc.schedules.create.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => scheduleCreateMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.schedules.list.invalidate();
      await utils.audit.list.invalidate();
      toast("Payroll schedule activated.");
    },
  });
  const scheduleUpdateMutation = trpc.schedules.update.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => scheduleUpdateMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.schedules.list.invalidate();
      await utils.audit.list.invalidate();
      toast("Schedule status updated.");
    },
  });
  const approvalThresholdMutation =
    trpc.workspace.setApprovalThreshold.useMutation({
      onError: (error, input) => {
        setMutationError(error.message);
        setRetryAction(() => () => approvalThresholdMutation.mutate(input));
      },
      onSuccess: async () => {
        await utils.workspace.overview.invalidate();
        await utils.audit.list.invalidate();
        toast("Approval threshold updated.");
      },
    });
  const approvalDecisionMutation = trpc.approvals.decide.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => approvalDecisionMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.approvals.list.invalidate();
      await utils.audit.list.invalidate();
      toast("Approval decision recorded.");
    },
  });
  const createProofMutation = trpc.proofs.create.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => createProofMutation.mutate(input));
    },
    onSuccess: result => {
      setProofSlug(result.slug);
      toast("Receipt-backed proof link created.", {
        description:
          "Available only after the route has a confirmed Starknet receipt.",
      });
    },
  });
  const policyCreateMutation = trpc.treasury.createPolicy.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => policyCreateMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.treasury.policies.invalidate();
      toast("Treasury policy saved.");
    },
  });
  const claimCreateMutation = trpc.claims.create.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => claimCreateMutation.mutate(input));
    },
    onSuccess: result => {
      setClaimToken(result.token);
      toast("Unsigned private claim link created.", {
        description:
          "This creates a persisted request; it does not sign or move funds.",
      });
    },
  });
  const recordBalanceMutation = trpc.treasury.recordBalance.useMutation({
    onError: (error, input) => {
      setMutationError(error.message);
      setRetryAction(() => () => recordBalanceMutation.mutate(input));
    },
    onSuccess: async () => {
      await utils.treasury.balances.invalidate();
      toast("Treasury snapshot saved.");
    },
  });
  const selectedRoute = liveRoutes.find(route => route.id === selectedRouteId);
  const recipientReview = routeRecipientReviewQuery.data ?? [];
  const claimedRecipient =
    recipientReview.length === 1 &&
    recipientReview[0]?.fulfillmentStatus === "claimed" &&
    isValidStarknetAddress(recipientReview[0]?.fulfilledWalletAddress ?? "")
      ? recipientReview[0]
      : undefined;
  const claimedRouteTransaction = transactionsQuery.data?.find(
    transaction =>
      transaction.status === "submitted" || transaction.status === "confirmed"
  );
  useEffect(() => {
    if (!selectedRouteId) {
      setRecoveryHash("");
      return;
    }
    setRecoveryHash(
      safeLocalStorageGet(`veyra-submission-${selectedRouteId}`) ?? ""
    );
  }, [selectedRouteId]);
  const displayActivity = isAuthenticated
    ? liveRoutes.map(route => ({
        id: `VP-${String(route.id).padStart(3, "0")}`,
        routeId: route.id,
        title: route.name,
        detail: `${route.token} · ${route.totalAmount}`,
        state: route.status.toUpperCase(),
        time: new Date(route.createdAt).toLocaleDateString(),
      }))
    : activity;
  const workspaceError =
    workspaceListQuery.error ??
    overviewQuery.error ??
    recipientsQuery.error ??
    auditQuery.error ??
    transactionsQuery.error ??
    routeRecipientReviewQuery.error;
  const visibleError = workspaceError?.message ?? mutationError;
  useEffect(() => {
    const firstWorkspace = workspaceListQuery.data?.[0];
    if (!activeWorkspaceId && firstWorkspace) {
      setActiveWorkspaceId(firstWorkspace.workspace.id);
      safeLocalStorageSet(
        "veilpay-active-workspace",
        String(firstWorkspace.workspace.id)
      );
    }
  }, [activeWorkspaceId, workspaceListQuery.data]);

  function switchWorkspace(value: string) {
    const nextId = Number(value);
    if (!Number.isInteger(nextId) || nextId <= 0) return;
    setActiveWorkspaceId(nextId);
    safeLocalStorageSet("veilpay-active-workspace", String(nextId));
    void utils.workspace.list.invalidate();
    void utils.workspace.overview.invalidate();
    void utils.recipients.list.invalidate();
    void utils.audit.list.invalidate();
    void utils.routes.list.invalidate();
    toast("Workspace switched.", {
      description: "Refreshing private workspace data.",
    });
  }

  function navigateTo(path: string) {
    setMobileOpen(false);
    setLocation(path);
  }

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "routes" | "ledger" | "identity" | "operations"
  >("routes");
  const [operationsView, setOperationsView] = useState<
    "overview" | "treasury" | "claims"
  >("overview");
  const [routeName, setRouteName] = useState("March contractor run");
  const [tokenSymbol, setTokenSymbol] = useState("STRK");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>(
    []
  );
  const [amount, setAmount] = useState("0.2");
  const normalizedAmount = normalizeAmountInput(amount);
  const adjustAmount = (delta: number) => {
    const current = Number(normalizedAmount || 0);
    const next = Math.max(0, current + delta);
    setAmount(next.toLocaleString("en-US"));
  };
  const [stage, setStage] = useState(1);
  const [connected, setConnected] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [wallet, setWallet] = useState<VeilWallet>();
  const [walletAddress, setWalletAddress] = useState("");
  const [walletName, setWalletName] = useState("");
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [walletOptions, setWalletOptions] = useState<StarknetWalletOption[]>(
    []
  );
  const [walletQrUri, setWalletQrUri] = useState("");
  const [walletQrImage, setWalletQrImage] = useState("");
  const [walletQrLoading, setWalletQrLoading] = useState(false);
  const walletNetwork = networkFromChainId(wallet?.chainId);
  const executionCapability = onchainCapability(wallet, selectedNetwork);
  const strk20Readiness = describeStrk20Readiness(wallet, selectedNetwork);
  const walletCanSubmitStrk20 = Boolean(
    wallet?.strk20InvokeTransaction || wallet?.request
  );
  const [copied, setCopied] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [editingRecipientId, setEditingRecipientId] = useState<number | null>(
    null
  );
  const [scheduleFrequency, setScheduleFrequency] = useState<
    "weekly" | "biweekly" | "monthly"
  >("monthly");
  const [scheduleTimezone, setScheduleTimezone] = useState("UTC");
  const [scheduleNextRun, setScheduleNextRun] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [proofSlug, setProofSlug] = useState<string | null>(null);
  const [approvalThreshold, setApprovalThreshold] = useState("1");
  const [policyName, setPolicyName] = useState("Contractor payroll guardrail");
  const [policyMax, setPolicyMax] = useState("5000");
  const [policyDaily, setPolicyDaily] = useState("15000");
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [treasuryBalance, setTreasuryBalance] = useState("");
  const policySimulationQuery = trpc.treasury.simulate.useQuery(
    {
      token: tokenSymbol,
      totalAmount: normalizedAmount,
      approvalCount: Math.max(0, Number(approvalThreshold) || 0),
      network: selectedNetwork,
    },
    {
      enabled: isAuthenticated && /^\d+(\.\d{1,18})?$/.test(normalizedAmount),
      retry: false,
    }
  );

  const stageCopy = useMemo(() => stages[stage], [stage]);

  function openWalletPicker() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setWalletQrUri("");
    setWalletQrImage("");
    const options = discoverStarknetWallets();
    setWalletOptions(options);
    setWalletPickerOpen(true);
  }

  async function handleWalletConnect(selectedWallet?: VeilWallet) {
    if (walletConnecting) return;
    if (!selectedWallet) {
      openWalletPicker();
      return;
    }
    setWalletConnecting(true);
    try {
      const result = await connectVeilWallet(selectedWallet);
      if (!result.live || !result.wallet) {
        toast("Wallet did not return an account.", {
          description: "Approve the Starknet wallet connection and try again.",
        });
        return;
      }
      setWallet(result.wallet);
      setWalletName(result.wallet.name ?? "Starknet wallet");
      setWalletAddress(result.address ?? "");
      setConnected(true);
      setWalletPickerOpen(false);
      const detectedNetwork = result.network;
      toast("Wallet connected.", {
        description: detectedNetwork
          ? `${result.wallet.name ?? "Starknet wallet"} · ${networkLabel(detectedNetwork)} detected.`
          : `${result.wallet.name ?? "Starknet wallet"} connected. Select a network before signing.`,
      });
    } catch (error) {
      toast("Wallet connection was cancelled.", {
        description: String(error).slice(0, 120),
      });
    } finally {
      setWalletConnecting(false);
    }
  }


  async function handleWalletQr(option: StarknetWalletOption) {
    setWalletQrLoading(true);
    setWalletQrUri("");
    setWalletQrImage("");
    try {
      const result = await requestWalletQrConnection(option);
      if (!result?.uri) {
        toast("QR connection is not exposed by this wallet.", {
          description: "Use the browser extension connection instead.",
        });
        return;
      }
      setWalletQrUri(result.uri);
      setWalletQrImage(
        await QRCode.toDataURL(result.uri, {
          width: 240,
          margin: 1,
          color: { dark: "#111210", light: "#F3EEE5" },
        })
      );
    } catch (error) {
      toast("Could not create a wallet QR code.", {
        description: String(error).slice(0, 120),
      });
    } finally {
      setWalletQrLoading(false);
    }
  }

  async function advanceRoute() {
    if (!isDemoMode && stage >= 2) {
      document
        .getElementById("recent-routes")
        ?.scrollIntoView({ behavior: "smooth" });
      toast("Receipt verification is required.", {
        description:
          "A proof card is not a confirmation. Verify the submitted Mainnet receipt in Recent routes.",
      });
      return;
    }
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    const availableRecipients =
      recipientsQuery.data?.filter(
        recipient => recipient.status === "active"
      ) ?? [];
    const activeRecipientIds = selectedRecipientIds.filter(id =>
      availableRecipients.some(recipient => recipient.id === id)
    );
    if (activeRecipientIds.length !== selectedRecipientIds.length)
      setSelectedRecipientIds(activeRecipientIds);
    const selectedRecipients = activeRecipientIds
      .map(id => availableRecipients.find(recipient => recipient.id === id))
      .filter((recipient): recipient is NonNullable<typeof recipient> =>
        Boolean(recipient)
      );
    if (!availableRecipients.length || !activeRecipientIds.length) {
      toast(
        "Select at least one active recipient before creating a saved route.",
        {
          description:
            "The public preview remains available, but SaaS routes are workspace-backed.",
        }
      );
      document
        .getElementById("recipient-roster")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!connected) {
      await handleWalletConnect();
      return;
    }
    if (!isDemoMode && selectedRecipients.length !== 1) {
      toast("Mainnet signing currently supports one recipient per route.", {
        description:
          "Use one selected recipient for this signed action; multi-recipient batching remains unavailable until its contract flow is verified.",
      });
      return;
    }
    const tokenAddress = strk20TokenAddressForSymbol(tokenSymbol);
    const tokenDecimals = strk20TokenDecimalsForSymbol(tokenSymbol);
    if (
      !isDemoMode &&
      stage === 1 &&
      (!tokenAddress || tokenDecimals === undefined)
    ) {
      toast("This Mainnet asset is not configured for STRK20 execution.", {
        description:
          "Choose a verified Starknet Mainnet asset before sending another token.",
      });
      return;
    }
    if (!isDemoMode && stage === 1 && !walletCanSubmitStrk20) {
      toast("This wallet cannot submit the STRK20 Mainnet action.", {
        description:
          "Use a wallet exposing the official STRK20 wallet action before creating a production route. Veyra will not substitute a generic invoke or public transfer.",
      });
      return;
    }
    let savedRoute: { id: number } | undefined;
    if (stage === 1) {
      try {
        const routeInput = {
          clientRequestId: routeCreateRequestId,
          name: routeName.trim() || "Untitled private route",
          token: tokenSymbol,
          network: selectedNetwork,
          totalAmount: normalizedAmount,
          recipientAmounts: activeRecipientIds.map(recipientId => ({
            recipientId,
            amount: normalizedAmount,
          })),
        };
        savedRoute = editingRouteId
          ? await updateRouteMutation.mutateAsync({
              id: editingRouteId,
              ...routeInput,
            })
          : await createRouteMutation.mutateAsync(routeInput);
        setEditingRouteId(savedRoute.id);
        setSelectedRouteId(savedRoute.id);
      } catch (error) {
        toast("Route could not be saved.", {
          description: String(error).slice(0, 140),
        });
        return;
      }
    }
    if (wallet && walletCanSubmitStrk20 && stage === 1) {
      try {
        const amountSmallestUnit = decimalToScaledBigInt(
          normalizedAmount,
          tokenDecimals ?? 18
        );
        const tx = await submitShieldedRoute(
          wallet,
          amountSmallestUnit,
          selectedNetwork,
          selectedRecipients[0]?.walletAddress,
          tokenAddress ?? ""
        );
        if (!tx.transaction_hash) {
          toast("No private transaction was submitted.", {
            description:
              "The wallet returned no transaction hash. The saved route remains ready to sign.",
          });
          return;
        }
        if (!savedRoute?.id) {
          throw new Error(
            "A saved route is required before recording a wallet hash"
          );
        }
        safeLocalStorageSet(
          `veyra-submission-${savedRoute.id}`,
          tx.transaction_hash
        );
        try {
          await recordTransactionMutation.mutateAsync({
            routeId: savedRoute.id,
            network: selectedNetwork,
            transactionHash: tx.transaction_hash,
            status: "submitted",
            explorerUrl: explorerUrl(tx.transaction_hash, selectedNetwork),
          });
          safeLocalStorageRemove(`veyra-submission-${savedRoute.id}`);
        } catch (recordError) {
          setStage(2);
          toast("Wallet action submitted; Veyra must recover its record.", {
            description:
              "No second signature is needed. Open the saved route in Claims and record the returned hash before verifying its receipt.",
          });
          return;
        }
        setStage(2);
        setRouteCreateRequestId(crypto.randomUUID());
        toast("Private route submitted.", {
          description: `${networkLabel(selectedNetwork)} · Receipt verification is required before settlement is confirmed.`,
        });
        return;
      } catch (error) {
        toast("STRK20 action was not submitted.", {
          description:
            describeStrk20SubmissionError(error) ?? String(error).slice(0, 180),
        });
        return;
      }
    }
    setStage(current => Math.min(current + 1, stages.length - 1));
    toast(stage >= 2 ? "Proof card prepared." : "Demo route created.", {
      description:
        "The public chain sees a commitment, not your recipient roster.",
    });
  }

  async function submitClaimedRecipientRoute() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!selectedRouteId || !selectedRoute) {
      toast("Select a saved route before reviewing a claim.");
      return;
    }
    if (selectedRoute.network !== "mainnet") {
      toast("Claimed private transactions are Mainnet-only.");
      return;
    }
    if (!claimedRecipient) {
      toast("A single claimed recipient is required.", {
        description:
          "This guarded flow supports one claimed recipient only. Review the route recipients before requesting a private wallet action.",
      });
      return;
    }
    if (claimedRouteTransaction) {
      toast("A private transaction is already recorded for this route.", {
        description:
          claimedRouteTransaction.status === "confirmed"
            ? "The receipt is confirmed. Do not request another wallet signature."
            : "Verify the recorded receipt before requesting any additional wallet action.",
      });
      return;
    }
    if (claimWalletActionPending) {
      toast("A wallet action is already awaiting a result.", {
        description:
          "Do not sign again. Wait for the wallet response or recover the returned hash.",
      });
      return;
    }
    if (!connected || !wallet) {
      toast("Connect a STRK20-capable wallet to continue.", {
        description:
          "The next step opens your wallet picker. No transaction will be requested until you review it in the wallet.",
      });
      openWalletPicker();
      return;
    }
    if (!walletCanSubmitStrk20) {
      toast("This wallet cannot submit the STRK20 Mainnet action.", {
        description:
          "No private transaction was created. Use a wallet exposing the official STRK20 wallet action; Veyra will not substitute a generic invoke or public transfer.",
      });
      return;
    }
    const tokenAddress = strk20TokenAddressForSymbol(selectedRoute.token);
    const tokenDecimals = strk20TokenDecimalsForSymbol(selectedRoute.token);
    const routeAmount = normalizeAmountInput(selectedRoute.totalAmount);
    if (!tokenAddress || tokenDecimals === undefined || !routeAmount) {
      toast("The claimed route cannot be submitted.", {
        description:
          "Its asset or amount is not configured for verified STRK20 Mainnet execution.",
      });
      return;
    }
    setClaimWalletActionPending(true);
    try {
      const tx = await submitShieldedRoute(
        wallet,
        decimalToScaledBigInt(routeAmount, tokenDecimals),
        selectedNetwork,
        claimedRecipient.fulfilledWalletAddress ?? "",
        tokenAddress
      );
      if (!tx.transaction_hash) {
        toast("No private transaction was submitted.", {
          description:
            "The wallet returned no transaction hash. The claim remains recorded and the route remains ready to sign.",
        });
        return;
      }
      safeLocalStorageSet(
        `veyra-submission-${selectedRouteId}`,
        tx.transaction_hash
      );
      try {
        await recordTransactionMutation.mutateAsync({
          routeId: selectedRouteId,
          network: selectedNetwork,
          transactionHash: tx.transaction_hash,
          status: "submitted",
          explorerUrl: explorerUrl(tx.transaction_hash, selectedNetwork),
        });
        safeLocalStorageRemove(`veyra-submission-${selectedRouteId}`);
      } catch (recordError) {
        setStage(2);
        setRecoveryHash(tx.transaction_hash);
        toast("Wallet action submitted; Veyra must recover its record.", {
          description:
            "No second signature is needed. Verify the returned hash from this route instead.",
        });
        return;
      }
      setStage(2);
      await Promise.all([
        utils.workspace.overview.invalidate(),
        utils.transactions.listRoute.invalidate({ routeId: selectedRouteId }),
      ]);
      toast("Private transaction submitted.", {
        description: `${networkLabel(selectedNetwork)} · Receipt verification is still required before settlement is confirmed.`,
      });
    } catch (error) {
      toast("STRK20 action was not submitted.", {
        description:
          describeStrk20SubmissionError(error) ?? String(error).slice(0, 180),
      });
    } finally {
      setClaimWalletActionPending(false);
    }
  }

  function viewContracts() {
    window.open(
      "https://strk20.starknet.io/build",
      "_blank",
      "noopener,noreferrer"
    );
    toast("Opening the STRK20 build documentation.");
  }

  function goToSection(
    section: "routes" | "ledger" | "identity" | "operations"
  ) {
    setActiveSection(section);
    const target =
      section === "routes"
        ? "route-builder"
        : section === "ledger"
          ? "proof-ledger"
          : section === "identity"
            ? "identity-keys"
            : "operations";
    document
      .getElementById(target)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  }

  function goToOperations(view: "overview" | "treasury" | "claims") {
    setOperationsView(view);
    goToSection("operations");
  }

  function openProductSurface(surface: (typeof productSurfaces)[number]) {
    if (surface.targetType === "section") {
      if (surface.target === "routes" || surface.target === "ledger" || surface.target === "identity") {
        goToSection(surface.target);
      } else if (surface.target === "operations") {
        goToOperations("overview");
      } else {
        goToOperations(surface.target);
      }
      return;
    }
    navigateTo(surface.target);
  }

  async function copyProof() {
    const copiedSuccessfully = await copyText("veilpay://proof/VP-019/strk20");
    if (!copiedSuccessfully) {
      toast("Copy failed.", {
        description:
          "Your browser blocked clipboard access; select the reference manually.",
      });
      return;
    }
    setCopied(true);
    toast("Proof reference copied.");
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function downloadAuditCsv() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    try {
      const csv = await utils.analytics.auditCsv.fetch();
      const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "veilpay-audit-export.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      toast("Audit CSV downloaded.");
    } catch (error) {
      toast("Audit export failed.", {
        description: String(error).slice(0, 120),
      });
    }
  }

  return (
    <div className="page-shell min-h-screen overflow-hidden bg-[#111210] text-[#F3EEE5] selection:bg-[#70D49D] selection:text-[#111210]">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.11] [background-image:radial-gradient(#F3EEE5_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-[204px] shrink-0 border-r border-[#163B4A]/70 bg-[#111210]/95 px-5 py-6 lg:flex lg:flex-col">
          <VeyraBrand />

          <nav
            className="mt-11 space-y-6"
            aria-label="Veyra workspace navigation"
          >
            <div className="space-y-1">
              <div className="nav-group-label">WORKSPACE</div>
              <button
                onClick={() => goToSection("routes")}
                aria-current={activeSection === "routes" ? "page" : undefined}
                className={`nav-item ${activeSection === "routes" ? "nav-item-active" : ""}`}
              >
                <WalletCards size={16} /> <span>Payment routes</span>
                <span className="ml-auto pr-3 font-mono text-[9px] tracking-[0.08em] text-[#D7E0E0]">
                  {isAuthenticated
                    ? String(liveRoutes.length).padStart(2, "0")
                    : "03"}
                </span>
              </button>
              <button
                onClick={() => goToSection("ledger")}
                aria-current={activeSection === "ledger" ? "page" : undefined}
                className={`nav-item ${activeSection === "ledger" ? "nav-item-active" : ""}`}
              >
                <Shield size={16} /> <span>Proof ledger</span>
              </button>
              <button
                onClick={() => goToSection("identity")}
                aria-current={activeSection === "identity" ? "page" : undefined}
                className={`nav-item ${activeSection === "identity" ? "nav-item-active" : ""}`}
              >
                <KeyRound size={16} /> <span>Identity keys</span>
              </button>
            </div>
            <div className="space-y-1">
              <div className="nav-group-label">CONTROL</div>
              <button
                onClick={() => goToOperations("overview")}
                aria-current={
                  activeSection === "operations" &&
                  operationsView === "overview"
                    ? "page"
                    : undefined
                }
                className={`nav-item ${activeSection === "operations" && operationsView === "overview" ? "nav-item-active" : ""}`}
              >
                <Workflow size={16} /> <span>Operations</span>
              </button>
              <button
                onClick={() => goToOperations("treasury")}
                aria-current={
                  activeSection === "operations" &&
                  operationsView === "treasury"
                    ? "page"
                    : undefined
                }
                className={`nav-item nav-item-sub ${activeSection === "operations" && operationsView === "treasury" ? "nav-item-active" : ""}`}
              >
                <LockKeyhole size={14} /> <span>Treasury</span>
              </button>
              <button
                onClick={() => goToOperations("claims")}
                aria-current={
                  activeSection === "operations" && operationsView === "claims"
                    ? "page"
                    : undefined
                }
                className={`nav-item nav-item-sub ${activeSection === "operations" && operationsView === "claims" ? "nav-item-active" : ""}`}
              >
                <Link2 size={14} /> <span>Claims</span>
              </button>
            </div>
            <div className="space-y-1">
              <div className="nav-group-label">PROTOCOL</div>
              <button
                onClick={() => {
                  navigateTo("/launchpad");
                }}
                className="nav-item"
              >
                <Sparkles size={16} /> <span>Launchpad</span>
              </button>
              <button
                onClick={() => {
                  navigateTo("/private-primitives");
                }}
                className="nav-item"
              >
                <Blocks size={16} /> <span>Private primitives</span>
              </button>
              <button
                onClick={() => {
                  navigateTo("/private-markets");
                }}
                className="nav-item"
              >
                <LineChart size={16} /> <span>Private markets</span>
              </button>
              <button
                onClick={() => {
                  navigateTo("/agent");
                }}
                className="nav-item"
              >
                <Bot size={16} /> <span>Veyra Agent</span>
              </button>
            </div>
            <div className="space-y-1">
              <div className="nav-group-label">RESOURCE</div>
              <button
                onClick={() => {
                  navigateTo("/docs");
                }}
                className="nav-item"
              >
                <BookOpen size={16} /> <span>Documentation</span>
              </button>
              <button
                onClick={() => {
                  navigateTo("/demo");
                }}
                className="nav-item"
              >
                <PlayCircle size={16} /> <span>Demo mode</span>
              </button>
            </div>
          </nav>

          <div className="mt-auto rounded-[16px] border border-[#70D49D]/20 bg-[#163B4A]/75 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-[0.16em] text-[#AEB8BE]">
                NETWORK
              </span>
              <span className="h-2 w-2 rounded-full bg-[#70D49D] shadow-[0_0_12px_#70D49D]" />
            </div>
            <div className="mt-3 font-display text-[15px] text-[#F3EEE5]">
              Starknet mainnet
            </div>
            <div className="mt-1 text-[12px] leading-5 text-[#AEB8BE]">
              Production path. Wallet approval required.
            </div>
            <button
              type="button"
              onClick={viewContracts}
              className="mt-4 flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-[#F0563A] hover:text-[#FF7257]"
            >
              VIEW CONTRACTS <ArrowUpRight size={12} />
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#111210]/80 px-5 py-4 backdrop-blur-xl supports-[backdrop-filter]:bg-[#111210]/65 sm:px-8 lg:justify-end lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(open => !open)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-workspace-navigation"
                className="rounded-lg border border-white/10 p-2 transition-colors hover:border-white/25 hover:bg-white/5"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <VeyraBrand compact mobileMarkOnly />
            </div>

            <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3">
              <div className="shrink-0 rounded-full border border-[#F0563A]/40 bg-[#201815] px-2 py-2 font-mono text-[9px] tracking-[0.1em] text-[#F0563A] sm:px-3">
                <span className="sm:hidden">MAINNET</span>
                <span className="hidden sm:inline">STARKNET MAINNET</span>
              </div>
              {isAuthenticated && (
                <Button
                  disabled={isWalletActionLocked(walletConnecting)}
                  onClick={openWalletPicker}
                  className="h-9 rounded-full bg-[#F0563A] px-4 font-mono text-[10px] tracking-[0.12em] text-[#111210] hover:bg-[#FF7257]"
                >
                  {walletConnecting
                    ? "CONNECTING…"
                    : connected
                      ? `${walletName || "WALLET"} · ${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
                      : "ADD WALLET"}
                </Button>
              )}
            </div>
          </header>

          {mobileOpen && (
            <div
              id="mobile-workspace-navigation"
              className="mobile-nav-panel border-b border-white/10 bg-[#151D21] px-5 py-4 lg:hidden"
            >
              {isAuthenticated && (
                <label className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3 font-mono text-[10px] tracking-[0.12em] text-[#AEB8BE]">
                  WORKSPACE
                  <select
                    aria-label="Mobile active workspace"
                    value={activeWorkspaceId ?? ""}
                    onChange={event => switchWorkspace(event.target.value)}
                    className="max-w-[190px] bg-transparent text-right text-[#F3EEE5] outline-none"
                  >
                    <option value="" disabled>
                      SELECT
                    </option>
                    {(workspaceListQuery.data ?? []).map(membership => (
                      <option
                        key={membership.workspace.id}
                        value={membership.workspace.id}
                      >
                        {membership.workspace.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                onClick={() => goToSection("routes")}
                className={`nav-item w-full ${activeSection === "routes" ? "nav-item-active" : ""}`}
              >
                Payment routes{" "}
                <span className="ml-auto font-mono text-[10px]">
                  {isAuthenticated
                    ? String(liveRoutes.length).padStart(2, "0")
                    : "03"}
                </span>
              </button>
              <button
                onClick={() => goToSection("ledger")}
                className={`nav-item w-full ${activeSection === "ledger" ? "nav-item-active" : ""}`}
              >
                Proof ledger
              </button>
              <button
                onClick={() => goToSection("identity")}
                className={`nav-item w-full ${activeSection === "identity" ? "nav-item-active" : ""}`}
              >
                Identity keys
              </button>
              <button
                onClick={() => goToOperations("overview")}
                className={`nav-item w-full ${activeSection === "operations" && operationsView === "overview" ? "nav-item-active" : ""}`}
              >
                Operations
              </button>
              <button
                onClick={() => goToOperations("treasury")}
                className={`nav-item w-full pl-8 text-[11px] ${activeSection === "operations" && operationsView === "treasury" ? "nav-item-active" : ""}`}
              >
                Treasury
              </button>
              <button
                onClick={() => goToOperations("claims")}
                className={`nav-item w-full pl-8 text-[11px] ${activeSection === "operations" && operationsView === "claims" ? "nav-item-active" : ""}`}
              >
                Claims
              </button>
              <button
                onClick={() => {
                  navigateTo("/launchpad");
                }}
                className="nav-item w-full"
              >
                <Sparkles size={15} /> Launchpad
              </button>
              <button
                onClick={() => {
                  navigateTo("/private-primitives");
                }}
                className="nav-item w-full"
              >
                <Fingerprint size={15} /> Private primitives
              </button>
              <button
                onClick={() => {
                  navigateTo("/private-markets");
                }}
                className="nav-item w-full"
              >
                <BarChart3 size={15} /> Private markets
              </button>
              <button
                onClick={() => {
                  navigateTo("/agent");
                }}
                className="nav-item w-full"
              >
                <Bot size={15} /> Veyra Agent
              </button>
              <button
                onClick={() => {
                  navigateTo("/docs");
                }}
                className="nav-item w-full"
              >
                <BookOpen size={15} /> Documentation
              </button>
            </div>
          )}
          {visibleError && isAuthenticated && (
            <div className="flex items-center justify-between gap-4 border-b border-[#F0563A]/30 bg-[#F0563A]/10 px-5 py-3 font-mono text-[10px] tracking-[0.08em] text-[#FFB1A3] sm:px-8 lg:px-12">
              <span>
                WORKSPACE ACTION FAILED / {visibleError.slice(0, 100)}
              </span>
              <button
                onClick={() => {
                  if (retryAction) retryAction();
                  else {
                    void workspaceListQuery.refetch();
                    void overviewQuery.refetch();
                    void recipientsQuery.refetch();
                    void auditQuery.refetch();
                    void transactionsQuery.refetch();
                  }
                  setMutationError(null);
                }}
                className="shrink-0 rounded-full border border-[#F0563A]/40 px-3 py-1 text-[#F3EEE5] hover:bg-[#F0563A] hover:text-[#111210]"
              >
                RETRY
              </button>
            </div>
          )}

          <section className="relative isolate overflow-hidden border-b border-white/10 px-5 py-11 sm:px-8 lg:px-8 lg:py-14">
            <img
              src="/manus-storage/veilpay-hero_c0925870.png"
              alt="Copper cryptographic veil texture"
              className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#111210] via-[#111210]/75 to-[#163B4A]/35" />
            <div className="max-w-[900px]">
              <div className="section-marker mb-6 flex items-center gap-3">
                <span className="h-[2px] w-10 shrink-0 rounded-full bg-[#F0563A]" />
                <span>PRIVATE PAYROLL / STRK20</span>
              </div>
              <h1 className="font-display max-w-[780px] text-[clamp(3.2rem,8vw,7.7rem)] font-bold leading-[0.86] tracking-[-0.08em] text-[#F3EEE5]">
                Move the money.
                <br />
                <span className="text-[#F0563A]">Keep the roster</span>
                <br />
                private.
              </h1>
              <p className="mt-8 max-w-[520px] text-[15px] leading-7 text-[#BDB5A9]">
                Veyra turns a recipient list into a private STRK20 route. Your
                team gets a payment workflow with a proof card, not a public
                spreadsheet of who got paid.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-5">
                <Button
                  onClick={() =>
                    document
                      .getElementById("route-builder")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="group h-12 rounded-full bg-[#F3EEE5] px-6 font-mono text-[10px] tracking-[0.13em] text-[#111210] hover:bg-white"
                >
                  CREATE PRIVATE ROUTE{" "}
                  <ArrowUpRight
                    className="ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                    size={15}
                  />
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("system-map")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="group h-12 rounded-full border-white/20 bg-transparent px-6 font-mono text-[10px] tracking-[0.13em] text-[#F3EEE5] hover:border-[#F0563A]/60 hover:bg-[#F0563A]/10"
                >
                  EXPLORE THE SYSTEM <ArrowUpRight className="ml-2" size={15} />
                </Button>
                <span className="font-mono text-[10px] leading-5 tracking-[0.1em] text-[#AEB8BE]">
                  PUBLICLY VERIFIABLE
                  <br />
                  AFTER RECEIPT CONFIRMATION
                </span>
              </div>
            </div>
          </section>

          <section
            className="border-b border-white/10 bg-[#0D1010] px-5 py-16 sm:px-8 lg:px-8 lg:py-24"
            aria-labelledby="veyra-teaser-title"
          >
            <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div className="max-w-[430px]">
                <div className="eyebrow">02 / VIEWING ROOM</div>
                <h2
                  id="veyra-teaser-title"
                  className="mt-5 font-display text-[clamp(3rem,5.3vw,5.4rem)] font-semibold leading-[0.88] tracking-[-0.075em] text-[#F3EEE5]"
                >
                  See the boundary.
                  <br />
                  <span className="text-[#F0563A]">Feel the system.</span>
                </h2>
                <p className="mt-7 max-w-[390px] text-[15px] leading-7 text-[#BDB5A9]">
                  A thirty-second institutional cut for Veyra’s private-payroll
                  operating model: governed intent, sealed allocations, private
                  markets, and receipt-backed proof.
                </p>
              </div>
              <div className="border border-[#F0563A]/45 bg-[#0A0C0C] p-3 sm:p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[9px] uppercase tracking-[0.15em]">
                  <span className="text-[#F0563A]">
                    Film 01 / Product thesis
                  </span>
                  <span className="border border-[#6DE3A1]/35 px-2 py-1 text-[8px] text-[#6DE3A1]">
                    Stable cut
                  </span>
                </div>
                <div className="mt-3 border border-white/15 bg-black p-1">
                  <video
                    className="aspect-video w-full bg-black object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    aria-label="Thirty-second Veyra teaser with voiceover and original score"
                  >
                    <source
                      src="/manus-storage/veyra-30s-logo-led-stable-teaser_edb01985.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support the Veyra teaser.
                  </video>
                </div>
                <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <p className="max-w-[420px] text-[12px] leading-5 text-[#D5CEC4]">
                    A private coordination system should make its execution
                    boundary legible: prepare, authorize, confirm, and prove.
                  </p>
                  <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#AEB8BE]">
                    Wallet → Receipt → Proof
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="system-map"
            className="border-b border-white/10 bg-[#111210] px-5 py-16 sm:px-8 lg:px-8 lg:py-24"
            aria-labelledby="system-map-title"
          >
            <div className="mx-auto max-w-[1180px]">
              <div className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-[720px]">
                  <div className="eyebrow text-[#F0563A]">03 / INSTITUTIONAL MAP</div>
                  <h2 id="system-map-title" className="mt-5 font-display text-[clamp(3rem,6vw,6.8rem)] font-semibold leading-[0.86] tracking-[-0.08em] text-[#F3EEE5]">
                    One system.
                    <br />
                    <span className="text-[#F0563A]">Ten operating surfaces.</span>
                  </h2>
                  <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#BDB5A9]">
                    Veyra is not a single transfer screen. It is an institutional operating layer for private financial coordination on Starknet: prepare the intent, govern the risk, coordinate the protocol, and leave an inspectable proof trail.
                  </p>
                </div>
                <div className="max-w-[270px] border-l border-[#F0563A]/50 pl-4 font-mono text-[10px] leading-5 tracking-[0.1em] text-[#AEB8BE]">
                  EVERY SURFACE HAS A DESTINATION.
                  <br />
                  EVERY LIVE ACTION HAS A BOUNDARY.
                </div>
              </div>

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {productSurfaces.map(surface => {
                  const Icon = surface.icon;
                  return (
                    <article key={surface.title} className={`surface-map-card surface-map-card--${surface.shape} group flex min-h-[280px] flex-col justify-between bg-[#151D21] p-6 transition-colors hover:bg-[#1B2930] sm:p-7`}>
                      <div>
                        <div className="flex items-center justify-between gap-3 font-mono text-[9px] tracking-[0.12em] text-[#7F8F97]">
                          <span className="text-[#F0563A]">{surface.group}</span>
                          <span className="surface-map-icon flex size-9 items-center justify-center rounded-full border border-[#70D49D]/30 bg-[#70D49D]/8">
                            <Icon size={17} className="text-[#70D49D]" aria-hidden="true" />
                          </span>
                        </div>
                        <h3 className="mt-7 font-display text-2xl font-semibold tracking-[-0.04em] text-[#F3EEE5]">{surface.title}</h3>
                        <p className="mt-3 max-w-[31ch] text-sm leading-6 text-[#AEB8BE]">{surface.copy}</p>
                      </div>
                      <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <span className="font-mono text-[9px] tracking-[0.1em] text-[#70D49D]">{surface.signal}</span>
                        <button type="button" onClick={() => openProductSurface(surface)} className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] text-[#F3EEE5] transition-colors hover:text-[#F0563A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0563A]/70">
                          {surface.action} <ArrowUpRight size={12} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            id="route-builder"
            className="grid border-b border-white/10 xl:grid-cols-[1.18fr_.82fr]"
          >
            <div className="border-b border-white/10 p-5 sm:p-8 lg:p-12 xl:border-b-0 xl:border-r">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="eyebrow">01 / ROUTE BUILDER</div>
                  <h2 className="section-title">
                    A payment intent
                    <br />
                    <span>without the exposure.</span>
                  </h2>
                </div>
                <div className="rounded-full border border-[#F0563A]/40 px-3 py-1 font-mono text-[9px] tracking-[0.1em] text-[#F0563A]">
                  {stageCopy.label}
                </div>
              </div>
              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label className="field-label">ROUTE NAME</Label>
                  <Input
                    value={routeName}
                    onChange={event => setRouteName(event.target.value)}
                    className="field-input"
                  />
                </div>
                <div>
                  <Label className="field-label">ASSET</Label>
                  <div className="relative">
                    <select
                      value={tokenSymbol}
                      onChange={event => setTokenSymbol(event.target.value)}
                      className="field-input w-full appearance-none pr-16"
                      aria-label="Mainnet asset"
                    >
                      {Object.values(STRK20_ASSETS).map(asset => (
                        <option key={asset.symbol} value={asset.symbol}>
                          {asset.symbol}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#AEB8BE]">
                      STRK20
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="field-label">TOTAL AMOUNT</Label>
                  <div className="amount-stepper">
                    <Input
                      aria-label="Total amount"
                      inputMode="decimal"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="field-input amount-stepper-input"
                    />
                    <span className="amount-stepper-token">{tokenSymbol}</span>
                    <div
                      className="amount-stepper-controls"
                      aria-label="Adjust total amount"
                    >
                      <button
                        type="button"
                        aria-label="Increase total amount"
                        onClick={() => adjustAmount(100)}
                        className="amount-stepper-button"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        aria-label="Decrease total amount"
                        disabled={Number(normalizedAmount || 0) <= 0}
                        onClick={() => adjustAmount(-100)}
                        className="amount-stepper-button"
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="field-label">RECIPIENTS</Label>
                  <div className="field-input flex items-center justify-between">
                    <span>
                      {selectedRecipientIds.length || "None selected"}
                    </span>
                    <span className="font-mono text-[10px] text-[#AEB8BE]">
                      ROSTER
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-[14px] border border-white/10 bg-[#151D21]/75 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-[#F3EEE5]">
                  <EyeOff size={15} className="text-[#F0563A]" />
                  <span className="font-mono text-[10px] tracking-[0.12em]">
                    WHAT STAYS SHIELDED
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-[13px] text-[#A8A195] sm:grid-cols-3">
                  <div>
                    <span className="block text-[#F3EEE5]">
                      Recipient roster
                    </span>
                    not published
                  </div>
                  <div>
                    <span className="block text-[#F3EEE5]">
                      Individual amounts
                    </span>
                    not published
                  </div>
                  <div>
                    <span className="block text-[#F3EEE5]">
                      Proof reference
                    </span>
                    shareable
                  </div>
                </div>
              </div>
              <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
                <div className="font-mono text-[10px] tracking-[0.1em] text-[#AEB8BE]">
                  {selectedRecipientIds.length || "0"} RECIPIENTS /{" "}
                  {amount || "0"} {tokenSymbol}
                </div>
                <Button
                  disabled={
                    createRouteMutation.isPending ||
                    updateRouteMutation.isPending ||
                    recordTransactionMutation.isPending ||
                    (!normalizedAmount && isAuthenticated)
                  }
                  onClick={advanceRoute}
                  className="h-11 rounded-full bg-[#F0563A] px-5 font-mono text-[10px] tracking-[0.12em] text-[#111210] hover:bg-[#FF7257]"
                >
                  {createRouteMutation.isPending ||
                  updateRouteMutation.isPending ||
                  recordTransactionMutation.isPending
                    ? "PROCESSING…"
                    : stage >= 2
                      ? "VERIFY RECEIPT"
                      : editingRouteId
                        ? "SAVE DRAFT CHANGES"
                        : "CREATE PRIVATE ROUTE"}
                  <ChevronRight className="ml-2" size={15} />
                </Button>
              </div>
            </div>

            <div className="relative isolate overflow-hidden bg-[#151D21] p-5 sm:p-8 lg:p-12">
              <img
                src="/manus-storage/veilpay-note_9aafc0f6.png"
                alt="Encrypted payment notes"
                className="pointer-events-none absolute bottom-[-6%] right-[-7%] w-[82%] max-w-[560px] opacity-[0.22] mix-blend-soft-light saturate-[0.7] [mask-image:radial-gradient(ellipse_at_72%_58%,rgba(0,0,0,.88)_22%,rgba(0,0,0,.62)_54%,transparent_88%)] sm:bottom-[-4%] sm:right-[-5%] sm:w-[78%]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-[#151D21]/35 to-[#151D21]/90" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#151D21] via-[#151D21]/45 to-transparent" />
              <div className="relative z-10">
                <div className="eyebrow">02 / PRIVACY STATE</div>
                <h2 className="section-title max-w-[420px]">
                  The route is
                  <br />
                  <span>the product.</span>
                </h2>
                <div className="mt-12 space-y-0">
                  {stages.map((item, index) => (
                    <div
                      key={item.label}
                      className={`relative flex gap-4 pb-8 ${index === stages.length - 1 ? "pb-0" : ""}`}
                    >
                      <div
                        className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${index <= stage ? "border-[#F0563A] bg-[#F0563A] text-[#111210]" : "border-white/20 text-[#7F8F97]"}`}
                      >
                        {index < stage ? (
                          <Check size={14} strokeWidth={3} />
                        ) : (
                          <span className="font-mono text-[10px]">
                            0{index + 1}
                          </span>
                        )}
                        {index !== stages.length - 1 && (
                          <span
                            className={`absolute left-1/2 top-7 h-[calc(100%+8px)] w-px -translate-x-1/2 ${index < stage ? "bg-[#F0563A]" : "bg-white/10"}`}
                          />
                        )}
                      </div>
                      <div>
                        <div
                          className={`font-mono text-[10px] tracking-[0.14em] ${index <= stage ? "text-[#F3EEE5]" : "text-[#7F8F97]"}`}
                        >
                          {item.label}
                        </div>
                        <p className="mt-1 max-w-[260px] text-[12px] leading-5 text-[#AEB8BE]">
                          {item.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            id="proof-ledger"
            className="grid gap-10 border-b border-white/10 px-5 py-11 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:px-8 lg:py-14"
          >
            <div>
              <div className="eyebrow">03 / PROOF LEDGER</div>
              <h2 className="section-title">
                Privacy that
                <br />
                <span>can be explained.</span>
              </h2>
              <p className="mt-6 max-w-[350px] text-[14px] leading-6 text-[#AEB8BE]">
                Every route leaves a small, shareable receipt: the contract, the
                commitment, and the state. Never the roster.
              </p>
              <div className="mt-5 font-mono text-[9px] tracking-[0.1em] text-[#70D49D]">
                {isAuthenticated
                  ? `${auditQuery.data?.length ?? 0} AUDIT EVENTS / WORKSPACE-BOUND`
                  : "PUBLIC PREVIEW / WORKSPACE EVENTS NOT LOADED"}
              </div>
              <button
                onClick={copyProof}
                className="mt-8 flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-[#F0563A]"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
                {copied ? "REFERENCE COPIED" : "COPY SAMPLE PROOF"}
              </button>
            </div>
            <div
              id="recent-routes"
              className="overflow-hidden rounded-[16px] border border-white/10 bg-[#151D21]"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="font-mono text-[10px] tracking-[0.15em] text-[#AEB8BE]">
                  RECENT ROUTES
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-[#70D49D]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#70D49D]" />{" "}
                  LIVE INDEX
                </div>
              </div>
              {displayActivity.map(item => (
                <div
                  key={item.id}
                  className="group flex items-center gap-4 border-b border-white/10 px-5 py-5 last:border-b-0"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[#F0563A]/25 bg-[#201815] shadow-[inset_0_0_0_1px_rgba(240,86,58,0.06)]">
                    <LockKeyhole size={16} className="text-[#F0563A]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[15px] text-[#F3EEE5]">
                      {item.title}
                    </div>
                    <div className="mt-1 font-mono text-[9px] tracking-[0.08em] text-[#7F8F97]">
                      {item.id} / {item.detail}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <Badge className="border border-[#F0563A]/30 bg-transparent font-mono text-[9px] tracking-[0.08em] text-[#F0563A]">
                      {item.state}
                    </Badge>
                    <div className="mt-2 font-mono text-[9px] text-[#7F8F97]">
                      {item.time}
                    </div>
                  </div>
                  {item.routeId && (
                    <>
                      <button
                        onClick={() => setSelectedRouteId(item.routeId ?? null)}
                        className="font-mono text-[9px] tracking-[0.08em] text-[#AEB8BE] hover:text-[#F0563A]"
                      >
                        RECEIPTS
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRouteId(item.routeId ?? null);
                          goToOperations("claims");
                        }}
                        className="font-mono text-[9px] tracking-[0.08em] text-[#AEB8BE] hover:text-[#F0563A]"
                      >
                        CLAIM REVIEW
                      </button>
                      <button
                        onClick={() => {
                          const route = liveRoutes.find(
                            candidate => candidate.id === item.routeId
                          );
                          if (!route) {
                            toast("Route is no longer available.");
                            return;
                          }
                          const recipientIdsPromise =
                            utils.routes.recipients.fetch({
                              routeId: route.id,
                            });
                          void recipientIdsPromise.then(recipientIds => {
                            const editState = prepareRouteEdit(
                              route,
                              recipientIds
                            );
                            if (!editState.editable) {
                              toast(editState.message);
                              return;
                            }
                            setEditingRouteId(editState.routeId);
                            setRouteName(editState.name);
                            setTokenSymbol(editState.token);
                            setAmount(editState.totalAmount);
                            setSelectedRecipientIds(editState.recipientIds);
                            setStage(1);
                            toast("Draft loaded into the route builder.");
                          });
                        }}
                        className="font-mono text-[9px] tracking-[0.08em] text-[#AEB8BE] hover:text-[#F0563A]"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() =>
                          void transitionRouteMutation.mutateAsync({
                            id: item.routeId,
                            status: "routed",
                          })
                        }
                        className="font-mono text-[9px] tracking-[0.08em] text-[#AEB8BE] hover:text-[#F0563A]"
                      >
                        ROUTE
                      </button>
                    </>
                  )}
                  <ArrowUpRight
                    size={16}
                    className="text-[#7F8F97] transition-colors group-hover:text-[#F0563A]"
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-[#151D21] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div
                  aria-hidden="true"
                  className="absolute right-0 top-0 h-8 w-8 border-b border-l border-[#F0563A]/25 bg-[#201815]"
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">
                    AUDIT HISTORY
                  </div>
                  <span className="font-mono text-[8px] tracking-[0.1em] text-[#F0563A]">
                    SEALED EVENT REGISTER
                  </span>
                </div>
                {isAuthenticated ? (
                  (auditQuery.data?.slice(0, 5).map(event => (
                    <div
                      key={event.id}
                      className="mt-3 flex items-center justify-between gap-3 border-b border-white/5 pb-2 font-mono text-[9px] text-[#A8A195]"
                    >
                      <span>{event.action}</span>
                      <span className="text-[#7F8F97]">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )) ?? (
                    <div className="mt-3 font-mono text-[9px] text-[#7F8F97]">
                      NO EVENTS YET
                    </div>
                  ))
                ) : (
                  <div className="mt-3 font-mono text-[9px] text-[#7F8F97]">
                    WORKSPACE CONTEXT REQUIRED FOR PRIVATE EVENTS
                  </div>
                )}
              </div>
              <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-[#151D21] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div
                  aria-hidden="true"
                  className="absolute right-0 top-0 h-8 w-8 border-b border-l border-[#F0563A]/25 bg-[#201815]"
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">
                    TRANSACTION RECEIPTS
                  </div>
                  <span className="font-mono text-[8px] tracking-[0.1em] text-[#F0563A]">
                    RECEIPT VAULT
                  </span>
                </div>
                {selectedRouteId ? (
                  transactionsQuery.data?.length ? (
                    transactionsQuery.data.map(tx => (
                      <div
                        key={tx.id}
                        className="mt-3 flex items-center justify-between gap-3 border-b border-white/5 pb-2 font-mono text-[9px] text-[#A8A195]"
                      >
                        <span className="truncate" title={tx.transactionHash}>
                          {tx.transactionHash}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span
                            className={
                              tx.status === "confirmed"
                                ? "text-[#70D49D]"
                                : tx.status === "reverted"
                                  ? "text-[#F0563A]"
                                  : "text-[#CFC7BC]"
                            }
                          >
                            {tx.status.toUpperCase()}
                          </span>
                          {tx.status !== "confirmed" && (
                            <button
                              type="button"
                              disabled={confirmTransactionMutation.isPending}
                              onClick={() =>
                                confirmTransactionMutation.mutate({
                                  transactionHash: tx.transactionHash,
                                })
                              }
                              className="text-[#F0563A] hover:text-[#FF8C76]"
                            >
                              VERIFY
                            </button>
                          )}
                          {tx.explorerUrl && (
                            <a
                              href={tx.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#AEB8BE] hover:text-[#F3EEE5]"
                            >
                              OPEN
                            </a>
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="mt-3 font-mono text-[9px] text-[#7F8F97]">
                      NO RECEIPTS FOR SELECTED ROUTE
                    </div>
                  )
                ) : (
                  <div className="mt-3 font-mono text-[9px] text-[#7F8F97]">
                    SELECT RECEIPTS ON A SAVED ROUTE
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            id="identity-keys"
            className="grid gap-8 border-b border-white/10 px-5 py-11 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:px-8 lg:py-14"
          >
            <div>
              <div className="eyebrow">04 / IDENTITY KEYS</div>
              <h2 className="section-title">
                Your wallet,
                <br />
                <span>your boundary.</span>
              </h2>
              <p className="mt-6 max-w-[350px] text-[14px] leading-6 text-[#AEB8BE]">
                Veyra never stores private keys. Connect a privacy-enabled
                wallet only when you are ready to sign a route, and keep custody
                with the wallet you control.
              </p>
            </div>
            <div className="rounded-[16px] border border-white/10 bg-[#151D21] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#F0563A]/15 text-[#F0563A]">
                  <Fingerprint size={18} />
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.14em] text-[#F3EEE5]">
                    WALLET STATUS
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[#70D49D]">
                    {connected
                      ? walletAddress
                        ? `CONNECTED / ${walletAddress.slice(0, 8)}…`
                        : "CONNECTED"
                      : "NOT CONNECTED"}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[12px] border border-white/10 bg-[#163B4A] p-4">
                  <div className="font-mono text-[9px] text-[#AEB8BE]">
                    PRIVATE KEY
                  </div>
                  <div className="mt-2 font-mono text-[10px] text-[#70D49D]">
                    NEVER STORED
                  </div>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-[#163B4A] p-4">
                  <div className="font-mono text-[9px] text-[#AEB8BE]">
                    STRK20 ADAPTER
                  </div>
                  <div className="mt-2 font-mono text-[10px] text-[#70D49D]">
                    {strk20Readiness.label}
                  </div>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-xs leading-5 text-[#918C83]">
                {strk20Readiness.detail} A returned hash is still only submitted
                evidence; Veyra marks a route confirmed only after receipt
                verification.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {isAuthenticated ? (
                  <>
                    <Button
                      disabled={isWalletActionLocked(walletConnecting)}
                      onClick={openWalletPicker}
                      className="h-11 rounded-full bg-[#F3EEE5] px-5 font-mono text-[10px] tracking-[0.12em] text-[#111210] hover:bg-white"
                    >
                      {walletConnecting
                        ? "CONNECTING…"
                        : connected
                          ? "CHANGE WALLET"
                          : "ADD WALLET"}
                    </Button>

                  </>
                ) : (
                  <div className="border-t border-white/10 pt-5 font-mono text-[9px] leading-5 tracking-[0.1em] text-[#AEB8BE]">
                    WALLET ACTIONS APPEAR AFTER WORKSPACE CONTEXT IS AVAILABLE.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            id="recipient-roster"
            className="grid gap-8 border-b border-white/10 px-5 py-12 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:px-12 lg:py-16"
          >
            <div>
              <div className="eyebrow">04 / PRIVATE ROSTER</div>
              <h2 className="section-title">
                People, not
                <br />
                <span>public addresses.</span>
              </h2>
              <p className="mt-6 max-w-[350px] text-[14px] leading-6 text-[#AEB8BE]">
                Recipients live inside your workspace. Only the wallet address
                is used when you explicitly create a route; the roster never
                appears in a public proof.
              </p>
            </div>
            <div className="rounded-[16px] border border-white/10 bg-[#151D21] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] tracking-[0.15em] text-[#AEB8BE]">
                  SAVED RECIPIENTS
                </div>
                <div className="font-mono text-[9px] text-[#70D49D]">
                  {isAuthenticated
                    ? `${recipientsQuery.data?.length ?? 0} ACTIVE`
                    : "WORKSPACE CONTEXT REQUIRED"}
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-[.8fr_1.2fr_auto]">
                <Input
                  value={recipientName}
                  onChange={event => setRecipientName(event.target.value)}
                  placeholder="Name"
                  className="field-input"
                />
                <Input
                  value={recipientWallet}
                  onChange={event => setRecipientWallet(event.target.value)}
                  placeholder="0x wallet address"
                  className="field-input"
                />
                <Button
                  disabled={
                    !isAuthenticated ||
                    createRecipientMutation.isPending ||
                    updateRecipientMutation.isPending ||
                    recipientName.trim().length < 2 ||
                    !isValidStarknetAddress(recipientWallet)
                  }
                  onClick={() =>
                    editingRecipientId
                      ? updateRecipientMutation.mutate({
                          id: editingRecipientId,
                          displayName: recipientName,
                          walletAddress: recipientWallet,
                        })
                      : createRecipientMutation.mutate({
                          displayName: recipientName,
                          walletAddress: recipientWallet,
                        })
                  }
                  className="h-12 rounded-[10px] bg-[#F3EEE5] px-4 font-mono text-[10px] tracking-[0.12em] text-[#111210] hover:bg-white"
                >
                  {editingRecipientId ? "SAVE" : "ADD"}
                </Button>
              </div>
              <div className="mt-5 space-y-2">
                {(recipientsQuery.data ?? []).slice(0, 4).map(recipient => (
                  <div
                    key={recipient.id}
                    className="flex items-center gap-3 rounded-[10px] border border-white/10 bg-[#163B4A] px-3 py-3"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-[#F0563A]/15 text-[#F0563A]">
                      <Fingerprint size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-[#F3EEE5]">
                        {recipient.displayName}
                      </div>
                      <div className="truncate font-mono text-[9px] text-[#7F8F97]">
                        {recipient.walletAddress}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingRecipientId(recipient.id);
                        setRecipientName(recipient.displayName);
                        setRecipientWallet(recipient.walletAddress);
                      }}
                      className="font-mono text-[9px] tracking-[0.1em] text-[#AEB8BE] hover:text-[#F0563A]"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() =>
                        setSelectedRecipientIds(current =>
                          current.includes(recipient.id)
                            ? current.filter(id => id !== recipient.id)
                            : [...current, recipient.id]
                        )
                      }
                      className={`font-mono text-[9px] tracking-[0.1em] ${selectedRecipientIds.includes(recipient.id) ? "text-[#70D49D]" : "text-[#AEB8BE]"}`}
                    >
                      {selectedRecipientIds.includes(recipient.id)
                        ? "SELECTED"
                        : "SELECT"}
                    </button>
                    <button
                      disabled={
                        archiveRecipientMutation.isPending ||
                        restoreRecipientMutation.isPending
                      }
                      onClick={() =>
                        void (recipient.status === "active"
                          ? archiveRecipientMutation.mutateAsync({
                              id: recipient.id,
                            })
                          : restoreRecipientMutation.mutateAsync({
                              id: recipient.id,
                            }))
                      }
                      className="font-mono text-[9px] tracking-[0.1em] text-[#AEB8BE] hover:text-[#F0563A]"
                    >
                      {recipient.status === "active" ? "ARCHIVE" : "RESTORE"}
                    </button>
                  </div>
                ))}
                {isAuthenticated && !recipientsQuery.data?.length && (
                  <div className="py-5 text-center font-mono text-[10px] tracking-[0.1em] text-[#7F8F97]">
                    NO RECIPIENTS YET / ADD YOUR FIRST PRIVATE CONTACT
                  </div>
                )}
                {!isAuthenticated && (
                  <div className="py-5 text-center font-mono text-[10px] tracking-[0.1em] text-[#7F8F97]">
                    WORKSPACE CONTEXT REQUIRED TO LOAD PRIVATE ROSTER
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            id="operations"
            className={`border-b border-white/10 px-5 py-11 sm:px-8 lg:px-8 lg:py-14 ${activeSection !== "operations" ? "hidden" : ""}`}
          >
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <div className="eyebrow">05 / OPERATIONS</div>
                <h2 className="section-title">
                  Run the payroll
                  <br />
                  <span>without guesswork.</span>
                </h2>
                <p className="mt-5 max-w-[520px] text-[14px] leading-6 text-[#AEB8BE]">
                  Schedules, approvals, shareable proofs, and operational
                  evidence now live inside the workspace instead of being
                  scattered across spreadsheets.
                </p>
              </div>
              <Button
                onClick={downloadAuditCsv}
                className="h-10 rounded-full border border-white/15 bg-transparent px-4 font-mono text-[10px] tracking-[0.12em] text-[#F3EEE5] hover:bg-white/10"
              >
                <Download size={14} className="mr-2" /> EXPORT AUDIT CSV
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-2 border-y border-white/10 py-3">
              <button
                onClick={() => setOperationsView("overview")}
                className={`rounded-full px-3 py-2 font-mono text-[9px] tracking-[0.1em] ${operationsView === "overview" ? "bg-[#F3EEE5] text-[#111210]" : "border border-white/15 text-[#AEB8BE]"}`}
              >
                CONTROL ROOM
              </button>
              <button
                onClick={() => setOperationsView("treasury")}
                className={`rounded-full px-3 py-2 font-mono text-[9px] tracking-[0.1em] ${operationsView === "treasury" ? "bg-[#F3EEE5] text-[#111210]" : "border border-white/15 text-[#AEB8BE]"}`}
              >
                TREASURY
              </button>
              <button
                onClick={() => setOperationsView("claims")}
                className={`rounded-full px-3 py-2 font-mono text-[9px] tracking-[0.1em] ${operationsView === "claims" ? "bg-[#F3EEE5] text-[#111210]" : "border border-white/15 text-[#AEB8BE]"}`}
              >
                RECIPIENT CLAIMS
              </button>
            </div>
            {!isAuthenticated ? (
              <div className="mt-8 rounded-[14px] border border-white/10 bg-[#151D21] p-5 font-mono text-[10px] tracking-[0.08em] text-[#AEB8BE]">
                WORKSPACE CONTEXT REQUIRED TO ACTIVATE OPERATIONS / THE PUBLIC
                PREVIEW NEVER PERSISTS PRIVATE WORKSPACE DATA.
              </div>
            ) : (
              <div className="mt-9 grid gap-4 xl:grid-cols-4">
                <div
                  className={`rounded-[14px] border border-white/10 bg-[#151D21] p-4 ${operationsView !== "overview" ? "hidden" : ""}`}
                >
                  <div className="flex items-center gap-2 text-[#F3EEE5]">
                    <CalendarDays size={15} className="text-[#F0563A]" />
                    <span className="font-mono text-[10px] tracking-[0.12em]">
                      SCHEDULED PAYROLL
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <select
                      value={scheduleFrequency}
                      onChange={event =>
                        setScheduleFrequency(
                          event.target.value as typeof scheduleFrequency
                        )
                      }
                      className="field-input bg-[#163B4A]"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every two weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <Input
                      value={scheduleTimezone}
                      onChange={event =>
                        setScheduleTimezone(event.target.value)
                      }
                      className="field-input"
                      placeholder="Timezone, e.g. UTC"
                    />
                    <Input
                      type="datetime-local"
                      value={scheduleNextRun}
                      onChange={event => setScheduleNextRun(event.target.value)}
                      className="field-input"
                    />
                    <Button
                      disabled={
                        !canScheduleRoute(
                          selectedRouteId,
                          scheduleCreateMutation.isPending
                        )
                      }
                      onClick={() =>
                        selectedRouteId &&
                        scheduleCreateMutation.mutate({
                          routeId: selectedRouteId,
                          frequency: scheduleFrequency,
                          timezone: scheduleTimezone,
                          nextRunAt: new Date(scheduleNextRun),
                        })
                      }
                      className="mt-1 h-10 rounded-[10px] bg-[#F0563A] font-mono text-[10px] tracking-[0.1em] text-[#111210] hover:bg-[#FF7257]"
                    >
                      {scheduleCreateMutation.isPending
                        ? "SAVING…"
                        : "SCHEDULE SELECTED ROUTE"}
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {schedulesQuery.isLoading ? (
                      <div className="py-2 font-mono text-[9px] text-[#7F8F97]">
                        LOADING SCHEDULES…
                      </div>
                    ) : schedulesQuery.data?.length ? (
                      <>
                        {schedulesQuery.data.slice(0, 3).map(schedule => (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 font-mono text-[9px] text-[#AEB8BE]"
                          >
                            <span>
                              {schedule.frequency.toUpperCase()} /{" "}
                              {schedule.timezone}
                            </span>
                            <button
                              disabled={scheduleUpdateMutation.isPending}
                              onClick={() =>
                                scheduleUpdateMutation.mutate({
                                  id: schedule.id,
                                  frequency: schedule.frequency,
                                  timezone: schedule.timezone,
                                  nextRunAt: schedule.nextRunAt,
                                  status:
                                    schedule.status === "active"
                                      ? "paused"
                                      : "active",
                                })
                              }
                              className="text-[#F0563A]"
                            >
                              {schedule.status === "active"
                                ? "PAUSE"
                                : "RESUME"}
                            </button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="py-2 font-mono text-[9px] text-[#7F8F97]">
                        NO ACTIVE SCHEDULES / CREATE ONE ABOVE
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`rounded-[14px] border border-white/10 bg-[#151D21] p-4 ${operationsView !== "overview" ? "hidden" : ""}`}
                >
                  <div className="flex items-center gap-2 text-[#F3EEE5]">
                    <UserCheck size={15} className="text-[#F0563A]" />
                    <span className="font-mono text-[10px] tracking-[0.12em]">
                      APPROVAL GATE
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-[#AEB8BE]">
                    Select a saved route in the proof ledger, then record an
                    owner/admin decision before settlement.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Input
                      aria-label="Approval threshold"
                      type="number"
                      min="1"
                      max="20"
                      value={approvalThreshold}
                      onChange={event =>
                        setApprovalThreshold(event.target.value)
                      }
                      className="field-input h-9 w-20"
                    />
                    <Button
                      disabled={
                        approvalThresholdMutation.isPending ||
                        !/^(?:[1-9]|1[0-9]|20)$/.test(approvalThreshold.trim())
                      }
                      onClick={() =>
                        approvalThresholdMutation.mutate({
                          approvalThreshold: Number(approvalThreshold),
                        })
                      }
                      className="h-9 rounded-[9px] border border-white/15 bg-transparent px-3 font-mono text-[9px] text-[#F3EEE5] hover:bg-white/10"
                    >
                      SET THRESHOLD
                    </Button>
                  </div>
                  <div className="mt-4 font-mono text-[10px] text-[#70D49D]">
                    {approvalsQuery.isLoading
                      ? "LOADING DECISIONS…"
                      : selectedRouteId
                        ? `${approvalsQuery.data?.length ?? 0} DECISIONS / ROUTE VP-${String(selectedRouteId).padStart(3, "0")}`
                        : "NO ROUTE SELECTED"}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      disabled={
                        !selectedRouteId || approvalDecisionMutation.isPending
                      }
                      onClick={() =>
                        selectedRouteId &&
                        approvalDecisionMutation.mutate({
                          routeId: selectedRouteId,
                          status: "approved",
                        })
                      }
                      className="h-9 flex-1 rounded-[9px] bg-[#70D49D] px-2 font-mono text-[9px] text-[#111210]"
                    >
                      APPROVE
                    </Button>
                    <Button
                      disabled={
                        !selectedRouteId || approvalDecisionMutation.isPending
                      }
                      onClick={() =>
                        selectedRouteId &&
                        approvalDecisionMutation.mutate({
                          routeId: selectedRouteId,
                          status: "rejected",
                        })
                      }
                      className="h-9 flex-1 rounded-[9px] border border-[#F0563A]/40 bg-transparent px-2 font-mono text-[9px] text-[#F0563A]"
                    >
                      REJECT
                    </Button>
                  </div>
                </div>
                <div
                  className={`rounded-[14px] border border-white/10 bg-[#151D21] p-4 ${operationsView !== "overview" ? "hidden" : ""}`}
                >
                  <div className="flex items-center gap-2 text-[#F3EEE5]">
                    <Link2 size={15} className="text-[#F0563A]" />
                    <span className="font-mono text-[10px] tracking-[0.12em]">
                      PUBLIC PROOF LINK
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-[#AEB8BE]">
                    Share receipt-backed status and commitment metadata without
                    exposing recipients or private notes. Proof creation is
                    blocked until the route has a confirmed receipt.
                  </p>
                  <Button
                    disabled={
                      !selectedRouteId ||
                      selectedRoute?.status !== "settled" ||
                      createProofMutation.isPending
                    }
                    onClick={() =>
                      selectedRouteId &&
                      selectedRoute?.status === "settled" &&
                      createProofMutation.mutate({ routeId: selectedRouteId })
                    }
                    className="mt-4 h-9 w-full rounded-[9px] bg-[#F3EEE5] font-mono text-[9px] text-[#111210]"
                  >
                    {createProofMutation.isPending
                      ? "CREATING…"
                      : selectedRoute?.status !== "settled"
                        ? "REQUIRES CONFIRMED RECEIPT"
                        : "CREATE RECEIPT-BACKED PROOF LINK"}
                  </Button>
                  {proofSlug && (
                    <button
                      onClick={async () => {
                        const url = `${window.location.origin}/proof/${proofSlug}`;
                        const copiedSuccessfully = await copyText(url);
                        toast(
                          copiedSuccessfully
                            ? "Receipt-backed public proof URL copied."
                            : "Copy failed.",
                          copiedSuccessfully
                            ? undefined
                            : {
                                description:
                                  "Your browser blocked clipboard access; select the URL manually.",
                              }
                        );
                      }}
                      className="mt-3 flex w-full items-center gap-2 truncate font-mono text-[9px] text-[#70D49D]"
                    >
                      <Copy size={12} /> {window.location.origin}/proof/
                      {proofSlug}
                    </button>
                  )}
                </div>
                <div
                  className={`rounded-[14px] border border-white/10 bg-[#151D21] p-4 ${operationsView !== "overview" ? "hidden" : ""}`}
                >
                  <div className="flex items-center gap-2 text-[#F3EEE5]">
                    <BarChart3 size={15} className="text-[#F0563A]" />
                    <span className="font-mono text-[10px] tracking-[0.12em]">
                      OPERATIONS PULSE
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      ["ROUTES", analyticsQuery.data?.routes ?? 0],
                      ["RECEIPT-CONFIRMED", analyticsQuery.data?.settled ?? 0],
                      ["FAILED", analyticsQuery.data?.failed ?? 0],
                      ["PROOFS", analyticsQuery.data?.proofs ?? 0],
                      [
                        "CONFIRMED RECEIPTS",
                        analyticsQuery.data?.confirmedTransactions ?? 0,
                      ],
                      [
                        "UNKNOWN RECEIPTS",
                        analyticsQuery.data?.unknownTransactions ?? 0,
                      ],
                      [
                        "ACTIVE SCHEDULES",
                        analyticsQuery.data?.activeSchedules ?? 0,
                      ],
                      ["AUDIT EVENTS", analyticsQuery.data?.auditEvents ?? 0],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-[9px] bg-[#163B4A] p-3"
                      >
                        <div className="font-mono text-[9px] text-[#AEB8BE]">
                          {label}
                        </div>
                        <div className="mt-1 font-display text-[20px] text-[#F3EEE5]">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 font-mono text-[9px] text-[#70D49D]">
                    <CheckCircle2 size={12} /> WORKSPACE-BOUND METRICS
                  </div>
                  <div className="mt-3 grid gap-2 font-mono text-[9px]">
                    <div
                      className={
                        healthQuery.data?.proofHealth.some(
                          proof => !proof.hasCommitment
                        )
                          ? "text-[#F0563A]"
                          : "text-[#70D49D]"
                      }
                    >
                      PROOF HEALTH /{" "}
                      {healthQuery.isLoading
                        ? "SCANNING…"
                        : healthQuery.data?.proofHealth.some(
                              proof => !proof.hasCommitment
                            )
                          ? "ACTION REQUIRED"
                          : "HEALTHY"}
                    </div>
                    <div
                      className={
                        healthQuery.data?.unresolvedReceipts.length
                          ? "text-[#F0563A]"
                          : "text-[#70D49D]"
                      }
                    >
                      RECEIPTS /{" "}
                      {healthQuery.isLoading
                        ? "SCANNING…"
                        : healthQuery.data?.unresolvedReceipts.length
                          ? `${healthQuery.data.unresolvedReceipts.length} NEED REVIEW`
                          : "ALL RECONCILED"}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 border-t border-white/10 pt-3 font-mono text-[8px] text-[#AEB8BE]">
                    {healthQuery.isLoading ? (
                      <div>LOADING HEALTH DETAILS…</div>
                    ) : (
                      <>
                        {(healthQuery.data?.unresolvedReceipts ?? [])
                          .slice(0, 2)
                          .map(receipt => (
                            <div
                              key={receipt.transactionHash}
                              className="truncate text-[#F0563A]"
                            >
                              RECEIPT / {receipt.routeName} / {receipt.status} /{" "}
                              {receipt.transactionHash.slice(0, 10)}…
                            </div>
                          ))}
                        {(healthQuery.data?.proofHealth ?? [])
                          .slice(0, 2)
                          .map(proof => (
                            <div
                              key={proof.slug}
                              className={
                                proof.hasCommitment
                                  ? "truncate text-[#70D49D]"
                                  : "truncate text-[#F0563A]"
                              }
                            >
                              PROOF / {proof.routeName} /{" "}
                              {proof.hasCommitment
                                ? "COMMITTED"
                                : "MISSING COMMITMENT"}{" "}
                              / {proof.slug}
                            </div>
                          ))}
                        {!healthQuery.data?.unresolvedReceipts.length &&
                          !healthQuery.data?.proofHealth.length && (
                            <div>NO HEALTH EXCEPTIONS OR ACTIVE PROOFS</div>
                          )}
                      </>
                    )}
                  </div>
                </div>
                <div
                  className={`rounded-[14px] border border-white/10 bg-[#151D21] p-4 ${operationsView !== "treasury" ? "hidden" : ""}`}
                >
                  <div className="flex items-center gap-2 text-[#F3EEE5]">
                    <LockKeyhole size={15} className="text-[#F0563A]" />
                    <span className="font-mono text-[10px] tracking-[0.12em]">
                      TREASURY GUARDRAILS
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-[#AEB8BE]">
                    Reusable policy templates keep route limits and approval
                    intent explicit before a wallet signs.
                  </p>
                  <div className="mt-4 grid gap-2">
                    <Input
                      value={policyName}
                      onChange={event => setPolicyName(event.target.value)}
                      className="field-input"
                      placeholder="Policy name"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={policyMax}
                        onChange={event => setPolicyMax(event.target.value)}
                        className="field-input"
                        placeholder="Max route"
                      />
                      <Input
                        value={policyDaily}
                        onChange={event => setPolicyDaily(event.target.value)}
                        className="field-input"
                        placeholder="Daily limit"
                      />
                    </div>
                    <Button
                      disabled={
                        policyCreateMutation.isPending ||
                        policyName.trim().length < 2 ||
                        !/^\d+(\.\d{1,18})?$/.test(policyMax.trim()) ||
                        !/^\d+(\.\d{1,18})?$/.test(policyDaily.trim()) ||
                        !/^(?:[1-9]|1[0-9]|20)$/.test(approvalThreshold.trim())
                      }
                      onClick={() =>
                        policyCreateMutation.mutate({
                          name: policyName,
                          token: tokenSymbol,
                          network: "mainnet",
                          maxRouteAmount: policyMax.trim(),
                          dailyLimit: policyDaily.trim(),
                          approvalThreshold: Number(approvalThreshold),
                        })
                      }
                      className="h-9 rounded-[9px] bg-[#F3EEE5] font-mono text-[9px] text-[#111210]"
                    >
                      {policyCreateMutation.isPending
                        ? "SAVING…"
                        : "SAVE POLICY"}
                    </Button>
                  </div>
                  <div className="mt-3 font-mono text-[9px] text-[#70D49D]">
                    {policiesQuery.isLoading
                      ? "SYNCING POLICIES…"
                      : `${policiesQuery.data?.length ?? 0} ACTIVE POLICY TEMPLATE(S)`}
                  </div>
                  <div className="mt-3 rounded-[9px] bg-[#163B4A] p-3">
                    <div className="font-mono text-[9px] text-[#AEB8BE]">
                      LATEST WALLET SNAPSHOT
                    </div>
                    <div className="mt-1 font-mono text-[13px] text-[#F3EEE5]">
                      {balancesQuery.data?.[0]
                        ? `${balancesQuery.data[0].availableBalance} ${balancesQuery.data[0].token}`
                        : "NO SNAPSHOT YET"}
                    </div>
                    <div className="mt-1 font-mono text-[8px] text-[#7F8F97]">
                      {balancesQuery.data?.[0]
                        ? new Date(
                            balancesQuery.data[0].capturedAt
                          ).toLocaleString()
                        : "Record after reading the connected wallet"}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={treasuryBalance}
                      onChange={event => setTreasuryBalance(event.target.value)}
                      className="field-input h-9"
                      placeholder="Latest balance"
                    />
                    <Button
                      disabled={
                        recordBalanceMutation.isPending ||
                        !/^\d+(\.\d{1,18})?$/.test(treasuryBalance.trim())
                      }
                      onClick={() =>
                        recordBalanceMutation.mutate({
                          token: tokenSymbol,
                          network: "mainnet",
                          availableBalance: treasuryBalance.trim(),
                          source: connected ? "wallet_read" : "manual_review",
                        })
                      }
                      className="h-9 rounded-[9px] border border-white/15 bg-transparent px-3 font-mono text-[9px] text-[#F3EEE5]"
                    >
                      SAVE SNAPSHOT
                    </Button>
                  </div>
                  <div
                    className={`mt-3 font-mono text-[9px] ${policySimulationQuery.data?.allowed ? "text-[#70D49D]" : "text-[#F0563A]"}`}
                  >
                    {policySimulationQuery.isLoading
                      ? "SIMULATING POLICY…"
                      : policySimulationQuery.data?.allowed
                        ? "DRY RUN PASSES / READY FOR APPROVAL"
                        : `DRY RUN BLOCKED / ${policySimulationQuery.data?.reasons?.join(" / ")}`}
                  </div>
                </div>
                <div
                  className={`rounded-[14px] border border-white/10 bg-[#151D21] p-4 ${operationsView !== "claims" ? "hidden" : ""}`}
                >
                  <div className="flex items-center gap-2 text-[#F3EEE5]">
                    <Link2 size={15} className="text-[#F0563A]" />
                    <span className="font-mono text-[10px] tracking-[0.12em]">
                      RECIPIENT CLAIM
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-[#AEB8BE]">
                    Give one recipient an expiring private link. The roster
                    never becomes a public directory.
                  </p>
                  {selectedRouteId ? (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">
                        CLAIMED RECIPIENT REVIEW
                      </div>
                      {routeRecipientReviewQuery.isLoading ? (
                        <div className="mt-3 font-mono text-[9px] text-[#7F8F97]">
                          LOADING CLAIM STATUS…
                        </div>
                      ) : recipientReview.length ? (
                        <div className="mt-3 space-y-2">
                          {recipientReview.map(recipient => (
                            <div
                              key={recipient.recipientId}
                              className="rounded-[9px] border border-white/10 bg-[#111210] p-3"
                            >
                              <div className="flex items-center justify-between gap-3 font-mono text-[9px] text-[#F3EEE5]">
                                <span className="truncate">
                                  {recipient.displayName}
                                </span>
                                <span className="text-[#70D49D]">
                                  {recipient.fulfillmentStatus.toUpperCase()}
                                </span>
                              </div>
                              <div className="mt-2 font-mono text-[9px] text-[#AEB8BE]">
                                {recipient.allocation} {selectedRoute?.token} /{" "}
                                {recipient.fulfilledWalletAddress ??
                                  "NO CLAIMED WALLET"}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 font-mono text-[9px] text-[#7F8F97]">
                          NO RECIPIENTS ARE AVAILABLE FOR THIS ROUTE.
                        </div>
                      )}
                      <Button
                        disabled={
                          recordTransactionMutation.isPending ||
                          routeRecipientReviewQuery.isLoading ||
                          !claimedRecipient ||
                          Boolean(claimedRouteTransaction) ||
                          claimWalletActionPending ||
                          Boolean(recoveryHash.trim())
                        }
                        onClick={() => void submitClaimedRecipientRoute()}
                        className="mt-3 h-10 w-full rounded-[9px] bg-[#F0563A] font-mono text-[9px] tracking-[0.08em] text-[#111210] hover:bg-[#FF7257]"
                      >
                        {claimedRouteTransaction
                          ? claimedRouteTransaction.status === "confirmed"
                            ? "PRIVATE TRANSACTION CONFIRMED"
                            : "PRIVATE TRANSACTION SUBMITTED — VERIFY RECEIPT"
                          : recoveryHash.trim()
                            ? "RECOVER EXISTING HASH FIRST"
                            : claimWalletActionPending
                              ? "WALLET ACTION IN PROGRESS"
                              : !connected
                                ? "CONNECT WALLET TO REVIEW"
                                : !walletCanSubmitStrk20
                                  ? "STRK20 WALLET REQUIRED"
                                  : "REVIEW & SUBMIT PRIVATE TRANSACTION"}
                      </Button>
                      {claimedRouteTransaction && (
                        <div className="mt-3 rounded-[9px] border border-[#70D49D]/30 bg-[#70D49D]/[0.06] p-3 font-mono text-[9px] text-[#CFC7BC]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[#70D49D]">
                              {claimedRouteTransaction.status.toUpperCase()} /
                              RECEIPT REQUIRED
                            </span>
                            {claimedRouteTransaction.status !== "confirmed" && (
                              <button
                                type="button"
                                disabled={confirmTransactionMutation.isPending}
                                onClick={() =>
                                  confirmTransactionMutation.mutate({
                                    transactionHash:
                                      claimedRouteTransaction.transactionHash,
                                  })
                                }
                                className="text-[#F3EEE5] hover:text-[#F0563A]"
                              >
                                VERIFY RECEIPT
                              </button>
                            )}
                          </div>
                          <div className="mt-2 truncate text-[#AEB8BE]">
                            {claimedRouteTransaction.transactionHash}
                          </div>
                        </div>
                      )}
                      {!claimedRouteTransaction && (
                        <div className="mt-3 rounded-[9px] border border-white/10 bg-[#111210] p-3">
                          <div className="font-mono text-[8px] tracking-[0.1em] text-[#AEB8BE]">
                            RECOVER A RETURNED WALLET HASH / NO NEW SIGNATURE
                          </div>
                          <Input
                            value={recoveryHash}
                            onChange={event =>
                              setRecoveryHash(event.target.value.trim())
                            }
                            placeholder="0x…"
                            className="mt-2 h-9 border-white/10 bg-[#0C1012] font-mono text-[9px] text-[#F3EEE5]"
                          />
                          <Button
                            type="button"
                            disabled={
                              recoverTransactionMutation.isPending ||
                              !/^0x[0-9a-fA-F]+$/.test(recoveryHash)
                            }
                            onClick={() =>
                              recoverTransactionMutation.mutate({
                                routeId: selectedRouteId,
                                network: selectedNetwork,
                                transactionHash: recoveryHash,
                                explorerUrl: explorerUrl(
                                  recoveryHash,
                                  selectedNetwork
                                ),
                              })
                            }
                            className="mt-2 h-8 w-full rounded-[8px] border border-white/15 bg-transparent font-mono text-[8px] text-[#F3EEE5] hover:border-[#F0563A]/60"
                          >
                            {recoverTransactionMutation.isPending
                              ? "VERIFYING HASH…"
                              : "VERIFY & RECORD EXISTING HASH"}
                          </Button>
                          <p className="mt-2 font-mono text-[8px] leading-4 text-[#7F8F97]">
                            Use only the hash returned by this route’s wallet
                            action. Veyra verifies its Starknet receipt before
                            recording it and never requests another signature
                            here.
                          </p>
                        </div>
                      )}
                      <p className="mt-2 font-mono text-[8px] leading-4 text-[#7F8F97]">
                        Uses the official STRK20 wallet action only. No
                        public-transfer fallback is available. A transaction is
                        recorded only if the wallet returns a hash; settlement
                        remains unconfirmed until receipt verification.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">
                        SELECT A SAVED ROUTE FOR CLAIM REVIEW
                      </div>
                      {liveRoutes.length ? (
                        <div className="mt-3 space-y-2">
                          {liveRoutes.slice(0, 6).map(route => (
                            <button
                              key={route.id}
                              type="button"
                              onClick={() => {
                                setSelectedRouteId(route.id);
                                toast("Route selected for claim review.", {
                                  description:
                                    "Review the claimed recipient below before requesting a wallet action.",
                                });
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-[9px] border border-white/10 bg-[#111210] px-3 py-3 text-left font-mono text-[9px] text-[#F3EEE5] hover:border-[#F0563A]/50"
                            >
                              <span className="min-w-0 truncate">
                                {route.name}
                              </span>
                              <span className="shrink-0 text-[#AEB8BE]">
                                {route.totalAmount} {route.token}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 font-mono text-[9px] text-[#7F8F97]">
                          NO SAVED ROUTES ARE AVAILABLE IN THIS WORKSPACE.
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    disabled={
                      !canCreateRecipientClaim(
                        selectedRouteId,
                        selectedRecipientIds,
                        claimCreateMutation.isPending
                      )
                    }
                    onClick={() => {
                      const recipientId = selectedRecipientIds[0];
                      if (!selectedRouteId || !recipientId) return;
                      claimCreateMutation.mutate({
                        routeId: selectedRouteId,
                        recipientId,
                        expiresAt: new Date(Date.now() + 7 * 86400000),
                      });
                    }}
                    className="mt-4 h-9 w-full rounded-[9px] bg-[#F0563A] font-mono text-[9px] text-[#111210]"
                  >
                    {claimCreateMutation.isPending
                      ? "CREATING…"
                      : "CREATE UNSIGNED 7-DAY CLAIM LINK"}
                  </Button>
                  {claimToken && (
                    <button
                      onClick={async () => {
                        const url = `${window.location.origin}/claim/${claimToken}`;
                        const copiedSuccessfully = await copyText(url);
                        toast(
                          copiedSuccessfully
                            ? "Unsigned private claim URL copied."
                            : "Copy failed.",
                          copiedSuccessfully
                            ? undefined
                            : {
                                description:
                                  "Your browser blocked clipboard access; select the URL manually.",
                              }
                        );
                      }}
                      className="mt-3 flex w-full items-center gap-2 truncate font-mono text-[9px] text-[#70D49D]"
                    >
                      <Copy size={12} /> {window.location.origin}/claim/
                      {claimToken}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          <footer className="border-t border-white/10 bg-[#0D1010] px-5 py-12 sm:px-8 lg:px-8 lg:py-16">
            <div className="mx-auto max-w-[1180px]">
              <div className="grid gap-10 lg:grid-cols-[1.25fr_.75fr_.75fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <VeyraBrand compact />
                    <span className="font-mono text-[9px] tracking-[0.12em] text-[#F0563A]">STARKNET / MAINNET</span>
                  </div>
                  <p className="mt-6 max-w-md font-display text-3xl leading-[0.95] tracking-[-0.05em] text-[#F3EEE5]">
                    Private coordination for teams that still need proof.
                  </p>
                  <p className="mt-5 max-w-md text-sm leading-6 text-[#AEB8BE]">
                    Veyra coordinates payroll, treasury, claims, markets, launches, and commit–reveal workflows without pretending that public chain edges are private.
                  </p>
                </div>
                <div>
                  <div className="nav-group-label">EXPLORE</div>
                  <div className="mt-4 grid gap-3 font-mono text-[10px] tracking-[0.1em] text-[#CFC7BC]">
                    <button type="button" onClick={() => goToSection("routes")} className="text-left hover:text-[#F0563A]">PRIVATE PAYROLL</button>
                    <button type="button" onClick={() => goToSection("operations")} className="text-left hover:text-[#F0563A]">OPERATIONS / TREASURY / CLAIMS</button>
                    <button type="button" onClick={() => goToSection("ledger")} className="text-left hover:text-[#F0563A]">PROOF LEDGER</button>
                    <button type="button" onClick={() => navigateTo("/agent")} className="text-left hover:text-[#F0563A]">VEYRA AGENT</button>
                  </div>
                </div>
                <div>
                  <div className="nav-group-label">PROTOCOL</div>
                  <div className="mt-4 grid gap-3 font-mono text-[10px] tracking-[0.1em] text-[#CFC7BC]">
                    <button type="button" onClick={() => navigateTo("/private-primitives")} className="text-left hover:text-[#F0563A]">PRIVATE PRIMITIVES</button>
                    <button type="button" onClick={() => navigateTo("/private-markets")} className="text-left hover:text-[#F0563A]">PRIVATE MARKETS</button>
                    <button type="button" onClick={() => navigateTo("/launchpad")} className="text-left hover:text-[#F0563A]">LAUNCHPAD</button>
                    <a href="https://github.com/sands786/veyra/blob/main/strk20.json" target="_blank" rel="noreferrer" className="hover:text-[#F0563A]">PUBLIC EVIDENCE ↗</a>
                  </div>
                </div>
              </div>
              <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-5 font-mono text-[9px] leading-5 tracking-[0.1em] text-[#7F8F97] sm:flex-row sm:items-center sm:justify-between">
                <span>VEYRA / PRIVATE FINANCIAL COORDINATION ON STARKNET</span>
                <span>WALLET SIGNS · RECEIPT PROVES · ROSTER STAYS PRIVATE</span>
              </div>
            </div>
          </footer>
          {isAuthenticated && walletPickerOpen && (
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-[#111210]/80 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="wallet-picker-title"
            >
              <div className="w-full max-w-lg rounded-[20px] border border-white/15 bg-[#151D21] p-5 shadow-2xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="eyebrow">STARKNET / WALLET ACCESS</div>
                    <h2
                      id="wallet-picker-title"
                      className="mt-2 font-display text-3xl tracking-[-0.05em]"
                    >
                      Add a wallet.
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-[#AEB8BE]">
                      Choose a detected Starknet wallet. Veyra never receives
                      your private key or approves a transaction without your
                      confirmation.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close wallet picker"
                    onClick={() => setWalletPickerOpen(false)}
                    className="rounded-full border border-white/10 p-2 text-[#AEB8BE] hover:text-[#F3EEE5]"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-6 space-y-2">
                  {walletOptions.length ? (
                    walletOptions.map(option => (
                      <div
                        key={option.id}
                        className="rounded-[14px] border border-white/10 bg-[#163B4A] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-[#111210] text-[#F3EEE5]">
                            {option.icon ? (
                              <img
                                src={option.icon}
                                alt=""
                                className="h-6 w-6 object-contain"
                              />
                            ) : (
                              <WalletCards
                                size={18}
                                className="text-[#F0563A]"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-display text-base text-[#F3EEE5]">
                              {option.name}
                            </div>
                            <div className="mt-1 font-mono text-[9px] text-[#AEB8BE]">
                              {option.supportsQr
                                ? "BROWSER + QR CAPABILITY DETECTED"
                                : "BROWSER EXTENSION DETECTED"}
                            </div>
                          </div>
                          <Button
                            disabled={walletConnecting}
                            onClick={() =>
                              void handleWalletConnect(option.wallet)
                            }
                            className="h-9 rounded-full bg-[#F3EEE5] px-4 font-mono text-[9px] text-[#111210] hover:bg-white"
                          >
                            {walletConnecting ? "WAIT…" : "CONNECT"}
                          </Button>
                        </div>
                        {option.supportsQr && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                            <button
                              type="button"
                              disabled={walletQrLoading}
                              onClick={() => void handleWalletQr(option)}
                              className="flex items-center gap-2 font-mono text-[9px] text-[#70D49D] hover:text-[#F3EEE5]"
                            >
                              <QrCode size={14} />{" "}
                              {walletQrLoading
                                ? "CREATING QR…"
                                : "CONNECT WITH QR"}
                            </button>
                            <span className="font-mono text-[9px] text-[#7F8F97]">
                              ONLY IF THIS PROVIDER EXPOSES A QR URI
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[14px] border border-dashed border-white/15 bg-[#163B4A] p-5 text-center">
                      <WalletCards
                        className="mx-auto text-[#F0563A]"
                        size={22}
                      />
                      <div className="mt-3 font-display text-lg text-[#F3EEE5]">
                        No Starknet wallet detected.
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#AEB8BE]">
                        Install a wallet below, then refresh this page or reopen
                        the picker.
                      </p>
                    </div>
                  )}
                </div>
                {walletQrImage && (
                  <div className="mt-5 rounded-[14px] border border-[#70D49D]/30 bg-[#70D49D]/[0.06] p-4">
                    <div className="flex flex-wrap items-start gap-4">
                      <img
                        src={walletQrImage}
                        alt="Starknet wallet connection QR code"
                        className="h-40 w-40 rounded-[8px] bg-[#F3EEE5] p-2"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[9px] tracking-[0.12em] text-[#70D49D]">
                          PROVIDER QR URI READY
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#CFC7BC]">
                          Scan this code with the selected Starknet wallet. If
                          the wallet does not open, copy the URI and open it on
                          the mobile device.
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            const copiedSuccessfully =
                              await copyText(walletQrUri);
                            toast(
                              copiedSuccessfully
                                ? "Wallet URI copied."
                                : "Copy failed."
                            );
                          }}
                          className="mt-3 flex items-center gap-2 font-mono text-[9px] text-[#F3EEE5] hover:text-[#70D49D]"
                        >
                          <Copy size={13} /> COPY URI
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">
                    INSTALL A STARKNET WALLET
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {walletInstallLinks.map(item => (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 font-mono text-[9px] text-[#CFC7BC] hover:border-[#F0563A]/60 hover:text-[#F3EEE5]"
                      >
                        {item.name}
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
