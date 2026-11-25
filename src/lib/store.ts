'use client';
import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Answers, Case, Evidence, Report, Bi } from './schemas';
import { demoCase } from './content';
import { nowIST, uid } from '.';

export const STORAGE_KEY = 'reclaim:v1';

export interface Settings {
  lang: 'en' | 'hi';
  neutralTitle: boolean;
  pinHash: string | null;
  pinSalt: string | null;
}
export interface State {
  hydrated: boolean;
  settings: Settings;
  answers: Answers;
  case: Case | null;
  tour: { active: boolean; step: number };
  setHydrated: () => void;
  setAnswer: <K extends keyof Answers>(k: K, v: Answers[K]) => void;
  resetAnswers: () => void;
  saveCase: (planKeys: string[]) => void;
  loadDemo: () => void;
  startBlankCase: () => void;
  togglePlanStep: (key: string) => void;
  addReport: (platform: string) => void;
  updateReport: (id: string, patch: Partial<Report>) => void;
  removeReport: (id: string) => void;
  addEvidence: (e: Omit<Evidence, 'id'>) => void;
  removeEvidence: (id: string) => void;
  log: (event: string | Bi) => void;
  setNeutralTitle: (v: boolean) => void;
  setPin: (hash: string, salt: string) => void;
  clearPin: () => void;
  startTour: () => void;
  setTourStep: (n: number) => void;
  endTour: () => void;
  wipe: () => void;
}

const defaultSettings: Settings = { lang: 'en', neutralTitle: false, pinHash: null, pinSalt: null };
const emptyAnswers: Answers = { what: [], where: [] };

function isPristine(s: Partial<State>): boolean {
  const st = s.settings ?? defaultSettings;
  const a = s.answers ?? emptyAnswers;
  return (
    !s.case &&
    !s.tour?.active &&
    !st.neutralTitle &&
    !st.pinHash &&
    !a.about && !a.safety && !a.who && !a.threat && !a.when && !a.lang &&
    (a.what?.length ?? 0) === 0 && (a.where?.length ?? 0) === 0
  );
}

/** Writes nothing when there is nothing to keep, so "Delete everything" really leaves storage empty. */
const quietStorage: StateStorage = {
  getItem: (k) => {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  setItem: (k, v) => {
    try {
      const parsed = JSON.parse(v) as { state: Partial<State> };
      if (isPristine(parsed.state)) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch { /* storage full or blocked: keep working in memory */ }
  },
  removeItem: (k) => {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  },
};

const newCase = (answers: Answers, planKeys: string[], reportsFor: string[]): Case => ({
  id: uid('case'),
  demo: false,
  createdAt: nowIST(),
  answers,
  plan: planKeys.map((k) => ({ stepId: k, done: false })),
  reports: reportsFor.map((p) => ({ id: uid('r'), platform: p, reportedAt: null, refId: '', status: 'not_reported', resolvedAt: null, notes: '' })),
  evidence: [],
  timeline: [{ at: nowIST(), event: { en: 'Case created', hi: 'केस बनाया गया' } }],
});

const PLATFORM_IDS = ['instagram', 'facebook', 'whatsapp', 'telegram', 'x', 'reddit', 'youtube', 'google-search'];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      settings: defaultSettings,
      answers: emptyAnswers,
      case: null,
      tour: { active: false, step: 0 },
      setHydrated: () => set({ hydrated: true }),
      setAnswer: (k, v) => set((s) => ({ answers: { ...s.answers, [k]: v } })),
      resetAnswers: () => set({ answers: emptyAnswers }),
      saveCase: (planKeys) => {
        const a = get().answers;
        const plats = (a.where ?? []).filter((w) => PLATFORM_IDS.includes(w));
        const existing = get().case;
        if (existing && !existing.demo) {
          // Merge into the existing case: keep reports and evidence, add new platforms and steps.
          const have = new Set(existing.reports.map((r) => r.platform));
          const doneKeys = new Set(existing.plan.filter((p) => p.done).map((p) => p.stepId));
          set({
            case: {
              ...existing,
              answers: a,
              plan: planKeys.map((k) => ({ stepId: k, done: doneKeys.has(k) })),
              reports: [
                ...existing.reports,
                ...plats.filter((p) => !have.has(p)).map((p) => ({ id: uid('r'), platform: p, reportedAt: null, refId: '', status: 'not_reported' as const, resolvedAt: null, notes: '' })),
              ],
              timeline: [...existing.timeline, { at: nowIST(), event: { en: 'Action plan updated', hi: 'एक्शन प्लान अपडेट किया' } }],
            },
          });
          return;
        }
        set({ case: newCase(a, planKeys, plats) });
      },
      loadDemo: () => set({ case: structuredClone(demoCase), answers: structuredClone(demoCase.answers) }),
      startBlankCase: () => set({ case: newCase(emptyAnswers, [], []) }),
      togglePlanStep: (key) =>
        set((s) => {
          if (!s.case) return {};
          const has = s.case.plan.some((p) => p.stepId === key);
          const plan = has
            ? s.case.plan.map((p) => (p.stepId === key ? { ...p, done: !p.done } : p))
            : [...s.case.plan, { stepId: key, done: true }];
          return { case: { ...s.case, plan } };
        }),
      addReport: (platform) =>
        set((s) => {
          const c = s.case ?? newCase(emptyAnswers, [], []);
          return { case: { ...c, reports: [...c.reports, { id: uid('r'), platform, reportedAt: null, refId: '', status: 'not_reported', resolvedAt: null, notes: '' }] } };
        }),
      updateReport: (id, patch) =>
        set((s) => (s.case ? { case: { ...s.case, reports: s.case.reports.map((r) => (r.id === id ? { ...r, ...patch } : r)) } } : {})),
      removeReport: (id) => set((s) => (s.case ? { case: { ...s.case, reports: s.case.reports.filter((r) => r.id !== id) } } : {})),
      addEvidence: (e) =>
        set((s) => {
          const c = s.case ?? newCase(s.answers, [], []);
          return { case: { ...c, evidence: [...c.evidence, { ...e, id: uid('e') }] } };
        }),
      removeEvidence: (id) => set((s) => (s.case ? { case: { ...s.case, evidence: s.case.evidence.filter((e) => e.id !== id) } } : {})),
      log: (event) => set((s) => (s.case ? { case: { ...s.case, timeline: [...s.case.timeline, { at: nowIST(), event }] } } : {})),
      setNeutralTitle: (v) => set((s) => ({ settings: { ...s.settings, neutralTitle: v } })),
      setPin: (hash, salt) => set((s) => ({ settings: { ...s.settings, pinHash: hash, pinSalt: salt } })),
      clearPin: () => set((s) => ({ settings: { ...s.settings, pinHash: null, pinSalt: null } })),
      startTour: () => set({ tour: { active: true, step: 0 } }),
      setTourStep: (n) => set({ tour: { active: true, step: n } }),
      endTour: () => set({ tour: { active: false, step: 0 } }),
      wipe: () => set({ settings: defaultSettings, answers: emptyAnswers, case: null, tour: { active: false, step: 0 } }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => quietStorage),
      skipHydration: true,
      partialize: (s) => ({ settings: s.settings, answers: s.answers, case: s.case, tour: s.tour }),
    },
  ),
);

/** Clear every trace this app keeps in the browser. */
export function deleteEverything() {
  useStore.getState().wipe();
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('reclaim')) localStorage.removeItem(k);
    for (const k of Object.keys(sessionStorage)) if (k.startsWith('reclaim')) sessionStorage.removeItem(k);
  } catch { /* ignore */ }
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
