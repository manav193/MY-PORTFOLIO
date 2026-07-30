export class KnowledgeValidationError extends TypeError {
  constructor(message, details = []) {
    super(message);
    this.name = 'KnowledgeValidationError';
    this.details = details;
  }
}

export class DuplicateKnowledgeError extends Error {
  constructor(id, existingSource, incomingSource) {
    super(`Duplicate project id "${id}" from "${incomingSource}"; already registered by "${existingSource}".`);
    this.name = 'DuplicateKnowledgeError';
    this.id = id;
  }
}

export function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new KnowledgeValidationError(`${label} must be an object.`);
  }
}
