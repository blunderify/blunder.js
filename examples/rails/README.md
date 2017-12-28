# Usage with Ruby on Rails

In order to include blunder-js into your Ruby on Rails application,
install blunder-js using webpacker or similar tools.

And then place the following code into your `application.js`:

```javascript
var blunder = new blunderJs.Client({projectId: 1, projectKey: 'FIXME', component: 'frontend'});
blunder.addFilter(function(notice) {
  notice.context.environment = "<%= Rails.env %>";
  return notice;
});

try {
  throw new Error('hello from blunder-js');
} catch (err) {
  var promise = blunder.notify(err);
  promise.then(function(notice) {
    console.log("notice id", notice.id);
  });
}
```

You should now be able to capture JavaScript exceptions in your Ruby on Rails
application.
