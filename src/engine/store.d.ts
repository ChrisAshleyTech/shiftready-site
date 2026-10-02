// Types for store.js (the engine stays plain JS). The live state is loosely typed on purpose:
// its shape is defined by the original simulator's data.
export let S: any;
export function setState(next: any): void;
export const U: (id: string) => any;
export const has: (id: string, g: string) => boolean;
export const C: (pass: unknown, label: string, pts: number, detail?: string) => { pass: boolean; label: string; pts: number; detail: string };
export function roleCheck(id: string, rk: string, pts: number): ReturnType<typeof C>;
export const firstIdx: (f: (e: any) => boolean) => number;
export function verifiedBefore(tid: string, acts: string[], target: string): boolean;
export function approvalBefore(tid: string, test: (e: any) => boolean): boolean;
export const esc: (ts: any, who: string) => boolean;
export const sodConflicts: (id: string) => string[][];
export const escalatedOn: (tid: string, who: string) => boolean;
