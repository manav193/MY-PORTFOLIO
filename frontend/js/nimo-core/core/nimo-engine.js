import { createKnowledgeRegistry } from '../knowledge/registry.js';
import { ContextResolver } from '../context-resolver.js';
import { detectLanguage } from '../language-detector.js';
import { matchEntity } from '../entity-matcher.js';
import { routeIntent } from '../intent-router.js';
import { buildResponse } from '../response-builder.js';
import { NIMO_PERSONA } from '../persona/nimo-persona.js';

export class NimoEngine {
  constructor({ persona = NIMO_PERSONA, adapters = [], federation = null, registry = federation?.knowledgeRegistry || createKnowledgeRegistry(), contextResolver = new ContextResolver() } = {}) {
    this.persona = persona;
    this.registry = registry;
    this.contextResolver = contextResolver;
    this.adapters = [...adapters];
    this.federation = federation;
    for (const adapter of this.adapters) {
      for (const source of adapter.getSources()) this.registry.registerProjectSource(source);
    }
  }

  respond(input, hostContext = {}) {
    const query = String(input ?? '').trim();
    const language = detectLanguage(query).language;
    const match = matchEntity(query, this.registry.list());
    const adapterContext = this.adapters.reduce((merged, adapter) => ({ ...merged, ...(adapter.getContext?.() || {}) }), {});
    const context = this.contextResolver.resolve({ explicitProject: match?.entity, hostContext: { ...adapterContext, ...hostContext }, query });
    const route = routeIntent(query, { entity: match?.entity, context, registry: this.registry });
    const response = buildResponse(route, { language, registry: this.registry, context, query });
    this.contextResolver.remember({ intent: response.intent, projectId: response.entity?.id || context.projectId });
    return Object.freeze({ ...response, context, executed: false });
  }

  resetContext() { this.contextResolver.reset(); }
}

export function createNimoEngine(options) { return new NimoEngine(options); }
