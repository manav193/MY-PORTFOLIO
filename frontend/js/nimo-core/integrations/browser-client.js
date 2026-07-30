export function createBrowserClient({ engine, executeAction, remoteFallback } = {}) {
  if (!engine || typeof engine.respond !== 'function') throw new TypeError('A NIMO engine is required.');
  return Object.freeze({
    async ask(input, context = {}) {
      const local = engine.respond(input, context);
      if (local.intent !== 'fallback' || typeof remoteFallback !== 'function') return local;
      const remote = await remoteFallback({ input, context, local });
      return remote || local;
    },
    execute(action) {
      if (typeof executeAction !== 'function') return { executed: false, action };
      return { executed: true, result: executeAction(action), action };
    }
  });
}
