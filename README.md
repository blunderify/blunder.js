# Blunder-JS

This is the JavaScript notifier for capturing errors in web browsers and reporting them to [Blunder](https://www.blunderify.se).

## Installation

Using npm:

```sh
npm install blunder-js
```


## Setup

Example configurations can be found in [examples](examples), including:

* [Angular 2](examples/angular2)
* [Plain JS](examples/plainjs)
* [Node.js](examples/nodejs)
* [Rails](examples/rails)

The notifier is built using
[umd](https://webpack.js.org/concepts/output/#output-librarytarget)
and therefore can be imported with AMD, CommonJS2 or as property in root.

If you're using Node.js you might need to install the [request](https://github.com/request/request) library too, on which Blunder depends:

```shell
npm install request
```

## Basic Usage

First you need to initialize the notifier with the project id and API key taken from [Blunderify](https://app.blunderify.se):

```js
var blunder = new blunderJs.Client({projectId: 1, projectKey: 'abc', component: 'frontend'});
```

Or if you are using browserify/webpack/etc:

```js
var BlunderClient = require('blunder-js');
var blunder = new BlunderClient({projectId: 1, projectKey: 'abc', component: 'frontend'});
```

Then you can send a textual message to Blunder:

```js
var promise = blunder.notify(`user id=${user_id} not found`);
promise.then(function(notice) {
  console.log('notice id', notice.id);
});
promise.catch(function(err) {
  console.log('blunder error', err);
});
```

Or report catched errors directly:

```js
try {
  // This will throw if the document has no head tag
  document.head.insertBefore(document.createElement('style'));
} catch(err) {
  blunder.notify(err);
  throw err;
}
```

Alternatively, you can wrap any code which may throw errors using the client's `wrap` method:

```js
var startApp = function() {
  // This will throw if the document has no head tag.
  document.head.insertBefore(document.createElement('style'));
}
startApp = blunder.wrap(startApp);

// Any exceptions thrown in startApp will be reported to Blunder.
startApp();
```

or use `call` shortcut:

```js
var startApp = function() {
  // This will throw if the document has no head tag.
  document.head.insertBefore(document.createElement('style'));
}

blunder.call(startApp);
```

## Advanced Usage

### Notice Annotations

It's possible to annotate error notices with all sorts of useful information at the time they're captured by supplying it in the object being reported.

```js
try {
  startApp();
} catch (err) {
  blunder.notify({
    error:       err,
    context:     { component: 'bootstrap' },
    environment: { env1: 'value' },
    params:      { param1: 'value' },
    session:     { session1: 'value' },
  });
  throw err;
}
```

### Severity

Severity allows categorizing how severe an error is. By default, it's set to `error`. To redefine severity, simply overwrite `context/severity` of a notice object. For example:

```js
blunder.notify({
  error: err,
  context: { severity: 'warning' }
});
```

### User information

To send user information to Blunder, either create [a filter](#filtering-errors) or use `setUser(userId: string, userEmail: string, userName: string)` on an instance of the `BlunderClient`. You can also use `setUserId(id: string)`, `setUserEmail(email: string)` or `setUserName(name: string)` on a client instance if you only have, or only care about one of the bits.

Since Blunder mostly works with .NET and their way of doing things, the backend will prefer grouping on UserName instead of the others. If you only set one piece of user info, make it UserName.

### Filtering errors

There may be some errors thrown in your application that you're not interested in sending to Blunder, such as errors thrown by 3rd-party libraries, or by browser extensions run by your users.

The Blunder notifier makes it simple to ignore this chaff while still processing legitimate errors. Add filters to the notifier by providing filter functions to `addFilter`.

`addFilter` accepts the entire error notice to be sent to Blunder, and provides access to the `context`, `environment`, `params`, and `session` values submitted with the notice, as well as the single-element `errors` array with its `backtrace` element and associated backtrace lines.

The return value of the filter function determines whether or not the error notice will be submitted.
  * If a null value is returned, the notice is ignored.
  * Otherwise, the returned notice will be submitted.

An error notice must pass all provided filters to be submitted.

In the following example all errors triggered by admins will be ignored:

```js
blunder.addFilter(function(notice) {
  if (notice.sessions.admin) {
    // Ignore errors from admin sessions.
    return null;
  }
  return notice;
});
```

Filters can be also used to modify notice payload, e.g. to set the environment and application version:

```js
blunder.addFilter(function(notice) {
  notice.context.environment = 'production';
  notice.context.version = '1.2.3';
  return notice;
});
```

### Source map

In order to enable source map support you have to specify the path to the source map file according to the [source map specification](https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.lmz475t4mvbx). For example, blunder.min.js has the following line:

```js
//# sourceMappingURL=blunder.min.js.map
```

*Please note* that the Blunder backend downloads the source map file to process the backtrace. This means that the source map should be publicly accessible via HTTP. So, for example, don't expect source map support to work on your local webserver running on `localhost`.

Custom source map URLs are supported by assigning a special property of `notice.context` called `sourceMaps`. The keys of the `sourceMaps` object represent shell filename patterns and the values are URLs of your source maps.

```js
blunder.addFilter(function(notice) {
  notice.context.sourceMaps = {
    '*': 'https://domain.com/path/to/source.map', // for all files
    'https://domain.com/path/to/file.min.js': 'https://domain.com/path/to/source.map'
  };
  return notice;
});
```

### Custom reporters

If you're interested in inspecting the information reported to Blunder in your own code, you can register your own error reporter. Note that reporters added this way may be executed out-of-order.

In this example, reported errors are also logged to the console.

```html
<script>
  blunder.addReporter(function(notice) {
    console.log(notice);
  });
</script>
```

### Unwrapping console

blunder-js automatically wraps `console.log` function calls in order to collect logs and send them with first error. You can undo it using following code:

```js
if (env === 'development') {
    let methods = ['debug', 'log', 'info', 'warn', 'error'];
    for (let m of methods) {
        if (m in console && console[m].inner) {
            console[m] = console[m].inner;
        }
    }
}
```

## Integration

### window.onerror

blunder-js automatically setups `window.onerror` handler when script is loaded. It also makes sure to call old error handler if there are any. Errors reported by `window.onerror` can be ignored using `ignoreWindowError` option:

```js
var blunder = new blunderJs.Client({ignoreWindowError: true});
```

## What does "Script error" mean?

See https://developer.mozilla.org/en/docs/Web/API/GlobalEventHandlers/onerror#Notes.

## Contributing

Install dependencies:

```bash
npm install
```

Build project:

```bash
webpack
```

# License

Copyright for portions of project are held by Airbrake Technologies, Inc, 2017 as part of project Airbrake.
All other copyright for project Blunder are held by Per Christian B. Viken, 2017.
It is free software, and may be redistributed under the terms specified in the LICENSE file.
