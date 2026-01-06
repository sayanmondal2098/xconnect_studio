import React from "react";
import Shell from "../components/Shell";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { Modal, Typewriter } from "../components/Modal";
import { api, IntegrationSummary } from "../lib/api";
import { useAppStore } from "../state/appStore";
import {
  Github,
  Trash2,
  RefreshCw,
  PlugZap,
  CheckCircle2,
  XCircle,
  Pencil,
  Sparkles,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

function statusChip(it: IntegrationSummary) {
  if (it.last_test_ok === true) {
    return (
      <span className="chip border-success/30 text-success">
        <CheckCircle2 className="w-3.5 h-3.5" /> OK
      </span>
    );
  }
  if (it.last_test_ok === false) {
    return (
      <span className="chip border-danger/30 text-danger">
        <XCircle className="w-3.5 h-3.5" /> Failed
      </span>
    );
  }
  return <span className="chip">Not tested</span>;
}

function fmt(ts: string | null) {
  if (!ts) return "–";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

type TestResult = { ok: boolean; headline: string; details: string };

type EditState =
  | {
      provider: "github";
      originalLabel: string;
      label: string;
      token: string;
      deleteOldIfRenamed: boolean;
    }
  | {
      provider: "servicenow";
      originalLabel: string;
      label: string;
      instance_url: string;
      username: string;
      password: string;
      deleteOldIfRenamed: boolean;
    };

function providerName(p: string) {
  return p === "servicenow" ? "ServiceNow" : p === "github" ? "GitHub" : p;
}

export default function Connections() {
  const drafts = useAppStore((s) => s.connectionDrafts);
  const setGithubDraft = useAppStore((s) => s.setGithubDraft);
  const setServiceNowDraft = useAppStore((s) => s.setServiceNowDraft);

  const [items, setItems] = React.useState<IntegrationSummary[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  // Modal (test/edit)
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalKind, setModalKind] = React.useState<"test" | "edit" | null>(null);
  const [modalBusy, setModalBusy] = React.useState(false);
  const [testResult, setTestResult] = React.useState<TestResult | null>(null);
  const [edit, setEdit] = React.useState<EditState | null>(null);

  async function refresh() {
    setErr(null);
    const res = await api.listIntegrations();
    setItems(res.items);
  }

  React.useEffect(() => {
    refresh().catch((e) => setErr(e.message || String(e)));
  }, []);

  async function connectGithub() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await api.connectGithub({ token: drafts.github.token, label: drafts.github.label || "default" });
      setMsg(`GitHub connected as ${res.github_login} (${res.label}).`);
      await refresh();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function connectServiceNow() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await api.connectServiceNow({
        instance_url: drafts.servicenow.instance_url,
        username: drafts.servicenow.username,
        password: drafts.servicenow.password,
        label: drafts.servicenow.label || "default",
      });
      setMsg(`ServiceNow connected as ${res.user} (${res.label}).`);
      await refresh();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function openTest(it: IntegrationSummary) {
    setModalKind("test");
    setModalOpen(true);
    setModalBusy(true);
    setTestResult(null);
    // keep edit null
    setEdit(null);

    runTest(it);
  }

  async function runTest(it: IntegrationSummary) {
    try {
      if (it.provider === "github") {
        const r = await api.listGithubRepos(it.label);
        const names = r.repos.slice(0, 6).map((x) => x.full_name).join("\n");
        setTestResult({
          ok: true,
          headline: "Connection verified. Mission cleared.",
          details: `GitHub responded with ${r.repos.length} repo(s).\n\nSample:\n${names || "(none)"}`,
        });
      } else if (it.provider === "servicenow") {
        const r = await api.listServiceNowTables(it.label, 8);
        const names = r.tables.slice(0, 8).map((t) => (t.label ? `${t.name} (${t.label})` : t.name)).join("\n");
        setTestResult({
          ok: true,
          headline: "Handshake complete. The portal accepts you.",
          details: `ServiceNow responded with ${r.tables.length} table(s).\n\nSample:\n${names || "(none)"}`,
        });
      } else {
        setTestResult({
          ok: false,
          headline: "No tester implemented.",
          details: `Provider '${it.provider}' doesn’t have a test routine yet.`,
        });
      }
      await refresh();
    } catch (e: any) {
      setTestResult({
        ok: false,
        headline: "Connection failed. Plot twist.",
        details: e.message || String(e),
      });
      await refresh().catch(() => {});
    } finally {
      setModalBusy(false);
    }
  }

  async function del(it: IntegrationSummary) {
    if (!confirm(`Delete ${it.provider}:${it.label}?`)) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await api.deleteIntegration(it.provider, it.label);
      setMsg("Deleted.");
      await refresh();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function openEdit(it: IntegrationSummary) {
    setModalKind("edit");
    setModalOpen(true);
    setModalBusy(false);
    setTestResult(null);

    if (it.provider === "github") {
      setEdit({
        provider: "github",
        originalLabel: it.label,
        label: it.label,
        token: "",
        deleteOldIfRenamed: true,
      });
    } else if (it.provider === "servicenow") {
      setEdit({
        provider: "servicenow",
        originalLabel: it.label,
        label: it.label,
        instance_url: String((it.config as any)?.instance_url ?? ""),
        username: String((it.config as any)?.username ?? ""),
        password: "",
        deleteOldIfRenamed: true,
      });
    } else {
      setEdit(null);
    }
  }

  async function saveEdit() {
    if (!edit) return;
    setModalBusy(true);

    try {
      if (edit.provider === "github") {
        if (!edit.token || edit.token.length < 10) throw new Error("GitHub token is required to update (min 10 chars).");
        await api.connectGithub({ token: edit.token, label: edit.label || "default" });

        if (edit.label !== edit.originalLabel && edit.deleteOldIfRenamed) {
          await api.deleteIntegration("github", edit.originalLabel).catch(() => {});
        }
      }

      if (edit.provider === "servicenow") {
        if (!edit.instance_url) throw new Error("Instance URL is required.");
        if (!edit.username) throw new Error("Username is required.");
        if (!edit.password) throw new Error("Password is required to update.");
        await api.connectServiceNow({
          instance_url: edit.instance_url,
          username: edit.username,
          password: edit.password,
          label: edit.label || "default",
        });

        if (edit.label !== edit.originalLabel && edit.deleteOldIfRenamed) {
          await api.deleteIntegration("servicenow", edit.originalLabel).catch(() => {});
        }
      }

      await refresh();
      setMsg("Connection updated.");
      setModalOpen(false);
      setModalKind(null);
      setEdit(null);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setModalBusy(false);
    }
  }

  const modalCanClose = modalKind === "edit" ? !modalBusy : !modalBusy; // test cannot close while running because modalBusy=true
  const modalTitle =
    modalKind === "test"
      ? testResult
        ? (testResult.ok ? "TEST RESULT" : "TEST FAILED")
        : "TESTING CONNECTION"
      : modalKind === "edit"
        ? "EDIT CONNECTION"
        : "";

  const modalSubtitle =
    modalKind === "test"
      ? testResult
        ? (testResult.ok ? "Cue dramatic anime soundtrack." : "Cue dramatic anime plot twist.")
        : "Stand by. You are not allowed to click anything right now."
      : modalKind === "edit"
        ? "Update credentials and config. This overwrites the stored secret for the label."
        : undefined;

  return (
    <Shell
      title="Connections"
      right={
        <button className="btn btn-primary" onClick={() => refresh()} disabled={busy}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      }
    >
      <Modal
        open={modalOpen}
        title={modalTitle}
        subtitle={modalSubtitle}
        canClose={modalCanClose}
        onClose={() => {
          if (!modalCanClose) return;
          setModalOpen(false);
          setModalKind(null);
          setTestResult(null);
          setEdit(null);
        }}
        footer={
          modalKind === "test" ? (
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted">Tip: a real “test endpoint” is optional. We test by calling the real API.</div>
              <button
                className="btn btn-primary"
                type="button"
                disabled={modalBusy}
                onClick={() => {
                  setModalOpen(false);
                  setModalKind(null);
                  setTestResult(null);
                }}
              >
                Close
              </button>
            </div>
          ) : modalKind === "edit" ? (
            <div className="flex items-center justify-end gap-2">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  if (modalBusy) return;
                  setModalOpen(false);
                  setModalKind(null);
                  setEdit(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={saveEdit} disabled={modalBusy}>
                {modalBusy ? "Saving..." : "Save changes"}
              </button>
            </div>
          ) : null
        }
      >
        {modalKind === "test" ? (
          <div className="scanline rounded-xl2 border border-border bg-panel2/60 p-4">
            {!testResult ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Sparkles className="w-4 h-4 text-lavender" />
                  <div>Running validation checks...</div>
                </div>
                <div className="mt-3 progress-bar" />
                <div className="mt-3 text-xs text-muted">
                  <Typewriter text="Authenticating... fetching data... refusing to trust anything blindly..." speedMs={14} />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {testResult.ok ? (
                    <ShieldCheck className="w-5 h-5 text-success" />
                  ) : (
                    <ShieldX className="w-5 h-5 text-danger" />
                  )}
                  <div className={["text-base font-semibold", testResult.ok ? "text-success" : "text-danger"].join(" ")}>
                    {testResult.headline}
                  </div>
                </div>

                <div className="mt-3 rounded-xl2 border border-border bg-panel/60 p-3 font-mono text-xs whitespace-pre-wrap">
                  <Typewriter text={testResult.details} speedMs={10} />
                </div>

                <div className="mt-3 text-xs text-muted">
                  {testResult.ok ? "SFX: キラキラ (sparkle)" : "SFX: ドーン (doom)"}
                </div>
              </>
            )}
          </div>
        ) : modalKind === "edit" ? (
          edit ? (
            <div className="grid gap-3">
              <div className="text-sm text-muted">
                Provider: <span className="text-text font-medium">{providerName(edit.provider)}</span> | Original label:{" "}
                <span className="font-mono text-xs">{edit.originalLabel}</span>
              </div>

              <TextField
                label="Label"
                value={edit.label}
                onChange={(v) => setEdit((s) => (s ? ({ ...s, label: v } as any) : s))}
                placeholder="default"
              />

              {edit.label !== edit.originalLabel ? (
                <div className="rounded-xl2 border border-border bg-panel2/60 p-3 text-xs text-muted">
                  Renaming creates a <b>new</b> connection under the new label. Optionally delete the old one after save.
                  <div className="mt-2">
                    <button
                      className="btn"
                      type="button"
                      onClick={() => setEdit((s) => (s ? ({ ...s, deleteOldIfRenamed: !s.deleteOldIfRenamed } as any) : s))}
                    >
                      {edit.deleteOldIfRenamed ? "Will delete old label after save" : "Will keep old label"}
                    </button>
                  </div>
                </div>
              ) : null}

              {edit.provider === "github" ? (
                <>
                  <TextField
                    label="New GitHub PAT (required to update)"
                    value={edit.token}
                    onChange={(v) => setEdit((s) => (s ? ({ ...s, token: v } as any) : s))}
                    placeholder="ghp_..."
                    type="password"
                  />
                  <div className="text-xs text-muted">
                    We do not show your saved token (by design). To update, you must provide a new one.
                  </div>
                </>
              ) : null}

              {edit.provider === "servicenow" ? (
                <>
                  <TextField
                    label="Instance URL"
                    value={edit.instance_url}
                    onChange={(v) => setEdit((s) => (s ? ({ ...s, instance_url: v } as any) : s))}
                    placeholder="https://devXXXXX.service-now.com"
                  />
                  <TextField
                    label="Username"
                    value={edit.username}
                    onChange={(v) => setEdit((s) => (s ? ({ ...s, username: v } as any) : s))}
                    placeholder="admin"
                  />
                  <TextField
                    label="Password (required to update)"
                    value={edit.password}
                    onChange={(v) => setEdit((s) => (s ? ({ ...s, password: v } as any) : s))}
                    type="password"
                    placeholder="••••••••"
                  />
                  <div className="text-xs text-muted">
                    Same story: saved passwords are never displayed. Provide a new password to update the secret.
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-muted">This provider does not support editing yet.</div>
          )
        ) : null}
      </Modal>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-7">
          <Card title="Saved connections" subtitle="Add, test, edit, delete. The full lifecycle of human indecision.">
            {err ? <div className="text-sm text-danger">{err}</div> : null}
            {msg ? <div className="text-sm text-success">{msg}</div> : null}

            <div className="mt-3 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="text-left font-medium py-2">Provider</th>
                    <th className="text-left font-medium py-2">Label</th>
                    <th className="text-left font-medium py-2">Status</th>
                    <th className="text-left font-medium py-2">Last tested</th>
                    <th className="text-right font-medium py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t border-border">
                      <td className="py-2">
                        <span className="inline-flex items-center gap-2">
                          {it.provider === "github" ? <Github className="w-4 h-4 text-mint" /> : <PlugZap className="w-4 h-4 text-sky" />}
                          <span className="capitalize">{it.provider}</span>
                        </span>
                      </td>
                      <td className="py-2 font-mono text-xs">{it.label}</td>
                      <td className="py-2">{statusChip(it)}</td>
                      <td className="py-2 text-muted">{fmt(it.last_tested_at)}</td>
                      <td className="py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button className="btn btn-primary" onClick={() => openTest(it)} disabled={busy}>
                            <RefreshCw className="w-4 h-4" /> Test
                          </button>
                          <button className="btn" onClick={() => openEdit(it)} disabled={busy}>
                            <Pencil className="w-4 h-4 text-peach" /> Edit
                          </button>
                          <button className="btn btn-danger" onClick={() => del(it)} disabled={busy}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 ? (
                    <tr>
                      <td className="py-6 text-center text-muted" colSpan={5}>
                        No connections yet. That’s either “clean” or “not started,” depending on your mood.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-5 flex flex-col gap-4">
          <Card title="Add GitHub (PAT)" subtitle="Stored encrypted on backend. Label lets you keep multiple accounts.">
            <div className="grid grid-cols-1 gap-3">
              <TextField label="Label" value={drafts.github.label} onChange={(v) => setGithubDraft({ label: v })} placeholder="defaultGithub" />
              <TextField label="Token (classic PAT)" value={drafts.github.token} onChange={(v) => setGithubDraft({ token: v })} placeholder="ghp_..." type="password" />
              <button className="btn btn-primary justify-center" onClick={connectGithub} disabled={busy}>
                <Github className="w-4 h-4" /> Save + Validate
              </button>
            </div>
          </Card>

          <Card title="Add ServiceNow" subtitle="Instance URL + basic auth. Use a least-privilege user, not admin. Seriously.">
            <div className="grid grid-cols-1 gap-3">
              <TextField label="Label" value={drafts.servicenow.label} onChange={(v) => setServiceNowDraft({ label: v })} placeholder="dev312494" />
              <TextField label="Instance URL" value={drafts.servicenow.instance_url} onChange={(v) => setServiceNowDraft({ instance_url: v })} placeholder="https://devXXXXX.service-now.com" />
              <TextField label="Username" value={drafts.servicenow.username} onChange={(v) => setServiceNowDraft({ username: v })} placeholder="admin" />
              <TextField label="Password" value={drafts.servicenow.password} onChange={(v) => setServiceNowDraft({ password: v })} type="password" placeholder="••••••••" />
              <button className="btn btn-primary justify-center" onClick={connectServiceNow} disabled={busy}>
                <PlugZap className="w-4 h-4" /> Save + Validate
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
