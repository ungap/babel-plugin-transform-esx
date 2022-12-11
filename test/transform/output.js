var _templateReference = {},
  _templateReference2 = {},
  _templateReference3 = {},
  _templateReference4 = {};
import ESXToken from "@ungap/esxtoken";
const div = new ESXToken(
  _templateReference,
  3,
  ESXToken._,
  ESXToken._,
  "div",
  "div"
);
const div2 = new ESXToken(
  _templateReference2,
  3,
  [
    {
      type: 1,
      dynamic: false,
      name: "a",
      value: "a",
    },
    {
      type: 1,
      dynamic: true,
      name: "b",
      value: "b",
    },
  ],
  [
    new ESXToken(
      null,
      3,
      ESXToken._,
      [
        {
          type: 6,
          value: "c",
        },
      ],
      "p",
      "p"
    ),
  ],
  "div",
  "div"
);
function MyComponent(...args) {
  return new ESXToken(_templateReference3, 4, ESXToken._, [
    {
      type: 5,
      value: "A",
    },
    {
      type: 6,
      value: ",",
    },
    {
      type: 5,
      value: "B",
    },
  ]);
}
const component = new ESXToken(
  _templateReference4,
  2,
  [
    {
      type: 1,
      dynamic: false,
      name: "a",
      value: "a",
    },
    {
      type: 5,
      value: props,
    },
  ],
  ESXToken._,
  "MyComponent",
  MyComponent
);
