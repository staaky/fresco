// Spinner
// a pure CSS based spinner
var Spinner = {
  // mark as supported
  supported: Support.css.transform && Support.css.animation,

  initialize: function(element) {
    this.element = $("<div>")
      .addClass("fr-spinner")
      .hide();

    for (var i = 1; i <= 12; i++) {
      this.element.append($("<div>").addClass("fr-spin-" + i));
    }

    this.element.on(
      "click",
      $.proxy(function() {
        Window.hide();
      }, this)
    );

    // prevent mousewheel scroll
    this.element.on("fresco:mousewheel", function(event) {
      event.preventDefault();
    });
  },

  setSkin: function(skin) {
    if (!this.supported) return;

    if (this._skin) {
      this.element.removeClass("fr-spinner-skin-" + this._skin);
    }

    // store dimensions, this avoids having to recalculate it every time we center()
    this.updateDimensions();

    this.element.addClass("fr-spinner-skin-" + skin);
    this._skin = skin;
  },

  updateDimensions: function() {
    // need to be attached to measure dimensions
    var attached = this._attached;
    if (!attached) this.attach();

    this._dimensions = {
      width: this.element.outerWidth(),
      height: this.element.outerHeight()
    };

    if (!attached) this.detach();
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

  show: function(callback, alternateDuration) {
    this._visible = true;

    this.attach();
    this.center();

    var pDuration =
        (Pages.page && Pages.page.view.options.effects.spinner.show) || 0,
      duration =
        ($.type(alternateDuration) === "number"
          ? alternateDuration
          : pDuration) || 0;

    this.element.stop(true).fadeTo(duration, 1, callback);
  },

  hide: function(callback, alternateDuration, position) {
    this._visible = false;

    var pDuration =
        (Pages.page && Pages.page.view.options.effects.spinner.hide) || 0,
      duration =
        ($.type(alternateDuration) === "number"
          ? alternateDuration
          : pDuration) || 0;

    this.element.stop(true).fadeOut(
      duration || 0,
      $.proxy(function() {
        this.detach();
        if (callback) callback();
      }, this)
    );
  },

  // center on the current page
  center: function() {
    if (!this.supported) return;

    // make sure dimensions are set
    if (!this._dimensions) this.updateDimensions();

    // for ui:fullclick we can already figure out the info height
    // before the content is loaded and center accordingly
    var page = Pages.page,
      iH = 0;
    if (page && page._ui === "fullclick") {
      page._whileVisible(function() {
        iH = page._getInfoHeight(Window._boxDimensions.width);
      });
    }

    this.element.css({
      top:
        Window._boxPosition.top +
        Window._boxDimensions.height * 0.5 -
        this._dimensions.height * 0.5 -
        iH * 0.5,
      left:
        Window._boxPosition.left +
        Window._boxDimensions.width * 0.5 -
        this._dimensions.width * 0.5
    });
  }
};
