# AI editing assistant

An "AI" tab in the edit and add forms: it assesses the page and proposes
changes to page fields and blocks. Every proposal is shown as a diff;
the editor selects what to apply to the unsaved form and saves the page
as usual. Nothing is written on the server.

**Status: proof of concept.** Off by default; to be tried by a small
group (the release gate is in [AI_EDIT_PLAN.md](AI_EDIT_PLAN.md) §3).

## Documents

| File | For |
|---|---|
| [AI_WORKFLOW.md](AI_WORKFLOW.md) | The spec: what the assistant does, how it is built and why (decisions D1–D59) |
| [AI_EDIT_PLAN.md](AI_EDIT_PLAN.md) | State, measured results, next steps, code map, how to run and debug, known issues |
| [AI_EDIT_INTENT_TOOLSET.md](AI_EDIT_INTENT_TOOLSET.md) | A second tool architecture compared in D57 and removed: result and code |
| [`frontend/eval/README.md`](../../frontend/eval/README.md) | The eval: cases, runner, graders, dashboard |

## Setting it up (for administrators)

The assistant needs an LLM gateway with an OpenAI-compatible chat
completions endpoint and native function calling. It was built and
measured with Open WebUI in front of Ollama and `qwen3:14b`.

1. **The gateway.** In Open WebUI, for the model:
   - set the context length explicitly (Ollama's `num_ctx`, measured
     with 16384). Left on "Default", Ollama picks a window per model
     load that can be as small as 2048 tokens, and the assistant then
     sees only part of the page without an error;
   - keep thinking on, and set function calling to "Native".
2. **The environment of the Plone backend.** The assistant uses the
   LLM variables of AI search (kitconcept.solr's RAG):

   | Variable | Required | Meaning |
   |---|---|---|
   | `KITCONCEPT_SOLR_LLM_URL` | yes | The gateway's base URL |
   | `KITCONCEPT_SOLR_LLM_CHAT_MODEL` | yes | The model; unlike AI search, no default |
   | `KITCONCEPT_SOLR_LLM_TOKEN` | if the gateway needs it | Bearer token |
   | `KITCONCEPT_SOLR_LLM_CHAT_PATH` | no | Default `/api/chat/completions` (Open WebUI) |
   | `KITCONCEPT_INTRANET_AI_EDIT_CONTEXT_LENGTH` | recommended | The gateway's context length in tokens (the same value as `num_ctx`); the browser keeps requests within it |
   | `KITCONCEPT_INTRANET_AI_EDIT_RESERVE_TOKENS` | no | Tokens kept free for the answer, default 4096 |
   | `KITCONCEPT_INTRANET_AI_EDIT_TIMEOUT` | no | Seconds per LLM call, default 120 (measured: 95 % of calls under 111 s; page-wide translations up to 134 s) |
   | `KITCONCEPT_INTRANET_AI_EDIT_MAX_CONCURRENT` | no | LLM calls at once per Zope process, default 2. Each holds a worker thread for the whole call: keep it below the process's threads |
   | `KITCONCEPT_INTRANET_AI_EDIT_STREAM` | no | `0` to ask the gateway for whole answers; streaming (default) keeps proxies such as Cloudflare from ending long answers |
   | `KITCONCEPT_INTRANET_AI_EDIT_TRACE` | no | `1` logs every round trip readably, page content included: development only |

3. **The site.** Run the upgrade steps of `kitconcept.intranet`
   (20261014001 adds the setting and the permission), then switch on
   **Enable AI assistant** in the Intranet settings. The tab shows once
   both the setting and the two required variables are set.
4. **Who may use it.** The permission `kitconcept.intranet: Use AI
   editing`, by default for Manager, Site Administrator, Editor,
   Contributor and Owner (not Reviewer).

## Privacy and safety

- The page being edited (its text, without images or link targets) and
  the conversation are sent to the configured gateway with every
  request. Use a gateway the site may send its content to.
- The backend stores nothing; logs hold no page content unless
  `KITCONCEPT_INTRANET_AI_EDIT_TRACE` is on or the logger
  `kitconcept.intranet.ai_edit` is at DEBUG.
- Page text is passed as data, never as instructions; every change is
  reviewed before it is applied, deletions start unselected, and the
  model cannot invent link targets, insert blocks it cannot fill, or
  touch content it cannot represent.
- Answers are AI-generated and can contain errors or invented facts:
  the panel says so, and editors check every change before saving.
