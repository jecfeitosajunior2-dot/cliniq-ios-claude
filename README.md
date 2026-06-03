# ClinIQ — O Shazam da Consulta Médica

**Redesign completo focado na experiência de captura por esfera animada**

## 🎯 Conceito Central

**"Toque. Consulte. Receba o caso reconstruído."**

ClinIQ não é um sistema que o médico preenche. É uma inteligência que escuta, entende, organiza e devolve o caso clínico pronto.

## ✨ Experiência do Produto

### Metáfora: Shazam para consulta médica

Assim como o Shazam identifica uma música em segundos, o ClinIQ reconstrói uma consulta médica inteira a partir da conversa, documentos e exames.

## 📱 Telas Principais (6)

### 1. Home / Capture
- **Esfera animada gigante** ocupando 35% da tela
- Texto: "Toque para capturar a consulta"
- Visual futurista com animações premium
- Casos recentes discretos
- Métricas do dia

### 2. Gravação em Andamento
- Esfera pulsando durante captura
- **Sinais de inteligência em tempo real:**
  - ✓ Voz do médico detectada
  - ✓ Voz do paciente detectada
  - ✓ Queixa principal emergindo
  - ✓ Sintomas detectados
  - ✓ Medicações mencionadas
  - ✓ Possíveis lacunas identificadas

### 3. Completar Caso
- Dados mínimos do paciente
- Especialidade e objetivo clínico
- **Adicionar contexto clínico** (não "upload"):
  - PDFs
  - Exames
  - Imagens

### 4. Análise Inteligente
- Mostra o **raciocínio acontecendo**
- 8 etapas de reconstrução
- **Descobertas em tempo real:**
  - Achado relevante encontrado
  - Inconsistência detectada
  - Padrão temporal identificado

### 5. Case Intelligence Report
- **Clinical Detective** em destaque (diferencial do produto)
- Achados cruzados com evidências
- Estrutura completa:
  - Resumo Executivo
  - Clinical Detective
  - Achados Relevantes
  - Inconsistências
  - Lacunas
  - Timeline Clínica
  - Perguntas Inteligentes
  - Próximos Passos

### 6. PDF Premium
- Preview do dossiê clínico
- Estrutura de documento médico internacional
- 12 páginas com 8 seções
- 27 evidências rastreáveis

## 🎨 Design Premium

### Inspirações
- **Shazam** — captura por esfera
- **Apple Health** — limpeza e sofisticação
- **Linear** — densidade elegante
- **Arc Browser** — modernidade
- **OpenAI** — visual futurista de IA
- **Raycast** — precisão e poder

### Características Visuais
- Fundo: gradient escuro (slate-950 → blue-950)
- Esfera 3D com múltiplas camadas de animação
- Glass effect (glassmorphism)
- Microanimações sofisticadas
- Partículas flutuantes
- Efeitos de glow e pulse
- Gradientes vibrantes (blue/purple)

## 🚀 Início Rápido

### Instalação

```bash
cd cliniq-redesign
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

### Build para Produção

```bash
npm run build
npm start
```

## 🛠️ Stack Técnica

- **Framework**: Next.js 14 + React 18
- **Estilização**: Tailwind CSS
- **Animações**: Framer Motion
- **Ícones**: Lucide React
- **TypeScript**: Tipagem completa

## 🎭 Componentes Principais

### AnimatedSphere
Esfera 3D animada com:
- Múltiplas camadas de glow
- Partículas flutuantes
- Efeitos de pulse
- Animações de hover/tap
- Estado de gravação

### Telas
- `HomeCapture` — tela inicial com esfera
- `RecordingInProgress` — gravação com sinais de IA
- `CompleteCase` — complementar dados
- `IntelligentAnalysis` — análise com descobertas
- `CaseIntelligenceReport` — relatório completo
- `PDFPreview` — visualização do PDF

## 🎯 Diferencial: Clinical Detective

O **Clinical Detective** é o motor de dependência do produto. Diferencia ClinIQ de um simples scribe:

### Tipos de Descoberta
1. **Padrão temporal** — "A piora não foi aleatória; ela tem progressão"
2. **Inconsistência** — "Paciente disse X, mas histórico mostra Y"
3. **Correlação entre fontes** — "Sintoma conversa com achado do exame"
4. **Lacuna crítica** — "Faltou perguntar algo que muda a decisão"
5. **Risco operacional** — "Há próximo passo que não pode ser esquecido"

### Estrutura de Cada Achado
- **Título** forte
- **Conclusão** clínica
- **Por que importa**
- **Evidências** rastreáveis
- **Confiança** (Alta/Média/Baixa)
- **Próxima ação**

## 📊 Objetivo Emocional

O médico deve sentir:
- ✅ Alívio
- ✅ Confiança
- ✅ Controle
- ✅ Inteligência ampliada
- ✅ Segurança

### Frase-chave
> "Consultar sem ClinIQ é como dirigir sem GPS"

## 🎬 Fluxo Completo

1. **Médico abre o app** → vê esfera animada
2. **Toca na esfera** → inicia gravação
3. **Consulta normalmente** → IA detecta em tempo real
4. **Encerra** → adiciona dados mínimos
5. **Aguarda 2-3 minutos** → vê raciocínio acontecendo
6. **Recebe dossiê** → Clinical Detective + PDF Premium

## 🔒 O Que NÃO É

- ❌ Landing page
- ❌ Site institucional
- ❌ Dashboard enterprise
- ❌ Prontuário eletrônico
- ❌ CRM médico
- ❌ Agenda
- ❌ Sistema de faturamento

## ✅ O Que É

✅ **Segundo cérebro clínico**  
✅ **Capturador de inteligência**  
✅ **Reconstrutor de casos**  
✅ **Amplificador cognitivo**

## 📝 Licença

Projeto desenvolvido como demonstração de produto iOS premium.

---

**ClinIQ** — Toque. Consulte. Receba o caso reconstruído.
