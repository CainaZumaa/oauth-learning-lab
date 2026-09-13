import type { Locale } from "@/i18n/config";

const STATUS_LABELS: Record<
  Locale,
  Record<"ACCEPTED" | "REJECTED" | "INFO" | "401", string>
> = {
  en: {
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    INFO: "INFO",
    "401": "401",
  },
  pt: {
    ACCEPTED: "ACEITO",
    REJECTED: "REJEITADO",
    INFO: "INFO",
    "401": "401",
  },
};

const REASONS: Record<Locale, Record<string, string>> = {
  en: {},
  pt: {
    "authorize failed": "autorização falhou",
    "redirect_uri mismatch": "redirect_uri não confere",
    "redirect_uri is required": "redirect_uri é obrigatória",
    "redirect_uri rejected: URI does not exactly match registered redirect URI":
      "redirect_uri rejeitada: a URI não coincide exatamente com a URI registrada",
    "client_id rejected: unknown or mismatched client_id":
      "client_id rejeitado: desconhecido ou não confere",
    "Only response_type=code is supported (Authorization Code Flow)":
      "Só response_type=code é suportado (Authorization Code Flow)",
    "PKCE required: code_challenge is missing":
      "PKCE obrigatório: code_challenge ausente",
    "Only code_challenge_method=S256 is supported":
      "Só code_challenge_method=S256 é suportado",
    "code is required": "code é obrigatório",
    "authorization_code not found": "authorization_code não encontrado",
    "authorization_code already used": "authorization_code já foi usado",
    "authorization_code expired": "authorization_code expirado",
    "client mismatch": "client_id não confere",
    "client_id does not match authorization code binding":
      "client_id não confere com o vínculo do authorization_code",
    "client_id is required": "client_id é obrigatório",
    "PKCE validation failed": "validação PKCE falhou",
    "first exchange failed": "primeira troca de token falhou",
    "access_token expired": "access_token expirado",
    "Bearer access_token required": "Bearer access_token obrigatório",
    "token associated with different client/context":
      "token associado a outro client/contexto",
    "refresh_token is required": "refresh_token é obrigatório",
    "refresh_token not found": "refresh_token não encontrado",
    "refresh_token expired": "refresh_token expirado",
    "refresh_token already rotated/revoked":
      "refresh_token já rotacionado/revogado",
    "refresh_token required": "refresh_token obrigatório",
    "refresh_token requires offline_access scope (this lab's policy)":
      "refresh_token exige o scope offline_access (política deste lab)",
    "Supported: authorization_code, refresh_token":
      "Suportados: authorization_code, refresh_token",
    "UNEXPECTED: server accepted tampered URI":
      "INESPERADO: o servidor aceitou URI adulterada",
    "UNEXPECTED: reuse was accepted":
      "INESPERADO: o reuso do code foi aceito",
    "UNEXPECTED: missing PKCE accepted":
      "INESPERADO: ausência de PKCE foi aceita",
    "UNEXPECTED: wrong verifier accepted":
      "INESPERADO: verifier errado foi aceito",
    "UNEXPECTED: tampered client accepted":
      "INESPERADO: client adulterado foi aceito",
    "UNEXPECTED: expired code accepted":
      "INESPERADO: code expirado foi aceito",
    "UNEXPECTED: expired token allowed":
      "INESPERADO: token expirado foi permitido",
    "UNEXPECTED: old refresh accepted":
      "INESPERADO: refresh antigo foi aceito",
    "UNEXPECTED: refresh_token issued without offline_access":
      "INESPERADO: refresh_token emitido sem offline_access",
    "NEW ACCESS TOKEN ISSUED (+ rotated refresh_token)":
      "NOVO ACCESS TOKEN EMITIDO (+ refresh_token rotacionado)",
    "Access token issued WITHOUT refresh_token. Access still expires on its own TTL; offline_access was not granted so refresh is unavailable.":
      "Access token emitido SEM refresh_token. O access ainda expira pelo próprio TTL; sem offline_access o refresh não fica disponível.",
  },
};

export function translateToastStatus(
  locale: Locale,
  status: "ACCEPTED" | "REJECTED" | "INFO" | "401"
): string {
  return STATUS_LABELS[locale][status] ?? status;
}

export function translateToastReason(locale: Locale, reason: string): string {
  if (!reason) return reason;
  if (locale === "en") return reason;

  const exact = REASONS.pt[reason];
  if (exact) return exact;

  const unsupported = reason.match(/^Unsupported scope:\s*(.+)$/i);
  if (unsupported) return `Scope não suportado: ${unsupported[1]}`;

  const redirectMismatch = reason.match(
    /^redirect_uri rejected: URI does not exactly match registered redirect URI$/i
  );
  if (redirectMismatch) {
    return REASONS.pt[
      "redirect_uri rejected: URI does not exactly match registered redirect URI"
    ];
  }

  return reason;
}
