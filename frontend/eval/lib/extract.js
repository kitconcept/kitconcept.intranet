/**
 * The report extractor (spec D11, §13.3): turns a text assessment into
 * `{target, category}` findings, so report turns can be graded by code.
 * Eval only, straight to the gateway (not through `@ai-edit`, whose prompt
 * is fixed). It is a measurement instrument: check a sample of its output
 * by hand before trusting the numbers.
 */
const TOOL = {
  type: 'function',
  function: {
    name: 'report_findings',
    description: 'The problems the assessment reports, one entry each.',
    parameters: {
      type: 'object',
      properties: {
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              target: {
                type: 'string',
                description:
                  'A block ref (b4, b6.1) or a page field (title, description).',
              },
              category: { type: 'string' },
            },
            required: ['target', 'category'],
          },
        },
      },
      required: ['findings'],
    },
  },
};

const outline = (blocks, lines = []) => {
  blocks.forEach((block) => {
    const text = Object.values(block.fields || {})
      .join(' ')
      .slice(0, 80);
    lines.push(`${block.ref} (${block.type}): ${text}`);
    outline(block.children || [], lines);
  });
  return lines;
};

// One extraction may take this long; the gateway's proxy (Cloudflare)
// gives up after about 100 s with a 524 anyway
const TIMEOUT_MS = 150_000;
// Failures worth one more try: the gateway or its proxy, not the request
const RETRY = (status) => status >= 500;

/**
 * The extractor for an endpoint. `extract(report, page)` resolves to the
 * findings, or throws after one retry; the runner records the failure
 * for the turn and goes on (a 524 once ended a 20-minute run).
 */
export const extractor = ({ url, token, model, categories }) => {
  const once = (report, page) =>
    fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        model,
        stream: false,
        tools: [TOOL],
        messages: [
          {
            role: 'system',
            content: [
              'List every problem the assessment below reports about the page, by calling report_findings once.',
              `Categories: ${categories.join(', ')}.`,
              'Only problems the assessment states; do not add your own.',
              'The page fields: title, description. The blocks:',
              ...outline(page.blocks),
            ].join('\n'),
          },
          // Sorting a report into a list needs no reasoning (qwen3's
          // switch): reasoning made the call slow enough for a 524
          { role: 'user', content: `${report}\n\n/no_think` },
        ],
      }),
    });
  return async function extract(report, page) {
    let response;
    try {
      response = await once(report, page);
    } catch {
      response = null;
    }
    if (!response || RETRY(response.status)) {
      response = await once(report, page);
    }
    if (!response.ok) throw new Error(`extractor: HTTP ${response.status}`);
    const data = await response.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;
    return (parsed?.findings || []).map(({ target, category }) => ({
      target: String(target).trim(),
      category: String(category).trim().toLowerCase(),
    }));
  };
};
