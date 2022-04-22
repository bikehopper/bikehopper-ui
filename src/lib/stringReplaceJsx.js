import { cloneElement } from 'react';

// A version of str.replace() where the replacer function can return JSx.

// Example:
//   stringReplaceJsx(
//     'Turn left on Chestnut St',
//     /(left|right)/,
//     (dir) => <span class="direction">{dir}</span>
//   )
//   -> ['Turn ', <span class="direction">left</span>, ' on Chestnut St']

export default function stringReplaceJsx(str, regexp, replacerFunction) {
  const result = [];
  let sourceCharsProcessed = 0;
  str.replace(regexp, (match, ...args) => {
    // To avoid trying to figure out how many parenthesized groups there are,
    // just figure the offset is the first number in the arguments.
    const offset = args.find((arg) => typeof arg === 'number');

    // Append any characters not matched since the last match.
    if (offset > sourceCharsProcessed)
      result.push(str.substring(sourceCharsProcessed, offset));

    // Push the return value of the passed replacer function (any JSX object).
    const replacement = replacerFunction(match, ...args);
    if (Array.isArray(replacement)) {
      for (const [replacementItem, idx] of replacement) {
        result.push(
          typeof replacementItem === 'string'
            ? replacementItem
            : cloneElement(replacementItem, { key: `o${offset}-${idx}` }),
        );
      }
    } else {
      result.push(
        typeof replacement === 'string'
          ? replacement
          : cloneElement(replacement, { key: `o${offset}` }),
      );
    }

    sourceCharsProcessed = offset + match.length;
  });

  if (str.length > sourceCharsProcessed)
    result.push(str.substring(sourceCharsProcessed));

  return result;
}
