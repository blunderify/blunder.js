function start() {
  var blunder = new blunderJs.Client({
    projectId: 1,
    projectKey: 'FIXME'
  });

  blunder.notify('app started');

  $(function() {
    $('#send_error').click(function() {
      try {
        history.pushState({'foo': 'bar'}, 'Send error', 'send-error');
      } catch (_) {}

      var val = $('#error_text').val();
      throw new Error(val);
    });
  });

  try {
    throw new Error('hello from blunder-js');
  } catch (err) {
    promise = blunder.notify(err);
    promise.then(function(notice) {
      console.log('notice id:', notice.id);
    }, function(err) {
      console.log('blunder failed:', err);
    });
  }
}

throw new Error('uncatched error');
