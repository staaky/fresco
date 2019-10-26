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
