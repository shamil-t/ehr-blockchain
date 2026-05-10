#!/usr/bin/env node

      import {createRequire as __cjsCompatRequire} from 'module';
      const require = __cjsCompatRequire(import.meta.url);
    

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/ngcc/index.mjs
function stringEncaseCRLFWithFirstIndex(value, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = value[index - 1] === "\r";
    returnValue += value.substring(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = value.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += value.substring(endIndex);
  return returnValue;
}
function styleMessage(message) {
  const open = "\x1B[31m\x1B[1m";
  const close = "\x1B[22m\x1B[39m";
  let styledMessage = message;
  const lfIndex = styledMessage.indexOf("\n");
  if (lfIndex !== -1) {
    styledMessage = stringEncaseCRLFWithFirstIndex(styledMessage, close, open, lfIndex);
  }
  return open + styledMessage + close;
}
var warningMsg = `

==========================================

ALERT: As of Angular 16, "ngcc" is no longer required and not invoked during CLI builds. You are seeing this message because the current operation invoked the "ngcc" command directly. This "ngcc" invocation can be safely removed.

A common reason for this is invoking "ngcc" from a "postinstall" hook in package.json.

In Angular 17, this command will be removed. Remove this and any other invocations to prevent errors in later versions.

==========================================

`;
console.warn(styleMessage(warningMsg));
process.exit(0);
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=index.js.map
