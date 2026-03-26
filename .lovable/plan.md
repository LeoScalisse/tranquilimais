
# Hábitos Pré-definidos com Streaks Individuais

## Conceito

Separar o sistema em duas entidades: **definições de hábitos** (templates persistentes com nome e cor) e **registros diários** (check-ins de qual hábito foi feito em qual dia). Streaks calculados por hábito individual.

## Mudanças no Banco de Dados

**Nova tabela `habit_definitions`:**
- `id` (uuid, PK), `user_id` (uuid), `title` (text), `color` (text), `created_at` (timestamptz), `archived` (boolean, default false)
- RLS: cada usuário acessa apenas os seus

**Tabela `habits` existente** passa a funcionar como registro diário:
- Adicionar coluna `habit_definition_id` (uuid, FK para habit_definitions, nullable para compatibilidade com dados antigos)
- Manter `title` e `color` para retrocompatibilidade

## Mudanças no Hook `useHabits.tsx`

- Adicionar estado e CRUD para `habitDefinitions` (criar, listar, arquivar)
- Função `logHabit(definitionId, date)` que insere na tabela `habits` usando título/cor da definição
- **Streaks por hábito**: calcular `{ current, best }` para cada `habit_definition_id` individualmente
- Expor `getStreakForHabit(definitionId)` 

## Mudanças na Tela `HabitsScreen.tsx`

### Layout reorganizado em duas áreas:

1. **Seção "Meus Hábitos"** (topo, antes do calendário):
   - Lista horizontal/grid dos hábitos pré-definidos com nome, bolinha de cor, e streak atual
   - Botão "+" para criar novo hábito (abre Dialog com nome + seleção de cor)
   - Toque longo ou ícone de lixeira para excluir/arquivar um hábito

2. **Calendário** (mantém visual atual):
   - Ao clicar num dia, abre um **Dialog/Sheet** mostrando a lista de hábitos pré-definidos como checklist
   - Cada hábito aparece com toggle/checkbox — marcado = registrado naquele dia
   - Marcar/desmarcar insere ou deleta o registro na tabela `habits`

3. **Seção de Streaks** (cards de estatísticas):
   - Em vez de streak global, mostrar cards por hábito com streak atual e melhor
   - Ou: ao tocar num hábito pré-definido, exibir popup com detalhes do streak desse hábito

### Dialogs:
- **Criar Hábito**: Input de nome + seleção de cor (mantém o visual atual)
- **Registrar Dia**: Lista de hábitos com checkboxes para marcar quais foram feitos
- **Detalhes do Hábito**: Popup ao tocar no hábito mostrando streak atual, melhor, e total de registros

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabela `habit_definitions`, adicionar coluna em `habits` |
| `src/hooks/useHabits.tsx` | Refatorar com definições + registros + streaks por hábito |
| `src/screens/HabitsScreen.tsx` | Redesenhar UI com seção de hábitos, checklist por dia, streaks individuais |
