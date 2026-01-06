import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";

export type ConnectionDrafts = {
  github: { label: string; token: string };
  servicenow: { label: string; instance_url: string; username: string; password: string };
};

export type AppUser = { id: number; email: string; created_at: string };

type State = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  user: AppUser | null;
  setUser: (u: AppUser | null) => void;

  connectionDrafts: ConnectionDrafts;
  setGithubDraft: (patch: Partial<ConnectionDrafts["github"]>) => void;
  setServiceNowDraft: (patch: Partial<ConnectionDrafts["servicenow"]>) => void;
};

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (t) => set({ theme: t }),

      user: null,
      setUser: (u) => set({ user: u }),

      connectionDrafts: {
        github: { label: "default", token: "" },
        servicenow: { label: "default", instance_url: "", username: "", password: "" },
      },

      setGithubDraft: (patch) =>
        set({ connectionDrafts: { ...get().connectionDrafts, github: { ...get().connectionDrafts.github, ...patch } } }),

      setServiceNowDraft: (patch) =>
        set({
          connectionDrafts: {
            ...get().connectionDrafts,
            servicenow: { ...get().connectionDrafts.servicenow, ...patch },
          },
        }),
    }),
    {
      name: "xconnect_ui",
      version: 1,
      partialize: (s) => ({ theme: s.theme, connectionDrafts: s.connectionDrafts }),
    }
  )
);
