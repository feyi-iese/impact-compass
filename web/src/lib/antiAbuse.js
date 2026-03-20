const HOUR_MS = 60 * 60 * 1000;

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const keyFor = (scope) => `abuse_guard:${scope}`;

const readTimestamps = (scope) => {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(keyFor(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => Number.isFinite(t));
  } catch {
    return [];
  }
};

const writeTimestamps = (scope, timestamps) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(keyFor(scope), JSON.stringify(timestamps));
};

export const checkSubmissionRate = (
  scope,
  { minIntervalMs = 15_000, maxPerHour = 6 } = {}
) => {
  const now = Date.now();
  const recent = readTimestamps(scope).filter((t) => now - t < HOUR_MS);
  const last = recent[recent.length - 1];

  if (last && now - last < minIntervalMs) {
    return {
      blocked: true,
      reason: 'cooldown',
      retryInMs: minIntervalMs - (now - last),
    };
  }

  if (recent.length >= maxPerHour) {
    return {
      blocked: true,
      reason: 'hourly_limit',
      retryInMs: HOUR_MS - (now - recent[0]),
    };
  }

  return { blocked: false };
};

export const markSubmission = (scope) => {
  const now = Date.now();
  const recent = readTimestamps(scope).filter((t) => now - t < HOUR_MS);
  recent.push(now);
  writeTimestamps(scope, recent);
};
