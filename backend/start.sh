#!/bin/bash
set -e

echo "==> Verificando revisao Alembic..."
# Pega a linha com a revisao atual (ex: "0008 (head)") ignorando linhas INFO
CURRENT=$(alembic current 2>&1 | grep -E "^[0-9a-f]+" || echo "")

if [ -z "$CURRENT" ]; then
    echo "==> Nenhuma revisao Alembic encontrada."
    echo "==> Banco criado via create_all. Carimbando em 0008 (baseline)..."
    alembic stamp 0008
else
    echo "==> Revisao atual: $CURRENT"
fi

echo "==> Aplicando migrations pendentes..."
alembic upgrade head

echo "==> Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
