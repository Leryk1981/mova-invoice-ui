import { AppConfig } from "./storage";

export const storeEpisodeSilently = async (
  config: AppConfig,
  action: string,
  requestId: string | undefined,
  requestPayload: unknown,
  responsePayload: unknown,
  statusCode?: number,
) => {
  const memoryBaseUrl = config.memoryBaseUrl || config.gatewayBaseUrl;
  const memoryToken = config.memoryToken || config.accessKey;
  if (!memoryBaseUrl || !memoryToken) {
    return;
  }
  const shortRand = Math.random().toString(36).slice(2, 8);
  const payload = {
    episode_id: `ui_${Date.now()}_${shortRand}`,
    domain: "invoice",
    action,
    ts_iso: new Date().toISOString(),
    gw_request_id: requestId ?? undefined,
    inputs: {
      request: requestPayload,
    },
    outputs: {
      http_status: statusCode ?? undefined,
      response: responsePayload,
    },
    meta: {
      source: "mova-invoice-ui/app",
    },
  };

  try {
    await fetch(`${memoryBaseUrl.replace(/\/$/, "")}/episode/store`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memoryToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent by design
  }
};
