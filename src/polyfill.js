import ESXToken from './inline.js';

export const getExternalPolyfill = (template) => template.statement.ast`
  import ESXToken from "@ungap/esxtoken";
`;

// Copied from https://github.com/ungap/esxtoken/blob/main/esm/index.js.
// Keep them in sync!
export const getInlinePolyfill = (template) =>
  Object.assign(
    template.statement.ast([ESXToken]),
    { _compact: true }
  );
