/**
 * `@ai-edit` on a running backend, as the panel uses it (spec D13: the
 * eval tests the real prompt and tool schema). The backend's LLM
 * environment decides the model under test.
 */
const authHeader = (user, password) =>
  `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;

export const backendClient = ({ url, user = 'admin', password = 'admin' }) => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: authHeader(user, password),
  };
  const endpoint = `${url.replace(/\/$/, '')}/@ai-edit`;
  return {
    /** Access, budget values and vocabulary (`GET @ai-edit`). */
    async info() {
      const response = await fetch(endpoint, { headers });
      if (!response.ok) throw new Error(`GET @ai-edit: ${response.status}`);
      const data = await response.json();
      if (!data.available)
        throw new Error(`@ai-edit not available: ${data.error_code}`);
      return {
        budget: {
          contextLength: data.context_length || undefined,
          reserveTokens: data.reserve_tokens || 0,
          fixedPromptChars: data.fixed_prompt_chars || 0,
        },
        vocabulary: {
          operations: data.operations,
          categories: data.categories,
          structuralTags: data.structural_tags,
        },
      };
    },
    /** One request, failures as `{error_code}` (like the panel). */
    async send(payload) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) return { error_code: `http_${response.status}` };
        return await response.json();
      } catch (error) {
        return { error_code: 'request_failed', error: String(error) };
      }
    },
  };
};
