/**
 * Fresco - A Beautiful Responsive Lightbox - v2.3.0
 * (c) 2012-2019 Nick Stakenburg
 *
 * https://www.frescojs.com
 *
 * @license: https://creativecommons.org/licenses/by/4.0
 */

// UMD wrapper
(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD
    define(["jquery"], factory);
  } else if (typeof module === "object" && module.exports) {
    // Node/CommonJS
    module.exports = factory(require("jquery"));
  } else {
    // Browser global
    root.Fresco = factory(jQuery);
  }
})(this, function($) {


var Fresco = {};

$.extend(Fresco, {
  version: "2.3.0"
});

Fresco.Skins = {
  // the default skin
  fresco: {}
};

var Bounds = {
  viewport: function() {
    var dimensions = {
      width: $(window).width()
    };

    // Mobile Safari has a bugged viewport height after scrolling
    // Firefox on Android also has problems with height
    if (Browser.MobileSafari || (Browser.Android && Browser.Gecko)) {
      var zoom = document.documentElement.clientWidth / window.innerWidth;
      dimensions.height = window.innerHeight * zoom;
    } else {
      // default
      dimensions.height = $(window).height();
    }

    return dimensions;
  }
};

var Browser = (function(uA) {
  function getVersion(identifier) {
    var version = new RegExp(identifier + "([\\d.]+)").exec(uA);
    return version ? parseFloat(version[1]) : true;
  }

  return {
    IE:
      !!(window.attachEvent && uA.indexOf("Opera") === -1) &&
      getVersion("MSIE "),
    Opera:
      uA.indexOf("Opera") > -1 &&
      ((!!window.opera && opera.version && parseFloat(opera.version())) ||
        7.55),
    WebKit: uA.indexOf("AppleWebKit/") > -1 && getVersion("AppleWebKit/"),
    Gecko:
      uA.indexOf("Gecko") > -1 &&
      uA.indexOf("KHTML") === -1 &&
      getVersion("rv:"),
    MobileSafari: !!uA.match(/Apple.*Mobile.*Safari/),
    Chrome: uA.indexOf("Chrome") > -1 && getVersion("Chrome/"),
    ChromeMobile: uA.indexOf("CrMo") > -1 && getVersion("CrMo/"),
    Android: uA.indexOf("Android") > -1 && getVersion("Android "),
    IEMobile: uA.indexOf("IEMobile") > -1 && getVersion("IEMobile/")
  };
})(navigator.userAgent);

var _slice = Array.prototype.slice;

function baseToString(value) {
  if (typeof value === "string") {
    return value;
  }
  return value == null ? "" : value + "";
}

var _ = {
  isElement: function(object) {
    return object && object.nodeType === 1;
  },

  String: {
    capitalize: function(string) {
      string = baseToString(string);
      return string && string.charAt(0).toUpperCase() + string.slice(1);
    }
  }
};

//mousewheel
(function() {
  function wheel(event) {
    var realDelta;

    // normalize the delta
    if (event.originalEvent.wheelDelta)
      // IE & Opera
      realDelta = event.originalEvent.wheelDelta / 120;
    else if (event.originalEvent.detail)
      // W3C
      realDelta = -event.originalEvent.detail / 3;

    if (!realDelta) return;

    var customEvent = $.Event("fresco:mousewheel");
    $(event.target).trigger(customEvent, realDelta);

    if (customEvent.isPropagationStopped()) {
      event.stopPropagation();
    }
    if (customEvent.isDefaultPrevented()) {
      event.preventDefault();
    }
  }

  $(document.documentElement).on("mousewheel DOMMouseScroll", wheel);
})();

// Fit
var Fit = {
  within: function(bounds, dimensions) {
    var options = $.extend(
      {
        height: true,
        width: true
      },
      arguments[2] || {}
    );

    var size = $.extend({}, dimensions),
      scale = 1,
      attempts = 5;

    var fit = { width: options.width, height: options.height };

    // adjust the bounds depending on what to fit (width/height)
    // start
    while (
      attempts > 0 &&
      ((fit.width && size.width > bounds.width) ||
        (fit.height && size.height > bounds.height))
    ) {
      // if both dimensions fall underneath a minimum, then don't event continue
      //if (size.width < 100 && size.height < 100) {
      var scaleX = 1,
        scaleY = 1;

      if (fit.width && size.width > bounds.width) {
        scaleX = bounds.width / size.width;
      }
      if (fit.height && size.height > bounds.height) {
        scaleY = bounds.height / size.height;
      }

      // we'll end up using the largest scaled down factor
      scale = Math.min(scaleX, scaleY);

      // adjust current size, based on original dimensions
      size = {
        width: dimensions.width * scale,
        height: dimensions.height * scale
      };
      //}

      attempts--;
    }

    // make sure size is never pressed into negative
    size.width = Math.max(size.width, 0);
    size.height = Math.max(size.height, 0);

    return size;
  }
};

// we only uses some of the jQueryUI easing functions
// add those with a prefix to prevent conflicts
$.extend($.easing, {
  frescoEaseInCubic: function(x, t, b, c, d) {
    return c * (t /= d) * t * t + b;
  },

  frescoEaseInSine: function(x, t, b, c, d) {
    return -c * Math.cos((t / d) * (Math.PI / 2)) + c + b;
  },

  frescoEaseOutSine: function(x, t, b, c, d) {
    return c * Math.sin((t / d) * (Math.PI / 2)) + b;
  }
});

var Support = (function() {
  var testElement = document.createElement("div"),
    domPrefixes = "Webkit Moz O ms Khtml".split(" ");

  function prefixed(property) {
    return testAllProperties(property, "prefix");
  }

  function testProperties(properties, prefixed) {
    for (var i in properties) {
      if (testElement.style[properties[i]] !== undefined) {
        return prefixed === "prefix" ? properties[i] : true;
      }
    }
    return false;
  }

  function testAllProperties(property, prefixed) {
    var ucProperty = property.charAt(0).toUpperCase() + property.substr(1),
      properties = (
        property +
        " " +
        domPrefixes.join(ucProperty + " ") +
        ucProperty
      ).split(" ");

    return testProperties(properties, prefixed);
  }

  // feature detect
  return {
    canvas: (function() {
      var canvas = document.createElement("canvas");
      return !!(canvas.getContext && canvas.getContext("2d"));
    })(),

    css: {
      animation: testAllProperties("animation"),
      transform: testAllProperties("transform"),
      prefixed: prefixed
    },

    svg:
      !!document.createElementNS &&
      !!document.createElementNS("http://www.w3.org/2000/svg", "svg")
        .createSVGRect,

    touch: (function() {
      try {
        return !!(
          "ontouchstart" in window ||
          (window.DocumentTouch && document instanceof DocumentTouch)
        ); // firefox on Android
      } catch (e) {
        return false;
      }
    })()
  };
})();

// add mobile touch to support
Support.detectMobileTouch = function() {
  Support.mobileTouch =
    Support.touch &&
    (Browser.MobileSafari ||
      Browser.Android ||
      Browser.IEMobile ||
      Browser.ChromeMobile ||
      !/^(Win|Mac|Linux)/.test(navigator.platform)); // otherwise, assume anything not on Windows, Mac or Linux is a mobile device
  //Support.mobileTouch = true;
};
Support.detectMobileTouch();

/* ImageReady (standalone) - part of Voilà
 * http://voila.nickstakenburg.com
 * MIT License
 */
var ImageReady = function() {
  return this.initialize.apply(this, Array.prototype.slice.call(arguments));
};

$.extend(ImageReady.prototype, {
  supports: {
    naturalWidth: (function() {
      return "naturalWidth" in new Image();
    })()
  },

  // NOTE: setTimeouts allow callbacks to be attached
  initialize: function(img, successCallback, errorCallback) {
    this.img = $(img)[0];
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.isLoaded = false;

    this.options = $.extend(
      {
        method: "naturalWidth",
        pollFallbackAfter: 1000
      },
      arguments[3] || {}
    );

    // a fallback is used when we're not polling for naturalWidth/Height
    // IE6-7 also use this to add support for naturalWidth/Height
    if (!this.supports.naturalWidth || this.options.method === "onload") {
      setTimeout($.proxy(this.fallback, this));
      return;
    }

    // can exit out right away if we have a naturalWidth
    if (this.img.complete && $.type(this.img.naturalWidth) !== "undefined") {
      setTimeout(
        $.proxy(function() {
          if (this.img.naturalWidth > 0) {
            this.success();
          } else {
            this.error();
          }
        }, this)
      );
      return;
    }

    // we instantly bind to onerror so we catch right away
    $(this.img).bind(
      "error",
      $.proxy(function() {
        setTimeout(
          $.proxy(function() {
            this.error();
          }, this)
        );
      }, this)
    );

    this.intervals = [
      [1000, 10],
      [2 * 1000, 50],
      [4 * 1000, 100],
      [20 * 1000, 500]
    ];

    // for testing, 2sec delay
    // this.intervals = [[20 * 1000, 2000]];

    this._ipos = 0;
    this._time = 0;
    this._delay = this.intervals[this._ipos][1];

    // start polling
    this.poll();
  },

  poll: function() {
    this._polling = setTimeout(
      $.proxy(function() {
        if (this.img.naturalWidth > 0) {
          this.success();
          return;
        }

        // update time spend
        this._time += this._delay;

        // use a fallback after waiting
        if (
          this.options.pollFallbackAfter &&
          this._time >= this.options.pollFallbackAfter &&
          !this._usedPollFallback
        ) {
          this._usedPollFallback = true;
          this.fallback();
        }

        // next i within the interval
        if (this._time > this.intervals[this._ipos][0]) {
          // if there's no next interval, we asume
          // the image image errored out
          if (!this.intervals[this._ipos + 1]) {
            this.error();
            return;
          }

          this._ipos++;

          // update to the new bracket
          this._delay = this.intervals[this._ipos][1];
        }

        this.poll();
      }, this),
      this._delay
    );
  },

  fallback: function() {
    var img = new Image();
    this._fallbackImg = img;

    img.onload = $.proxy(function() {
      img.onload = function() {};

      if (!this.supports.naturalWidth) {
        this.img.naturalWidth = img.width;
        this.img.naturalHeight = img.height;
      }

      this.success();
    }, this);

    img.onerror = $.proxy(this.error, this);

    img.src = this.img.src;
  },

  abort: function() {
    if (this._fallbackImg) {
      this._fallbackImg.onload = function() {};
    }

    if (this._polling) {
      clearTimeout(this._polling);
      this._polling = null;
    }
  },

  success: function() {
    if (this._calledSuccess) return;
    this._calledSuccess = true;

    this.isLoaded = true;
    this.successCallback(this);
  },

  error: function() {
    if (this._calledError) return;
    this._calledError = true;

    this.abort();
    if (this.errorCallback) this.errorCallback(this);
  }
});

function Timers() {
  return this.initialize.apply(this, _slice.call(arguments));
}
$.extend(Timers.prototype, {
  initialize: function() {
    this._timers = {};
  },

  set: function(name, handler, ms) {
    this._timers[name] = setTimeout(handler, ms);
  },

  get: function(name) {
    return this._timers[name];
  },

  clear: function(name) {
    if (name) {
      if (this._timers[name]) {
        clearTimeout(this._timers[name]);
        delete this._timers[name];
      }
    } else {
      this.clearAll();
    }
  },

  clearAll: function() {
    $.each(this._timers, function(i, timer) {
      clearTimeout(timer);
    });
    this._timers = {};
  }
});

// uses Types to scan a URI for info
function getURIData(url) {
  var result = { type: "image" };
  $.each(Types, function(i, type) {
    var data = type.data(url);
    if (data) {
      result = data;
      result.type = i;
      result.url = url;
    }
  });

  return result;
}

function detectExtension(url) {
  var ext = (url || "").replace(/\?.*/g, "").match(/\.([^.]{3,4})$/);
  return ext ? ext[1].toLowerCase() : null;
}

var Type = {
  isVideo: function(type) {
    return /^(youtube|vimeo)$/.test(type);
  }
};

var Types = {
  image: {
    extensions: "bmp gif jpeg jpg png webp",
    detect: function(url) {
      return $.inArray(detectExtension(url), this.extensions.split(" ")) > -1;
    },
    data: function(url) {
      if (!this.detect()) return false;

      return {
        extension: detectExtension(url)
      };
    }
  },

  vimeo: {
    detect: function(url) {
      var res = /(vimeo\.com)\/([a-zA-Z0-9-_]+)(?:\S+)?$/i.exec(url);
      if (res && res[2]) return res[2];

      return false;
    },
    data: function(url) {
      var id = this.detect(url);
      if (!id) return false;

      return {
        id: id
      };
    }
  },

  youtube: {
    detect: function(url) {
      var res = /(youtube\.com|youtu\.be)\/watch\?(?=.*vi?=([a-zA-Z0-9-_]+))(?:\S+)?$/.exec(
        url
      );
      if (res && res[2]) return res[2];

      res = /(youtube\.com|youtu\.be)\/(vi?\/|u\/|embed\/)?([a-zA-Z0-9-_]+)(?:\S+)?$/i.exec(
        url
      );
      if (res && res[3]) return res[3];

      return false;
    },
    data: function(url) {
      var id = this.detect(url);
      if (!id) return false;

      return {
        id: id
      };
    }
  }
};

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

var Options = {
  defaults: {
    effects: {
      content: { show: 0, hide: 0 },
      spinner: { show: 150, hide: 150 },
      window: { show: 440, hide: 300 },
      thumbnail: { show: 300, delay: 150 },
      thumbnails: { slide: 0 }
    },
    keyboard: {
      left: true,
      right: true,
      esc: true
    },
    loadedMethod: "naturalWidth",
    loop: false,
    onClick: "previous-next",
    overflow: false,
    overlay: {
      close: true
    },
    preload: [1, 2],
    position: true,
    skin: "fresco",
    spinner: true,
    spinnerDelay: 300,
    sync: true,
    thumbnails: "horizontal",
    ui: "outside",
    uiDelay: 3000,
    vimeo: {
      autoplay: 1,
      api: 1,
      title: 1,
      byline: 1,
      portrait: 0,
      loop: 0
    },
    youtube: {
      autoplay: 1,
      controls: 1,
      //cc_load_policy: 0,
      enablejsapi: 1,
      hd: 1,
      iv_load_policy: 3,
      loop: 0,
      modestbranding: 1,
      rel: 0,
      vq: "hd1080" // force hd: http://stackoverflow.com/a/12467865
    },

    initialTypeOptions: {
      image: {},
      vimeo: {
        width: 1280
      },
      // Youtube needs both dimensions, it doesn't support fetching video dimensions like Vimeo yet.
      // Star this ticket if you'd like to get support for it at some point:
      // https://code.google.com/p/gdata-issues/issues/detail?id=4329
      youtube: {
        width: 1280,
        height: 720
      }
    }
  },

  create: function(opts, type, data) {
    opts = opts || {};
    data = data || {};

    opts.skin = opts.skin || this.defaults.skin;

    var selected = opts.skin
        ? $.extend(
            {},
            Fresco.Skins[opts.skin] || Fresco.Skins[this.defaults.skin]
          )
        : {},
      merged = $.extend(true, {}, this.defaults, selected);

    // merge initial type options
    if (merged.initialTypeOptions) {
      if (type && merged.initialTypeOptions[type]) {
        merged = $.extend(true, {}, merged.initialTypeOptions[type], merged);
      }
      // these aren't used further, so remove them
      delete merged.initialTypeOptions;
    }

    // safe options to work with
    var options = $.extend(true, {}, merged, opts);

    // touch should never use ui:inside
    if (Support.mobileTouch && options.ui === "inside") {
      options.ui = "outside";
    }

    // set all effect duration to 0 for effects: false
    // IE8 and below never use effects
    if (!options.effects || (Browser.IE && Browser.IE < 9)) {
      options.effects = {};
      $.each(this.defaults.effects, function(name, effect) {
        $.each((options.effects[name] = $.extend({}, effect)), function(
          option
        ) {
          options.effects[name][option] = 0;
        });
      });

      // disable the spinner when effects are disabled
      options.spinner = false;
    }

    // keyboard
    if (options.keyboard) {
      // when keyboard is true, enable all keys
      if ($.type(options.keyboard) === "boolean") {
        options.keyboard = {};
        $.each(this.defaults.keyboard, function(key, bool) {
          options.keyboard[key] = true;
        });
      }

      // disable left and right keys for video, because players like
      // youtube use these keys
      if (type === "vimeo" || type === "youtube") {
        $.extend(options.keyboard, { left: false, right: false });
      }
    }

    // overflow
    if (!options.overflow || Support.mobileTouch) {
      // false
      options.overflow = { x: false, y: false };
    } else {
      if ($.type(options.overflow) === "boolean") {
        // true
        options.overflow = { x: false, y: true };
      }
    }

    // vimeo & youtube always have no overlap
    if (type === "vimeo" || type === "youtube") {
      options.overlap = false;
    }

    // disabled thumbnails IE < 9 & touch based devices
    if ((Browser.IE && Browser.IE < 9) || Support.mobileTouch) {
      options.thumbnail = false;
      options.thumbnails = false;
    }

    // width/height are only used for youtube
    // convert it to maxWidth/Height for the other content
    // when no max values have been set
    if (type !== "youtube") {
      if (options.width && !options.maxWidth) {
        options.maxWidth = options.width;
      }
      if (options.height && !options.maxHeight) {
        options.maxHeight = options.height;
      }
    }

    // youtube thumbnails
    if (!options.thumbnail && $.type(options.thumbnail) !== "boolean") {
      // only continue if undefined, forced false stays false
      var thumbnail = false;

      switch (type) {
        case "youtube":
          var protocol =
            "http" +
            (window.location && window.location.protocol === "https:"
              ? "s"
              : "") +
            ":";

          thumbnail = protocol + "//img.youtube.com/vi/" + data.id + "/0.jpg";
          break;
        case "image":
        case "vimeo":
          thumbnail = true;
          break;
      }

      options.thumbnail = thumbnail;
    }

    return options;
  }
};

var Overlay = {
  initialize: function() {
    this.build();
    this.visible = false;
  },

  build: function() {
    this.element = $("<div>")
      .addClass("fr-overlay")
      .hide()
      .append($("<div>").addClass("fr-overlay-background"));

    this.element.on(
      "click",
      $.proxy(function() {
        var page = Pages.page;
        if (
          page &&
          page.view &&
          page.view.options.overlay &&
          !page.view.options.overlay.close
        ) {
          return;
        }
        Window.hide();
      }, this)
    );

    if (Support.mobileTouch) {
      this.element.addClass("fr-mobile-touch");
    }

    // prevent mousewheel scroll
    this.element.on("fresco:mousewheel", function(event) {
      event.preventDefault();
    });
  },

  setSkin: function(skin) {
    if (this.skin) {
      this.element.removeClass("fr-overlay-skin-" + this.skin);
    }

    this.element.addClass("fr-overlay-skin-" + skin);
    this.skin = skin;
  },

  attach: function() {
    $(document.body).append(this.element);
  },

  detach: function() {
    this.element.detach();
  },

  show: function(callback, alternateDuration) {
    if (this.visible) {
      if (callback) callback();
      return;
    }

    this.visible = true;

    this.attach();
    this.max();

    var pDuration =
        (Pages.page && Pages.page.view.options.effects.window.show) || 0,
      duration =
        ($.type(alternateDuration) === "number"
          ? alternateDuration
          : pDuration) || 0;

    this.element.stop(true).fadeTo(duration, 1, callback);
  },

  hide: function(callback, alternateDuration) {
    if (!this.visible) {
      if (callback) callback();
      return;
    }

    var pDuration =
        (Pages.page && Pages.page.view.options.effects.window.hide) || 0,
      duration =
        ($.type(alternateDuration) === "number"
          ? alternateDuration
          : pDuration) || 0;

    this.element.stop(true).fadeOut(
      duration || 0,
      $.proxy(function() {
        this.detach();
        this.visible = false;
        if (callback) callback();
      }, this)
    );
  },

  getScrollDimensions: function() {
    var dimensions = {};
    $.each(["width", "height"], function(i, d) {
      var D = d.substr(0, 1).toUpperCase() + d.substr(1),
        ddE = document.documentElement;

      dimensions[d] =
        (Browser.IE
          ? Math.max(ddE["offset" + D], ddE["scroll" + D])
          : Browser.WebKit
          ? document.body["scroll" + D]
          : ddE["scroll" + D]) || 0;
    });
    return dimensions;
  },

  max: function() {
    var scrollDimensions;
    if (Browser.MobileSafari && (Browser.WebKit && Browser.WebKit < 533.18)) {
      scrollDimensions = this.getScrollDimensions();
      this.element.css(scrollDimensions);
    }

    if (Browser.IE && Browser.IE < 9) {
      var viewport = Bounds.viewport();
      this.element.css({ height: viewport.height, width: viewport.width });
    }

    if (Support.mobileTouch && !scrollDimensions) {
      this.element.css({
        height: this.getScrollDimensions().height
      });
    }
  }
};

var Window = {
  initialize: function() {
    this.queues = [];
    this.queues.hide = $({});

    this.pages = [];
    this._tracking = [];
    this._first = true;

    this.timers = new Timers();

    this.build();
    this.setSkin(Options.defaults.skin);
  },

  build: function() {
    // window
    this.element = $("<div>")
      .addClass("fr-window fr-measured")
      .hide() // start hidden

      .append(
        (this._box = $("<div>")
          .addClass("fr-box")
          .append((this._pages = $("<div>").addClass("fr-pages"))))
      )

      .append((this._thumbnails = $("<div>").addClass("fr-thumbnails")));

    Overlay.initialize();
    Pages.initialize(this._pages);
    Thumbnails.initialize(this._thumbnails);
    Spinner.initialize();
    UI.initialize();

    // support classes
    this.element.addClass(
      "fr" + (!Support.mobileTouch ? "-no" : "") + "-mobile-touch"
    );
    this.element.addClass("fr" + (!Support.svg ? "-no" : "") + "-svg");

    if (Browser.IE) {
      for (var i = 7; i <= 9; i++) {
        if (Browser.IE < i) {
          this.element.addClass("fr-ltIE" + i);
        }
      }
    }

    // prevent mousewheel scroll
    this.element.on("fresco:mousewheel", function(event) {
      event.preventDefault();
    });
  },

  attach: function() {
    if (this._attached) return;
    $(document.body).append(this.element);
    this._attached = true;
  },

  detach: function() {
    if (!this._attached) return;
    this.element.detach();
    this._attached = false;
  },

  setSkin: function(skin) {
    if (this._skin) {
      this.element.removeClass("fr-window-skin-" + this._skin);
    }
    this.element.addClass("fr-window-skin-" + skin);

    Overlay.setSkin(skin);

    this._skin = skin;
  },

  setShowingType: function(type) {
    if (this._showingType === type) return;

    if (this._showingType) {
      this.element.removeClass("fr-showing-type-" + this._showingType);
      if (Type.isVideo(this._showingType)) {
        this.element.removeClass("fr-showing-type-video");
      }
    }

    this.element.addClass("fr-showing-type-" + type);
    if (Type.isVideo(type)) {
      this.element.addClass("fr-showing-type-video");
    }

    this._showingType = type;
  },

  // Resize
  startObservingResize: function() {
    if (this._onWindowResizeHandler) return;
    $(window).on(
      "resize orientationchange",
      (this._onWindowResizeHandler = $.proxy(this._onWindowResize, this))
    );
  },

  stopObservingResize: function() {
    if (this._onWindowResizeHandler) {
      $(window).off("resize orientationchange", this._onWindowResizeHandler);
      this._onWindowResizeHandler = null;
    }
  },

  /*startObservingScroll: function() {
    if (this._onScrollHandler) return;
    $(window).on('scroll', this._onScrollHandler = $.proxy(this._onScroll, this));
  },

  stopObservingScroll: function() {
    if (this._onScrollHandler) {
      $(window).off('scroll', this._onScrollHandler);
      this._onScrollHandler = null;
    }
  },*/

  _onScroll: function() {
    if (!Support.mobileTouch) return;
    // the timeout is a hack for iOS not responding
    this.timers.set("scroll", $.proxy(this.adjustToScroll, this), 0);
  },

  _onWindowResize: function() {
    var page;
    if (!(page = Pages.page)) return;

    Thumbnails.fitToViewport();

    this.updateBoxDimensions();

    page.fitToBox();

    // update the UI to the current size
    UI.update();

    // instantly update previous/next
    UI.adjustPrevNext(null, 0);

    // reposition spinner
    Spinner.center();

    Overlay.max(); // IE7-8

    // show UI for touch on resize
    UI._onWindowResize();

    this._onScroll();
  },

  adjustToScroll: function() {
    if (!Support.mobileTouch) return;

    this.element.css({
      //left: $(window).scrollLeft(),
      top: $(window).scrollTop()
    });
  },

  getBoxDimensions: function() {
    return this._boxDimensions;
  },

  updateBoxDimensions: function() {
    var page;
    if (!(page = Pages.page)) return;

    var viewport = Bounds.viewport(),
      thumbnails = Thumbnails.getDimensions();

    var isHorizontal = Thumbnails._orientation === "horizontal";

    this._boxDimensions = {
      width: isHorizontal ? viewport.width : viewport.width - thumbnails.width,
      height: isHorizontal
        ? viewport.height - thumbnails.height
        : viewport.height
    };

    // resize
    this._boxPosition = {
      top: 0,
      left: isHorizontal ? 0 : thumbnails.width
    };

    this._box.css($.extend({}, this._boxDimensions, this._boxPosition));
  },

  show: function(callback, alternateDuration) {
    if (this.visible) {
      if (callback) callback();
      return;
    }

    this.visible = true;
    this.opening = true;

    this.attach();

    // clear timers that possible break toggling between show/hide()
    this.timers.clear("show-window");
    this.timers.clear("hide-overlay");

    // position the window at the top if mobile touch
    this.adjustToScroll();

    var duration =
      ($.type(alternateDuration) === "number"
        ? alternateDuration
        : Pages.page && Pages.page.view.options.effects.window.show) || 0;

    var fx = 2;

    // overlay
    Overlay[Pages.page && Pages.page.view.options.overlay ? "show" : "hide"](
      function() {
        if (callback && --fx < 1) callback();
      },
      duration
    );

    // window
    // using a timeout here removes a sharp visible edge of the window while fading in
    // because the fading happens on top of a solid area
    this.timers.set(
      "show-window",
      $.proxy(function() {
        this._show(
          $.proxy(function() {
            this.opening = false;
            if (callback && --fx < 1) callback();
          }, this),
          duration
        );
      }, this),
      duration > 1 ? Math.min(duration * 0.5, 50) : 1
    );
  },

  _show: function(callback, alternateDuration) {
    var duration =
      ($.type(alternateDuration) === "number"
        ? alternateDuration
        : Pages.page && Pages.page.view.options.effects.window.show) || 0;

    this.element.stop(true).fadeTo(duration, 1, callback);
  },

  hide: function(callback) {
    if (!this.view) return;

    var hideQueue = this.queues.hide;
    hideQueue.queue([]); // clear queue

    // clear timers that possible break toggling between show/hide()
    this.timers.clear("show-window");
    this.timers.clear("hide-overlay");

    var duration = Pages.page ? Pages.page.view.options.effects.window.hide : 0;

    hideQueue.queue(
      $.proxy(function(next_stop) {
        Pages.stop();

        // hide the spinner here so its effect ends early enough
        Spinner.hide();

        next_stop();
      }, this)
    );

    hideQueue.queue(
      $.proxy(function(next_unbinds) {
        // ui
        UI.disable();
        UI.hide(null, duration);

        // keyboard
        Keyboard.disable();

        next_unbinds();
      }, this)
    );

    hideQueue.queue(
      $.proxy(function(next_hidden) {
        var fx = 2;

        this._hide(function() {
          if (--fx < 1) next_hidden();
        }, duration);

        // using a timeout here removes a sharp visible edge of the window while fading out
        this.timers.set(
          "hide-overlay",
          $.proxy(function() {
            Overlay.hide(function() {
              if (--fx < 1) next_hidden();
            }, duration);
          }, this),
          duration > 1 ? Math.min(duration * 0.5, 150) : 1
        );

        // after we initiate hide, the next show() should bring up the UI
        // we to this using a flag
        this._first = true;
      }, this)
    );

    // callbacks after resize in a separate queue
    // so we can stop the hideQueue without stopping the resize
    hideQueue.queue(
      $.proxy(function(next_after_resize) {
        this._reset();

        // all of the below we cannot safely call safely
        this.stopObservingResize();
        //this.stopObservingScroll();

        Pages.removeAll();

        Thumbnails.clear();

        this.timers.clear();

        this._position = -1;

        // afterHide callback
        var afterHide = Pages.page && Pages.page.view.options.afterHide;
        if ($.type(afterHide) === "function") {
          afterHide.call(Fresco);
        }

        this.view = null;
        this.opening = false;
        this.closing = false;

        // remove from DOM
        this.detach();

        next_after_resize();
      }, this)
    );

    if ($.type(callback) === "function") {
      hideQueue.queue(
        $.proxy(function(next_callback) {
          callback();
          next_callback();
        }, this)
      );
    }
  },

  _hide: function(callback, alternateDuration) {
    var duration =
      ($.type(alternateDuration) === "number"
        ? alternateDuration
        : Pages.page && Pages.page.view.options.effects.window.hide) || 0;

    this.element.stop(true).fadeOut(duration, callback);
  },

  // Load
  load: function(views, position) {
    this.views = views;

    // dimension and visibility based code needs
    // the window attached
    this.attach();

    Thumbnails.load(views);

    Pages.load(views);

    this.startObservingResize();
    //this.startObservingScroll();

    if (position) {
      this.setPosition(position);
    }
  },

  // loading indicator
  /*
  startLoading: function() {
    if (!Spinner.supported) return;

    Spinner.show();
    Spinner.center();
  },

  stopLoading: function() {
    if (!Spinner.supported) return;

    // we only stop loading if there are no loading pages anymore
    var loadingCount = Pages.getLoadingCount();

    if (loadingCount < 1) {
      Spinner.hide();
    }
  },*/

  setPosition: function(position, callback) {
    this._position = position;

    // store the current view
    this.view = this.views[position - 1];

    // we need to make sure that a possible hide effect doesn't
    // trigger its callbacks, as that would cancel the showing/loading
    // of the page started below
    this.stopHideQueue();

    // store the page and show it
    this.page = Pages.show(
      position,
      $.proxy(function() {
        if (callback) callback();
      }, this)
    );
  },

  // stop all callbacks possibly queued up into a hide animation
  // this allows the hide animation to finish as we start showing/loading
  // a new page, a callback could otherwise interrupt this
  stopHideQueue: function() {
    this.queues.hide.queue([]);
  },

  _reset: function() {
    this.visible = false;
    UI.hide(null, 0);
    UI.reset();
  },

  // Previous / Next
  mayPrevious: function() {
    return (
      (this.view &&
        this.view.options.loop &&
        this.views &&
        this.views.length > 1) ||
      this._position !== 1
    );
  },

  previous: function(force) {
    var mayPrevious = this.mayPrevious();

    if (force || mayPrevious) {
      this.setPosition(this.getSurroundingIndexes().previous);
    }
  },

  mayNext: function() {
    var hasViews = this.views && this.views.length > 1;

    return (
      (this.view && this.view.options.loop && hasViews) ||
      (hasViews && this.getSurroundingIndexes().next !== 1)
    );
  },

  next: function(force) {
    var mayNext = this.mayNext();

    if (force || mayNext) {
      this.setPosition(this.getSurroundingIndexes().next);
    }
  },

  // surrounding
  getSurroundingIndexes: function() {
    if (!this.views) return {};

    var pos = this._position,
      length = this.views.length;

    var previous = pos <= 1 ? length : pos - 1,
      next = pos >= length ? 1 : pos + 1;

    return {
      previous: previous,
      next: next
    };
  }
};

//  Keyboard
//  keeps track of keyboard events when enabled
var Keyboard = {
  enabled: false,

  keyCode: {
    left: 37,
    right: 39,
    esc: 27
  },

  // enable is passed the keyboard option of a page, which can be false
  // or contains multiple buttons to toggle
  enable: function(enabled) {
    this.disable();

    if (!enabled) return;

    $(document)
      .on("keydown", (this._onKeyDownHandler = $.proxy(this.onKeyDown, this)))
      .on("keyup", (this._onKeyUpHandler = $.proxy(this.onKeyUp, this)));

    this.enabled = enabled;
  },

  disable: function() {
    this.enabled = false;

    if (this._onKeyUpHandler) {
      $(document)
        .off("keyup", this._onKeyUpHandler)
        .off("keydown", this._onKeyDownHandler);
      this._onKeyUpHandler = this._onKeyDownHandler = null;
    }
  },

  onKeyDown: function(event) {
    if (!this.enabled) return;

    var key = this.getKeyByKeyCode(event.keyCode);

    if (!key || (key && this.enabled && !this.enabled[key])) return;

    event.preventDefault();
    event.stopPropagation();

    switch (key) {
      case "left":
        Window.previous();
        break;
      case "right":
        Window.next();
        break;
    }
  },

  onKeyUp: function(event) {
    if (!this.enabled) return;

    var key = this.getKeyByKeyCode(event.keyCode);

    if (!key || (key && this.enabled && !this.enabled[key])) return;

    switch (key) {
      case "esc":
        Window.hide();
        break;
    }
  },

  getKeyByKeyCode: function(keyCode) {
    for (var key in this.keyCode) {
      if (this.keyCode[key] === keyCode) return key;
    }
    return null;
  }
};

var Page = (function() {
  var _uid = 0,
    _loadedUrlCache = {},
    // a group of elements defining the 1px stroke, cloned later on
    _strokes = $("<div>")
      .addClass("fr-stroke fr-stroke-top fr-stroke-horizontal")
      .append($("<div>").addClass("fr-stroke-color"))
      .add(
        $("<div>")
          .addClass("fr-stroke fr-stroke-bottom fr-stroke-horizontal")
          .append($("<div>").addClass("fr-stroke-color"))
      )
      .add(
        $("<div>")
          .addClass("fr-stroke fr-stroke-left fr-stroke-vertical")
          .append($("<div>").addClass("fr-stroke-color"))
      )
      .add(
        $("<div>")
          .addClass("fr-stroke fr-stroke-right fr-stroke-vertical")
          .append($("<div>").addClass("fr-stroke-color"))
      );

  function Page() {
    return this.initialize.apply(this, _slice.call(arguments));
  }
  $.extend(Page.prototype, {
    initialize: function(view, position, total) {
      this.view = view;
      this.dimensions = { width: 0, height: 0 };
      this.uid = _uid++;

      // store position/total views for later use
      this._position = position;
      this._total = total;
      this._fullClick = false;

      this._visible = false;

      this.queues = {};
      this.queues.showhide = $({});
    },

    // create the page, this doesn't mean it's loaded
    // should happen instantly
    create: function() {
      if (this._created) return;

      Pages.element.append(
        (this.element = $("<div>")
          .addClass("fr-page")
          .append((this.container = $("<div>").addClass("fr-container")))
          .css({ opacity: 0 })
          .hide())
      );

      // check if we have a position
      var hasPosition = this.view.options.position && this._total > 1;
      if (hasPosition) {
        // mark it if so
        this.element.addClass("fr-has-position");
      }

      // info (caption/position)
      if (this.view.caption || hasPosition) {
        this.element.append(
          (this.info = $("<div>")
            .addClass("fr-info")
            .append($("<div>").addClass("fr-info-background"))
            .append(_strokes.clone(true))
            .append((this.infoPadder = $("<div>").addClass("fr-info-padder"))))
        );

        // insert position first because it floats right
        if (hasPosition) {
          this.element.addClass("fr-has-position");

          this.infoPadder.append(
            (this.pos = $("<div>")
              .addClass("fr-position")
              .append(
                $("<span>")
                  .addClass("fr-position-text")
                  .html(this._position + " / " + this._total)
              ))
          );
        }

        if (this.view.caption) {
          this.infoPadder.append(
            (this.caption = $("<div>")
              .addClass("fr-caption")
              .html(this.view.caption))
          );
        }
      }

      // background
      this.container
        .append(
          (this.background = $("<div>").addClass("fr-content-background"))
        )
        .append((this.content = $("<div>").addClass("fr-content")));

      // append images instantly
      if (this.view.type == "image") {
        this.content.append(
          (this.image = $("<img>")
            .addClass("fr-content-element")
            .attr({ src: this.view.url }))
        );

        this.content.append(_strokes.clone(true));
      }

      // ui:outside needs a position outside of the info bar
      if (hasPosition && this.view.options.ui == "outside") {
        this.container.append(
          (this.positionOutside = $("<div>")
            .addClass("fr-position-outside")
            .append($("<div>").addClass("fr-position-background"))
            .append(
              $("<span>")
                .addClass("fr-position-text")
                .html(this._position + " / " + this._total)
            ))
        );
      }

      // ui:inside has everything inside the content
      if (this.view.options.ui == "inside") {
        // buttons
        this.content
          // < previous
          .append(
            (this.previousInside = $("<div>")
              .addClass("fr-side fr-side-previous fr-toggle-ui")
              .append(
                $("<div>")
                  .addClass("fr-side-button")
                  .append($("<div>").addClass("fr-side-button-background"))
                  .append($("<div>").addClass("fr-side-button-icon"))
              ))
          )
          // > next
          .append(
            (this.nextInside = $("<div>")
              .addClass("fr-side fr-side-next fr-toggle-ui")
              .append(
                $("<div>")
                  .addClass("fr-side-button")
                  .append($("<div>").addClass("fr-side-button-background"))
                  .append($("<div>").addClass("fr-side-button-icon"))
              ))
          )

          // X close
          .append(
            (this.closeInside = $("<div>")
              .addClass("fr-close fr-toggle-ui")
              .append($("<div>").addClass("fr-close-background"))
              .append($("<div>").addClass("fr-close-icon")))
          );

        // info (only inserted when there is a caption)
        // if there is no caption we insert a separate position element below
        // but if 1 item in the group has a caption we insert the info bar
        if (this.view.caption || (hasPosition && this.view.grouped.caption)) {
          this.content.append(
            (this.infoInside = $("<div>")
              .addClass("fr-info fr-toggle-ui")
              .append($("<div>").addClass("fr-info-background"))
              .append(_strokes.clone(true))
              .append(
                (this.infoPadderInside = $("<div>").addClass("fr-info-padder"))
              ))
          );

          // insert position first because it floats right
          if (hasPosition) {
            this.infoPadderInside.append(
              (this.posInside = $("<div>")
                .addClass("fr-position")
                .append(
                  $("<span>")
                    .addClass("fr-position-text")
                    .html(this._position + " / " + this._total)
                ))
            );
          }

          if (this.view.caption) {
            this.infoPadderInside.append(
              (this.captionInside = $("<div>")
                .addClass("fr-caption")
                .html(this.view.caption))
            );
          }
        }

        // insert a separate position for when there's no caption
        // avoid adding it when the group has at least one caption,
        // the info bar is shown then
        if (!this.view.caption && hasPosition && !this.view.grouped.caption) {
          this.content.append(
            (this.positionInside = $("<div>")
              .addClass("fr-position-inside fr-toggle-ui")
              .append($("<div>").addClass("fr-position-background"))
              .append(
                $("<span>")
                  .addClass("fr-position-text")
                  .html(this._position + " / " + this._total)
              ))
          );
        }

        // disabled states on buttons
        var mayPrevious =
            (this.view.options.loop && this._total > 1) || this._position != 1,
          mayNext =
            (this.view.options.loop && this._total > 1) ||
            this._position < this._total;
        this.previousInside[(mayPrevious ? "remove" : "add") + "Class"](
          "fr-side-disabled"
        );
        this.nextInside[(mayNext ? "remove" : "add") + "Class"](
          "fr-side-disabled"
        );
      }

      // overlap (this affects padding)
      $.each(
        ["x", "y"],
        $.proxy(function(i, z) {
          if (this.view.options.overflow[z]) {
            this.element.addClass("fr-overflow-" + z);
          }
        }, this)
      );

      // add the type
      this.element.addClass("fr-type-" + this.view.type);
      // add type-video
      if (Type.isVideo(this.view.type)) {
        this.element.addClass("fr-type-video");
      }

      // no sides
      if (this._total < 2) {
        this.element.addClass("fr-no-sides");
      }

      this._created = true;
    },

    //surrounding
    _getSurroundingPages: function() {
      var preload;
      if (!(preload = this.view.options.preload)) return [];

      var pages = [],
        begin = Math.max(1, this._position - preload[0]),
        end = Math.min(this._position + preload[1], this._total),
        pos = this._position;

      // add the pages after this one first for the preloading order
      for (var i = pos; i <= end; i++) {
        var page = Pages.pages[i - 1];
        if (page._position != pos) pages.push(page);
      }

      for (var i = pos; i >= begin; i--) {
        var page = Pages.pages[i - 1];
        if (page._position != pos) pages.push(page);
      }

      return pages;
    },

    preloadSurroundingImages: function() {
      var pages = this._getSurroundingPages();

      $.each(
        pages,
        $.proxy(function(i, page) {
          page.preload();
        }, this)
      );
    },

    // preload is a non-abortable preloader,
    // so that it doesn't interfere with our regular load
    preload: function() {
      if (
        this.preloading ||
        this.preloaded ||
        this.view.type != "image" ||
        !this.view.options.preload ||
        this.loaded // page might be loaded before it's preloaded so also stop there
      ) {
        return;
      }

      // make sure the page is created
      this.create();

      this.preloading = true;

      this.preloadReady = new ImageReady(
        this.image[0],
        $.proxy(function(imageReady) {
          // mark this page as loaded, without hiding the spinner
          this.loaded = true;
          _loadedUrlCache[this.view.url] = true;

          this.preloading = false;
          this.preloaded = true;

          this.dimensions = {
            width: imageReady.img.naturalWidth,
            height: imageReady.img.naturalHeight
          };
        }, this),
        null,
        {
          // have the preload always use naturalWidth,
          // this avoid an extra new Image() request
          method: "naturalWidth"
        }
      );
    },

    // the purpose of load is to set dimensions
    // we use it to set dimensions even for content that doesn't load like youtube
    load: function(callback, isPreload) {
      // make sure the page is created
      this.create();
      // exit early if already loaded
      if (this.loaded) {
        if (callback) callback();
        return;
      }

      // abort possible previous (pre)load
      this.abort();

      // mark as loading
      this.loading = true;

      // start the spinner after waiting for some duration
      if (this.view.options.spinner) {
        // && !_loadedUrlCache[this.view.url]
        this._spinnerDelay = setTimeout(
          $.proxy(function() {
            Spinner.show();
          }, this),
          this.view.options.spinnerDelay || 0
        );
      }

      switch (this.view.type) {
        case "image":
          // if we had an error before just go through
          if (this.error) {
            if (callback) callback();
            return;
          }

          this.imageReady = new ImageReady(
            this.image[0],
            $.proxy(function(imageReady) {
              // mark as loaded
              this._markAsLoaded();

              this.setDimensions({
                width: imageReady.img.naturalWidth,
                height: imageReady.img.naturalHeight
              });

              if (callback) callback();
            }, this),
            $.proxy(function() {
              // mark as loaded
              this._markAsLoaded();

              this.image.hide();
              this.content.prepend(
                (this.error = $("<div>")
                  .addClass("fr-error fr-content-element")
                  .append($("<div>").addClass("fr-error-icon")))
              );
              this.element.addClass("fr-has-error");

              this.setDimensions({
                width: this.error.outerWidth(),
                height: this.error.outerHeight()
              });

              // allow resizing
              this.error.css({ width: "100%", height: "100%" });

              if (callback) callback();
            }, this),
            {
              method: this.view.options.loadedMethod
            }
          );

          break;

        case "vimeo":
          this.vimeoReady = new VimeoReady(
            this.view.url,
            $.proxy(function(data) {
              // mark as loaded
              this._markAsLoaded();

              this.setDimensions({
                width: data.dimensions.width,
                height: data.dimensions.height
              });

              if (callback) callback();
            }, this)
          );
          break;

        case "youtube":
          // mark as loaded
          this._markAsLoaded();

          this.setDimensions({
            width: this.view.options.width,
            height: this.view.options.height
          });

          if (callback) callback();
          break;
      }
    },

    // sets dimensions taking maxWidth/Height into account
    setDimensions: function(dimensions) {
      this.dimensions = dimensions;

      if (this.view.options.maxWidth || this.view.options.maxHeight) {
        var opts = this.view.options,
          bounds = {
            width: opts.maxWidth ? opts.maxWidth : this.dimensions.width,
            height: opts.maxHeight ? opts.maxHeight : this.dimensions.height
          };

        this.dimensions = Fit.within(bounds, this.dimensions);
      }
    },

    // helper for load()
    _markAsLoaded: function() {
      this._abortSpinnerDelay();

      this.loading = false;
      this.loaded = true;

      // mark url as loaded so we can avoid
      // showing the spinner again
      _loadedUrlCache[this.view.url] = true;

      Spinner.hide(null, null, this._position);
    },

    isVideo: function() {
      return Type.isVideo(this.view.type);
    },

    insertVideo: function(callback) {
      // don't insert a video twice
      // and stop if not a video
      if (this.playerIframe || !this.isVideo()) {
        if (callback) callback();
        return;
      }

      var protocol =
        "http" +
        (window.location && window.location.protocol === "https:" ? "s" : "") +
        ":";

      var playerVars = $.extend({}, this.view.options[this.view.type] || {}),
        queryString = $.param(playerVars),
        urls = {
          vimeo: protocol + "//player.vimeo.com/video/{id}?{queryString}",
          youtube: protocol + "//www.youtube.com/embed/{id}?{queryString}"
        },
        src = urls[this.view.type]
          .replace("{id}", this.view._data.id)
          .replace("{queryString}", queryString);

      this.content.prepend(
        (this.playerIframe = $(
          "<iframe webkitAllowFullScreen mozallowfullscreen allowFullScreen>"
        )
          .addClass("fr-content-element")
          .attr({
            src: src,
            height: this._contentDimensions.height,
            width: this._contentDimensions.width,
            frameborder: 0
          }))
      );

      if (callback) callback();
    },

    raise: function() {
      // no need to raise if we're already the topmost element
      // this helps avoid unnecessary detaching of the element
      var lastChild = Pages.element[0].lastChild;
      if (lastChild && lastChild === this.element[0]) {
        return;
      }

      Pages.element.append(this.element);
    },

    show: function(callback) {
      var shq = this.queues.showhide;
      shq.queue([]); // clear queue

      shq.queue(
        $.proxy(function(next_stopped_inactive) {
          // hide the spinner only if it's visible, and when this page doesn't need loading
          var needsLoading =
            this.view.options.spinner && !_loadedUrlCache[this.view.url];
          if (Spinner._visible && !needsLoading) {
            Spinner.hide();
          }

          Pages.stopInactive();
          next_stopped_inactive();
        }, this)
      );

      // update the mode is something we can do instantly
      shq.queue(
        $.proxy(function(next_updated_UI) {
          this.updateUI(); // first this page
          UI.set(this._ui); // then the window to match
          next_updated_UI();
        }, this)
      );

      // keyboard, enabled here so escape can be pressed on load
      shq.queue(
        $.proxy(function(next_keyboard) {
          Keyboard.enable(this.view.options.keyboard);
          next_keyboard();
        }, this)
      );

      // load
      shq.queue(
        $.proxy(function(next_loaded) {
          // skin spinner
          Spinner.setSkin(this.view.options.skin);

          // load
          this.load(
            $.proxy(function() {
              this.preloadSurroundingImages();
              next_loaded();
            }, this)
          );
        }, this)
      );

      shq.queue(
        $.proxy(function(next_utility) {
          this.raise();

          Window.setSkin(this.view.options.skin);
          UI.enable(); // enable ui controls

          this.fitToBox();

          // adjust to scroll
          Window.adjustToScroll();

          next_utility();
        }, this)
      );

      // vimeo and youtube use this for insertion
      if (this.isVideo()) {
        shq.queue(
          $.proxy(function(next_video_inserted) {
            this.insertVideo(
              $.proxy(function() {
                next_video_inserted();
              })
            );
          }, this)
        );
      }

      // if we're not syncing, hide other visible pages before this one
      if (!this.view.options.sync) {
        shq.queue(
          $.proxy(function(next_synced) {
            Pages.hideInactive(next_synced);
          }, this)
        );
      }

      shq.queue(
        $.proxy(function(next_shown) {
          var fx = 3,
            duration = this.view.options.effects.content.show;

          // set type on the window
          Window.setShowingType(this.view.type);

          // if this is the first thing we open, we should math the duration
          // of the page opening with that of the window
          if (!Window.visible) {
            duration = this.view.options.effects.window.show;

            if ($.type(this.view.options.onShow) === "function") {
              this.view.options.onShow.call(Fresco);
            }
          }

          // when syncing, hide other pages while showing this one
          if (this.view.options.sync) {
            fx++;
            Pages.hideInactive(function() {
              if (--fx < 1) next_shown();
            });
          }

          Window.show(function() {
            if (--fx < 1) next_shown();
          }, this.view.options.effects.window.show);

          this._show(function() {
            if (--fx < 1) next_shown();
          }, duration);

          UI.adjustPrevNext(
            function() {
              if (--fx < 1) next_shown();
            },
            Window._first ? 0 : duration
          );

          if (Window._first) {
            UI.show(null, 0);

            // don't show the UI the next time, it'll show up
            // when we set this flag again
            Window._first = false;
          } else {
            //if (this._ui == 'inside')
            UI.show(null, 0);
          }

          // call afterPosition right after starting the _show() but within
          // this queue step so triggers before the animation completes
          var afterPosition = this.view.options.afterPosition;
          if ($.type(afterPosition) === "function") {
            afterPosition.call(Fresco, this._position);
          }
        }, this)
      );

      shq.queue(
        $.proxy(function(next_set_visible) {
          this._visible = true;

          if (callback) callback();

          next_set_visible();
        }, this)
      );
    },

    _show: function(callback, alternateDuration) {
      var duration = !Window.visible
        ? 0
        : $.type(alternateDuration) === "number"
        ? alternateDuration
        : this.view.options.effects.content.show;

      this.element
        .stop(true)
        .show()
        .fadeTo(duration || 0, 1, callback);
    },

    hide: function(callback, alternateDuration) {
      if (!this.element) {
        if (callback) callback();
        return; // nothing to hide yet
      }

      this.removeVideo();

      // abort possible loading
      this.abort();

      var duration =
        $.type(alternateDuration) === "number"
          ? alternateDuration
          : this.view.options.effects.content.hide;

      // hide video instantly
      if (this.isVideo()) duration = 0;

      // stop, delay & effect
      this.element
        .stop(true)
        // we use alternative easing to minize background color showing through
        // a lowered opacity fade while images are trading places
        .fadeTo(
          duration,
          0,
          "frescoEaseInCubic",
          $.proxy(function() {
            this.element.hide();
            this._visible = false;
            Pages.removeTracking(this._position);
            if (callback) callback();
          }, this)
        );
    },

    // stop everything
    stop: function() {
      var shq = this.queues.showhide;
      shq.queue([]); // clear queue

      // stop animations
      if (this.element) this.element.stop(true);

      // stop possible loading
      this.abort();
    },

    removeVideo: function() {
      if (this.playerIframe) {
        // this fixes a bug where sound keep playing after
        // removing the iframe in IE10+
        this.playerIframe[0].src = "//about:blank";

        this.playerIframe.remove();
        this.playerIframe = null;
      }
    },

    remove: function() {
      this.stop();
      this.removeVideo();
      if (this.element) this.element.remove();

      if (this._track) {
        Pages.removeTracking(this._position);
        this._track = false;
      }

      // only cancel preloading on remove
      if (this.preloadReady) {
        this.preloadReady.abort();
        this.preloadReady = null;
        this.preloading = null;
        this.preloaded = null;
      }

      this._visible = false;
      this.removed = true;
    },

    abort: function() {
      // we don't stop preloading when aborting
      if (this.imageReady) {
        this.imageReady.abort();
        this.imageReady = null;
      }

      if (this.vimeoReady) {
        this.vimeoReady.abort();
        this.vimeoReady = null;
      }

      this._abortSpinnerDelay();

      this.loading = false;
      //Window.stopLoading();
    },

    _abortSpinnerDelay: function() {
      if (this._spinnerDelay) {
        clearTimeout(this._spinnerDelay);
        this._spinnerDelay = null;
      }
    },

    _getInfoHeight: function(width) {
      // height is always 0 when no caption
      //if (!this.view.caption) return 0;
      // not measuring height? should this be based on visibility?
      var hasPosition = this.view.options.position && this._total > 1;

      switch (this._ui) {
        case "fullclick":
        case "inside":
          if (!(this.view.caption || hasPosition)) return 0;
          break;
        case "outside":
          if (!this.view.caption) return 0;
          break;
      }

      var info = this._ui === "inside" ? this.infoInside : this.info;

      // make sure width fits within the bounds if we use the outside ui
      if (this._ui === "outside") {
        width = Math.min(width, Window._boxDimensions.width);
      }

      // css('width') return an incorrected parsed value, we need the one on the style attribute
      var height,
        oldWidth = info[0].style.width; //.css('width');
      // always use 100% restore width for inside/fullclick
      if (this._ui === "inside" || this._ui === "fullclick") oldWidth = "100%";

      info.css({ width: width + "px" });

      height = parseFloat(info.outerHeight());

      info.css({ width: oldWidth });

      return height;
    },

    _whileVisible: function(fn, extraElements) {
      var shown = [],
        showElements = Window.element.add(this.element);

      if (extraElements) {
        showElements = showElements.add(extraElements);
      }

      // show hidden elements and track which elements got shown
      $.each(showElements, function(i, element) {
        var visible = $(element).is(":visible");

        if (!visible) {
          shown.push($(element).show());
        }
      });

      // need to measure assuming we have a caption, otherwise info.caption will flip between true/false
      // because this class could have been applied at some point
      // having a caption also means these classes are set a certain way, restore them later
      var has_nocap = this.element.hasClass("fr-no-caption");
      this.element.removeClass("fr-no-caption");
      var has_hascap = this.element.hasClass("fr-has-caption");
      this.element.addClass("fr-has-caption");

      // prevent fragments
      Window.element.css({ visibility: "hidden" });

      fn(); // run some code

      // restore visibility
      Window.element.css({ visibility: "visible" });

      // restore classes
      if (has_nocap) this.element.addClass("fr-no-caption");
      if (!has_hascap) this.element.removeClass("fr-has-caption");

      $.each(shown, function(i, element) {
        element.hide();
      });
    },

    // this keeps tracks of flags set in CSS to force certain options
    // like fullclick or no-overlap
    updateForced: function() {
      this.create(); // make sure the element is created

      this._fullClick = this.view.options.fullClick;
      this._noOverflow = false;
      if (parseInt(this.element.css("min-width")) > 0) this._fullClick = true;
      if (parseInt(this.element.css("min-height")) > 0) this._noOverflow = true;
    },

    updateUI: function() {
      // check if we have forced properties
      this.updateForced();

      var ui = this._fullClick ? "fullclick" : this.view.options.ui;

      if (this._ui) this.element.removeClass("fr-ui-" + this._ui);
      this.element.addClass("fr-ui-" + ui);

      this._ui = ui;
    },

    fitToBox: function() {
      // if we have no content, no need to update further
      if (!this.content) return;

      var page = this.element,
        bounds = $.extend({}, Window.getBoxDimensions()),
        dimensions = $.extend({}, this.dimensions),
        container = this.container;

      // need to know which mode we are in before continuing
      this.updateUI();

      var padding = {
        left: parseInt(container.css("padding-left")),
        top: parseInt(container.css("padding-top"))
      };

      // if the ui is outside and we're showing a position, it might be larger then left padding
      // so increase it if that's the case
      if (this._ui === "outside" && this._positionOutside) {
        var positionWidth = 0;

        this._whileVisible(
          $.proxy(function() {
            if (this._positionOutside.is(":visible")) {
              positionWidth = this._positionOutside.outerWidth(true);
            }
          }, this)
        );

        if (positionWidth > padding.left) {
          padding.left = positionWidth;
        }
      }

      bounds.width -= 2 * padding.left;
      bounds.height -= 2 * padding.top;

      var fitOptions = {
        width: true,
        height: this._noOverflow ? true : !this.view.options.overflow.y
      };

      var fitted = Fit.within(bounds, dimensions, fitOptions),
        contentDimensions = $.extend({}, fitted),
        content = this.content,
        infoHeight = 0,
        backgroundDimensions;

      var isInside = this._ui === "inside",
        info = isInside ? this.infoInside : this.info,
        caption = isInside ? this.captionInside : this.caption,
        pos = isInside ? this.posInside : this.pos;

      var infoCaption = !!caption;
      var extraShowElements;

      // set the max-height on the info window so the height calculation takes it into account
      //this.setInfoMaxHeight();

      switch (this._ui) {
        case "outside":
          var preScale = $.extend({}, contentDimensions);

          if (this.caption) {
            extraShowElements = this.caption;

            this._whileVisible(
              $.proxy(function() {
                var count = 0,
                  attempts = 2;

                while (count < attempts) {
                  infoHeight = this._getInfoHeight(contentDimensions.width);

                  var spaceBottom = bounds.height - contentDimensions.height;
                  if (spaceBottom < infoHeight) {
                    contentDimensions = Fit.within(
                      {
                        width: contentDimensions.width,
                        height: Math.max(
                          contentDimensions.height - (infoHeight - spaceBottom),
                          0
                        ) // prevents NaN
                      },
                      contentDimensions,
                      fitOptions
                    );
                  }

                  count++;
                }

                // grab info_height one final time
                infoHeight = this._getInfoHeight(contentDimensions.width);
                var infoShowLimit = 0.5; //this.view.options.infoShowLimit;

                // console.log(infoHeight, contentDimensions.height, bounds.height);
                // console.log(infoHeight + contentDimensions.height, '>', bounds.height);
                if (
                  // too much overflow after resizing the info box to the content area
                  (!this.view.options.overflow.y &&
                    infoHeight + contentDimensions.height > bounds.height) ||
                  // caption disabled through css
                  (info && info.css("display") === "none") ||
                  // info height is >= 50% of image height
                  (infoShowLimit &&
                    infoHeight >= infoShowLimit * contentDimensions.height)
                  //|| (infoHide && infoHide.width
                  //  && infoHeight >= infoHide.width * contentDimensions.width) // info height is >= 60% of image width
                ) {
                  // info is almost a square compared to the image width
                  // console.log('hiding caption', infoHeight, infoShowLimit * contentDimensions.height,
                  // (!this.view.options.overflow.y && (infoHeight + contentDimensions.height > bounds.height)));
                  // console.log(infoHeight, contentDimensions.height, bounds.height);

                  // console.log((!this.view.options.overflow.y && (infoHeight + contentDimensions.height > bounds.height)));
                  // console.log(infoHeight, contentDimensions.height, bounds.height);
                  // console.log('disabling caption, okay');
                  infoCaption = false;
                  infoHeight = 0;
                  contentDimensions = preScale;
                }
              }, this),
              extraShowElements
            );
          } // end caption

          if (info) {
            info.css({
              width: contentDimensions.width + "px"
            });
          }

          backgroundDimensions = {
            width: contentDimensions.width,
            height: contentDimensions.height + infoHeight
          };

          break;

        case "inside":
          if (this.caption) {
            // store elements
            extraShowElements = caption;

            this._whileVisible(
              $.proxy(function() {
                infoHeight = this._getInfoHeight(contentDimensions.width);
                var infoShowLimit = 0.45;

                // hide caption if it is too large
                if (
                  infoShowLimit &&
                  infoHeight >= infoShowLimit * contentDimensions.height
                ) {
                  infoCaption = false;
                  infoHeight = 0;
                }
              }, this),
              extraShowElements
            );
          }

          backgroundDimensions = contentDimensions;

          break;

        case "fullclick":
          var extraElements = [];

          if (caption) {
            extraElements.push(caption);
          }

          this._whileVisible(
            $.proxy(function() {
              // make the caption 100% width
              if (caption || pos) {
                info.css({ width: "100%" });
              }

              infoHeight = this._getInfoHeight(Window._boxDimensions.width);

              if (caption) {
                if (infoHeight > bounds.height * 0.5) {
                  infoCaption = false;

                  if (pos) {
                    var c_disp = this.caption.is(":visible");
                    this.caption.hide();
                    infoHeight = this._getInfoHeight(
                      Window._boxDimensions.width
                    );
                    if (c_disp) this.caption.show();
                  } else {
                    infoHeight = 0;
                  }
                }
              }

              contentDimensions = Fit.within(
                {
                  width: bounds.width,
                  height: Math.max(0, bounds.height - infoHeight)
                },
                contentDimensions,
                fitOptions
              );

              backgroundDimensions = contentDimensions;
            }, this),
            extraElements
          );

          // always show the caption if we have a position
          // at some point to fix something, look into this.
          /*if (pos) {
          infoCaption = true;
        }*/

          // remove possible padding on content added by ui:outside
          this.content.css({ "padding-bottom": 0 });

          break;
      }

      // show/hide caption and mark its visibility with a class
      if (caption) {
        caption[infoCaption ? "show" : "hide"]();
      }
      this.element[(!infoCaption ? "add" : "remove") + "Class"](
        "fr-no-caption"
      );
      this.element[(!infoCaption ? "remove" : "add") + "Class"](
        "fr-has-caption"
      );

      this.content.css(contentDimensions);
      this.background.css(backgroundDimensions);

      // on iframes we force dimensions
      if (this.playerIframe) {
        this.playerIframe.attr(contentDimensions);
      }

      // Overlap, and tracking start/stop based on dimensions
      this.overlap = {
        y:
          backgroundDimensions.height +
          (this._ui === "fullclick" ? infoHeight : 0) -
          Window._boxDimensions.height,
        x: 0
      };

      this._track =
        !this._noOverflow && this.view.options.overflow.y && this.overlap.y > 0;

      // store some values for later use in .position()
      this._infoHeight = infoHeight;
      this._padding = padding;
      this._contentDimensions = contentDimensions;
      this._backgroundDimensions = backgroundDimensions;

      Pages[(this._track ? "set" : "remove") + "Tracking"](this._position);

      this.position();
    },

    position: function() {
      // exit early if we have nothing to position
      if (!this.content) return;

      var contentDimensions = this._contentDimensions,
        backgroundDimensions = this._backgroundDimensions;

      // figure out top/left of the content
      var contentPosition = {
        top:
          Window._boxDimensions.height * 0.5 -
          backgroundDimensions.height * 0.5,
        left:
          Window._boxDimensions.width * 0.5 - backgroundDimensions.width * 0.5
      };
      var infoPosition = {
        top: contentPosition.top + contentDimensions.height,
        left: contentPosition.left
      };
      var containerBottom = 0;

      var info = this._ui === "inside" ? this.infoInside : this.info;

      switch (this._ui) {
        case "fullclick":
          contentPosition.top =
            (Window._boxDimensions.height - this._infoHeight) * 0.5 -
            backgroundDimensions.height * 0.5;

          infoPosition = {
            top: Window._boxDimensions.height - this._infoHeight,
            left: 0,
            bottom: "auto"
          };

          containerBottom = this._infoHeight;
          break;

        case "inside":
          // we have to do some resets when switching between inside and fullclick
          infoPosition = {
            top: "auto",
            left: 0,
            bottom: 0
          };

          break;
      }

      // overlap requires further modification
      if (this.overlap.y > 0) {
        var xyp = Pages.getXYP();

        contentPosition.top = 0 - xyp.y * this.overlap.y;

        switch (this._ui) {
          case "outside":
          case "fullclick":
            infoPosition.top = Window._boxDimensions.height - this._infoHeight;
            break;

          case "inside":
            var bottom =
              contentPosition.top +
              contentDimensions.height -
              Window._boxDimensions.height;
            var top = -1 * contentPosition.top;

            // info
            infoPosition.bottom = bottom;

            // close X
            this.closeInside.css({
              top: top
            });

            if (this._total > 1) {
              // < >
              var windowVisible = Window.element.is(":visible");
              if (!windowVisible) Window.element.show();

              var pRestoreStyle = this.previousInside.attr("style");
              this.previousInside.removeAttr("style");
              var pnMarginTop = parseInt(this.previousInside.css("margin-top")); // the original margin top
              this.previousInside.attr({ style: pRestoreStyle });

              if (!windowVisible) Window.element.hide();

              var buttons = this.previousInside.add(this.nextInside),
                center = this.overlap.y * 0.5;

              buttons.css({
                "margin-top": pnMarginTop + (top - center)
              });

              // position inside
              if (this.positionInside) {
                this.positionInside.css({ bottom: bottom });
              }
            }

            break;
        }
      } else {
        // we have to remove offset from the inner elements possible set by overlap
        if (this._ui === "inside") {
          this.element
            .find(".fr-info, .fr-side, .fr-close, .fr-position-inside")
            .removeAttr("style");
        }
      }

      if (info) info.css(infoPosition);
      this.container.css({ bottom: containerBottom });
      this.content.css(contentPosition);
      this.background.css(contentPosition);
    }
  });

  return Page;
})();

var Pages = {
  initialize: function(element) {
    this.element = element;
    this.pages = [];
    this.uid = 1;
    this._tracking = [];
  },

  load: function(views) {
    this.views = views;

    // remove all inactive page groups
    this.removeAll();

    // add pages for all these views
    $.each(
      views,
      $.proxy(function(i, view) {
        this.pages.push(new Page(view, i + 1, this.views.length));
      }, this)
    );
  },

  show: function(position, callback) {
    var page = this.pages[position - 1];

    // never try to reload the exact same frame
    if (this.page && this.page.uid === page.uid) {
      return;
    }

    // update the page
    this.page = page;

    // reposition thumbnails
    Thumbnails.show(position);

    Window.updateBoxDimensions(); // these are based on Thumbnails, so after thumbnails

    page.show(
      $.proxy(function() {
        if (callback) callback();
      }, this)
    );
  },

  // used by the API when opening
  // checks if the page is in the currently open group
  getPositionInActivePageGroup: function(element) {
    var position = 0;

    $.each(this.pages, function(i, page) {
      if (page.view.element && page.view.element === element) {
        position = i + 1;
      }
    });

    return position;
  },

  getLoadingCount: function() {
    // we only stop loading if all the frames we have are not loading anymore
    var count = 0;
    $.each(this.pages, function(i, page) {
      if (page.loading) count++;
    });
    return count;
  },

  // Window.hide will call thise when fully closed
  removeAll: function() {
    $.each(this.pages, function(i, page) {
      page.remove();
    });

    this.pages = [];
  },

  hideInactive: function(callback, alternateDuration) {
    var _pages = [];

    $.each(
      this.pages,
      $.proxy(function(i, page) {
        if (page.uid !== this.page.uid) {
          _pages.push(page);
        }
      }, this)
    );

    var fx = 0 + _pages.length;

    if (fx < 1) {
      if (callback) callback();
    } else {
      $.each(_pages, function(i, page) {
        page.hide(function() {
          if (callback && --fx < 1) callback();
        }, alternateDuration);
      });
    }

    return _pages.length;
  },

  stopInactive: function() {
    $.each(
      this.pages,
      $.proxy(function(i, page) {
        if (page.uid !== this.page.uid /* && !page.preloading*/) {
          page.stop();
        }
      }, this)
    );
  },

  stop: function() {
    $.each(this.pages, function(i, page) {
      page.stop();
    });
  },

  // Tracking
  /* Tracking x/y */
  handleTracking: function(event) {
    if (Browser.IE && Browser.IE < 9) {
      this.setXY({ x: event.pageX, y: event.pageY });
      this.updatePositions();
    } else {
      this._tracking_timer = setTimeout(
        $.proxy(function() {
          this.setXY({ x: event.pageX, y: event.pageY });
          this.updatePositions();
        }, this),
        30
      );
    }
  },

  clearTrackingTimer: function() {
    if (this._tracking_timer) {
      clearTimeout(this._tracking_timer);
      this._tracking_timer = null;
    }
  },

  startTracking: function() {
    if (Support.mobileTouch || this._handleTracking) return;
    // we observe the document so that even when the page is
    // still loading and the window isn't in view we can still
    // shift x/y positions to get a correct position after load.
    $(document.documentElement).on(
      "mousemove",
      (this._handleTracking = $.proxy(this.handleTracking, this))
    );
  },

  stopTracking: function() {
    if (Support.mobileTouch || !this._handleTracking) return;
    $(document.documentElement).off("mousemove", this._handleTracking);
    this._handleTracking = null;
    this.clearTrackingTimer();
  },

  setTracking: function(position) {
    if (!this.isTracking(position)) {
      this._tracking.push(this.pages[position - 1]);

      if (this._tracking.length === 1) this.startTracking();
    }
  },

  clearTracking: function() {
    this._tracking = [];
  },

  removeTracking: function(position) {
    this._tracking = $.grep(this._tracking, function(page) {
      return page._position !== position;
    });

    if (this._tracking.length < 1) this.stopTracking();
  },

  isTracking: function(position) {
    var found = false;
    $.each(this._tracking, function(i, page) {
      if (page._position === position) {
        found = true;
        return false;
      }
    });
    return found;
  },

  // the tracking itself
  // Pointer %
  setXY: function(xy) {
    this._xy = xy;
  },

  getXYP: function() {
    var page = Pages.page;
    var dimensions = $.extend({}, Window._boxDimensions);
    var xy = $.extend({}, this._xy);

    // subtract scroll
    xy.y -= $(window).scrollTop();

    if (
      page &&
      (page._ui === "outside" || page._ui === "fullclick") &&
      page._infoHeight > 0
    ) {
      dimensions.height -= page._infoHeight;
    }

    xy.y -= Window._boxPosition.top;

    // BUG: in Chrome, events can trigger past the range of the browser
    // window causing incorrect offset, when moving onto the developer tools
    // for example, haven't found a workaround for this yet.

    var xyp = {
      //x: Math.min(Math.max(xy.x / dimensions.width, 0), 1),
      x: 0,
      y: Math.min(Math.max(xy.y / dimensions.height, 0), 1)
    };

    // safety should be a percentage
    var safetyPX = 20,
      wh = { x: "width", y: "height" },
      safety = {};

    $.each(
      "y".split(" "),
      $.proxy(function(i, z) {
        // safety should be a percentage, so convert pixel to %
        safety[z] = Math.min(Math.max(safetyPX / dimensions[wh[z]], 0), 1);

        // now convert
        xyp[z] *= 1 + 2 * safety[z]; // increase the range by 2*%
        xyp[z] -= safety[z]; // shift back by %
        xyp[z] = Math.min(Math.max(xyp[z], 0), 1); // chop of the sides
      }, this)
    );

    this.setXYP(xyp);

    return this._xyp;
  },

  setXYP: function(xyp) {
    this._xyp = xyp;
  },

  // update all page positions
  updatePositions: function() {
    if (this._tracking.length < 1) return;

    $.each(this._tracking, function(i, page) {
      page.position();
    });
  }
};

function View() {
  this.initialize.apply(this, _slice.call(arguments));
}
$.extend(View.prototype, {
  initialize: function(object) {
    var options = arguments[1] || {},
      data = {};

    // string -> element
    if ($.type(object) === "string") {
      // turn the string into an element
      object = { url: object };
    }

    // element -> object
    else if (object && object.nodeType === 1) {
      var element = $(object);

      object = {
        element: element[0],
        url: element.attr("href"),
        caption: element.attr("data-fresco-caption"),
        group: element.attr("data-fresco-group"),
        extension: element.attr("data-fresco-extension"),
        type: element.attr("data-fresco-type"),
        options:
          (element.attr("data-fresco-options") &&
            eval("({" + element.attr("data-fresco-options") + "})")) ||
          {}
      };
    }

    if (object) {
      // detect type if none is set
      if (!object.extension) {
        object.extension = detectExtension(object.url);
      }

      if (!object.type) {
        data = getURIData(object.url);
        object._data = data;
        object.type = data.type;
      }
    }

    if (!object._data) {
      object._data = getURIData(object.url);
    }

    if (object && object.options) {
      object.options = $.extend(
        true,
        $.extend({}, options),
        $.extend({}, object.options)
      );
    } else {
      object.options = $.extend({}, options);
    }
    // extend the options
    object.options = Options.create(object.options, object.type, object._data);

    // extend this with data
    $.extend(this, object);

    return this;
  }
});

// Spinner
// a pure CSS based spinner
var Spinner = {
  // mark as supported
  supported: Support.css.transform && Support.css.animation,

  initialize: function(element) {
    this.element = $("<div>")
      .addClass("fr-spinner")
      .hide();

    for (var i = 1; i <= 12; i++) {
      this.element.append($("<div>").addClass("fr-spin-" + i));
    }

    this.element.on(
      "click",
      $.proxy(function() {
        Window.hide();
      }, this)
    );

    // prevent mousewheel scroll
    this.element.on("fresco:mousewheel", function(event) {
      event.preventDefault();
    });
  },

  setSkin: function(skin) {
    if (!this.supported) return;

    if (this._skin) {
      this.element.removeClass("fr-spinner-skin-" + this._skin);
    }

    // store dimensions, this avoids having to recalculate it every time we center()
    this.updateDimensions();

    this.element.addClass("fr-spinner-skin-" + skin);
    this._skin = skin;
  },

  updateDimensions: function() {
    // need to be attached to measure dimensions
    var attached = this._attached;
    if (!attached) this.attach();

    this._dimensions = {
      width: this.element.outerWidth(),
      height: this.element.outerHeight()
    };

    if (!attached) this.detach();
  },

  attach: function() {
    if (this._attached) return;
    $(document.body).append(this.element);
    this._attached = true;
  },

  detach: function() {
    if (!this._attached) return;
    this.element.detach();
    this._attached = false;
  },

  show: function(callback, alternateDuration) {
    this._visible = true;

    this.attach();
    this.center();

    var pDuration =
        (Pages.page && Pages.page.view.options.effects.spinner.show) || 0,
      duration =
        ($.type(alternateDuration) === "number"
          ? alternateDuration
          : pDuration) || 0;

    this.element.stop(true).fadeTo(duration, 1, callback);
  },

  hide: function(callback, alternateDuration, position) {
    this._visible = false;

    var pDuration =
        (Pages.page && Pages.page.view.options.effects.spinner.hide) || 0,
      duration =
        ($.type(alternateDuration) === "number"
          ? alternateDuration
          : pDuration) || 0;

    this.element.stop(true).fadeOut(
      duration || 0,
      $.proxy(function() {
        this.detach();
        if (callback) callback();
      }, this)
    );
  },

  // center on the current page
  center: function() {
    if (!this.supported) return;

    // make sure dimensions are set
    if (!this._dimensions) this.updateDimensions();

    // for ui:fullclick we can already figure out the info height
    // before the content is loaded and center accordingly
    var page = Pages.page,
      iH = 0;
    if (page && page._ui === "fullclick") {
      page._whileVisible(function() {
        iH = page._getInfoHeight(Window._boxDimensions.width);
      });
    }

    this.element.css({
      top:
        Window._boxPosition.top +
        Window._boxDimensions.height * 0.5 -
        this._dimensions.height * 0.5 -
        iH * 0.5,
      left:
        Window._boxPosition.left +
        Window._boxDimensions.width * 0.5 -
        this._dimensions.width * 0.5
    });
  }
};

// API

// an unexposed object for internal use
var _Fresco = {
  _disabled: false,
  _fallback: true,

  initialize: function() {
    Window.initialize();
    if (!this._disabled) this.startDelegating();
  },

  // click delegation
  startDelegating: function() {
    if (this._delegateHandler) return;

    $(document.documentElement)
      .on(
        "click",
        ".fresco[href]",
        (this._delegateHandler = $.proxy(this.delegate, this))
      )
      // observe document clicks for XY setting, this makes sure that
      // positioning is correct when opening overflow with the API
      .on("click", (this._setClickXYHandler = $.proxy(this.setClickXY, this)));
  },

  stopDelegating: function() {
    if (!this._delegateHandler) return;

    $(document.documentElement)
      .off("click", ".fresco[href]", this._delegateHandler)
      .off("click", this._setClickXYHandler);

    this._setClickXYHandler = null;
    this._delegateHandler = null;
  },

  setClickXY: function(event) {
    Pages.setXY({
      x: event.pageX,
      y: event.pageY
    });
  },

  delegate: function(event) {
    if (this._disabled) return;

    event.stopPropagation();
    event.preventDefault();

    var element = event.currentTarget;

    this.setClickXY(event);

    _Fresco.show(element);
  },

  show: function(object) {
    if (this._disabled) {
      this.showFallback.apply(_Fresco, _slice.call(arguments));
      return;
    }

    var options = arguments[1] || {},
      position = arguments[2];

    if (arguments[1] && $.type(arguments[1]) === "number") {
      position = arguments[1];
      options = {};
    }

    var views = [],
      object_type,
      isElement = _.isElement(object);

    switch ((object_type = $.type(object))) {
      case "string":
      case "object":
        var view = new View(object, options),
          _dgo = "data-fresco-group-options",
          groupOptions = {};

        if (view.group) {
          // extend the entire group

          // if we have an element, look for other elements
          if (isElement) {
            var elements = $(
              '.fresco[data-fresco-group="' +
                $(object).attr("data-fresco-group") +
                '"]'
            );

            // find possible group options
            elements.filter("[" + _dgo + "]").each(function(i, element) {
              $.extend(
                groupOptions,
                eval("({" + ($(element).attr(_dgo) || "") + "})")
              );
            });

            elements.each(function(i, element) {
              // adjust the position if we find that the given object position
              if (!position && element === object) position = i + 1;
              views.push(
                new View(element, $.extend({}, groupOptions, options))
              );
            });
          }
        } else {
          if (isElement && $(object).is("[" + _dgo + "]")) {
            $.extend(
              groupOptions,
              eval("({" + ($(object).attr(_dgo) || "") + "})")
            );
            // reset the view with group options applied
            view = new View(object, $.extend({}, groupOptions, options));
          }

          views.push(view);
        }
        break;

      case "array":
        $.each(object, function(i, item) {
          var view = new View(item, options);
          views.push(view);
        });
        break;
    }

    // grouped settings
    var groupExtend = { grouped: { caption: false } },
      firstUI = views[0].options.ui;

    $.each(views, function(i, view) {
      // at least one view in the group has a caption
      if (view.caption) {
        groupExtend.grouped.caption = true;
      }

      // make sure all items in a group have the same ui
      if (i > 0 && view.options.ui !== firstUI) {
        view.options.ui = firstUI;
      }
    });
    // put the grouped settings on every view
    $.each(views, function(i, view) {
      view = $.extend(view, groupExtend);
    });

    // if we haven't found a position by now, load the first view
    if (!position || position < 1) {
      position = 1;
    }
    if (position > views.length) position = views.length;

    // if we've clicked an element, search for it in the currently open pagegroup
    var positionInAPG;
    if (
      isElement &&
      (positionInAPG = Pages.getPositionInActivePageGroup(object))
    ) {
      Window.setPosition(positionInAPG);
    } else {
      // otherwise start loading and open
      Window.load(views, position);
    }
  },

  showFallback: (function() {
    function getUrl(object) {
      var url,
        type = $.type(object);

      if (type === "string") {
        url = object;
      } else if (type === "array" && object[0]) {
        url = getUrl(object[0]);
      } else if (_.isElement(object) && $(object).attr("href")) {
        url = $(object).attr("href");
      } else if (object.url) {
        url = object.url;
      } else {
        url = false;
      }

      return url;
    }

    return function(object) {
      if (!this._fallback) return;
      var url = getUrl(object);
      if (url) window.location.href = url;
    };
  })()
};

$.extend(Fresco, {
  show: function(object) {
    _Fresco.show.apply(_Fresco, _slice.call(arguments));
    return this;
  },

  hide: function() {
    Window.hide();
    return this;
  },

  disable: function() {
    _Fresco.stopDelegating();
    _Fresco._disabled = true;
    return this;
  },

  enable: function() {
    _Fresco._disabled = false;
    _Fresco.startDelegating();
    return this;
  },

  fallback: function(fallback) {
    _Fresco._fallback = fallback;
    return this;
  },

  setDefaultSkin: function(skin) {
    Options.defaults.skin = skin;
    return this;
  }
});

// fallback for old browsers without full position:fixed support
if (
  // IE6
  (Browser.IE && Browser.IE < 7) ||
  // old Android
  // added a version check because Firefox on Android doesn't have a
  // version number above 4.2 anymore
  ($.type(Browser.Android) === "number" && Browser.Android < 3) ||
  // old WebKit
  (Browser.MobileSafari &&
    ($.type(Browser.WebKit) === "number" && Browser.WebKit < 533.18))
) {
  // we'll reset the show function
  _Fresco.show = _Fresco.showFallback;
}

// Thumbnails
var Thumbnails = {
  initialize: function(element) {
    this.element = element;

    this._thumbnails = [];
    this._orientation = "vertical";

    this._vars = {
      thumbnail: {},
      thumbnailFrame: {},
      thumbnails: {}
    };

    this.build();

    this.startObserving();
  },

  build: function() {
    this.element.append(
      (this.wrapper = $("<div>")
        .addClass("fr-thumbnails-wrapper")
        .append(
          (this._slider = $("<div>")
            .addClass("fr-thumbnails-slider")
            .append(
              (this._previous = $("<div>")
                .addClass("fr-thumbnails-side fr-thumbnails-side-previous")
                .append(
                  (this._previous_button = $("<div>")
                    .addClass("fr-thumbnails-side-button")
                    .append(
                      $("<div>").addClass(
                        "fr-thumbnails-side-button-background"
                      )
                    )
                    .append(
                      $("<div>").addClass("fr-thumbnails-side-button-icon")
                    ))
                ))
            )
            .append(
              (this._thumbs = $("<div>")
                .addClass("fr-thumbnails-thumbs")
                .append(
                  (this._slide = $("<div>").addClass("fr-thumbnails-slide"))
                ))
            )

            .append(
              (this._next = $("<div>")
                .addClass("fr-thumbnails-side fr-thumbnails-side-next")
                .append(
                  (this._next_button = $("<div>")
                    .addClass("fr-thumbnails-side-button")
                    .append(
                      $("<div>").addClass(
                        "fr-thumbnails-side-button-background"
                      )
                    )
                    .append(
                      $("<div>").addClass("fr-thumbnails-side-button-icon")
                    ))
                ))
            ))
        ))
    );
  },

  startObserving: function() {
    this._slider.delegate(
      ".fr-thumbnail",
      "click",
      $.proxy(function(event) {
        event.stopPropagation();

        var thumbnail = $(event.target).closest(".fr-thumbnail")[0];
        var position = thumbnail && $(thumbnail).data("fr-position");

        if (position) {
          this.setActive(position);
          Window.setPosition(position);
        }
      }, this)
    );

    // prevent bubbling on slider click, so you can safely click next to a thumbnail
    this._slider.bind("click", function(event) {
      event.stopPropagation();
    });

    // previous / next
    this._previous.bind("click", $.proxy(this.previousPage, this));
    this._next.bind("click", $.proxy(this.nextPage, this));
  },

  load: function(views) {
    // first clear out any previous thumbnails
    this.clear();

    // set orientation
    // it's always horizontal unless 1 view has vertical
    var orientation = "horizontal",
      disabled = false;
    $.each(
      views,
      $.proxy(function(i, view) {
        if (view.options.thumbnails === "vertical") {
          orientation = "vertical";
        }
        if (!view.options.thumbnails) disabled = true;
      }, this)
    );
    this.setOrientation(orientation);
    this._disabledGroup = disabled;

    $.each(
      views,
      $.proxy(function(i, view) {
        this._thumbnails.push(new Thumbnail(view, i + 1));
      }, this)
    );

    this.fitToViewport();
  },

  clear: function() {
    $.each(this._thumbnails, function(i, thumbnail) {
      thumbnail.remove();
    });

    this._thumbnails = [];
    this._position = -1;
    this._page = -1;
  },

  setOrientation: function(orientation) {
    if (this._orientation) {
      Window.element.removeClass("fr-thumbnails-" + this._orientation);
    }
    Window.element.addClass("fr-thumbnails-" + orientation);

    this._orientation = orientation;
  },

  // disable / enable
  disable: function() {
    Window.element
      .removeClass("fr-thumbnails-enabled")
      .addClass("fr-thumbnails-disabled");
    this._disabled = true;
  },
  enable: function() {
    Window.element
      .removeClass("fr-thumbnails-disabled")
      .addClass("fr-thumbnails-enabled");
    this._disabled = false;
  },
  enabled: function() {
    return !this._disabled;
  },
  disabled: function() {
    return this._disabled;
  },

  // update current dimension variables
  updateVars: function() {
    var win = Window.element,
      vars = this._vars,
      orientation = this._orientation,
      isHorizontal = orientation === "horizontal",
      _top = isHorizontal ? "top" : "left",
      _left = isHorizontal ? "left" : "top",
      _mbottom = isHorizontal ? "bottom" : "left",
      _mtop = isHorizontal ? "top" : "right",
      _width = isHorizontal ? "width" : "height",
      _height = isHorizontal ? "height" : "width",
      _swapZ = { left: "right", right: "left", top: "bottom", bottom: "top" };

    this.element.removeClass("fr-thumbnails-measured");
    var w_vis = win.is(":visible");
    if (!w_vis) win.show();

    // we have to observe visibility without having the disabled class on the window
    if (this.disabled()) this.enable();

    // exit early if we're not showing thumbnails
    if (
      !this.element.is(":visible") ||
      this._thumbnails.length < 2 ||
      this._disabledGroup
    ) {
      this.disable();

      // store some variables so getDimensions at least has these
      $.extend(this._vars.thumbnails, { width: 0, height: 0 });

      // show the window again
      if (!w_vis) win.hide();
      this.element.addClass("fr-thumbnails-measured");

      // exit early
      return;
    } else {
      // otherwise enable and continue filling variables
      this.enable();
    }

    var previous = this._previous,
      next = this._next,
      viewport = Bounds.viewport();

    // NOTE: All dimensions are stored as if the orientation is horizontal.
    // base the height of the thumbnail on the height of the element, minus padding
    var height = this.element["inner" + _.String.capitalize(_height)](),
      paddingTop = parseInt(this._thumbs.css("padding-" + _top)) || 0,
      thumbnailHeight = Math.max(height - paddingTop * 2, 0),
      paddingLeft = parseInt(this._thumbs.css("padding-" + _left)) || 0,
      marginTotal =
        (parseInt(this.element.css("margin-" + _mbottom)) || 0) +
        (parseInt(this.element.css("margin-" + _mtop)) || 0);

    $.extend(vars.thumbnails, {
      height: height + marginTotal, // we store as z just to make dimensioning later easier
      width: viewport[isHorizontal ? "width" : "height"],
      paddingTop: paddingTop
    });

    $.extend(vars.thumbnail, {
      height: thumbnailHeight,
      width: thumbnailHeight
    });

    $.extend(vars.thumbnailFrame, {
      width: thumbnailHeight + paddingLeft * 2,
      height: height
    });

    // previous/next
    vars.sides = {
      previous: {
        width: next["inner" + _.String.capitalize(_width)](),
        marginLeft: parseInt(previous.css("margin-" + _left)) || 0, // left
        marginRight: parseInt(previous.css("margin-" + _swapZ[_left])) || 0 // right
      },
      next: {
        width: next["inner" + _.String.capitalize(_width)](),
        marginLeft: parseInt(next.css("margin-" + _left)) || 0, // left
        marginRight: parseInt(next.css("margin-" + _swapZ[_left])) || 0 // right
      }
    };

    // how many pages and ipp
    // first try to fit all the thu
    var viewportWidth = viewport[_width], //$(window).width()
      thumbnailOuterWidth = vars.thumbnailFrame.width,
      thumbs = this._thumbnails.length;

    vars.thumbnails.width = viewportWidth;

    vars.sides.enabled = (thumbs * thumbnailOuterWidth) / viewportWidth > 1;

    // disable the sides if we have only 1 thumbnail
    var thumbsWidth = viewportWidth,
      vs = vars.sides,
      vsPrevious = vs.previous,
      vsNext = vs.next,
      sidesWidth =
        vsPrevious.marginLeft +
        vsPrevious.width +
        vsPrevious.marginRight +
        vsNext.marginLeft +
        vsNext.width +
        vsNext.marginRight;

    if (vars.sides.enabled) {
      thumbsWidth -= sidesWidth;
    }

    // lower the thumbnail width to a factor of a thumbnail
    thumbsWidth =
      Math.floor(thumbsWidth / thumbnailOuterWidth) * thumbnailOuterWidth;

    var totalThumbsWidth = thumbs * thumbnailOuterWidth;
    if (totalThumbsWidth < thumbsWidth) {
      thumbsWidth = totalThumbsWidth;
    }

    // now adust the wrapper to match that size
    var wrapperWidth = thumbsWidth + (vars.sides.enabled ? sidesWidth : 0);

    // items per page
    vars.ipp = Math.round(thumbsWidth / thumbnailOuterWidth); //Math.max(thumbsWidth / tw, 1); // at least one

    this._mode = "page";
    if (vars.ipp <= 1) {
      // recalculate width
      thumbsWidth = viewportWidth;
      wrapperWidth = viewportWidth;
      vars.sides.enabled = false;
      this._mode = "center";
    }

    // now find out the pages
    vars.pages = Math.ceil((thumbs * thumbnailOuterWidth) / thumbsWidth);

    vars.wrapper = {
      width: wrapperWidth + 1, // IE fix
      height: height
    };

    vars.thumbs = {
      width: thumbsWidth,
      height: height
    };

    vars.slide = {
      width: thumbs * thumbnailOuterWidth + 1, // IE fix
      height: height
    };

    if (!w_vis) win.hide();
    this.element.addClass("fr-thumbnails-measured");
  },

  hide: function() {
    this.disable();
    this.thumbnails.hide();
    this._visible = false;
  },

  getDimensions: function() {
    var isHorizontal = this._orientation === "horizontal";

    return {
      width: isHorizontal
        ? this._vars.thumbnails.width
        : this._vars.thumbnails.height,
      height: isHorizontal
        ? this._vars.thumbnails.height
        : this._vars.thumbnails.width
    };
  },

  // resize
  fitToViewport: function() {
    // make sure vars are set so we can use them
    this.updateVars();
    if (this.disabled()) return;

    var vars = $.extend({}, this._vars),
      isHorizontal = this._orientation === "horizontal";

    // individual thumbnails
    $.each(this._thumbnails, function(i, thumbnail) {
      thumbnail.resize();
    });

    // show hide sides
    this._previous[vars.sides.enabled ? "show" : "hide"]();
    this._next[vars.sides.enabled ? "show" : "hide"]();

    this._thumbs.css({
      width: vars.thumbs[isHorizontal ? "width" : "height"],
      height: vars.thumbs[isHorizontal ? "height" : "width"]
    });

    this._slide.css({
      width: vars.slide[isHorizontal ? "width" : "height"],
      height: vars.slide[isHorizontal ? "height" : "width"]
    });

    var wrapperCSS = {
      width: vars.wrapper[isHorizontal ? "width" : "height"],
      height: vars.wrapper[isHorizontal ? "height" : "width"]
    };
    wrapperCSS["margin-" + (isHorizontal ? "left" : "top")] =
      Math.round(-0.5 * vars.wrapper.width) + "px";
    wrapperCSS["margin-" + (!isHorizontal ? "left" : "top")] = 0;
    this.wrapper.css(wrapperCSS);

    // move to the correct position instantly
    if (this._position) {
      this.moveTo(this._position, true);
    }
  },

  moveToPage: function(page) {
    if (page < 1 || page > this._vars.pages || page === this._page) return;

    var position = this._vars.ipp * (page - 1) + 1;

    this.moveTo(position);
  },

  previousPage: function() {
    this.moveToPage(this._page - 1);
  },

  nextPage: function() {
    this.moveToPage(this._page + 1);
  },

  show: function(position) {
    // move instantly when the position wasn't set before
    var instant = this._position < 0;

    // make sure position is available
    if (position < 1) position = 1;
    var ic = this._thumbnails.length;
    if (position > ic) position = ic;

    // set it
    this._position = position;

    this.setActive(position);

    // don't move if we are using page mode and are on this page
    if (
      this._mode === "page" &&
      this._page === Math.ceil(position / this._vars.ipp)
    )
      return;

    this.moveTo(position, instant);
  },

  moveTo: function(position, instant) {
    this.updateVars();
    if (this.disabled()) return;

    var left,
      isHorizontal = this._orientation === "horizontal",
      vp_z = Bounds.viewport()[isHorizontal ? "width" : "height"],
      vp_center = vp_z * 0.5,
      t_width = this._vars.thumbnailFrame.width,
      page;

    if (this._mode === "page") {
      page = Math.ceil(position / this._vars.ipp);

      // set the page
      this._page = page;

      left = -1 * (t_width * (this._page - 1) * this._vars.ipp);

      // disabled states on buttons
      var disabled = "fr-thumbnails-side-button-disabled";
      this._previous_button[(page < 2 ? "add" : "remove") + "Class"](disabled);
      this._next_button[
        (page >= this._vars.pages ? "add" : "remove") + "Class"
      ](disabled);
    } else {
      // center
      left = vp_center + -1 * (t_width * (position - 1) + t_width * 0.5);
    }

    page = Pages.page;

    // now move there
    var resetCSS = {},
      animateCSS = {};
    resetCSS[!isHorizontal ? "left" : "top"] = 0; // zero out the other offset in case of switching orientation
    animateCSS[isHorizontal ? "left" : "top"] = left + "px";

    this._slide
      .stop(true)
      .css(resetCSS)
      .animate(
        animateCSS,
        instant
          ? 0
          : page
          ? page.view.options.effects.thumbnails.slide || 0
          : 0,
        $.proxy(function() {
          // load all thumbnails on this page
          this.loadCurrentPage();
        }, this)
      );
  },

  loadCurrentPage: function() {
    var min, max;

    // load protection, don't load when there's no position or width on the thumbnail
    if (
      !this._position ||
      !this._vars.thumbnailFrame.width ||
      this._thumbnails.length < 1
    )
      return;

    if (this._mode === "page") {
      // load the thumbnail on the current page
      if (this._page < 1) return;

      min = (this._page - 1) * this._vars.ipp + 1;
      max = Math.min(min - 1 + this._vars.ipp, this._thumbnails.length);
    } else {
      // mode is 'center', load the thumbnails within the viewport
      var thumbnail_count = Math.ceil(
        this._vars.thumbnails.width / this._vars.thumbnailFrame.width
      );

      min = Math.max(
        Math.floor(Math.max(this._position - thumbnail_count * 0.5, 0)),
        1
      );
      max = Math.ceil(Math.min(this._position + thumbnail_count * 0.5));

      if (this._thumbnails.length < max) max = this._thumbnails.length;
    }

    // load the thumbnails
    for (var i = min; i <= max; i++) {
      this._thumbnails[i - 1].load();
    }
  },

  // only the active class
  setActive: function(position) {
    this._slide.find(".fr-thumbnail-active").removeClass("fr-thumbnail-active");

    var thumbnail = position && this._thumbnails[position - 1];
    if (thumbnail) thumbnail.activate();
  },

  refresh: function() {
    if (this._position) this.setPosition(this._position);
  }
};

// Thumbnail
function Thumbnail() {
  this.initialize.apply(this, _slice.call(arguments));
}
$.extend(Thumbnail.prototype, {
  initialize: function(view, position) {
    this.view = view;

    //this._dimensions = {};
    this._position = position;

    this.preBuild();
  },

  preBuild: function() {
    this.thumbnail = $("<div>")
      .addClass("fr-thumbnail")
      .data("fr-position", this._position);
  },

  build: function() {
    if (this.thumbnailFrame) return;

    var options = this.view.options;

    Thumbnails._slide.append(
      (this.thumbnailFrame = $("<div>")
        .addClass("fr-thumbnail-frame")
        .append(
          this.thumbnail.append(
            (this.thumbnailWrapper = $("<div>").addClass(
              "fr-thumbnail-wrapper"
            ))
          )
        ))
    );

    if (this.view.type === "image") {
      this.thumbnail.addClass("fr-load-thumbnail").data("thumbnail", {
        view: this.view,
        src: options.thumbnail || this.view.url
      });
    }

    // icon
    var icon = options.thumbnail && options.thumbnail.icon;
    if (icon) {
      this.thumbnail.append(
        $("<div>").addClass("fr-thumbnail-icon fr-thumbnail-icon-" + icon)
      );
    }

    // overlay
    var overlay;
    this.thumbnail.append(
      (overlay = $("<div>")
        .addClass("fr-thumbnail-overlay")
        .append($("<div>").addClass("fr-thumbnail-overlay-background"))
        .append(
          (this.loading = $("<div>")
            .addClass("fr-thumbnail-loading")
            .append($("<div>").addClass("fr-thumbnail-loading-background"))
            .append(
              (this.spinner = $("<div>")
                .addClass("fr-thumbnail-spinner")
                .hide()
                .append($("<div>").addClass("fr-thumbnail-spinner-spin")))
            ))
        )
        .append($("<div>").addClass("fr-thumbnail-overlay-border")))
    );

    this.thumbnail.append($("<div>").addClass("fr-thumbnail-state"));

    this.resize();
  },

  remove: function() {
    if (this.thumbnailFrame) {
      this.thumbnailFrame.remove();
      this.thumbnailFrame = null;
      this.image = null;
    }

    if (this.ready) {
      this.ready.abort();
      this.ready = null;
    }

    if (this.vimeoThumbnail) {
      this.vimeoThumbnail.abort();
      this.vimeoThumbnail = null;
    }

    this._loading = false;
    this._removed = true;

    // clean up
    this.view = null;

    this._clearDelay();
  },

  load: function() {
    if (this._loaded || this._loading || this._removed) return;

    if (!this.thumbnailWrapper) this.build();

    this._loading = true;

    var thumbnail = this.view.options.thumbnail;
    var url =
      thumbnail && $.type(thumbnail) === "boolean"
        ? this.view.url
        : thumbnail || this.view.url;

    // store this now so we can modify it
    this._url = url;

    // vimeo needs an extra wrapper with a JSONP request
    if (url) {
      if (this.view.type === "vimeo") {
        if (url === thumbnail) {
          this._url = url;
          this._load(this._url);
        } else {
          switch (this.view.type) {
            case "vimeo":
              this.vimeoThumbnail = new VimeoThumbnail(
                this.view.url,
                $.proxy(function(url) {
                  this._url = url;
                  this._load(url);
                }, this),
                $.proxy(function() {
                  this._error();
                }, this)
              );
              break;
          }
        }
      } else {
        // youtube
        this._load(this._url);
      }
    }
  },

  activate: function() {
    this.thumbnail.addClass("fr-thumbnail-active");
  },

  _load: function(url) {
    this.thumbnailWrapper.prepend(
      (this.image = $("<img>")
        .addClass("fr-thumbnail-image")
        .attr({ src: url })
        .css({ opacity: 0.0001 }))
    );

    this.fadeInSpinner();

    this.ready = new ImageReady(
      this.image[0],
      $.proxy(function(imageready) {
        var img = imageready.img;

        // if the thumbnail has been removed before we finish,
        // or if the _loading has been cancelled,
        // just quit
        if (!this.thumbnailFrame || !this._loading) return;

        this._loaded = true;
        this._loading = false;

        // store dimensions, used by resize
        this._dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight
        };

        // set dimensions after having loaded
        this.resize();

        // fadeout spinner
        this.show();
      }, this),
      $.proxy(function() {
        this._error();
      }, this),
      {
        method: this.view.options.loadedMethod
      }
    );
  },

  // error callback
  _error: function() {
    this._loaded = true;
    this._loading = false;

    this.thumbnail.addClass("fr-thumbnail-error");
    if (this.image) {
      this.image.hide();
    }
    this.thumbnailWrapper.append($("<div>").addClass("fr-thumbnail-image"));
    this.show();
  },

  fadeInSpinner: function() {
    if (!Spinner.supported || !this.view.options.spinner) return;

    // clear possible delay
    this._clearDelay();

    var fx = this.view.options.effects.thumbnail;

    this._delay = setTimeout(
      $.proxy(function() {
        this.spinner.stop(true).fadeTo(fx.show || 0, 1);
      }, this),
      this.view.options.spinnerDelay || 0
    );
  },

  // fades out the loading block
  // which could also contain a spinner
  show: function() {
    // clear possible delay
    this._clearDelay();

    var fx = this.view.options.effects.thumbnail;

    this.loading
      .stop(true)
      .delay(fx.delay)
      .fadeTo(fx.show, 0);
  },

  _clearDelay: function() {
    if (this._delay) {
      clearTimeout(this._delay);
      this._delay = null;
    }
  },

  // center image based on current dimensions
  resize: function() {
    if (!this.thumbnailFrame) return;

    var isHorizontal = Thumbnails._orientation === "horizontal";

    // frame
    this.thumbnailFrame.css({
      width: Thumbnails._vars.thumbnailFrame[isHorizontal ? "width" : "height"],
      height: Thumbnails._vars.thumbnailFrame[isHorizontal ? "height" : "width"]
    });

    // position frame
    this.thumbnailFrame.css({
      top: isHorizontal
        ? 0
        : Thumbnails._vars.thumbnailFrame.width * (this._position - 1),
      left: isHorizontal
        ? Thumbnails._vars.thumbnailFrame.width * (this._position - 1)
        : 0
    });

    if (!this.thumbnailWrapper) return;

    // resize the wrapper
    var thumbnail = Thumbnails._vars.thumbnail;
    this.thumbnail.css({
      width: thumbnail.width,
      height: thumbnail.height,
      "margin-top": Math.round(-0.5 * thumbnail.height),
      "margin-left": Math.round(-0.5 * thumbnail.width),
      "margin-bottom": 0,
      "margin-right": 0
    });

    // if there's no image, don't resize the rest
    if (!this._dimensions) return;

    var bounds = {
      width: thumbnail.width, //this.thumbnail.innerWidth(),
      height: thumbnail.height //this.thumbnail.innerHeight()
    };

    var maxZ = Math.max(bounds.width, bounds.height);

    var dimensions;

    var image = $.extend({}, this._dimensions);

    if (image.width > bounds.width && image.height > bounds.height) {
      dimensions = Fit.within(bounds, image);

      // if the dimensions are smaller than bounds, increase them
      var scaleX = 1,
        scaleY = 1;
      if (dimensions.width < bounds.width) {
        scaleX = bounds.width / dimensions.width;
      }
      if (dimensions.height < bounds.height) {
        scaleY = bounds.height / dimensions.height;
      }

      var scale = Math.max(scaleX, scaleY);
      if (scale > 1) {
        dimensions.width *= scale;
        dimensions.height *= scale;
      }

      $.each("width height".split(" "), function(i, z) {
        dimensions[z] = Math.round(dimensions[z]); // .5 for anti-aliasing
      });
    } else {
      dimensions = Fit.within(
        this._dimensions,
        image.width < bounds.width || image.height < bounds.height
          ? { width: maxZ, height: maxZ }
          : bounds
      );
    }

    var x = Math.round(bounds.width * 0.5 - dimensions.width * 0.5),
      y = Math.round(bounds.height * 0.5 - dimensions.height * 0.5);

    this.image
      .removeAttr("style") // remove the opacity
      .css($.extend({}, dimensions, { top: y, left: x }));
  }
});

// UI Modes
var UI = {
  _modes: ["fullclick", "outside", "inside"],
  _ui: false,
  _validClickTargetSelector: [
    ".fr-content-element",
    ".fr-content",
    ".fr-content > .fr-stroke",
    ".fr-content > .fr-stroke .fr-stroke-color"
  ].join(", "),

  initialize: function(element) {
    // initialize the 3 different UI types
    $.each(
      this._modes,
      $.proxy(function(i, mode) {
        this[mode].initialize();
      }, this)
    );

    // start with hidden ui
    Window.element.addClass("fr-ui-inside-hidden fr-ui-fullclick-hidden");
  },

  // set the ui mode, this only changes the class and with that visibility
  set: function(ui) {
    if (this._ui) {
      Window.element.removeClass("fr-window-ui-" + this._ui);
      Overlay.element.removeClass("fr-overlay-ui-" + this._ui);
    }
    Window.element.addClass("fr-window-ui-" + ui);
    Overlay.element.addClass("fr-overlay-ui-" + ui);

    // if we've switched ui's disable one and enable the other
    if (this._enabled && this._ui && this._ui !== ui) {
      this[this._ui].disable();
      this[ui].enable();

      // also show the UI when switched
      UI[ui].show();

      // stop timers on all other ui modes instantly
      //this.setActiveTimers(ui);
    }

    this._ui = ui;
  },

  // show ui for touch onresize
  _onWindowResize: function() {
    if (Support.mobileTouch) this.show();
  },

  // enable the currently set ui, disable all others
  enable: function() {
    $.each(
      this._modes,
      $.proxy(function(i, mode) {
        UI[mode][mode === this._ui ? "enable" : "disable"]();
      }, this)
    );

    this._enabled = true;
  },

  disable: function() {
    $.each(
      this._modes,
      $.proxy(function(i, mode) {
        UI[mode].disable();
      }, this)
    );

    this._enabled = false;
  },

  adjustPrevNext: function(callback, alternateDuration) {
    // only fullclick adjusts sides
    UI[this._ui].adjustPrevNext(callback, alternateDuration);
  },

  show: function(callback, alternateDuration) {
    UI[this._ui].show(callback, alternateDuration);

    //this.setActiveTimers(this._ui);
  },

  hide: function(callback, alternateDuration) {
    UI[this._ui].hide(callback, alternateDuration);
  },

  // called on Window.reset
  reset: function() {
    $.each(
      this._modes,
      $.proxy(function(i, mode) {
        UI[mode].reset();
      }, this)
    );
  },

  update: function() {
    var page = Pages.page;
    if (!page) return;

    this.set(page._ui);
  } /*,

  // sets the ui to use timers for and disabled timers
  // on all other ui modes
  setActiveTimers: function(ui) {
    $.each(this._modes, function(i, mode) {
      if (mode != ui) UI[mode].clearTimer();
    });
  }*/
};

UI.fullclick = {
  initialize: function() {
    this.build();

    this._scrollLeft = -1;
  },

  build: function() {
    Window._box
      .append(
        (this._previous = $("<div>")
          .addClass(
            "fr-side fr-side-previous fr-side-previous-fullclick fr-toggle-ui"
          )
          .append(
            $("<div>")
              .addClass("fr-side-button")
              .append($("<div>").addClass("fr-side-button-background"))
              .append($("<div>").addClass("fr-side-button-icon"))
          ))
      )
      .append(
        (this._next = $("<div>")
          .addClass("fr-side fr-side-next fr-side-next-fullclick fr-toggle-ui")
          .append(
            $("<div>")
              .addClass("fr-side-button")
              .append($("<div>").addClass("fr-side-button-background"))
              .append($("<div>").addClass("fr-side-button-icon"))
          ))
      )

      // close
      .append(
        (this._close = $("<div>")
          .addClass("fr-close fr-close-fullclick")
          .append($("<div>").addClass("fr-close-background"))
          .append($("<div>").addClass("fr-close-icon")))
      );

    // IE7 has a bug that causes multiple UI buttons from showing up
    // starting hidden fixes it
    if (Browser.IE && Browser.IE <= 7) {
      this._previous
        .add(this._next)
        .add(this._close)
        .hide();
    }

    // events
    this._close.on(
      "click",
      $.proxy(function(event) {
        event.preventDefault();
        Window.hide();
      }, this)
    );

    this._previous.on(
      "click",
      $.proxy(function(event) {
        Window.previous();
        this._onMouseMove(event); // update cursor
      }, this)
    );

    this._next.on(
      "click",
      $.proxy(function(event) {
        Window.next();
        this._onMouseMove(event); // update cursor
      }, this)
    );
  },

  enable: function() {
    this.bind();
  },

  disable: function() {
    this.unbind();
  },

  reset: function() {
    Window.timers.clear("ui-fullclick");

    // clear cached mousemove
    this._x = -1;
    this._y = -1;

    this._scrollLeft = -1;

    this.resetPrevNext();

    // reset the classes by faking a mouseleave
    this._onMouseLeave();
  },

  resetPrevNext: function() {
    var buttons = this._previous.add(this._next);
    buttons.stop(true).removeAttr("style");
  },

  // events
  bind: function() {
    // no need to bind twice
    if (this._onMouseUpHandler) return;

    this.unbind();

    // clicks
    Window._pages.on(
      "mouseup",
      ".fr-container",
      (this._onMouseUpHandler = $.proxy(this._onMouseUp, this))
    );

    // track <> only on desktop
    if (!Support.mobileTouch) {
      Window.element
        .on("mouseenter", (this._showHandler = $.proxy(this.show, this)))
        .on("mouseleave", (this._hideHandler = $.proxy(this.hide, this)));

      Window.element.on(
        "mousemove",
        (this._mousemoveHandler = $.proxy(function(event) {
          // Chrome has a bug that triggers mousemove events incorrectly
          // we have to work around this by comparing cursor positions
          // so only true mousemove events pass through:
          // https://code.google.com/p/chromium/issues/detail?id=420032
          var x = event.pageX,
            y = event.pageY;

          if (this._hoveringSideButton || (y === this._y && x === this._x)) {
            return;
          }

          // cache x/y
          this._x = x;
          this._y = y;

          this.show();
          this.startTimer();
        }, this))
      );

      // delegate <> mousemove/click states
      Window._pages
        .on(
          "mousemove",
          ".fr-container",
          (this._onMouseMoveHandler = $.proxy(this._onMouseMove, this))
        )
        .on(
          "mouseleave",
          ".fr-container",
          (this._onMouseLeaveHandler = $.proxy(this._onMouseLeave, this))
        )
        .on(
          "mouseenter",
          ".fr-container",
          (this._onMouseEnterHandler = $.proxy(this._onMouseEnter, this))
        );

      // delegate moving onto the <> buttons
      // keeping the mouse on them should keep the buttons visible
      Window.element
        .on(
          "mouseenter",
          ".fr-side",
          (this._onSideMouseEnterHandler = $.proxy(
            this._onSideMouseEnter,
            this
          ))
        )
        .on(
          "mouseleave",
          ".fr-side",
          (this._onSideMouseLeaveHandler = $.proxy(
            this._onSideMouseLeave,
            this
          ))
        );

      $(window).on(
        "scroll",
        (this._onScrollHandler = $.proxy(this._onScroll, this))
      );
    }
  },

  unbind: function() {
    if (!this._onMouseUpHandler) return;

    // clicks
    Window._pages.off("mouseup", ".fr-container", this._onMouseUpHandler);
    this._onMouseUpHandler = null;

    if (this._showHandler) {
      Window.element
        .off("mouseenter", this._showHandler)
        .off("mouseleave", this._hideHandler)
        .off("mousemove", this._mousemoveHandler);

      Window._pages
        .off("mousemove", ".fr-container", this._onMouseMoveHandler)
        .off("mouseleave", ".fr-container", this._onMouseLeaveHandler)
        .off("mouseenter", ".fr-container", this._onMouseEnterHandler);

      Window.element
        .off("mouseenter", ".fr-side", this._onSideMouseEnterHandler)
        .off("mouseleave", ".fr-side", this._onSideMouseLeaveHandler);

      $(window).off("scroll", this._onScrollHandler);

      this._showHandler = null;
    }
  },

  adjustPrevNext: function(callback, alternateDuration) {
    var page = Pages.page;
    if (!page) {
      if (callback) callback();
      return;
    }

    // offset <>
    var windowVisible = Window.element.is(":visible");
    if (!windowVisible) Window.element.show();

    var pRestoreStyle = this._previous.attr("style");
    this._previous.removeAttr("style");
    var pnMarginTop = parseInt(this._previous.css("margin-top")); // the original margin top
    this._previous.attr({ style: pRestoreStyle });

    if (!windowVisible) Window.element.hide();

    // only the fullclick UI changes previous/next position based on info height
    var iH = page._infoHeight || 0;

    var buttons = this._previous.add(this._next),
      css = { "margin-top": pnMarginTop - iH * 0.5 };

    var duration =
      $.type(alternateDuration) === "number"
        ? alternateDuration
        : (Pages.page && Pages.page.view.options.effects.content.show) || 0;

    // adjust <> instantly when opening
    if (this.opening) duration = 0;

    buttons.stop(true).animate(css, duration, callback);

    // disabled states
    this._previous[(Window.mayPrevious() ? "remove" : "add") + "Class"](
      "fr-side-disabled"
    );
    this._next[(Window.mayNext() ? "remove" : "add") + "Class"](
      "fr-side-disabled"
    );

    // hide buttons for single content
    buttons[(page._total < 2 ? "add" : "remove") + "Class"]("fr-side-hidden");

    if (callback) callback();
  },

  _onScroll: function() {
    this._scrollLeft = $(window).scrollLeft();
  },

  _onMouseMove: function(event) {
    // no need for this on mobile-touch
    if (Support.mobileTouch) return;

    var side = this._getEventSide(event),
      Side = _.String.capitalize(side),
      mayClickHoveringSide = side ? Window["may" + Side]() : false;

    // prevent doing this on every mousemove
    if (
      side === this._hoveringSide &&
      mayClickHoveringSide === this._mayClickHoveringSide
    ) {
      return;
    }
    this._hoveringSide = side;
    this._mayClickHoveringSide = mayClickHoveringSide;

    Window._box[(mayClickHoveringSide ? "add" : "remove") + "Class"](
      "fr-hovering-clickable"
    );

    // previous
    switch (side) {
      case "previous":
        Window._box
          .addClass("fr-hovering-previous")
          .removeClass("fr-hovering-next");
        break;
      case "next":
        Window._box
          .addClass("fr-hovering-next")
          .removeClass("fr-hovering-previous");
        break;
    }
  },

  _onMouseLeave: function(event) {
    Window._box.removeClass(
      "fr-hovering-clickable fr-hovering-previous fr-hovering-next"
    );
    this._hoveringSide = false;
  },

  // click == mouseup
  // We use mouseup instead of click because it is more reliable.
  // Multiple clicks on images coming in and out of view can be
  // seen as triggering a selection, which doesn't trigger a click
  // event, but mouseup always fires.
  _onMouseUp: function(event) {
    // don't respond to middle/right clicks (2 & 3)
    if (event.which > 1) {
      return;
    }

    // close when needed
    // NOTE: we only do this for 1 item for fullclick
    // not for onClick:'close' since the arrow moves around
    // making it possible to accidentally close
    if (Pages.pages.length === 1) {
      Window.hide();
      return;
    }

    var side = this._getEventSide(event);
    Window[side]();

    // adjust cursor, doesn't work with effects
    // but _onMouseEnter is used to fix that
    this._onMouseMove(event);
  },

  _onMouseEnter: function(event) {
    // this solves clicking an area and not having an updating cursor
    // when not moving cursor after click. When an overlapping page comes into view
    // it'll trigger a mouseenter after the mouseout on the disappearing page
    // that would normally remove the clickable class
    this._onMouseMove(event);
  },

  _getEventSide: function(event) {
    var scrollLeft =
        this._scrollLeft > -1
          ? this._scrollLeft
          : (this._scrollLeft = $(window).scrollLeft()),
      left = event.pageX - Window._boxPosition.left - this._scrollLeft,
      width = Window._boxDimensions.width;

    return left < 0.5 * width ? "previous" : "next";
  },

  _onSideMouseEnter: function(event) {
    this._hoveringSideButton = true;
    this._hoveringSide = this._getEventSide(event);
    this._mayClickHoveringSide = Window[
      "may" + _.String.capitalize(this._hoveringSide)
    ]();
    this.clearTimer();
  },

  _onSideMouseLeave: function(event) {
    this._hoveringSideButton = false;
    this._hoveringSide = false;
    this._mayClickHoveringSide = false;
    this.startTimer();
  },

  show: function(callback) {
    if (this._visible) {
      // still clear a timer that could possible trigger hide
      // and start a new one
      this.startTimer();

      if ($.type(callback) === "function") callback();
      return;
    }

    this._visible = true;

    this.startTimer();

    Window.element
      .addClass("fr-visible-fullclick-ui")
      .removeClass("fr-hidden-fullclick-ui");

    if (Browser.IE && Browser.IE <= 7) {
      this._previous
        .add(this._next)
        .add(this._close)
        .show();
    }

    if ($.type(callback) === "function") callback();
  },

  hide: function(callback) {
    // never hide the ui for video
    var type = Pages.page && Pages.page.view.type;
    if (!this._visible || (type && (type === "youtube" || type === "vimeo"))) {
      if ($.type(callback) === "function") callback();
      return;
    }

    this._visible = false;

    Window.element
      .removeClass("fr-visible-fullclick-ui")
      .addClass("fr-hidden-fullclick-ui");

    if ($.type(callback) === "function") callback();
  },

  // UI Timer
  // not used on mobile-touch based devices
  clearTimer: function() {
    if (Support.mobileTouch) return;

    Window.timers.clear("ui-fullclick");
  },

  startTimer: function() {
    if (Support.mobileTouch) return;

    this.clearTimer();
    Window.timers.set(
      "ui-fullclick",
      $.proxy(function() {
        this.hide();
      }, this),
      Window.view ? Window.view.options.uiDelay : 0
    );
  }
};

UI.inside = {
  initialize: function() {},

  enable: function() {
    this.bind();
  },

  disable: function() {
    this.unbind();
  },

  bind: function() {
    // no need to bind twice
    if (this._onMouseUpHandler) return;

    this.unbind();

    // clicks
    Window._pages.on(
      "mouseup",
      ".fr-content",
      (this._onMouseUpHandler = $.proxy(this._onMouseUp, this))
    );

    // buttons
    Window._pages
      .on(
        "click",
        ".fr-content .fr-close",
        $.proxy(function(event) {
          event.preventDefault();
          Window.hide();
        }, this)
      )
      .on(
        "click",
        ".fr-content .fr-side-previous",
        $.proxy(function(event) {
          Window.previous();
          this._onMouseMove(event); // update cursor
        }, this)
      )
      .on(
        "click",
        ".fr-content .fr-side-next",
        $.proxy(function(event) {
          Window.next();
          this._onMouseMove(event); // update cursor
        }, this)
      );

    // overlay
    Window.element.on(
      "click",
      ".fr-container, .fr-thumbnails, .fr-thumbnails-wrapper",
      (this._delegateOverlayCloseHandler = $.proxy(
        this._delegateOverlayClose,
        this
      ))
    );

    // track <> only on desktop
    if (!Support.mobileTouch) {
      Window.element
        .on(
          "mouseenter",
          ".fr-content",
          (this._showHandler = $.proxy(this.show, this))
        )
        .on(
          "mouseleave",
          ".fr-content",
          (this._hideHandler = $.proxy(this.hide, this))
        );

      Window.element.on(
        "mousemove",
        ".fr-content",
        (this._mousemoveHandler = $.proxy(function(event) {
          // Chrome has a bug that triggers mousemove events incorrectly
          // we have to work around this by comparing cursor positions
          // so only true mousemove events pass through:
          // https://code.google.com/p/chromium/issues/detail?id=420032
          var x = event.pageX,
            y = event.pageY;

          if (this._hoveringSideButton || (y === this._y && x === this._x)) {
            return;
          }

          // cache x/y
          this._x = x;
          this._y = y;

          this.show();
          this.startTimer();
        }, this))
      );

      // block mousemove on caption and info
      Window._pages.on(
        "mousemove",
        ".fr-info, .fr-close",
        $.proxy(function(event) {
          event.stopPropagation();
          this._onMouseLeave(event);
        }, this)
      );

      // hovering info shouldn't hide it
      // mousemove is used here since mouseenter would conflict with
      // mouseenter on the content triggering later. That would make it
      // impossible to enter the content on the info box and keep it
      // visible since the timer would start again on the 2nd mouseenter.
      Window._pages.on(
        "mousemove",
        ".fr-info",
        $.proxy(function() {
          this.clearTimer();
        }, this)
      );

      // delegate <> mousemove/click states
      Window._pages
        .on(
          "mousemove",
          ".fr-content",
          (this._onMouseMoveHandler = $.proxy(this._onMouseMove, this))
        )
        .on(
          "mouseleave",
          ".fr-content",
          (this._onMouseLeaveHandler = $.proxy(this._onMouseLeave, this))
        )
        .on(
          "mouseenter",
          ".fr-content",
          (this._onMouseEnterHandler = $.proxy(this._onMouseEnter, this))
        );

      // delegate moving onto the <> buttons
      // keeping the mouse on them should keep the buttons visible
      Window.element
        .on(
          "mouseenter",
          ".fr-side",
          (this._onSideMouseEnterHandler = $.proxy(
            this._onSideMouseEnter,
            this
          ))
        )
        .on(
          "mouseleave",
          ".fr-side",
          (this._onSideMouseLeaveHandler = $.proxy(
            this._onSideMouseLeave,
            this
          ))
        );

      $(window).on(
        "scroll",
        (this._onScrollHandler = $.proxy(this._onScroll, this))
      );
    }
  },

  unbind: function() {
    if (!this._onMouseUpHandler) return;

    // clicks
    Window._pages.off("mouseup", ".fr-content", this._onMouseUpHandler);
    this._onMouseUpHandler = null;

    // buttons
    Window._pages
      .off("click", ".fr-content .fr-close")
      .off("click", ".fr-content .fr-side-previous")
      .off("click", ".fr-content .fr-side-next");

    // overlay
    Window.element.off(
      "click",
      ".fr-container, .fr-thumbnails, .fr-thumbnails-wrapper",
      this._delegateOverlayCloseHandler
    );

    if (this._showHandler) {
      Window.element
        .off("mouseenter", ".fr-content", this._showHandler)
        .off("mouseleave", ".fr-content", this._hideHandler)
        .off("mousemove", ".fr-content", this._mousemoveHandler);

      // blocked mousemove
      Window._pages.off("mousemove", ".fr-info, .fr-close");

      // info
      Window._pages.off("mousemove", ".fr-info");

      Window._pages
        .off("mousemove", ".fr-content-element", this._onMouseMoveHandler)
        .off("mouseleave", ".fr-content", this._onMouseLeaveHandler)
        .off("mouseenter", ".fr-content", this._onMouseEnterHandler);

      Window.element
        .off("mouseenter", ".fr-side", this._onSideMouseEnterHandler)
        .off("mouseleave", ".fr-side", this._onSideMouseLeaveHandler);

      $(window).off("scroll", this._onScrollHandler);

      this._showHandler = null;
    }
  },

  reset: function() {
    Window.timers.clear("ui-fullclick");

    // clear cached mousemove
    this._x = -1;
    this._y = -1;

    this._scrollLeft = -1;
    this._hoveringSide = false;

    // reset the classes by faking a mouseleave
    this._onMouseLeave();
  },

  adjustPrevNext: function(callback) {
    if (callback) callback();
  },

  _onScroll: function() {
    this._scrollLeft = $(window).scrollLeft();
  },

  _delegateOverlayClose: function(event) {
    var page = Pages.page;
    if (page && page.view.options.overlay && !page.view.options.overlay.close)
      return;

    // we don't want to respond to clicks on children
    if (
      !$(event.target).is(
        ".fr-container, .fr-thumbnails, .fr-thumbnails-wrapper"
      )
    )
      return;

    event.preventDefault();
    event.stopPropagation();
    Window.hide();
  },

  _onMouseMove: function(event) {
    // no need for this on mobile-touch
    if (Support.mobileTouch) return;

    var side = this._getEventSide(event),
      Side = _.String.capitalize(side),
      mayClickHoveringSide = side ? Window["may" + Side]() : false;

    // clear out side when onClick:'close'
    if (
      Pages.pages.length === 1 ||
      (Pages.page && Pages.page.view.options.onClick === "close")
    ) {
      side = false;
    }

    // prevent doing this on every mousemove
    if (
      side === this._hoveringSide &&
      mayClickHoveringSide === this._mayClickHoveringSide
    ) {
      return;
    }
    this._hoveringSide = side;
    this._mayClickHoveringSide = mayClickHoveringSide;

    if (side) {
      Window._box[(mayClickHoveringSide ? "add" : "remove") + "Class"](
        "fr-hovering-clickable"
      );

      // previous
      switch (side) {
        case "previous":
          Window._box
            .addClass("fr-hovering-previous")
            .removeClass("fr-hovering-next");
          break;
        case "next":
          Window._box
            .addClass("fr-hovering-next")
            .removeClass("fr-hovering-previous");
          break;
      }
    } else {
      Window._box.removeClass(
        "fr-hovering-clickable fr-hovering-previous fr-hovering-next"
      );
    }
  },

  _onMouseLeave: function(event) {
    Window._box.removeClass(
      "fr-hovering-clickable fr-hovering-previous fr-hovering-next"
    );
    this._hoveringSide = false;
  },

  // click == mouseup
  // We use mouseup instead of click because it is more reliable.
  // Multiple clicks on images coming in and out of view can be
  // seen as triggering a selection, which doesn't trigger a click
  // event, but mouseup always fires.
  _onMouseUp: function(event) {
    if (
      // don't respond to middle/right clicks (2 & 3)
      event.which > 1 ||
      // or invalid targets
      !$(event.target).is(UI._validClickTargetSelector)
    ) {
      return;
    }

    // close when needed
    if (
      Pages.pages.length === 1 ||
      (Pages.page && Pages.page.view.options.onClick === "close")
    ) {
      Window.hide();
      return;
    }

    var side = this._getEventSide(event);
    Window[side]();

    // adjust cursor, doesn't work with effects
    // but _onMouseEnter is used to fix that
    this._onMouseMove(event);
  },

  _onMouseEnter: function(event) {
    // this solves clicking an area and not having an updating cursor
    // when not moving cursor after click. When an overlapping page comes into view
    // it'll trigger a mouseenter after the mouseout on the disappearing page
    // that would normally remove the clickable class
    this._onMouseMove(event);
  },

  _getEventSide: function(event) {
    var scrollLeft =
        this._scrollLeft > -1
          ? this._scrollLeft
          : (this._scrollLeft = $(window).scrollLeft()),
      left = event.pageX - Window._boxPosition.left - this._scrollLeft,
      width = Window._boxDimensions.width;

    return left < 0.5 * width ? "previous" : "next";
  },

  _onSideMouseEnter: function(event) {
    this._hoveringSideButton = true;
    this._hoveringSide = this._getEventSide(event);
    this._mayClickHoveringSide = Window[
      "may" + _.String.capitalize(this._hoveringSide)
    ]();
    this.clearTimer();
  },

  _onSideMouseLeave: function(event) {
    this._hoveringSideButton = false;
    this._hoveringSide = false;
    this._mayClickHoveringSide = false;
    this.startTimer();
  },

  show: function(callback) {
    if (this._visible) {
      // still clear a timer that could possible trigger hide
      // and start a new one
      this.startTimer();

      if ($.type(callback) === "function") callback();
      return;
    }

    this._visible = true;
    //UI.fullclick.visible = true;

    this.startTimer();

    Window.element
      .addClass("fr-visible-inside-ui")
      .removeClass("fr-hidden-inside-ui");

    if ($.type(callback) === "function") callback();
  },

  hide: function(callback) {
    if (!this._visible) {
      if ($.type(callback) === "function") callback();
      return;
    }

    this._visible = false;
    //UI.fullclick.visible = false;

    Window.element
      .removeClass("fr-visible-inside-ui")
      .addClass("fr-hidden-inside-ui");

    if ($.type(callback) === "function") callback();
  },

  // timers
  // not used on mobile-touch based devices
  clearTimer: function() {
    if (Support.mobileTouch) return;

    Window.timers.clear("ui-inside");
  },

  startTimer: function() {
    if (Support.mobileTouch) return;

    this.clearTimer();
    Window.timers.set(
      "ui-inside",
      $.proxy(function() {
        this.hide();
      }, this),
      Window.view ? Window.view.options.uiDelay : 0
    );
  }
};

UI.outside = {
  initialize: function() {
    this.build();

    this._scrollLeft = -1;
  },

  build: function() {
    Window._box
      .append(
        (this._previous = $("<div>")
          .addClass("fr-side fr-side-previous fr-side-previous-outside")
          .append(
            $("<div>")
              .addClass("fr-side-button")
              .append($("<div>").addClass("fr-side-button-background"))
              .append($("<div>").addClass("fr-side-button-icon"))
          ))
      )
      .append(
        (this._next = $("<div>")
          .addClass("fr-side fr-side-next fr-side-next-outside")
          .append(
            $("<div>")
              .addClass("fr-side-button")
              .append($("<div>").addClass("fr-side-button-background"))
              .append($("<div>").addClass("fr-side-button-icon"))
          ))
      )

      // close
      .append(
        (this._close = $("<div>")
          .addClass("fr-close fr-close-outside")
          .append($("<div>").addClass("fr-close-background"))
          .append($("<div>").addClass("fr-close-icon")))
      );

    // IE7 has a bug that causes multiple UI buttons from showing up
    // starting hidden fixes it
    if (Browser.IE && Browser.IE <= 7) {
      this._previous
        .add(this._next)
        .add(this._close)
        .hide();
    }

    // events
    this._close.on(
      "click",
      $.proxy(function(event) {
        event.preventDefault();
        Window.hide();
      }, this)
    );

    this._previous.on(
      "click",
      $.proxy(function(event) {
        Window.previous();
        this._onMouseMove(event); // update cursor
      }, this)
    );

    this._next.on(
      "click",
      $.proxy(function(event) {
        Window.next();
        this._onMouseMove(event); // update cursor
      }, this)
    );
  },

  enable: function() {
    this.bind();
  },

  disable: function() {
    this.unbind();
  },

  reset: function() {
    Window.timers.clear("ui-outside");

    // clear cached mousemove
    this._x = -1;
    this._y = -1;

    this._scrollLeft = -1;

    // reset the classes by faking a mouseleave
    this._onMouseLeave();
  },

  // events
  bind: function() {
    // no need to bind twice
    if (this._onMouseUpHandler) return;

    this.unbind();

    // clicks
    Window.element.on(
      "mouseup",
      ".fr-content",
      (this._onMouseUpHandler = $.proxy(this._onMouseUp, this))
    );

    // overlay
    Window.element.on(
      "click",
      ".fr-container, .fr-thumbnails, .fr-thumbnails-wrapper",
      (this._delegateOverlayCloseHandler = $.proxy(
        this._delegateOverlayClose,
        this
      ))
    );

    // track <> only on desktop
    if (!Support.mobileTouch) {
      // delegate <> mousemove/click states
      Window._pages
        .on(
          "mousemove",
          ".fr-content",
          (this._onMouseMoveHandler = $.proxy(this._onMouseMove, this))
        )
        .on(
          "mouseleave",
          ".fr-content",
          (this._onMouseLeaveHandler = $.proxy(this._onMouseLeave, this))
        )
        .on(
          "mouseenter",
          ".fr-content",
          (this._onMouseEnterHandler = $.proxy(this._onMouseEnter, this))
        );

      // delegate moving onto the <> buttons
      // keeping the mouse on them should keep the buttons visible
      Window.element
        .on(
          "mouseenter",
          ".fr-side",
          (this._onSideMouseEnterHandler = $.proxy(
            this._onSideMouseEnter,
            this
          ))
        )
        .on(
          "mouseleave",
          ".fr-side",
          (this._onSideMouseLeaveHandler = $.proxy(
            this._onSideMouseLeave,
            this
          ))
        );

      $(window).on(
        "scroll",
        (this._onScrollHandler = $.proxy(this._onScroll, this))
      );
    }
  },

  unbind: function() {
    if (!this._onMouseUpHandler) return;

    // clicks
    Window.element.off("mouseup", ".fr-content", this._onMouseUpHandler);
    this._onMouseUpHandler = null;

    // overlay
    Window.element.off(
      "click",
      ".fr-container, .fr-thumbnails, .fr-thumbnails-wrapper",
      this._delegateOverlayCloseHandler
    );

    if (this._onMouseMoveHandler) {
      Window._pages
        .off("mousemove", ".fr-content", this._onMouseMoveHandler)
        .off("mouseleave", ".fr-content", this._onMouseLeaveHandler)
        .off("mouseenter", ".fr-content", this._onMouseEnterHandler);

      Window.element
        .off("mouseenter", ".fr-side", this._onSideMouseEnterHandler)
        .off("mouseleave", ".fr-side", this._onSideMouseLeaveHandler);

      $(window).off("scroll", this._onScrollHandler);

      this._onMouseMoveHandler = null;
    }
  },

  adjustPrevNext: function(callback, alternateDuration) {
    var page = Pages.page;
    if (!page) {
      if (callback) callback();
      return;
    }

    var buttons = this._previous.add(this._next);

    // disabled states
    this._previous[(Window.mayPrevious() ? "remove" : "add") + "Class"](
      "fr-side-disabled"
    );
    this._next[(Window.mayNext() ? "remove" : "add") + "Class"](
      "fr-side-disabled"
    );

    // hide buttons for single content
    buttons[(page._total < 2 ? "add" : "remove") + "Class"]("fr-side-hidden");

    if (callback) callback();
  },

  _onScroll: function() {
    this._scrollLeft = $(window).scrollLeft();
  },

  _delegateOverlayClose: function(event) {
    var page = Pages.page;
    if (page && page.view.options.overlay && !page.view.options.overlay.close)
      return;

    // we don't want to respond to clicks on children
    if (
      !$(event.target).is(
        ".fr-container, .fr-thumbnails, .fr-thumbnails-wrapper"
      )
    )
      return;

    event.preventDefault();
    event.stopPropagation();
    Window.hide();
  },

  _onMouseMove: function(event) {
    // no need for this on mobile-touch
    if (Support.mobileTouch) return;

    var side = this._getEventSide(event),
      Side = _.String.capitalize(side),
      mayClickHoveringSide = side ? Window["may" + Side]() : false;

    // clear out side when onClick:'close'
    if (
      Pages.pages.length === 1 ||
      (Pages.page && Pages.page.view.options.onClick === "close")
    ) {
      side = false;
    }

    // prevent doing this on every mousemove
    if (
      side === this._hoveringSide &&
      mayClickHoveringSide === this._mayClickHoveringSide
    ) {
      return;
    }
    this._hoveringSide = side;
    this._mayClickHoveringSide = mayClickHoveringSide;

    if (side) {
      Window._box[(mayClickHoveringSide ? "add" : "remove") + "Class"](
        "fr-hovering-clickable"
      );

      // previous
      switch (side) {
        case "previous":
          Window._box
            .addClass("fr-hovering-previous")
            .removeClass("fr-hovering-next");
          break;
        case "next":
          Window._box
            .addClass("fr-hovering-next")
            .removeClass("fr-hovering-previous");
          break;
      }
    } else {
      Window._box.removeClass(
        "fr-hovering-clickable fr-hovering-previous fr-hovering-next"
      );
    }
  },

  _onMouseLeave: function(event) {
    Window._box.removeClass(
      "fr-hovering-clickable fr-hovering-previous fr-hovering-next"
    );
    this._hoveringSide = false;
  },

  // click == mouseup
  // We use mouseup instead of click because it is more reliable.
  // Multiple clicks on images coming in and out of view can be
  // seen as triggering a selection, which doesn't trigger a click
  // event, but mouseup always fires.
  _onMouseUp: function(event) {
    if (
      // don't respond to middle/right clicks (2 & 3)
      event.which > 1 ||
      // or invalid targets
      !$(event.target).is(UI._validClickTargetSelector)
    ) {
      return;
    }

    // close when needed
    if (
      Pages.pages.length === 1 ||
      (Pages.page && Pages.page.view.options.onClick === "close")
    ) {
      Window.hide();
      return;
    }

    var side = this._getEventSide(event);
    Window[side]();

    // adjust cursor, doesn't work with effects
    // but _onMouseEnter is used to fix that
    this._onMouseMove(event);
  },

  _onMouseEnter: function(event) {
    // this solves clicking an area and not having an updating cursor
    // when not moving cursor after click. When an overlapping page comes into view
    // it'll trigger a mouseenter after the mouseout on the disappearing page
    // that would normally remove the clickable class
    this._onMouseMove(event);
  },

  _getEventSide: function(event) {
    var scrollLeft =
        this._scrollLeft > -1
          ? this._scrollLeft
          : (this._scrollLeft = $(window).scrollLeft()),
      left = event.pageX - Window._boxPosition.left - this._scrollLeft,
      width = Window._boxDimensions.width;

    return left < 0.5 * width ? "previous" : "next";
  },

  show: function() {
    if (Browser.IE && Browser.IE <= 7) {
      this._previous
        .add(this._next)
        .add(this._close)
        .show();
    }
  },

  hide: function() {},

  _onSideMouseEnter: function(event) {
    this._hoveringSideButton = true;
    this._hoveringSide = this._getEventSide(event);
    this._mayClickHoveringSide = Window[
      "may" + _.String.capitalize(this._hoveringSide)
    ]();
  },

  _onSideMouseLeave: function(event) {
    this._hoveringSideButton = false;
    this._hoveringSide = false;
    this._mayClickHoveringSide = false;
  },

  clearTimer: function() {}
};

  // start
  $(document).ready(function(event) {
    _Fresco.initialize();
  });

  return Fresco;
});
