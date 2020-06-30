export type FieldSyntax = [string, string[]];
export type FieldSyntaxTree = (string | FieldSyntax)[];

export function tokenize(str: string): string[] {
  // Remove query syntax between `{` and `}`
  let replaced = str.replace(/(\{[^\}]*?\})/gi, '');
  // Remove count syntax between `[` and `]`
  replaced = replaced.replace(/(\[[^\]]*?\])/gi, '');
  // Remove any whitespace
  replaced = replaced.replace(/\s/gi, '');
  return replaced.match(/((\w+)|([\(\)\{\}\[\]]))/gi);
}

// Convert tokens into a psuedo syntax tree.
export function parse(tokens: string[]): FieldSyntaxTree {
  let curr: FieldSyntaxTree = [];
  const stack: FieldSyntaxTree[] = [];
  for (const token of tokens) {
    switch (token) {
      case '(':
        stack.push(curr);
        curr = [];
        break;
      case ')':
        const tmp = stack.pop() || [];
        const lastKey = (tmp.pop() as string) || '';
        tmp.push([lastKey, curr as string[]]);
        curr = tmp;
        break;
      default:
        curr.push(token);
    }
  }
  return curr;
}

// Parse a single field
export function readField(str: string) {
  return parse(tokenize(str))[0];
}

// Parse a list of fields as a string
export function readFields(str: string) {
  return parse(tokenize(str));
}

// Ensure all parsed fields returned as a tuple
export function fieldTuple(field: string | FieldSyntax): FieldSyntax {
  if (Array.isArray(field)) {
    return field;
  }
  return [field, []];
}

export function stringify(fields: FieldSyntaxTree): string {
  const formatted: string[] = fields.map((field) => {
    const [key, children] = fieldTuple(field);
    if (children.length) {
      const nested = stringify(children);
      return `${key}(${nested})`;
    }
    return key;
  });
  return formatted.join();
}

export function missingSubFields(field: string, meta: any) {
  const [key, children] = fieldTuple(readField(field));
  if (!meta) {
    return field;
  }
  if (children.length) {
    const missing = filterNotInMeta(children, meta.associatedEntity);
    // Stringify expects list of fieldTuples
    return stringify([[key, missing]]);
  }
  return false;
}

export function filterNotInMeta(fields: FieldSyntaxTree, meta: any) {
  return fields
    .map((field) => {
      const [key, children] = fieldTuple(field);
      // Check if nested field exists for the associatedEntity
      const def = meta && meta.fields.find((f) => f.name === key);
      if (!def) {
        // If not return unparsed field
        return field;
      }
      if (children.length) {
        // If meta exists and requested child fields filter out fields that are known
        const missing = filterNotInMeta(children, def.associatedEntity);
        if (missing.length) {
          // If there are missing fields return them
          return [key, missing];
        }
      }
      // If all fields are known return null
      return null;
    })
    .filter(Boolean); // Filter out nulls
}
