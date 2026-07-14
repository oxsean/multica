"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import { Card, CardContent } from "@multica/ui/components/ui/card";
import { Input } from "@multica/ui/components/ui/input";
import { Label } from "@multica/ui/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@multica/ui/components/ui/alert-dialog";
import { useWorkspaceId } from "@multica/core/hooks";
import { useCurrentWorkspace } from "@multica/core/paths";
import { giteaConnectionsOptions, giteaKeys } from "@multica/core/gitea";
import { api } from "@multica/core/api";
import { useNavigation } from "../../navigation";
import { useT } from "../../i18n";
import { SettingsTab } from "./settings-layout";
import { GiteaMark } from "./gitea-mark";

export function GiteaTab() {
  const { t } = useT("settings");
  const workspace = useCurrentWorkspace();
  const wsId = useWorkspaceId();
  const qc = useQueryClient();
  const navigation = useNavigation();

  const { data } = useQuery({
    ...giteaConnectionsOptions(wsId),
    enabled: !!wsId,
  });
  const connections = data?.connections ?? [];
  const configured = data?.configured ?? false;
  const canManage = data?.can_manage === true;

  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleConnect() {
    if (connecting) return;
    const trimmedUrl = baseUrl.trim();
    const trimmedToken = token.trim();
    if (!trimmedUrl || !trimmedToken) {
      toast.error(t(($) => $.gitea.toast_missing_fields));
      return;
    }
    setConnecting(true);
    try {
      await api.giteaConnect(wsId, { base_url: trimmedUrl, token: trimmedToken });
      await qc.invalidateQueries({ queryKey: giteaKeys.connections(wsId) });
      toast.success(t(($) => $.gitea.toast_connected));
      setBaseUrl("");
      setToken("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t(($) => $.gitea.toast_connect_failed));
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!disconnectTarget || disconnecting) return;
    setDisconnecting(true);
    try {
      await api.deleteGiteaConnection(wsId, disconnectTarget);
      await qc.invalidateQueries({ queryKey: giteaKeys.connections(wsId) });
      toast.success(t(($) => $.gitea.toast_disconnected));
      setDisconnectTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t(($) => $.gitea.toast_disconnect_failed));
    } finally {
      setDisconnecting(false);
    }
  }

  if (!workspace) return null;

  const githubHref = `${navigation.pathname}?tab=github`;

  return (
    <SettingsTab
      title={t(($) => $.page.tabs.gitea)}
      description={t(($) => $.gitea.page_description)}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t(($) => $.gitea.section_connection)}</h2>
        <Card>
          <CardContent className="space-y-4">
            {connections.length > 0 ? (
              <ul className="space-y-3">
                {connections.map((conn) => (
                  <li key={conn.id} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <GiteaMark className="h-6 w-6 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{conn.base_url}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(($) => $.gitea.connected_as, { login: conn.account_login })}
                        </p>
                      </div>
                    </div>
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDisconnectTarget(conn.id)}
                      >
                        {t(($) => $.gitea.disconnect)}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-start gap-3">
                <GiteaMark className="h-6 w-6 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {canManage
                    ? t(($) => $.gitea.connection_description)
                    : t(($) => $.gitea.contact_admin_to_connect)}
                </p>
              </div>
            )}

            {canManage && configured && (
              <div className="space-y-3 border-t border-surface-border pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gitea-base-url" className="text-xs font-medium">
                    {t(($) => $.gitea.base_url_label)}
                  </Label>
                  <Input
                    id="gitea-base-url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={t(($) => $.gitea.base_url_placeholder)}
                    disabled={connecting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gitea-token" className="text-xs font-medium">
                    {t(($) => $.gitea.token_label)}
                  </Label>
                  <Input
                    id="gitea-token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={t(($) => $.gitea.token_placeholder)}
                    disabled={connecting}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(($) => $.gitea.token_hint)}
                  </p>
                </div>
                <Button size="sm" onClick={handleConnect} disabled={connecting}>
                  {connecting
                    ? t(($) => $.gitea.connecting)
                    : t(($) => $.gitea.connect)}
                </Button>
              </div>
            )}

            {canManage && !configured && (
              <p className="text-xs text-muted-foreground">
                {t(($) => $.gitea.not_configured_prefix)}{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  MULTICA_GITEA_SECRET_KEY
                </code>
                .
              </p>
            )}

            {!canManage && (
              <p className="text-xs text-muted-foreground">
                {t(($) => $.gitea.read_only_hint)}
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t(($) => $.gitea.section_features)}</h2>
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {t(($) => $.gitea.features_shared_note)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigation.push(githubHref)}
              >
                <ExternalLink className="h-3 w-3" />
                {t(($) => $.gitea.features_manage_link)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <AlertDialog
        open={!!disconnectTarget}
        onOpenChange={(v) => {
          if (!v && !disconnecting) setDisconnectTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(($) => $.gitea.disconnect_confirm_title)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(($) => $.gitea.disconnect_confirm_description)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>
              {t(($) => $.gitea.disconnect_confirm_cancel)}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting
                ? t(($) => $.gitea.disconnecting)
                : t(($) => $.gitea.disconnect_confirm_action)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsTab>
  );
}
