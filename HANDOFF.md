# HANDOFF — Agent Council + Voice Agent
> Gerado em: 2026-03-29 | De: Claude Code → Para: Trae (ou qualquer AI local)

---

## O QUE É ESSE PROJETO

**Agent Council** — framework que resolve problemas complexos usando um "conselho" de agentes IA especializados.

**Repo:** `ma-serra/agent_council` | **Branch de trabalho:** `claude/analyze-project-agents-vQNob`
**Servidor:** Linux `/home/user/agent_council` | **API:** `http://localhost:8000`
**Stack:** FastAPI + SQLAlchemy + React 19 + Vite + Tailwind + OpenAI Agents SDK (GPT-5.1)

---

## FLUXO DOS 4 AGENTES

```
Pergunta + Arquivos
    ↓
[1] Council Architect (council_builder.py)
    → Cria 3-5 personas especializadas via GPT-5.1 (JSON)
    ↓
[User] Edita agentes (opcional)
    ↓
[2] Specialist Agents (council_runner.py) — PARALELO (asyncio.gather)
    → Cada um responde da sua perspectiva + TLDR + proposal_id
    ↓
[3] Peer Reviewers (council_reviewer.py) — PARALELO
    → Cada agente avalia os outros anonimamente (score 1-5, strengths, gaps)
    ↓
[4] Chairman (council_chairman.py)
    → Sintetiza tudo em resposta final autoritativa
```

---

## ESTRUTURA ATUAL DO PROJETO

```
agent_council/
├── agentcouncil.py              # CLI entrypoint
├── run_api.py                   # FastAPI server (porta 8000)
├── src/
│   ├── agent_council/core/
│   │   ├── council_builder.py   # Architect agent
│   │   ├── council_runner.py    # Parallel execution
│   │   ├── council_reviewer.py  # Peer review
│   │   ├── council_chairman.py  # Synthesis
│   │   ├── agent_builder.py     # Builds OpenAI agent instances
│   │   ├── agent_runner.py      # Runs single agent + token tracking
│   │   ├── agent_config.py      # AgentConfig dataclass
│   │   └── agent_presets.py     # Preset configs
│   ├── agent_council/utils/
│   │   ├── session_logger.py    # Token/cost tracking
│   │   ├── file_ingestion.py    # PDF/DOCX parser
│   │   └── context_condense.py  # Fallback summarizer
│   └── web/
│       ├── api.py               # FastAPI endpoints
│       ├── services.py          # Business logic
│       ├── database.py          # SQLAlchemy models
│       ├── db_service.py        # DB operations
│       └── state_service.py     # Session state (DB-backed)
├── web-ui/src/
│   ├── steps/Step1Input.jsx     # Pergunta + upload
│   ├── steps/Step2Build.jsx     # Council builder
│   ├── steps/Step3Edit.jsx      # Edit agents
│   ├── steps/Step4Execute.jsx   # Execute
│   ├── steps/Step5Review.jsx    # Peer review
│   └── steps/Step6Synthesize.jsx# Final answer
└── tools/
    ├── enable_everything_server.ps1  # Habilita Everything HTTP
    └── search_everything.py          # Busca arquivos via Everything API
```

---

## O QUE PRECISA SER FEITO (prioridade)

### TAREFA 1 — Templates de Conselho por Domínio

**Criar:** `src/agent_council/core/council_templates.py`
```python
TEMPLATES = {
    "TI": {
        "council_name": "Conselho de TI",
        "strategy_summary": "Perspectivas técnicas complementares",
        "agents": [
            {"name": "Arquiteto de Software", "persona": "...", "reasoning_effort": "high", "enable_web_search": False},
            {"name": "Engenheiro de Segurança", "persona": "...", "reasoning_effort": "high", "enable_web_search": True},
            {"name": "Product Manager", "persona": "...", "reasoning_effort": "medium", "enable_web_search": False},
            {"name": "DevOps/SRE", "persona": "...", "reasoning_effort": "medium", "enable_web_search": True},
            {"name": "QA/Tester", "persona": "...", "reasoning_effort": "medium", "enable_web_search": False},
        ]
    }
    # Futuros: "DIREITO", "PETICAO"
}
```

**Modificar:** `src/web/api.py`
- `GET /api/council-templates` → lista templates
- `POST /api/sessions/{id}/build_council?template=TI` → usa template sem chamar LLM

**Modificar:** `src/web/services.py`
- Função `build_council_from_template(key: str)`

**Modificar:** `web-ui/src/steps/Step2Build.jsx`
- Dropdown antes do botão gerar: "Gerar automaticamente" | "TI"

---

### TAREFA 2 — Voice Agent

**Fonte existente no GitHub da usuária:** `ma-serra/es-voicebot`
- React + Web Speech API (STT) + OpenAI GPT-4o + OpenAI TTS
- Atualizado fevereiro 2026
- **Só precisa trocar a chamada direta à OpenAI pelo Agent Council API**

**O que adaptar no es-voicebot:**
1. `POST /api/sessions` → cria sessão com a pergunta transcrita
2. Aguardar síntese final (polling `/api/sessions/{id}/status`)
3. Ler síntese final via TTS

**TTS recomendado (decisão tomada):**
- Level 1: Google TTS Neural2 pt-BR (1M chars/mês grátis)
- Level 2: Gemini 2.5 Flash Live (grátis, multimodal voz in/out)
- Level 3: OpenAI tts-1-hd (já tem API key)

**STT:** OpenAI Whisper / gpt-4o-mini-transcribe ($0.003/min, melhor pt-BR)

---

### TAREFA 3 — Everything HTTP Server (Everton Fink)

O script está em `tools/enable_everything_server.ps1`.
**Problema:** não executa automaticamente — precisa rodar no Windows local.

**Solução via Trae** (tem acesso à máquina):
```powershell
$ini = "$env:APPDATA\Everything\Everything.ini"
(Get-Content $ini) -replace 'http_server_enabled=0','http_server_enabled=1' | Set-Content $ini
Stop-Process -Name Everything -Force -ErrorAction SilentlyContinue
Start-Process "Everything"
```

Depois que rodar: `http://[IP]:8080/?s=TERMO&json=1` — qualquer AI pode buscar arquivos na máquina.

---

## DECISÕES JÁ TOMADAS (não reabrir)

| Decisão | Escolha |
|---------|---------|
| Voice TTS Level 1 | Google TTS Neural2 pt-BR (grátis) |
| Voice TTS Level 2 | Gemini 2.5 Flash Live (grátis, multimodal) |
| Voice STT | OpenAI Whisper ($0.003/min) |
| Voice frontend base | ma-serra/es-voicebot (adaptar) |
| Templates | Começar por TI, depois Direito e Petição |
| CosyVoice/MeloTTS | DESCARTADOS (sem pt-BR) |
| Browser/Windows TTS | DESCARTADOS (usuária não quer) |

---

## PROJETOS DA USUÁRIA RELEVANTES (GitHub: ma-serra)

| Repo | Relevância |
|------|-----------|
| `ma-serra/es-voicebot` | **Base do voice agent** — loop STT→LLM→TTS pronto |
| `ma-serra/meeting-brain-v5` | Padrões FastAPI + Whisper + WebSockets |
| `ma-serra/whisper-cpp-android-ptbr` | Whisper pt-BR offline |
| `ma-serra/agent_council` | Este projeto |

---

## ARQUIVOS NA MÁQUINA WINDOWS DA USUÁRIA

```
C:\Users\Marcela\.ollama\models          ← Ollama instalado
C:\Users\Marcela\Desktop\Solo\whisper-main (2)  ← Whisper local
H:\_4.0onedrive25\...\es-voicebot       ← voice agent base
H:\_4.0onedrive25\...\live-audio.zip    ← OpenAI Realtime demo
H:\_4.0onedrive25\...\react-voice-agent ← ARQUIVADO, não usar
```

---

## CONTEXTO: POR QUE MUDAMOS PARA O TRAE

- Claude Code rodando no servidor Linux não tem acesso direto ao Windows
- Everything (busca de arquivos) está no Windows
- Artefato de sessão anterior está no Windows/claude.ai
- Trae tem acesso à máquina local — consegue fazer o que Claude Code não consegue
