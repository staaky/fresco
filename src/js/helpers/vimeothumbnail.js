var VimeoThumbnail = (function() {
  var VimeoThumbnail = function() {
    return this.initialize.apply(this, _slice.call(arguments));
  };
  $.extend(VimeoThumbnail.prototype, {
    initialize: function(url, successCallback, errorCallback) {
      this.url = url;
      this.successCallback = successCallback;
      this.errorCallback = errorCallback;

      this.load();
    },

    load: function() {
      // first try the cache
      var cache = Cache.get(this.url);

      if (cache) {
        return this.successCallback(cache.data.url);
      }

      var protocol =
          "http" +
          (window.location && window.location.protocol === "https:"
            ? "s"
            : "") +
          ":",
        video_id = getURIData(this.url).id;

      this._xhr = $.getJSON(
        protocol +
          "//vimeo.com/api/oembed.json?url=" +
          protocol +
          "//vimeo.com/" +
          video_id +
          "&callback=?",
        $.proxy(function(_data) {
          if (_data && _data.thumbnail_url) {
            var data = {
              url: _data.thumbnail_url
            };

            Cache.set(this.url, data);

            this.successCallback(data.url);
          } else {
            this.errorCallback();
          }
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

  return VimeoThumbnail;
})();
