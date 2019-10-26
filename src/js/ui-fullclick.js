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
