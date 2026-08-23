import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, KeyRound, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { VeyraBrand } from "@/components/VeyraBrand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

type AuthMode = "signIn" | "register" | "forgot" | "reset";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const signInParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const returnTo = useMemo(() => safeReturnTo(signInParams.get("returnTo")), [signInParams]);
  const resetToken = useMemo(() => signInParams.get("token") ?? "", [signInParams]);
  const [mode, setMode] = useState<AuthMode>(() => signInParams.get("mode") === "register" ? "register" : signInParams.get("mode") === "forgot" ? "forgot" : signInParams.get("mode") === "reset" ? "reset" : "signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [previewResetUrl, setPreviewResetUrl] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const register = trpc.auth.register.useMutation();
  const signIn = trpc.auth.signIn.useMutation();
  const requestReset = trpc.auth.requestPasswordReset.useMutation();
  const resetPassword = trpc.auth.resetPassword.useMutation();
  const pending = register.isPending || signIn.isPending || requestReset.isPending || resetPassword.isPending;
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const canSubmit = isForgot
    ? email.trim().length > 3
    : isReset
      ? resetToken.length >= 40 && password.length >= 12
      : email.trim().length > 3 && password.length >= 12 && (!isRegister || name.trim().length >= 2);

  function changeMode(next: AuthMode) {
    setPreviewResetUrl(null);
    setPassword("");
    setMode(next);
    setLocation(`/sign-in?mode=${next === "signIn" ? "signin" : next}`);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || pending) return;
    try {
      if (isForgot) {
        const result = await requestReset.mutateAsync({ email: email.trim() });
        setPreviewResetUrl("previewResetUrl" in result ? result.previewResetUrl : null);
        toast("Recovery request received.", { description: result.message });
        return;
      }
      if (isReset) {
        const user = await resetPassword.mutateAsync({ token: resetToken, password });
        utils.auth.me.setData(undefined, user);
        await utils.auth.me.invalidate();
        toast("Password updated.", { description: "Your new Veyra session is active." });
        setLocation(returnTo);
        return;
      }
      const user = isRegister
        ? await register.mutateAsync({ name: name.trim(), email: email.trim(), password })
        : await signIn.mutateAsync({ email: email.trim(), password });
      utils.auth.me.setData(undefined, user);
      await utils.auth.me.invalidate();
      toast(isRegister ? "Veyra account secured." : "Welcome back to Veyra.", { description: "Your private workspace session is active." });
      setLocation(returnTo);
    } catch (error) {
      toast(isReset ? "Password reset failed." : isForgot ? "Recovery request could not be completed." : isRegister ? "Account creation failed." : "Sign in failed.", { description: error instanceof Error ? error.message : "Please verify the fields and retry." });
    }
  }

  const eyebrow = isForgot ? "ACCOUNT RECOVERY / REQUEST LINK" : isReset ? "ACCOUNT RECOVERY / SET NEW PASSWORD" : isRegister ? "NEW OPERATOR / ACCOUNT SETUP" : "OPERATOR ACCESS / VERIFY CREDENTIALS";
  const title = isForgot ? "Recover your Veyra access." : isReset ? "Set a new password." : isRegister ? "Create a private workspace." : "Resume your Veyra workspace.";
  const description = isForgot ? "Enter your account email. If it matches an account, Veyra will send a time-limited recovery link without revealing account existence." : isReset ? "Choose a new password of at least 12 characters. The link is single-use and expires after 15 minutes." : "Veyra account credentials are issued by this application—not an external identity provider. Your password is never stored in plaintext, and authenticated workspace actions remain server-enforced.";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#111210] px-5 py-6 text-[#F3EEE5] sm:px-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_88%_5%,rgba(240,86,58,0.16),transparent_38%),radial-gradient(ellipse_at_8%_100%,rgba(22,59,74,0.38),transparent_46%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1180px] flex-col justify-between sm:min-h-[calc(100vh-5rem)]">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <VeyraBrand compact />
          <button type="button" onClick={() => setLocation(returnTo)} className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-[#AEB8BE] transition-colors hover:text-[#F3EEE5]"><ArrowLeft size={14} aria-hidden="true" /> RETURN</button>
        </header>
        <section className="grid items-center gap-10 py-12 lg:grid-cols-[1.1fr_.9fr] lg:py-16">
          <div className="max-w-xl">
            <div className="eyebrow text-[#F0563A]">VEYRA IDENTITY / PRIVATE WORKSPACE</div>
            <h1 className="mt-5 font-display text-[clamp(3.6rem,7vw,6.5rem)] font-bold leading-[0.84] tracking-[-0.08em]">Enter the system.<br /><span className="text-[#F0563A]">Keep control.</span></h1>
            <p className="mt-7 max-w-lg text-sm leading-7 text-[#CFC7BC]">{description}</p>
            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <div className="border border-white/10 bg-[#151D21] p-4"><ShieldCheck size={17} className="text-[#F0563A]" /><div className="mt-5 font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">SERVER-ISSUED SESSION</div><p className="mt-2 text-xs leading-5 text-[#CFC7BC]">HttpOnly session cookie, scoped to Veyra’s managed application boundary.</p></div>
              <div className="border border-white/10 bg-[#151D21] p-4"><KeyRound size={17} className="text-[#F0563A]" /><div className="mt-5 font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">PRIVATE CREDENTIALS</div><p className="mt-2 text-xs leading-5 text-[#CFC7BC]">Memory-hard password hashing; recovery tokens are single-use and never stored in plaintext.</p></div>
            </div>
          </div>
          <div className="relative border border-white/10 bg-[#151D21] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] sm:p-8">
            <div aria-hidden="true" className="absolute right-0 top-0 h-10 w-10 border-b border-l border-[#F0563A]/30 bg-[#201815]" />
            {!isForgot && !isReset && <div className="flex gap-2 border-b border-white/10 pb-5"><button type="button" onClick={() => changeMode("signIn")} className={`rounded-full px-3 py-2 font-mono text-[9px] tracking-[0.1em] ${!isRegister ? "bg-[#F3EEE5] text-[#111210]" : "text-[#AEB8BE] hover:text-[#F3EEE5]"}`}>SIGN IN</button><button type="button" onClick={() => changeMode("register")} className={`rounded-full px-3 py-2 font-mono text-[9px] tracking-[0.1em] ${isRegister ? "bg-[#F3EEE5] text-[#111210]" : "text-[#AEB8BE] hover:text-[#F3EEE5]"}`}>CREATE ACCOUNT</button></div>}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] tracking-[0.15em] text-[#F0563A]"><span>{eyebrow}</span><span className="border border-[#F0563A]/30 bg-[#201815] px-2 py-1 text-[8px]">SHIELDED / PASSWORD PROOF</span></div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.05em]">{title}</h2>
            <form className="mt-7 space-y-5" onSubmit={submit}>
              {isRegister && <label className="field-label block">YOUR NAME<Input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="field-input mt-2 h-12 !border-white/15 !bg-[#111210] !text-[#F3EEE5] placeholder:!text-[#7F8F97] focus:!border-[#F0563A]/70" placeholder="Operator name" /></label>}
              {!isReset && <label className="field-label block">EMAIL ADDRESS<Input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-input mt-2 h-12 !border-white/15 !bg-[#111210] !text-[#F3EEE5] placeholder:!text-[#7F8F97] focus:!border-[#F0563A]/70" placeholder="you@company.com" /></label>}
              {!isForgot && <label className="field-label block">PASSWORD<Input autoComplete={isReset || isRegister ? "new-password" : "current-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input mt-2 h-12 !border-white/15 !bg-[#111210] !text-[#F3EEE5] placeholder:!text-[#7F8F97] focus:!border-[#F0563A]/70" placeholder="At least 12 characters" /></label>}
              {isReset && !resetToken && <p className="font-mono text-[9px] leading-5 text-[#F0563A]">This recovery link is missing or invalid. Request a new link.</p>}
              {!isForgot && <p className="font-mono text-[9px] leading-5 text-[#7F8F97]">PUBLIC: account identity and session state. SHIELDED: your password and its verifier. Use at least 12 characters.</p>}
              {isForgot && <p className="font-mono text-[9px] leading-5 text-[#7F8F97]">For privacy, Veyra returns the same confirmation whether or not the email exists.</p>}
              <Button type="submit" disabled={!canSubmit || pending} className="h-12 w-full rounded-[10px] bg-[#F0563A] font-mono text-[10px] tracking-[0.12em] text-[#111210] hover:bg-[#FF7257]">{pending ? "PROCESSING…" : isForgot ? "SEND RECOVERY LINK" : isReset ? "UPDATE PASSWORD" : isRegister ? "CREATE VEYRA ACCOUNT" : "SIGN IN TO VEYRA"} <ArrowUpRight size={14} className="ml-2" /></Button>
            </form>
            {previewResetUrl && <div className="mt-5 border border-[#70D49D]/30 bg-[#70D49D]/[0.08] p-3 font-mono text-[9px] leading-5 text-[#B8E9CB]">DEVELOPMENT DELIVERY PREVIEW<br /><a className="break-all underline" href={previewResetUrl}>Open the local recovery link</a></div>}
            {isForgot ? <button type="button" onClick={() => changeMode("signIn")} className="mt-5 font-mono text-[9px] tracking-[0.1em] text-[#AEB8BE] underline hover:text-[#F3EEE5]">RETURN TO SIGN IN</button> : isReset ? <button type="button" onClick={() => changeMode("signIn")} className="mt-5 font-mono text-[9px] tracking-[0.1em] text-[#AEB8BE] underline hover:text-[#F3EEE5]">BACK TO SIGN IN</button> : !isRegister && <button type="button" onClick={() => changeMode("forgot")} className="mt-5 font-mono text-[9px] tracking-[0.1em] text-[#AEB8BE] underline hover:text-[#F3EEE5]">FORGOT PASSWORD?</button>}
          </div>
        </section>
        <footer className="border-t border-white/10 pt-5 font-mono text-[9px] tracking-[0.1em] text-[#7F8F97]">VEYRA IDENTITY / APPLICATION-OWNED ACCESS / NO EXTERNAL CALLBACK REQUIRED</footer>
      </div>
    </main>
  );
}

