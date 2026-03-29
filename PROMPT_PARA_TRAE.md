# PROMPT — Cole isso no Trae para continuar o projeto

---

## CONTEXTO DO PROJETO

Sou a Marcela. Estávamos trabalhando no **Agent Council** com o Claude Code (Linux) mas ele não tem acesso à minha máquina Windows. Preciso que você (Trae, com acesso local) continue de onde paramos.

---

## PRIMEIRO: LEIA ESSES ARQUIVOS

**1. Arquivo base do projeto anterior (IMPORTANTE):**
```
C:\Users\Marcela\AppData\Roaming\Claude\local-agent-mode-sessions\9dd8b032-4acd-47e6-aaf8-1737446835b0\a09b58bb-0274-4aed-9d63-7aaae8e431b4\local_cd759075-7649-44ae-b5d9-da17a6dd6f3a\outputs\jarvis-workspace.html
```
Leia esse HTML e me mostra o que está lá. Ele contém a estrutura do workspace que foi planejada.

**2. Contexto completo da última sessão:**
```
git clone https://github.com/ma-serra/agent_council
git checkout claude/analyze-project-agents-vQNob
cat HANDOFF.md
```

---

## SEGUNDO: CONFIGURE O EVERYTHING HTTP SERVER

Arquivo Everything instalado na máquina. Execute:
```powershell
$ini = "$env:APPDATA\Everything\Everything.ini"
$content = Get-Content $ini -Raw
$content = $content -replace 'http_server_enabled=0', 'http_server_enabled=1'
if ($content -notmatch 'http_server_enabled') { $content += "`nhttp_server_enabled=1" }
$content = $content -replace 'http_server_port=\d+', 'http_server_port=8080'
if ($content -notmatch 'http_server_port') { $content += "`nhttp_server_port=8080" }
Set-Content $ini $content -Encoding UTF8
Stop-Process -Name Everything -Force -ErrorAction SilentlyContinue
Start-Sleep 2
Start-Process "$env:ProgramFiles\Everything\Everything.exe" -ErrorAction SilentlyContinue
Write-Host "Pronto. Acesse: http://localhost:8080/?s=BUSCA&json=1"
```

---

## TERCEIRO: O QUE PRECISA SER FEITO

### Tarefa 1 — Estrutura macro de workspace
Baseado no `jarvis-workspace.html` que você leu, implemente a estrutura de pastas onde:
- Todos os IDEs (Claude, Cursor, Trae) veem o mesmo projeto
- Cada AI tem sua própria subpasta
- Tudo indexado pelo Everything

### Tarefa 2 — Templates de conselho TI
Em `src/agent_council/core/council_templates.py`:
- 5 agentes: Arquiteto de Software, Engenheiro de Segurança, PM, DevOps/SRE, QA/Tester
- Endpoint `GET /api/council-templates`
- `POST /api/sessions/{id}/build_council?template=TI` sem chamar LLM

### Tarefa 3 — Voice Agent
Repo base: `ma-serra/es-voicebot` (atualizado fev/2026)
- Adaptar para chamar Agent Council API em vez de OpenAI direto
- TTS: Google Neural2 pt-BR (grátis, 1M chars/mês)
- STT: OpenAI Whisper pt-BR

---

## ARQUIVOS IMPORTANTES NA MÁQUINA

```
C:\Users\Marcela\.ollama\models                    ← Ollama
C:\Users\Marcela\Desktop\Solo\whisper-main (2)     ← Whisper local
H:\_4.0onedrive25\...\es-voicebot                  ← base do voice agent
H:\_4.0onedrive25\...\live-audio.zip               ← OpenAI Realtime demo
```

---

## DECISÕES JÁ TOMADAS (não reabrir)

| Decisão | Escolha |
|---------|---------|
| TTS Level 1 | Google TTS Neural2 pt-BR (grátis) |
| TTS Level 2 | Gemini 2.5 Flash Live (grátis, multimodal) |
| STT | OpenAI Whisper gpt-4o-mini-transcribe |
| Voice base | ma-serra/es-voicebot |
| Browser TTS / Windows TTS | DESCARTADOS |
| CosyVoice / MeloTTS | DESCARTADOS (sem pt-BR) |

---

## STACK DO PROJETO

- **Backend:** FastAPI + SQLAlchemy + Python (porta 8000)
- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **LLM:** OpenAI GPT-5.1 via openai-agents SDK
- **Repo:** `ma-serra/agent_council`
- **Branch:** `claude/analyze-project-agents-vQNob`
