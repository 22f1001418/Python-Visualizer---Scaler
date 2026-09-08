import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

/**
 * Builtins and keywords, offered with one-line descriptions.
 *
 * The descriptions are the point: a student who has just typed `enumerate` gets
 * told what it does without leaving the editor for a search engine.
 */
const BUILTINS: Array<[string, string]> = [
  ['print', 'Show a value in the output'],
  ['input', 'Read one line of text from the Input box'],
  ['len', 'How many items are in a sequence'],
  ['range', 'A sequence of numbers to loop over'],
  ['int', 'Convert to a whole number'],
  ['float', 'Convert to a decimal number'],
  ['str', 'Convert to text'],
  ['bool', 'Convert to True or False'],
  ['list', 'Build a list'],
  ['dict', 'Build a dictionary'],
  ['set', 'Build a set of unique values'],
  ['tuple', 'Build an unchangeable sequence'],
  ['sum', 'Add up the numbers in a sequence'],
  ['min', 'The smallest value'],
  ['max', 'The largest value'],
  ['abs', 'Distance from zero'],
  ['round', 'Round to a number of decimal places'],
  ['sorted', 'A new sorted list'],
  ['reversed', 'Walk a sequence backwards'],
  ['enumerate', 'Loop with the index alongside the value'],
  ['zip', 'Walk two sequences side by side'],
  ['map', 'Apply a function to every item'],
  ['filter', 'Keep only the items that pass a test'],
  ['any', 'True if at least one item is true'],
  ['all', 'True if every item is true'],
  ['type', 'What kind of value this is'],
  ['isinstance', 'Check whether a value is of a given type'],
  ['open', 'Open a file'],
  ['format', 'Format a value as text'],
  ['repr', 'The developer-facing text for a value'],
];

const KEYWORDS = [
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
  'True',
  'False',
  'None',
];

const OPTIONS = [
  ...BUILTINS.map(([label, detail]) => ({ label, type: 'function', detail, boost: 1 })),
  ...KEYWORDS.map((label) => ({ label, type: 'keyword' })),
];

export function pythonCompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  return { from: word.from, options: OPTIONS, validFor: /^\w*$/ };
}
