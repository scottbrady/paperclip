import { api } from "./client";

export interface ClaudeConfigResponse {
  claudeJson: Record<string, unknown> | null;
  credentialsJson: Record<string, unknown> | null;
}

export const claudeConfigApi = {
  get: () => api.get<ClaudeConfigResponse>("/instance/claude-config"),
  update: (data: { claudeJson?: Record<string, unknown> | null; credentialsJson?: Record<string, unknown> | null }) =>
    api.patch<{ success: boolean }>("/instance/claude-config", data),
};
