// Thumbnail
function Thumbnail() {
  this.initialize.apply(this, _slice.call(arguments));
}
$.extend(Thumbnail.prototype, {
  initialize: function(view, position) {
    this.view = view;

    //this._dimensions = {};
    this._position = position;

    this.preBuild();
  },

  preBuild: function() {
    this.thumbnail = $("<div>")
      .addClass("fr-thumbnail")
      .data("fr-position", this._position);
  },

  build: function() {
    if (this.thumbnailFrame) return;

    var options = this.view.options;

    Thumbnails._slide.append(
      (this.thumbnailFrame = $("<div>")
        .addClass("fr-thumbnail-frame")
        .append(
          this.thumbnail.append(
            (this.thumbnailWrapper = $("<div>").addClass(
              "fr-thumbnail-wrapper"
            ))
          )
        ))
    );

    if (this.view.type === "image") {
      this.thumbnail.addClass("fr-load-thumbnail").data("thumbnail", {
        view: this.view,
        src: options.thumbnail || this.view.url
      });
    }

    // icon
    var icon = options.thumbnail && options.thumbnail.icon;
    if (icon) {
      this.thumbnail.append(
        $("<div>").addClass("fr-thumbnail-icon fr-thumbnail-icon-" + icon)
      );
    }

    // overlay
    var overlay;
    this.thumbnail.append(
      (overlay = $("<div>")
        .addClass("fr-thumbnail-overlay")
        .append($("<div>").addClass("fr-thumbnail-overlay-background"))
        .append(
          (this.loading = $("<div>")
            .addClass("fr-thumbnail-loading")
            .append($("<div>").addClass("fr-thumbnail-loading-background"))
            .append(
              (this.spinner = $("<div>")
                .addClass("fr-thumbnail-spinner")
                .hide()
                .append($("<div>").addClass("fr-thumbnail-spinner-spin")))
            ))
        )
        .append($("<div>").addClass("fr-thumbnail-overlay-border")))
    );

    this.thumbnail.append($("<div>").addClass("fr-thumbnail-state"));

    this.resize();
  },

  remove: function() {
    if (this.thumbnailFrame) {
      this.thumbnailFrame.remove();
      this.thumbnailFrame = null;
      this.image = null;
    }

    if (this.ready) {
      this.ready.abort();
      this.ready = null;
    }

    if (this.vimeoThumbnail) {
      this.vimeoThumbnail.abort();
      this.vimeoThumbnail = null;
    }

    this._loading = false;
    this._removed = true;

    // clean up
    this.view = null;

    this._clearDelay();
  },

  load: function() {
    if (this._loaded || this._loading || this._removed) return;

    if (!this.thumbnailWrapper) this.build();

    this._loading = true;

    var thumbnail = this.view.options.thumbnail;
    var url =
      thumbnail && $.type(thumbnail) === "boolean"
        ? this.view.url
        : thumbnail || this.view.url;

    // store this now so we can modify it
    this._url = url;

    // vimeo needs an extra wrapper with a JSONP request
    if (url) {
      if (this.view.type === "vimeo") {
        if (url === thumbnail) {
          this._url = url;
          this._load(this._url);
        } else {
          switch (this.view.type) {
            case "vimeo":
              this.vimeoThumbnail = new VimeoThumbnail(
                this.view.url,
                $.proxy(function(url) {
                  this._url = url;
                  this._load(url);
                }, this),
                $.proxy(function() {
                  this._error();
                }, this)
              );
              break;
          }
        }
      } else {
        // youtube
        this._load(this._url);
      }
    }
  },

  activate: function() {
    this.thumbnail.addClass("fr-thumbnail-active");
  },

  _load: function(url) {
    this.thumbnailWrapper.prepend(
      (this.image = $("<img>")
        .addClass("fr-thumbnail-image")
        .attr({ src: url })
        .css({ opacity: 0.0001 }))
    );

    this.fadeInSpinner();

    this.ready = new ImageReady(
      this.image[0],
      $.proxy(function(imageready) {
        var img = imageready.img;

        // if the thumbnail has been removed before we finish,
        // or if the _loading has been cancelled,
        // just quit
        if (!this.thumbnailFrame || !this._loading) return;

        this._loaded = true;
        this._loading = false;

        // store dimensions, used by resize
        this._dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight
        };

        // set dimensions after having loaded
        this.resize();

        // fadeout spinner
        this.show();
      }, this),
      $.proxy(function() {
        this._error();
      }, this),
      {
        method: this.view.options.loadedMethod
      }
    );
  },

  // error callback
  _error: function() {
    this._loaded = true;
    this._loading = false;

    this.thumbnail.addClass("fr-thumbnail-error");
    if (this.image) {
      this.image.hide();
    }
    this.thumbnailWrapper.append($("<div>").addClass("fr-thumbnail-image"));
    this.show();
  },

  fadeInSpinner: function() {
    if (!Spinner.supported || !this.view.options.spinner) return;

    // clear possible delay
    this._clearDelay();

    var fx = this.view.options.effects.thumbnail;

    this._delay = setTimeout(
      $.proxy(function() {
        this.spinner.stop(true).fadeTo(fx.show || 0, 1);
      }, this),
      this.view.options.spinnerDelay || 0
    );
  },

  // fades out the loading block
  // which could also contain a spinner
  show: function() {
    // clear possible delay
    this._clearDelay();

    var fx = this.view.options.effects.thumbnail;

    this.loading
      .stop(true)
      .delay(fx.delay)
      .fadeTo(fx.show, 0);
  },

  _clearDelay: function() {
    if (this._delay) {
      clearTimeout(this._delay);
      this._delay = null;
    }
  },

  // center image based on current dimensions
  resize: function() {
    if (!this.thumbnailFrame) return;

    var isHorizontal = Thumbnails._orientation === "horizontal";

    // frame
    this.thumbnailFrame.css({
      width: Thumbnails._vars.thumbnailFrame[isHorizontal ? "width" : "height"],
      height: Thumbnails._vars.thumbnailFrame[isHorizontal ? "height" : "width"]
    });

    // position frame
    this.thumbnailFrame.css({
      top: isHorizontal
        ? 0
        : Thumbnails._vars.thumbnailFrame.width * (this._position - 1),
      left: isHorizontal
        ? Thumbnails._vars.thumbnailFrame.width * (this._position - 1)
        : 0
    });

    if (!this.thumbnailWrapper) return;

    // resize the wrapper
    var thumbnail = Thumbnails._vars.thumbnail;
    this.thumbnail.css({
      width: thumbnail.width,
      height: thumbnail.height,
      "margin-top": Math.round(-0.5 * thumbnail.height),
      "margin-left": Math.round(-0.5 * thumbnail.width),
      "margin-bottom": 0,
      "margin-right": 0
    });

    // if there's no image, don't resize the rest
    if (!this._dimensions) return;

    var bounds = {
      width: thumbnail.width, //this.thumbnail.innerWidth(),
      height: thumbnail.height //this.thumbnail.innerHeight()
    };

    var maxZ = Math.max(bounds.width, bounds.height);

    var dimensions;

    var image = $.extend({}, this._dimensions);

    if (image.width > bounds.width && image.height > bounds.height) {
      dimensions = Fit.within(bounds, image);

      // if the dimensions are smaller than bounds, increase them
      var scaleX = 1,
        scaleY = 1;
      if (dimensions.width < bounds.width) {
        scaleX = bounds.width / dimensions.width;
      }
      if (dimensions.height < bounds.height) {
        scaleY = bounds.height / dimensions.height;
      }

      var scale = Math.max(scaleX, scaleY);
      if (scale > 1) {
        dimensions.width *= scale;
        dimensions.height *= scale;
      }

      $.each("width height".split(" "), function(i, z) {
        dimensions[z] = Math.round(dimensions[z]); // .5 for anti-aliasing
      });
    } else {
      dimensions = Fit.within(
        this._dimensions,
        image.width < bounds.width || image.height < bounds.height
          ? { width: maxZ, height: maxZ }
          : bounds
      );
    }

    var x = Math.round(bounds.width * 0.5 - dimensions.width * 0.5),
      y = Math.round(bounds.height * 0.5 - dimensions.height * 0.5);

    this.image
      .removeAttr("style") // remove the opacity
      .css($.extend({}, dimensions, { top: y, left: x }));
  }
});
