import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { api, setToken } from "../lib/api";
import { Workflow } from "lucide-react";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api.register(email, password);
      setToken(r.access_token);
      nav("/workflows");
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-center gap-2 text-muted">
          <div className="w-10 h-10 rounded-xl2 bg-panel border border-border shadow-soft flex items-center justify-center">
            <Workflow className="w-5 h-5 text-lavender" />
          </div>
          <div className="text-sm">
            <div className="text-text font-semibold">XConnect Studio</div>
            <div className="text-xs text-muted">Create an account. Try not to forget it.</div>
          </div>
        </div>

        <Card title="Register" subtitle="One step closer to automating your job away.">
          <form className="grid gap-3" onSubmit={submit}>
            <TextField label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <TextField label="Password" value={password} onChange={setPassword} type="password" placeholder="min 8 chars" />
            {err ? <div className="text-sm text-danger">{err}</div> : null}
            <button className="btn btn-primary justify-center" disabled={busy}>
              {busy ? "Creating..." : "Create account"}
            </button>
          </form>

          <div className="text-sm text-muted mt-3">
            Already have an account?{" "}
            <Link className="text-lavender underline underline-offset-4" to="/login">
              Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
