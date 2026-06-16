# Planos de treino dinâmicos com IA

## Contexto

O app hoje tem 5 tipos de treino fixos no código (Push, Pull, Legs, Upper, Push+), cada um com 6 exercícios hardcoded. O objetivo é tornar os planos dinâmicos: cada usuário tem seu próprio plano salvo no Firestore, podendo criar/editar pelo app ou receber um plano gerado por IA via script local.

## Dados

Campo `plan` no documento `users/{uid}` no Firestore. Array de objetos:

```json
[
  {
    "key": "peito",
    "label": "Peito",
    "exercises": [
      { "name": "Supino reto c/ barra", "type": "composto", "sets": 4, "repsRange": "6–10", "note": "" },
      { "name": "Crossover no cabo",    "type": "isolador",  "sets": 3, "repsRange": "12–15", "note": "Foco na contração" }
    ]
  },
  {
    "key": "costas",
    "label": "Costas",
    "exercises": [ ... ]
  }
]
```

- `key` — identificador único do treino (slug, sem espaços/acentos), usado internamente
- `label` — nome exibido na aba (ex: "Peito", "PPL — Costas")
- Quantidade de treinos e exercícios por treino: livre
- Se `plan` não existir ou for array vazio → estado vazio no app

O `scheduleSync()` existente já persiste o plano no Firestore quando o usuário editar pelo app (junto com workouts, peso, nutrição).

## App — leitura do plano

No boot, após `loadFromCloud()`:
- Se `plan` existe e tem itens → usa como `DAYS` dinâmico (substitui a constante hardcoded)
- Se `plan` vazio ou ausente → tela de treino exibe estado vazio (não cai nos 5 fixos)

A variável global `DAYS` passa a ser mutável (`let DAYS = []`), populada pelo plano do usuário.

## App — criar e editar planos (in-app)

### Estado vazio
Quando `DAYS` está vazio, a aba Treino exibe:
- Mensagem: "Nenhum treino ainda"
- Botão verde "+ Novo treino"

### Criar treino
- Botão "+" ao lado das abas de treino existentes (sempre visível)
- Abre um input inline ou bottom sheet para digitar o nome (ex: "Peito")
- Confirmar cria a aba, entra nela vazia, dispara `scheduleSync()`

### Adicionar exercício
- Botão "+ Exercício" no final da lista de exercícios de cada treino
- Abre o seletor de catálogo existente (mesmo componente "Trocar exercício")
- Exercício selecionado é adicionado ao treino com `sets: 3`, `repsRange: "8–12"`, `note: ""`

### Remover exercício
- Botão de lixeira em cada card de exercício dentro do treino
- Remove o exercício do array e dispara `scheduleSync()`

### Deletar treino
- Botão "..." ou pressionar a aba exibe opção "Excluir treino"
- Confirma antes de deletar; remove do array `DAYS` e dispara `scheduleSync()`

### Reordenar
- Fora do escopo desta iteração

## Script local — publicar plano via IA

Arquivo `publish-plan.js` na raiz do projeto. Uso:

```bash
node publish-plan.js --uid <uid-do-usuario>
```

Lê `plan.json` na mesma pasta e escreve o campo `plan` no documento `users/{uid}` do Firestore via Firebase Admin SDK.

**Fluxo típico:**
1. Usuário pede: *"Cria um PPL de 6 dias focado em hipertrofia"*
2. Claude gera `plan.json` com os exercícios do catálogo
3. Usuário roda `node publish-plan.js --uid <uid>`
4. App atualiza no próximo acesso/reload

**Autenticação:** chave de serviço em `serviceAccountKey.json` (raiz do projeto, nunca vai para o git — adicionado ao `.gitignore`). Gerada em Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada.

## Catálogo de exercícios — exercícios novos

O catálogo atual é `exercises-db.json` (873 exercícios). Quando o plano gerado por IA incluir exercícios que não existem no catálogo:

1. Claude adiciona os novos exercícios ao `exercises-db.json` com os campos padrão (`id`, `name`, `category`, `equipment`, `primaryMuscles`, `secondaryMuscles`, `level`, `force`, `mechanic`)
2. Faz commit do arquivo atualizado
3. Publica o plano normalmente

Novos exercícios ficam disponíveis para todos os usuários do app (aparecem no seletor "Trocar exercício").

## Fora do escopo

- Reordenar exercícios por drag-and-drop
- Editar nome/sets/repsRange de exercícios existentes no plano (edição inline) — futura iteração
- Geração de plano com IA diretamente dentro do app (sem passar pelo Claude Code)
- Planos múltiplos por usuário (alternância entre planos)
