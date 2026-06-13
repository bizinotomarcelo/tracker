# Trocar exercício via catálogo PT-BR — Design

## Contexto

O projeto tem um arquivo `exercises-ptbr-full-translation.json` (873 exercícios traduzidos para PT-BR, com nome, categoria, equipamento, músculos primários/secundários, nível, força, instruções e imagens). O app (`index.html`) define `DAYS`, uma lista fixa de 5 tipos de treino (Push, Pull, Legs, Upper, Push+), cada um com 6 exercícios fixos no código.

Objetivo: permitir que o usuário substitua qualquer um dos exercícios fixos por outro do catálogo, filtrando por músculo/equipamento, sem precisar editar o código.

## Dados

- Gerar `exercises-db.json` a partir de `exercises-ptbr-full-translation.json`, mantendo apenas: `id, name, category, equipment, primaryMuscles, secondaryMuscles, level, force, mechanic` (remove `instructions` e `images`). Tamanho estimado: ~186KB.
- O app faz `fetch('exercises-db.json')` (caminho relativo) apenas na primeira vez que o usuário abrir o seletor de troca, e guarda o resultado em `localStorage.mb_exdb` para evitar refetch.

## UI/UX

- Cada `.ex-card` em `#exContainer` ganha um botão "↔ Trocar exercício" ao lado/abaixo do badge de tipo.
- Ao clicar, abre um painel inline abaixo do card (dentro do mesmo `.ex-card` ou imediatamente após ele) contendo:
  - Campo de busca por nome (`<input>` com filtro client-side via `includes`, case-insensitive).
  - Chips de filtro por músculo (`primaryMuscles` do exercício atual, pré-marcados) e por equipamento (`equipment` do exercício atual, pré-marcado). Chips são toggle — clicar desmarca/marca.
  - Lista de resultados do catálogo que atendem aos filtros ativos (intersecção: `primaryMuscles` do item contém algum músculo marcado E `equipment` do item está entre os equipamentos marcados). Se nenhum chip estiver marcado, lista todos (filtrados só pela busca).
  - Cada resultado mostra nome + músculos/equipamento, com botão "Usar".
- Ao clicar "Usar":
  - Atualiza o slot: `name` recebe `result.name`; `type` (badge) é derivado de `result.mechanic`: `'isolado'` → `'isolador'`, qualquer outro valor (incluindo `null`) → `'composto'`.
  - `sets`, `repsRange` e `note` do slot **não mudam** — preserva a estrutura de séries planejada.
  - Painel de troca fecha e o card é re-renderizado.
- Card com exercício trocado (override ativo) mostra um botão extra "↺ restaurar padrão" que remove o override daquele slot e volta ao exercício original definido em `DAYS`.

## Persistência

- `localStorage.mb_day_overrides`, formato:
  ```json
  { "push1": { "0": { "name": "Supino inclinado c/ barra", "type": "composto" } } }
  ```
  Chave externa = `dayKey`, chave interna = índice do exercício no array `exercises` daquele dia.
- `renderExercises()` aplica os overrides de `mb_day_overrides[selectedDay.key]` sobre `selectedDay.exercises` antes de montar o HTML (sem mutar `DAYS` original — overrides são aplicados numa cópia/merge no momento da renderização).
- "Restaurar padrão" remove a entrada `mb_day_overrides[dayKey][index]` e re-renderiza.

## Compatibilidade com funcionalidades existentes

- `getLastPerf(name)` continua funcionando sem alteração — já busca por `name` no histórico de `workouts`.
- `captureSets`/`applySets`/`typeData` (séries em andamento por tipo de treino) continuam operando por índice (`i`), não por nome — não são afetados pela troca de exercício.
- `selectType`/troca entre abas de treino não é afetada.

## Fora do escopo

- Tela/painel de instruções (passo-a-passo) de execução — não incluído nesta etapa.
- Criação de novos tipos de treino ou exercícios extras além dos 6 slots existentes por dia.
- Edição de `sets`/`repsRange`/`note` ao trocar — permanecem os do slot original.
