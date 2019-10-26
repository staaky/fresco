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
