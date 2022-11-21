# babel-plugin-transform-esx

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
