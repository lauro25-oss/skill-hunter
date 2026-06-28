import os
import resend

resend.api_key = os.environ.get("RESEND_API_KEY", "")

_FROM    = os.environ.get("EMAIL_FROM",    "SKILL HUNTER <noreply@skillcerto.com.br>")
_TO      = os.environ.get("NOTIFICATION_EMAIL", "")
_ENABLED = bool(resend.api_key and _TO)

STATUS_PT = {
    "novo":       "Novo",
    "em_triagem": "Em triagem",
    "shortlist":  "Shortlist",
    "aprovado":   "Aprovado",
    "rejeitado":  "Rejeitado",
    "contratado": "Contratado",
}

_BASE_HTML = """
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
  <div style="background:#0f172a;padding:20px 28px;border-radius:8px 8px 0 0;">
    <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">SKILL HUNTER</span>
    <span style="color:#2563eb;font-size:18px;font-weight:800;">.</span>
    <span style="color:#64748b;font-size:11px;margin-left:8px;">by skill certo</span>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px 28px;">
    {body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
    <p style="font-size:11px;color:#9ca3af;margin:0;">
      Este é um e-mail automático do sistema SKILL HUNTER ATS.<br>
      Não responda este e-mail.
    </p>
  </div>
</div>
"""


async def _send(subject: str, body_html: str) -> None:
    if not _ENABLED:
        return
    resend.Emails.send({
        "from":    _FROM,
        "to":      [_TO],
        "subject": subject,
        "html":    _BASE_HTML.format(body=body_html),
    })


async def enviar_email_novo_candidato(nome: str, arquivo: str, vaga: str | None) -> None:
    vaga_str = f"<strong>{vaga}</strong>" if vaga else "sem vaga definida"
    body = f"""
    <h2 style="margin:0 0 12px;color:#111827;font-size:16px;">Novo candidato importado</h2>
    <p style="color:#374151;margin:0 0 16px;">
      Um novo currículo foi processado pelo sistema.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;width:120px;">Candidato</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">{nome}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;">Arquivo</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">{arquivo}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;">Vaga</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">{vaga_str}</td>
      </tr>
    </table>
    <p style="margin:16px 0 0;">
      <a href="{os.environ.get('FRONTEND_URL','https://skill-hunter-psi.vercel.app')}"
         style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">
        Ver no sistema
      </a>
    </p>
    """
    await _send(f"[SKILL HUNTER] Novo candidato: {nome}", body)


async def enviar_email_status_alterado(nome: str, status_anterior: str, novo_status: str) -> None:
    cor_map = {
        "novo":       "#6b7280",
        "em_triagem": "#2563eb",
        "shortlist":  "#7c3aed",
        "aprovado":   "#16a34a",
        "rejeitado":  "#dc2626",
        "contratado": "#059669",
    }
    cor = cor_map.get(novo_status, "#374151")
    label_anterior = STATUS_PT.get(status_anterior, status_anterior)
    label_novo     = STATUS_PT.get(novo_status, novo_status)

    body = f"""
    <h2 style="margin:0 0 12px;color:#111827;font-size:16px;">Status de candidato atualizado</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;width:140px;">Candidato</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;"><strong>{nome}</strong></td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;">Status anterior</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">{label_anterior}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;">Novo status</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">
          <span style="background:{cor};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">
            {label_novo}
          </span>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;">
      <a href="{os.environ.get('FRONTEND_URL','https://skill-hunter-psi.vercel.app')}"
         style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">
        Ver no sistema
      </a>
    </p>
    """
    await _send(f"[SKILL HUNTER] {nome} → {label_novo}", body)


async def enviar_email_shortlist_criada(label: str, total: int, token: str) -> None:
    frontend_url = os.environ.get("FRONTEND_URL", "https://skill-hunter-psi.vercel.app")
    portal_url   = f"{frontend_url}/shortlist/{token}"
    body = f"""
    <h2 style="margin:0 0 12px;color:#111827;font-size:16px;">Nova shortlist criada</h2>
    <p style="color:#374151;margin:0 0 16px;">
      Uma nova shortlist foi criada e está pronta para ser compartilhada com o cliente.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;width:140px;">Nome</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;"><strong>{label}</strong></td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;">Candidatos</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">{total} candidatos na shortlist</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;">Link do cliente</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">
          <a href="{portal_url}" style="color:#2563eb;">{portal_url}</a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;display:flex;gap:10px;">
      <a href="{portal_url}"
         style="background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">
        Abrir portal do cliente
      </a>
    </p>
    """
    await _send(f"[SKILL HUNTER] Shortlist criada: {label}", body)
