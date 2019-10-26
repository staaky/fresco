var Options = {
  defaults: {
    effects: {
      content: { show: 0, hide: 0 },
      spinner: { show: 150, hide: 150 },
      window: { show: 440, hide: 300 },
      thumbnail: { show: 300, delay: 150 },
      thumbnails: { slide: 0 }
    },
    keyboard: {
      left: true,
      right: true,
      esc: true
    },
    loadedMethod: "naturalWidth",
    loop: false,
    onClick: "previous-next",
    overflow: false,
    overlay: {
      close: true
    },
    preload: [1, 2],
    position: true,
    skin: "fresco",
    spinner: true,
    spinnerDelay: 300,
    sync: true,
    thumbnails: "horizontal",
    ui: "outside",
    uiDelay: 3000,
    vimeo: {
      autoplay: 1,
      api: 1,
      title: 1,
      byline: 1,
      portrait: 0,
      loop: 0
    },
    youtube: {
      autoplay: 1,
      controls: 1,
      //cc_load_policy: 0,
      enablejsapi: 1,
      hd: 1,
      iv_load_policy: 3,
      loop: 0,
      modestbranding: 1,
      rel: 0,
      vq: "hd1080" // force hd: http://stackoverflow.com/a/12467865
    },

    initialTypeOptions: {
      image: {},
      vimeo: {
        width: 1280
      },
      // Youtube needs both dimensions, it doesn't support fetching video dimensions like Vimeo yet.
      // Star this ticket if you'd like to get support for it at some point:
      // https://code.google.com/p/gdata-issues/issues/detail?id=4329
      youtube: {
        width: 1280,
        height: 720
      }
    }
  },

  create: function(opts, type, data) {
    opts = opts || {};
    data = data || {};

    opts.skin = opts.skin || this.defaults.skin;

    var selected = opts.skin
        ? $.extend(
            {},
            Fresco.Skins[opts.skin] || Fresco.Skins[this.defaults.skin]
          )
        : {},
      merged = $.extend(true, {}, this.defaults, selected);

    // merge initial type options
    if (merged.initialTypeOptions) {
      if (type && merged.initialTypeOptions[type]) {
        merged = $.extend(true, {}, merged.initialTypeOptions[type], merged);
      }
      // these aren't used further, so remove them
      delete merged.initialTypeOptions;
    }

    // safe options to work with
    var options = $.extend(true, {}, merged, opts);

    // touch should never use ui:inside
    if (Support.mobileTouch && options.ui === "inside") {
      options.ui = "outside";
    }

    // set all effect duration to 0 for effects: false
    // IE8 and below never use effects
    if (!options.effects || (Browser.IE && Browser.IE < 9)) {
      options.effects = {};
      $.each(this.defaults.effects, function(name, effect) {
        $.each((options.effects[name] = $.extend({}, effect)), function(
          option
        ) {
          options.effects[name][option] = 0;
        });
      });

      // disable the spinner when effects are disabled
      options.spinner = false;
    }

    // keyboard
    if (options.keyboard) {
      // when keyboard is true, enable all keys
      if ($.type(options.keyboard) === "boolean") {
        options.keyboard = {};
        $.each(this.defaults.keyboard, function(key, bool) {
          options.keyboard[key] = true;
        });
      }

      // disable left and right keys for video, because players like
      // youtube use these keys
      if (type === "vimeo" || type === "youtube") {
        $.extend(options.keyboard, { left: false, right: false });
      }
    }

    // overflow
    if (!options.overflow || Support.mobileTouch) {
      // false
      options.overflow = { x: false, y: false };
    } else {
      if ($.type(options.overflow) === "boolean") {
        // true
        options.overflow = { x: false, y: true };
      }
    }

    // vimeo & youtube always have no overlap
    if (type === "vimeo" || type === "youtube") {
      options.overlap = false;
    }

    // disabled thumbnails IE < 9 & touch based devices
    if ((Browser.IE && Browser.IE < 9) || Support.mobileTouch) {
      options.thumbnail = false;
      options.thumbnails = false;
    }

    // width/height are only used for youtube
    // convert it to maxWidth/Height for the other content
    // when no max values have been set
    if (type !== "youtube") {
      if (options.width && !options.maxWidth) {
        options.maxWidth = options.width;
      }
      if (options.height && !options.maxHeight) {
        options.maxHeight = options.height;
      }
    }

    // youtube thumbnails
    if (!options.thumbnail && $.type(options.thumbnail) !== "boolean") {
      // only continue if undefined, forced false stays false
      var thumbnail = false;

      switch (type) {
        case "youtube":
          var protocol =
            "http" +
            (window.location && window.location.protocol === "https:"
              ? "s"
              : "") +
            ":";

          thumbnail = protocol + "//img.youtube.com/vi/" + data.id + "/0.jpg";
          break;
        case "image":
        case "vimeo":
          thumbnail = true;
          break;
      }

      options.thumbnail = thumbnail;
    }

    return options;
  }
};
