# babel-plugin-transform-esx

An [ESX](https://gist.github.com/WebReflection/2d64f34cf58daa812ec876242c91a97c) transformer as implementation reference.

## Usage

```jsonc
// babel.config.json
{
  "plugins": [["@ungap/transform-esx", { "polyfill": "import" }]]
}
```

Where the `"polyfill"` option can be one of `false`, `"inline"` (default), or `"import"`.
