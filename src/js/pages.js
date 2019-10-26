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
