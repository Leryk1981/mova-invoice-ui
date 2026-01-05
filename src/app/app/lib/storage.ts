export type AppMode = "demo" | "connected";

export type Client = {
  id: string;
  name: string;
  email: string;
  defaultAmount?: number;
};

export type Receipt = {
  ts: string;
  action: string;
  status: string;
  requestId?: string;
  clientName?: string;
  amount?: number;
};

export type AppConfig = {
  mode: AppMode;
  accessKey: string;
  gatewayBaseUrl: string;
  memoryBaseUrl: string;
  memoryToken: string;
};

export const STORAGE_KEYS = {
  clients: "mova_clients_v0",
  receipts: "mova_receipts_demo_v0",
  mode: "mova_mode",
  accessKey: "mova_access_key",
  gatewayBaseUrl: "mova_gateway_base_url",
  memoryBaseUrl: "mova_memory_base_url",
  memoryToken: "mova_memory_token",
};

export const DEFAULT_CONFIG: AppConfig = {
  mode: "demo",
  accessKey: "",
  gatewayBaseUrl: "",
  memoryBaseUrl: "",
  memoryToken: "",
};

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const canUseStorage = () => typeof window !== "undefined";

export const loadClients = (): Client[] => {
  if (!canUseStorage()) {
    return [];
  }
  return safeParse<Client[]>(window.localStorage.getItem(STORAGE_KEYS.clients), []);
};

export const saveClients = (clients: Client[]) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
};

export const loadReceipts = (): Receipt[] => {
  if (!canUseStorage()) {
    return [];
  }
  return safeParse<Receipt[]>(
    window.localStorage.getItem(STORAGE_KEYS.receipts),
    [],
  );
};

export const saveReceipts = (receipts: Receipt[]) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEYS.receipts,
    JSON.stringify(receipts.slice(0, 20)),
  );
};

export const addReceipt = (receipt: Receipt) => {
  if (!canUseStorage()) {
    return;
  }
  const existing = loadReceipts();
  saveReceipts([receipt, ...existing].slice(0, 20));
};

export const loadConfig = (): AppConfig => {
  if (!canUseStorage()) {
    return { ...DEFAULT_CONFIG };
  }
  const mode = (window.localStorage.getItem(STORAGE_KEYS.mode) ??
    DEFAULT_CONFIG.mode) as AppMode;
  return {
    mode: mode === "connected" ? "connected" : "demo",
    accessKey: window.localStorage.getItem(STORAGE_KEYS.accessKey) ?? "",
    gatewayBaseUrl:
      window.localStorage.getItem(STORAGE_KEYS.gatewayBaseUrl) ?? "",
    memoryBaseUrl:
      window.localStorage.getItem(STORAGE_KEYS.memoryBaseUrl) ?? "",
    memoryToken: window.localStorage.getItem(STORAGE_KEYS.memoryToken) ?? "",
  };
};

export const saveConfig = (config: AppConfig) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.mode, config.mode);
  if (config.accessKey) {
    window.localStorage.setItem(STORAGE_KEYS.accessKey, config.accessKey);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.accessKey);
  }
  if (config.gatewayBaseUrl) {
    window.localStorage.setItem(
      STORAGE_KEYS.gatewayBaseUrl,
      config.gatewayBaseUrl,
    );
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.gatewayBaseUrl);
  }
  if (config.memoryBaseUrl) {
    window.localStorage.setItem(
      STORAGE_KEYS.memoryBaseUrl,
      config.memoryBaseUrl,
    );
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.memoryBaseUrl);
  }
  if (config.memoryToken) {
    window.localStorage.setItem(STORAGE_KEYS.memoryToken, config.memoryToken);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.memoryToken);
  }
};
