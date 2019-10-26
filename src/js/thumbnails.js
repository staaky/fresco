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
