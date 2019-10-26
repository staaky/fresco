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
