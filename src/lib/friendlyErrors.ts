import type { PyError } from './runtime/protocol';

export interface FriendlyError {
  /** Short headline, in the student's language rather than Python's. */
  title: string;
  /** What actually happened. */
  plain: string;
  /** Where to look, or what usually causes this. */
  hint?: string;
}

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

interface Rule {
  type: string | RegExp;
  message?: RegExp;
  build: (error: PyError, match: RegExpMatchArray | null) => FriendlyError;
}

const quoted = (value: string | undefined) => (value ? `'${value}'` : 'it');

/** "a str", but "an int" — small thing, but the copy is read aloud in class. */
const withArticle = (word: string | undefined) =>
  word ? `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}` : 'something else';

/**
 * Plain-English readings of the errors beginners actually hit.
 *
 * Order matters — the first matching rule wins, so specific message patterns sit
 * above the catch-all for their exception type. Anything unmatched still renders
 * with the real traceback, so an unrecognised error is never a dead end.
 */
const RULES: Rule[] = [
  {
    type: 'KeyboardInterrupt',
    build: () => ({
      title: 'Stopped',
      plain: 'You stopped the program while it was still running.',
      hint: 'If it was stuck, look for a loop whose condition never becomes false.',
    }),
  },
  {
    type: 'IndentationError',
    build: (error) => ({
      title: 'The indentation does not line up',
      plain:
        'Python uses indentation to decide which lines belong together, and this line does not match the block around it.',
      hint: error.message.includes('expected an indented block')
        ? 'A line ending in ":" must be followed by an indented line beneath it.'
        : 'Check that every line in the same block starts at the same column, and never mix tabs with spaces.',
    }),
  },
  {
    type: 'SyntaxError',
    message: /invalid syntax/i,
    build: () => ({
      title: 'Python could not read this line',
      plain: 'Something in the punctuation is off, so Python cannot tell what the line means.',
      hint: 'Usual suspects: a missing ":" after if/for/while/def, an unclosed bracket, or "=" where "==" was meant. The real mistake is often on the line *above* the one marked.',
    }),
  },
  {
    type: 'SyntaxError',
    build: (error) => ({
      title: 'Python could not read this line',
      plain: error.message,
      hint: 'Check the line marked and the one directly above it.',
    }),
  },
  {
    type: 'NameError',
    message: /name '([^']+)'/,
    build: (_error, match) => ({
      title: `${quoted(match?.[1])} has not been defined yet`,
      plain: `Python reached this line and had never been told what ${quoted(match?.[1])} is.`,
      hint: 'Either the name is spelled differently where you created it, or it is created further down the file than where you used it.',
    }),
  },
  {
    type: 'TypeError',
    message: /can only concatenate str \(not "([^"]+)"\) to str/,
    build: (_error, match) => ({
      title: 'You cannot add text and a number together',
      plain: `The "+" has a piece of text on one side and ${withArticle(match?.[1])} on the other, and Python will not guess which one you meant to convert.`,
      hint: 'Wrap the number in str(...), or use an f-string: f"total: {count}".',
    }),
  },
  {
    type: 'TypeError',
    message: /unsupported operand type\(s\) for (\S+): '([^']+)' and '([^']+)'/,
    build: (_error, match) => ({
      title: `You cannot use "${match?.[1]}" between ${withArticle(match?.[2])} and ${withArticle(match?.[3])}`,
      plain: 'Those two kinds of value do not combine with that operator.',
      hint: 'Check what each side really holds — input() always gives text, even when it looks like a number.',
    }),
  },
  {
    type: 'TypeError',
    message: /'(\w+)' object is not (subscriptable|callable|iterable)/,
    build: (_error, match) => {
      const kind = match?.[2];
      const plain: Record<string, string> = {
        subscriptable: `${capitalise(withArticle(match?.[1]))} does not have positions, so you cannot ask it for [something].`,
        callable: `${capitalise(withArticle(match?.[1]))} is not a function, so it cannot be called with ().`,
        iterable: `${capitalise(withArticle(match?.[1]))} is a single value, so a for-loop has nothing to walk through.`,
      };
      const hint: Record<string, string> = {
        subscriptable: 'Often a variable that holds a number where you expected a list or string.',
        callable:
          'Often a name used for both a variable and a function, or a missing operator before the bracket.',
        iterable: 'Use range(n) to loop a number of times.',
      };
      return {
        title: `That is not something you can use this way`,
        plain: plain[kind ?? ''] ?? 'The value is not the kind Python expected here.',
        hint: hint[kind ?? ''],
      };
    },
  },
  {
    type: 'TypeError',
    message: /takes (\d+) positional arguments? but (\d+) (?:was|were) given/,
    build: (_error, match) => ({
      title: 'The function got the wrong number of arguments',
      plain: `It is defined to take ${match?.[1]}, but ${match?.[2]} were passed in.`,
      hint: 'Inside a class, remember that self counts as the first parameter but is supplied automatically.',
    }),
  },
  {
    type: 'IndexError',
    build: () => ({
      title: 'That position does not exist',
      plain: 'You asked for an index beyond the end of the sequence.',
      hint: 'Positions start at 0, so the last one is len(x) - 1. A loop running to len(x) inclusive is the classic cause.',
    }),
  },
  {
    type: 'KeyError',
    build: (error) => ({
      title: `The dictionary has no key ${error.message}`,
      plain: 'You asked for a key that is not in the dictionary.',
      hint: 'Check the spelling and the type — the key 1 and the key "1" are different. Use .get(key) to get None instead of an error.',
    }),
  },
  {
    type: 'AttributeError',
    message: /'([^']+)' object has no attribute '([^']+)'/,
    build: (_error, match) => ({
      title: `${capitalise(withArticle(match?.[1]))} has no '${match?.[2]}'`,
      plain: `You asked for .${match?.[2]} on a value that does not have it.`,
      hint: 'Either the value is not the type you expected, or the method belongs to a different type — .append() is a list method, for instance, not a string one.',
    }),
  },
  {
    type: 'ValueError',
    message: /invalid literal for int\(\) with base 10: '(.*)'/,
    build: (_error, match) => ({
      title: 'That text is not a whole number',
      plain: `int() was given "${match?.[1]}", which it cannot read as a number.`,
      hint: 'Decimals need float() rather than int(), and stray spaces or newlines need .strip() first.',
    }),
  },
  {
    type: 'ZeroDivisionError',
    build: () => ({
      title: 'Something was divided by zero',
      plain: 'The value on the right of the / or % turned out to be 0.',
      hint: 'Usually a counter or a length that is still empty at this point in the program.',
    }),
  },
  {
    type: 'RecursionError',
    build: () => ({
      title: 'The function called itself too many times',
      plain:
        'Python stopped it after about a thousand nested calls, which almost always means the recursion never reaches its base case.',
      hint: 'Check that every path either returns without recursing, or recurses on a strictly smaller input.',
    }),
  },
  {
    type: 'ModuleNotFoundError',
    message: /No module named '([^']+)'/,
    build: (_error, match) => ({
      title: `There is no module called '${match?.[1]}'`,
      plain: 'Python could not find that module in the standard library or among your open files.',
      hint: 'PyLens runs Python in the browser, so third-party packages are not installed. Check the spelling, or create a file of that name as a tab.',
    }),
  },
  {
    type: 'UnboundLocalError',
    message: /local variable '([^']+)'/,
    build: (_error, match) => ({
      title: `'${match?.[1]}' is being read before it is set`,
      plain: `Because ${quoted(match?.[1])} is assigned somewhere inside this function, Python treats it as local — and this line reads it before that assignment runs.`,
      hint: 'Give it a starting value at the top of the function, or add "global" if you really mean the outer one.',
    }),
  },
  {
    type: 'EOFError',
    build: () => ({
      title: 'input() ran out of input',
      plain: 'The program asked for input, but nothing was left to read.',
      hint: 'Add another line to the Input box beside the editor — one line per input() call.',
    }),
  },
];

export function explainError(error: PyError): FriendlyError {
  for (const rule of RULES) {
    const typeMatches =
      typeof rule.type === 'string' ? rule.type === error.type : rule.type.test(error.type);
    if (!typeMatches) continue;

    if (!rule.message) return rule.build(error, null);

    const match = error.message.match(rule.message);
    if (match) return rule.build(error, match);
  }

  return {
    title: error.type,
    plain: error.message || 'Python stopped the program here.',
  };
}
