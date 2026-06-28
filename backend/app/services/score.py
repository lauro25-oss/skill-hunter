"""
Serviço de Score de Aderência.

Calcula uma pontuação 0–100 para um candidato,
tanto por completude do perfil quanto por aderência a uma vaga específica.
"""


# ── Score de completude de perfil (sem vaga) ─────────────────

PROFILE_WEIGHTS = {
    "nome":             5,
    "email":            5,
    "telefone":         5,
    "localizacao":      10,
    "cargo_atual":      15,
    "anos_experiencia": 15,
    "hard_skills":      20,   # até 20 pts proporcional ao nº de skills (max 10)
    "resumo_ia":        10,
    "texto_bruto":      15,
}


def score_completude(candidate: dict) -> float:
    """Score baseado em quão completo é o perfil do candidato (0–100)."""
    total = 0.0

    for field, weight in PROFILE_WEIGHTS.items():
        val = candidate.get(field)
        if field == "hard_skills":
            skills = val or []
            # Proporcional: 5 skills = 10 pts, 10+ skills = 20 pts
            total += min(weight, weight * len(skills) / 10)
        elif val:
            total += weight

    return round(min(total, 100.0), 1)


# ── Score de aderência a uma vaga ────────────────────────────

def score_aderencia(candidate: dict, requisitos: dict) -> float:
    """
    Calcula aderência do candidato a uma vaga específica.

    requisitos:
        skills_obrigatorias: list[str]   — peso 40
        skills_desejaveis:   list[str]   — peso 20
        anos_experiencia_min: float | None — peso 20
        palavras_chave:      list[str]   — peso 20 (busca no texto_bruto)

    Retorna score 0–100.
    """
    score = 0.0

    skills_candidato = {s.lower() for s in (candidate.get("hard_skills") or [])}
    texto = (candidate.get("texto_bruto") or "").lower()

    # Skills obrigatórias (40 pts)
    skills_ob = [s.lower() for s in (requisitos.get("skills_obrigatorias") or [])]
    if skills_ob:
        match = sum(1 for s in skills_ob if s in skills_candidato or s in texto)
        score += 40 * (match / len(skills_ob))

    # Skills desejáveis (20 pts)
    skills_des = [s.lower() for s in (requisitos.get("skills_desejaveis") or [])]
    if skills_des:
        match = sum(1 for s in skills_des if s in skills_candidato or s in texto)
        score += 20 * (match / len(skills_des))

    # Experiência mínima (20 pts)
    exp_min = requisitos.get("anos_experiencia_min")
    exp_cand = candidate.get("anos_experiencia")
    if exp_min is not None:
        if exp_cand is not None:
            ratio = min(exp_cand / exp_min, 1.5)  # cap em 150%
            score += 20 * min(ratio, 1.0)
    else:
        score += 20  # sem requisito de experiência = pontuação completa

    # Palavras-chave no texto bruto (20 pts)
    palavras = [p.lower() for p in (requisitos.get("palavras_chave") or [])]
    if palavras:
        match = sum(1 for p in palavras if p in texto)
        score += 20 * (match / len(palavras))
    else:
        score += 20

    return round(min(score, 100.0), 1)


def calcular_score(candidate: dict, requisitos: dict | None = None) -> float:
    """
    Ponto de entrada unificado.
    Se nenhuma vaga for fornecida, usa score de completude de perfil.
    """
    if requisitos:
        return score_aderencia(candidate, requisitos)
    return score_completude(candidate)
