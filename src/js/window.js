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
