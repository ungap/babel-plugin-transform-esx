import {readFileSync} from 'node:fs';

import umeta from 'umeta';

const {require} = umeta(import.meta);

export default readFileSync(require.resolve('@ungap/esxtoken')).toString()
                .replace(/^[\s\S]+?class/, 'globalThis.ESXToken || (globalThis.ESXToken = class')
                .replace(/;?\s*$/, ');\n');
