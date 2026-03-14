import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileJson } from "lucide-react";
import { claudeConfigApi } from "../api/claudeConfig";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys } from "../lib/queryKeys";

function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function ConfigSection({
  title,
  description,
  filePath,
  value,
  onChange,
  onSave,
  saving,
  error,
}: {
  title: string;
  description: string;
  filePath: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const isEmpty = value.trim() === "";
  const isValidJson = isEmpty || tryParseJson(value) !== null;
  const isDirty = value !== "";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
        <code className="text-xs text-muted-foreground font-mono">{filePath}</code>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          className="w-full min-h-48 resize-y rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={`Paste JSON content for ${filePath}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
        {!isValidJson && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            Invalid JSON — fix the content before saving.
          </div>
        )}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={saving || !isValidJson || isEmpty}
            onClick={onSave}
          >
            {saving ? "Saving..." : isDirty && isValidJson && !isEmpty ? "Save" : "Save"}
          </Button>
          {isEmpty && (
            <span className="text-xs text-muted-foreground">Paste JSON to enable saving</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClaudeConfig() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Instance Settings" },
      { label: "Claude Config" },
    ]);
  }, [setBreadcrumbs]);

  const [claudeJsonText, setClaudeJsonText] = useState("");
  const [credentialsJsonText, setCredentialsJsonText] = useState("");
  const [claudeJsonError, setClaudeJsonError] = useState<string | null>(null);
  const [credentialsJsonError, setCredentialsJsonError] = useState<string | null>(null);

  const configQuery = useQuery({
    queryKey: queryKeys.instance.claudeConfig,
    queryFn: () => claudeConfigApi.get(),
  });

  useEffect(() => {
    if (!configQuery.data) return;
    if (configQuery.data.claudeJson) {
      setClaudeJsonText(JSON.stringify(configQuery.data.claudeJson, null, 2));
    }
    if (configQuery.data.credentialsJson) {
      setCredentialsJsonText(JSON.stringify(configQuery.data.credentialsJson, null, 2));
    }
  }, [configQuery.data]);

  const claudeJsonMutation = useMutation({
    mutationFn: (claudeJson: Record<string, unknown>) =>
      claudeConfigApi.update({ claudeJson }),
    onSuccess: () => {
      setClaudeJsonError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.instance.claudeConfig });
    },
    onError: (err) => {
      setClaudeJsonError(err instanceof Error ? err.message : "Failed to save.");
    },
  });

  const credentialsMutation = useMutation({
    mutationFn: (credentialsJson: Record<string, unknown>) =>
      claudeConfigApi.update({ credentialsJson }),
    onSuccess: () => {
      setCredentialsJsonError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.instance.claudeConfig });
    },
    onError: (err) => {
      setCredentialsJsonError(err instanceof Error ? err.message : "Failed to save.");
    },
  });

  function handleSaveClaudeJson() {
    const parsed = tryParseJson(claudeJsonText);
    if (!parsed) {
      setClaudeJsonError("Invalid JSON.");
      return;
    }
    setClaudeJsonError(null);
    claudeJsonMutation.mutate(parsed);
  }

  function handleSaveCredentials() {
    const parsed = tryParseJson(credentialsJsonText);
    if (!parsed) {
      setCredentialsJsonError("Invalid JSON.");
      return;
    }
    setCredentialsJsonError(null);
    credentialsMutation.mutate(parsed);
  }

  if (configQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (configQuery.error) {
    const msg = configQuery.error instanceof Error ? configQuery.error.message : "Failed to load.";
    return <div className="text-sm text-destructive">{msg}</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Claude Config Files</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste JSON content to write to the Claude config files on disk.
        </p>
      </div>

      <ConfigSection
        title="Claude Settings"
        description="Global Claude Code settings used by agents."
        filePath={configQuery.data?.claudeJsonPath ?? "/paperclip/.claude.json"}
        value={claudeJsonText}
        onChange={setClaudeJsonText}
        onSave={handleSaveClaudeJson}
        saving={claudeJsonMutation.isPending}
        error={claudeJsonError}
      />

      <ConfigSection
        title="Claude Credentials"
        description="Claude Code credentials including API keys."
        filePath={configQuery.data?.credentialsJsonPath ?? "/paperclip/.claude/.credentials.json"}
        value={credentialsJsonText}
        onChange={setCredentialsJsonText}
        onSave={handleSaveCredentials}
        saving={credentialsMutation.isPending}
        error={credentialsJsonError}
      />
    </div>
  );
}
