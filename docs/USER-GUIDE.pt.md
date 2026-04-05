# Guia do Usuário

Um guia abrangente para usar Spec Workflow MCP para desenvolvimento de software assistido por IA.

## Primeiros Passos

### O que é Spec Workflow MCP?

Spec Workflow MCP é um servidor Model Context Protocol que fornece ferramentas estruturadas de desenvolvimento orientado por especificações para assistentes de IA. Ele ajuda você a:

- Criar especificações detalhadas antes de codificar
- Rastrear progresso de implementação
- Gerenciar aprovações e revisões
- Manter documentação do projeto

### Fluxo de Trabalho Básico

1. **Criar uma especificação** - Defina o que você quer construir
2. **Revisar e aprovar** - Garanta que as especificações atendem aos requisitos
3. **Implementar tarefas** - Execute o plano de implementação
4. **Rastrear progresso** - Monitore o status de conclusão

## Criando Especificações

### Criação Simples de Especificação

Peça ao seu assistente de IA para criar uma especificação:

```
"Crie uma especificação para autenticação de usuário"
```

A IA automaticamente irá:
1. Criar um documento de requisitos
2. Projetar a abordagem técnica
3. Dividir a implementação em tarefas

### Criação Detalhada de Especificação

Forneça mais contexto para melhores especificações:

```
"Crie uma especificação chamada payment-gateway com os seguintes recursos:
- Processamento de cartão de crédito
- Integração com PayPal
- Gerenciamento de assinaturas
- Tratamento de webhook para eventos de pagamento"
```

### A Partir de Documentos Existentes

Use seu PRD ou documentos de design existentes:

```
"Construa uma especificação a partir de @product-requirements.md"
```

## Gerenciando Especificações

### Listando Todas as Especificações

```
"Liste todas as minhas especificações"
```

Retorna:
- Nomes das especificações
- Status atual
- Porcentagem de progresso
- Estados dos documentos

### Verificando Status da Especificação

```
"Mostre-me o status da especificação user-auth"
```

Fornece:
- Status de aprovação dos requisitos
- Status de aprovação do design
- Progresso de conclusão de tarefas
- Detalhamento de tarefas detalhado

### Visualizando Documentos da Especificação

Use o dashboard ou extensão VSCode para:
- Ler documentos de requisitos
- Revisar documentos de design
- Navegar listas de tarefas
- Rastrear progresso de implementação

## Trabalhando com Tarefas

### Estrutura de Tarefas

As tarefas são organizadas hierarquicamente:
- **1.0** - Seções principais
  - **1.1** - Subtarefas
  - **1.2** - Subtarefas
    - **1.2.1** - Passos detalhados

### Implementando Tarefas

#### Método 1: Implementação Direta
```
"Implemente a tarefa 1.2 da especificação user-auth"
```

#### Método 2: Copiar do Dashboard
1. Abra o dashboard
2. Navegue até sua especificação
3. Clique na aba "Tasks"
4. Clique no botão "Copy Prompt" ao lado de qualquer tarefa
5. Cole na sua conversa com a IA

#### Método 3: Implementação em Lote
```
"Implemente todas as tarefas de configuração de banco de dados da especificação user-auth"
```

### Status de Tarefa

As tarefas têm três estados:
- ⏳ **Pendente** - Não iniciada
- 🔄 **Em Progresso** - Sendo trabalhada atualmente
- ✅ **Concluída** - Finalizada

## Fluxo de Trabalho de Aprovação

### Solicitando Aprovação

Quando os documentos estão prontos para revisão:

1. A IA solicita aprovação automaticamente
2. Dashboard mostra notificação
3. Revise o documento
4. Forneça feedback ou aprove

### Ações de Aprovação

- **Aprovar** - Aceitar o documento como está
- **Solicitar Mudanças** - Fornecer feedback para revisão
- **Rejeitar** - Começar do zero com novos requisitos

### Processo de Revisão

1. Forneça feedback específico
2. IA revisa o documento
3. Revise a versão atualizada
4. Aprove ou solicite mais mudanças

## Fluxo de Trabalho de Bugs

### Relatando Bugs

```
"Crie um relatório de bug para falha de login ao usar SSO"
```

Cria:
- Descrição do bug
- Passos para reproduzir
- Comportamento esperado vs real
- Prioridade e severidade

### Resolução de Bug

```
"Crie uma correção para o bug #123 na especificação user-auth"
```

Gera:
- Análise de causa raiz
- Plano de implementação da correção
- Requisitos de teste
- Passos de implantação

## Sistema de Templates

### Usando Templates

Spec Workflow inclui templates para:
- Documentos de requisitos
- Documentos de design
- Listas de tarefas
- Relatórios de bug
- Documentos de direcionamento

### Templates Personalizados

Crie seus próprios templates em `.specflow/templates/`:

```markdown
# Template de Recurso Personalizado

## Visão Geral
[Descrição do recurso]

## Histórias de Usuário
[Histórias de usuário]

## Requisitos Técnicos
[Detalhes técnicos]
```

## Recursos Avançados

### Documentos de Direcionamento

Crie orientação de alto nível para o projeto:

```
"Crie documentos de direcionamento para meu projeto de e-commerce"
```

Gera:
- **Direcionamento de produto** - Visão e objetivos
- **Direcionamento técnico** - Decisões de arquitetura
- **Direcionamento de estrutura** - Organização do projeto

### Sistema de Arquivo

Gerencie especificações concluídas:
- Mova especificações finalizadas para arquivo
- Mantenha workspace ativo limpo
- Acesse especificações arquivadas a qualquer momento
- Restaure especificações quando necessário

### Suporte Multi-idioma

Mude o idioma da interface:

1. **Dashboard**: Configurações → Idioma
2. **Extensão VSCode**: Configurações da Extensão → Idioma
3. **Arquivo de configuração**: `lang = "pt"` (ou outro código de idioma)

## Melhores Práticas

### 1. Comece com Documentos de Direcionamento

Antes de criar especificações:
```
"Crie documentos de direcionamento para guiar o projeto"
```

### 2. Seja Específico nos Requisitos

Bom:
```
"Crie uma especificação para autenticação de usuário com:
- Login por email/senha
- OAuth2 (Google, GitHub)
- Suporte a 2FA
- Fluxo de redefinição de senha"
```

Não ideal:
```
"Crie uma especificação de login"
```

### 3. Revise Antes da Implementação

Sempre revise e aprove:
1. Documento de requisitos
2. Documento de design
3. Detalhamento de tarefas

### 4. Implemente Incrementalmente

- Complete tarefas em ordem
- Teste após cada seção principal
- Atualize status de tarefa regularmente

### 5. Use o Dashboard

O dashboard fornece:
- Rastreamento visual de progresso
- Navegação fácil de documentos
- Ações rápidas de aprovação
- Atualizações em tempo real

## Fluxos de Trabalho Comuns

### Desenvolvimento de Recurso

1. Criar especificação: `"Crie especificação para recurso de carrinho de compras"`
2. Revisar requisitos no dashboard
3. Aprovar ou solicitar mudanças
4. Revisar documento de design
5. Aprovar design
6. Implementar tarefas sequencialmente
7. Rastrear progresso no dashboard

### Correção de Bug

1. Relatar bug: `"Crie relatório de bug para erro de checkout"`
2. Analisar: `"Analise a causa raiz do bug #45"`
3. Planejar correção: `"Crie plano de correção para o bug #45"`
4. Implementar: `"Implemente a correção"`
5. Verificar: `"Crie plano de teste para correção do bug #45"`

### Refatoração

1. Criar especificação: `"Crie especificação para otimização de banco de dados"`
2. Documentar estado atual
3. Projetar melhorias
4. Planejar passos de migração
5. Implementar incrementalmente
6. Verificar cada passo

## Dicas e Truques

### Gerenciamento Eficiente de Tarefas

- Use agrupamento de tarefas para itens relacionados
- Copie prompts do dashboard para precisão
- Marque tarefas como concluídas imediatamente após finalizar

### Gerenciamento de Documentos

- Mantenha requisitos concisos mas completos
- Inclua critérios de aceitação
- Adicione restrições técnicas no design
- Referencie documentos externos quando necessário

### Colaboração

- Use comentários de aprovação para feedback
- Compartilhe URL do dashboard com a equipe
- Exporte documentos para revisão externa
- Rastreie mudanças através do histórico de revisão

## Integração com Assistentes de IA

### Consciência Contextual

O assistente de IA automaticamente:
- Conhece sua estrutura de projeto
- Entende relações entre especificações
- Rastreia progresso de implementação
- Mantém consistência

### Comandos em Linguagem Natural

Fale naturalmente:
- "Quais especificações eu tenho?"
- "Mostre-me o que falta fazer"
- "Comece a trabalhar na próxima tarefa"
- "Atualize o design para melhor desempenho"

### Fluxo de Trabalho Contínuo

A IA mantém contexto entre sessões:
- Retome de onde parou
- Referencie decisões anteriores
- Construa sobre trabalho existente
- Mantenha coerência do projeto

## Documentação Relacionada

- [Processo de Fluxo de Trabalho](WORKFLOW.pt.md) - Guia detalhado de fluxo de trabalho
- [Guia de Prompts](PROMPTING-GUIDE.pt.md) - Exemplos de prompts
- [Guia de Interfaces](INTERFACES.pt.md) - Detalhes do dashboard e extensão
- [Referência de Ferramentas](TOOLS-REFERENCE.pt.md) - Documentação completa de ferramentas
