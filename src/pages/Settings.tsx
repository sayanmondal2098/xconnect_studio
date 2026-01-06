import React from "react";
import Shell from "../components/Shell";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { api } from "../lib/api";
import { useAppStore, ThemeMode } from "../state/appStore";
import { useWorkflowStore } from "../state/workflowStore";
import { Check, RefreshCw, Trash2 } from "lucide-react";

function ThemeButton(props: { mode: ThemeMode; active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      className={[
        "btn w-full justify-between",
        props.active ? "border-lavender/60" : "border-border",
      ].join(" ")}
      onClick={props.onClick}
      type="button"
    >
      <span>{props.label}</span>
      {props.active ? <Check className="w-4 h-4 text-lavender" /> : null}
    </button>
  );
}

export default function Settings() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const resetWorkflow = useWorkflowStore((s) => s.reset);

  const [email, setEmail] = React.useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [notifications, setNotifications] = React.useState(true);

  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function load() {
    setErr(null);
    setMsg(null);
    try {
      const [me, s] = await Promise.all([api.me(), api.getUserSettings().catch(() => null)]);
      setUser(me);
      setEmail(me.email);
      if (s?.ok) {
        // backend stores theme as free-form string; we map to our modes
        const t = (s.settings.theme as any) as ThemeMode;
        if (t === "light" || t === "dark" || t === "system") setTheme(t);
        setNotifications(!!s.settings.notifications);
      }
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveTheme(mode: ThemeMode) {
    setTheme(mode);
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await api.putUserSettings({ theme: mode });
      setMsg("Theme saved.");
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveNotifications(v: boolean) {
    setNotifications(v);
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await api.putUserSettings({ notifications: v });
      setMsg("Settings saved.");
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveEmail() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const me = await api.updateMe({ email });
      setUser(me);
      setMsg("Profile updated.");
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMsg("Password changed.");
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Settings"
      right={
        <button className="btn btn-primary" onClick={load} disabled={busy} title="Refresh">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      }
    >
      {err ? <div className="text-sm text-danger mb-3">{err}</div> : null}
      {msg ? <div className="text-sm text-success mb-3">{msg}</div> : null}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-6 flex flex-col gap-4">
          <Card title="Appearance" subtitle="Because staring at one theme forever is a human rights violation.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ThemeButton mode="system" label="System" active={theme === "system"} onClick={() => saveTheme("system")} />
              <ThemeButton mode="light" label="Light" active={theme === "light"} onClick={() => saveTheme("light")} />
              <ThemeButton mode="dark" label="Dark" active={theme === "dark"} onClick={() => saveTheme("dark")} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-sm text-text font-medium">Notifications</div>
                <div className="text-xs text-muted">Stored server-side via /api/user/settings</div>
              </div>
              <button className="btn" onClick={() => saveNotifications(!notifications)} disabled={busy} type="button">
                {notifications ? "On" : "Off"}
              </button>
            </div>
          </Card>

          <Card title="Danger zone" subtitle="Reset just clears UI state. Backend stays intact.">
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-danger justify-center"
                onClick={() => {
                  if (!confirm("Reset the workflow canvas state?")) return;
                  resetWorkflow();
                  setMsg("Workflow canvas reset.");
                }}
                type="button"
              >
                <Trash2 className="w-4 h-4" /> Reset canvas state
              </button>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-6 flex flex-col gap-4">
          <Card title="Profile" subtitle="The bare minimum of user management.">
            <div className="grid grid-cols-1 gap-3">
              <TextField label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <button className="btn btn-primary justify-center" onClick={saveEmail} disabled={busy} type="button">
                Save profile
              </button>
              <div className="text-xs text-muted">
                User id: <span className="font-mono">{user?.id ?? "—"}</span> | Created:{" "}
                <span className="font-mono">{user?.created_at ?? "—"}</span>
              </div>
            </div>
          </Card>

          <Card title="Security" subtitle="Change password. Please don’t use 'password123' this time.">
            <div className="grid grid-cols-1 gap-3">
              <TextField label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" />
              <TextField label="New password" value={newPassword} onChange={setNewPassword} type="password" />
              <button className="btn btn-primary justify-center" onClick={changePassword} disabled={busy} type="button">
                Change password
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
