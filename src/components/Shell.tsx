import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, Workflow, PlugZap, Settings as SettingsIcon, LogOut, Sun, Moon, Laptop } from "lucide-react";
import { api, clearToken } from "../lib/api";
import { useAppStore } from "../state/appStore";

function navClass(isActive: boolean) {
  return [
    "w-full px-3 py-2 rounded-xl2 border border-border bg-panel hover:bg-panel2",
    "text-sm flex items-center gap-2 transition",
    isActive ? "border-lavender/60" : "border-border",
  ].join(" ");
}

function themeIcon(mode: "system" | "light" | "dark") {
  if (mode === "light") return <Sun className="w-4 h-4 text-lemon" />;
  if (mode === "dark") return <Moon className="w-4 h-4 text-lavender" />;
  return <Laptop className="w-4 h-4 text-sky" />;
}

export default function Shell(props: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  const nav = useNavigate();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  React.useEffect(() => {
    let alive = true;
    if (user) return;
    api.me()
      .then((u) => alive && setUser(u))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, setUser]);

  function cycleTheme() {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col gap-4 border-r border-border bg-panel/40 px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl2 bg-panel border border-border shadow-soft flex items-center justify-center">
            <Workflow className="w-5 h-5 text-lavender" />
          </div>
          <div>
            <div className="text-text font-semibold leading-tight">XConnect Studio</div>
            <div className="text-muted text-xs">Workflows, without the chaos.</div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <NavLink to="/workflows" className={({ isActive }) => navClass(isActive)}>
            <LayoutGrid className="w-4 h-4 text-sky" />
            Workflows
          </NavLink>

          <NavLink to="/studio" className={({ isActive }) => navClass(isActive)}>
            <Workflow className="w-4 h-4 text-lavender" />
            Studio
          </NavLink>

          <NavLink to="/connections" className={({ isActive }) => navClass(isActive)}>
            <PlugZap className="w-4 h-4 text-mint" />
            Connections
          </NavLink>

          <NavLink to="/settings" className={({ isActive }) => navClass(isActive)}>
            <SettingsIcon className="w-4 h-4 text-peach" />
            Settings
          </NavLink>
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <button className="btn btn-primary justify-between" onClick={cycleTheme} title="Theme">
            <span className="flex items-center gap-2">
              {themeIcon(theme)}
              Theme
            </span>
            <span className="chip capitalize">{theme}</span>
          </button>

          <button
            className="btn btn-danger"
            onClick={() => {
              clearToken();
              setUser(null);
              nav("/login");
            }}
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-danger" />
            Logout
          </button>

          <div className="text-xs text-muted pt-1">
            {user ? (
              <>
                Signed in as <span className="text-text">{user.email}</span>
              </>
            ) : (
              <>Signed in</>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main>
        <header className="px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-10 h-10 rounded-xl2 bg-panel border border-border shadow-soft flex items-center justify-center">
              <Workflow className="w-5 h-5 text-lavender" />
            </div>
            <div>
              <div className="text-text font-semibold leading-tight">{props.title}</div>
              <div className="text-muted text-xs">
                {user ? user.email : "Loading user..."}{" "}
                <span className="hidden sm:inline">| Pastel, minimal, and trying to keep it together.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="md:hidden btn btn-primary" onClick={cycleTheme} title="Theme">
              {themeIcon(theme)}
            </button>
            {props.right}
            <button
              className="md:hidden btn btn-danger"
              onClick={() => {
                clearToken();
                setUser(null);
                nav("/login");
              }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="px-5 pb-6">{props.children}</div>
      </main>
    </div>
  );
}
