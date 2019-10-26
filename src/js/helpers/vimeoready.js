var VimeoReady = (function() {
  var VimeoReady = function() {
    return this.initialize.apply(this, _slice.call(arguments));
  };
  $.extend(VimeoReady.prototype, {
    initialize: function(url, callback) {
      this.url = url;
      this.callback = callback;

      this.load();
    },

    load: function() {
      // first try the cache
      var cache = Cache.get(this.url);

      if (cache) {
        return this.callback(cache.data);
      }

      var protocol =
          "http" +
          (window.location && window.location.protocol === "https:"
            ? "s"
            : "") +
          ":",
        video_id = getURIData(this.url).id;

      // NOTE: We're using a maxwidth/maxheight hack because of a regression in the oEmbed API
      // see: https://vimeo.com/forums/api/topic:283559
      this._xhr = $.getJSON(
        protocol +
          "//vimeo.com/api/oembed.json?url=" +
          protocol +
          "//vimeo.com/" +
          video_id +
          "&maxwidth=9999999&maxheight=9999999&callback=?",
        $.proxy(function(_data) {
          var data = {
            dimensions: {
              width: _data.width,
              height: _data.height
            }
          };

          Cache.set(this.url, data);

          if (this.callback) this.callback(data);
        }, this)
      );
    },

    abort: function() {
      if (this._xhr) {
        this._xhr.abort();
        this._xhr = null;
      }
    }
  });

  var Cache = {
    cache: [],

    get: function(url) {
      var entry = null;
      for (var i = 0; i < this.cache.length; i++) {
        if (this.cache[i] && this.cache[i].url === url) entry = this.cache[i];
      }
      return entry;
    },

    set: function(url, data) {
      this.remove(url);
      this.cache.push({ url: url, data: data });
    },

    remove: function(url) {
      for (var i = 0; i < this.cache.length; i++) {
        if (this.cache[i] && this.cache[i].url === url) {
          delete this.cache[i];
        }
      }
    }
  };

  return VimeoReady;
})();
