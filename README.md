# babel-plugin-transform-esx

<sup><sub>**THIS PROJECT IS BROKEN AND UNDER HEAVY REFACTORING - FEEL FREE TO PLAY WITH IT BUT DON'T USE IT IN PRODUCTION**</sub></sup>

## Highly Experimental

If you are using this already, consider changes soon due [the discussion around current ESX proposal](https://es.discourse.group/t/proposal-esx-as-core-js-feature/1511/43).

Feel free to keep an eye on [udomsay](https://github.com/WebReflection/udomsay) as that will be the implementation reference for consumers.

- - -

An [ESX](https://gist.github.com/WebReflection/2d64f34cf58daa812ec876242c91a97c) transformer as implementation reference.

## Usage

```sh
# required only with polyfill "import" (default)
npm i --save @ungap/esxtoken

# required to transform ESX
npm i --save-dev @ungap/babel-plugin-transform-esx
```

```jsonc
// babel.config.json
{
  "plugins": [["@ungap/transform-esx", { "polyfill": "import" }]]
}
```

Where the `"polyfill"` option can be one of `false`, `"import"` (default), or `"inline"`.
