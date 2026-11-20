const KEY = "renewal-cockpit:demo-status";

export type StatusOverrides = Record<string, string>;

export function readOverrides(): StatusOverrides {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StatusOverrides) : {};
  } catch {
    return {};
  }
}

export function writeOverride(contractId: string, status: string): StatusOverrides {
  const next = { ...readOverrides(), [contractId]: status };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearOverrides(): void {
  window.localStorage.removeItem(KEY);
}

/** Browser value wins over the database value on screen. */
export function effectiveStatus(dbStatus: string, contractId: string, overrides: StatusOverrides): string {
  return overrides[contractId] ?? dbStatus;
}
