export interface GiteaConnection {
  id: string;
  workspace_id: string;
  /** The instance web base URL, e.g. `https://gitea.example.com`. */
  base_url: string;
  account_login: string;
  account_avatar_url: string | null;
  created_at: string;
}

export interface ListGiteaConnectionsResponse {
  connections: GiteaConnection[];
  /** Whether the deployment has the Gitea secret key configured. When false, the Connect form is disabled. */
  configured: boolean;
  /** Whether the caller can connect / disconnect. Non-admin members get `false`.
   * Older backends omit the field; treat absence as `false` for read-only safety. */
  can_manage?: boolean;
}

export interface GiteaConnectRequest {
  base_url: string;
  token: string;
}
