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
