# babel-plugin-transform-amd-system-dependencies

tdb

## Example

**In**

```js
define(['bar'], function(bar, require, module) {
    module.exports = {
	  bar: bar
	}
});
```

**Babel Options**
```js
{
  plugins: [
    ['transform-amd-system-dependencies', {
	  map: function(dep) {
        return dep;
      }
    }]
  ]
}
```

**Out**

```js
tbd
```

## Installation

```sh
$ npm install babel-plugin-transform-amd-system-dependencies
```

## Usage

### Via `.babelrc`

**.babelrc**

```json
{
  "plugins": [
    ["transform-amd-system-dependencies", {
      map: function(dep) {
        return dep;
      }
    }]
  ]
}
```

### Via CLI

```sh
$ babel --plugins transform-amd-system-dependencies script.js
```

### Via Node API (Recommended)

```javascript
require("babel-core").transform("code", {
  plugins: [
    ["transform-amd-system-dependencies", {
      map: function(dep) {
        return dep;
      }
    }]
  ]
});
```
