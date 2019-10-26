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
