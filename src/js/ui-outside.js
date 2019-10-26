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
