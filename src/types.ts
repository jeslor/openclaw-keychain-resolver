export interface SecretRefRequest {
  protocolVersion: 1;
  provider: string;
  ids: string[];
}

export interface SecretRefResponse {
  protocolVersion: 1;
  values: Record<string, string>;
  errors?: Record<string, { message: string }>;
}

export const SERVICE_NAME = "openclaw-keychain";
