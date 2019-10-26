// UI Modes
var UI = {
  _modes: ["fullclick", "outside", "inside"],
  _ui: false,
  _validClickTargetSelector: [
    ".fr-content-element",
    ".fr-content",
    ".fr-content > .fr-stroke",
    ".fr-content > .fr-stroke .fr-stroke-color"
  ].join(", "),

  initialize: function(element) {
    // initialize the 3 different UI types
    $.each(
      this._modes,
      $.proxy(function(i, mode) {
        this[mode].initialize();
      }, this)
    );

    // start with hidden ui
    Window.element.addClass("fr-ui-inside-hidden fr-ui-fullclick-hidden");
  },

  // set the ui mode, this only changes the class and with that visibility
  set: function(ui) {
    if (this._ui) {
      Window.element.removeClass("fr-window-ui-" + this._ui);
      Overlay.element.removeClass("fr-overlay-ui-" + this._ui);
    }
    Window.element.addClass("fr-window-ui-" + ui);
    Overlay.element.addClass("fr-overlay-ui-" + ui);

    // if we've switched ui's disable one and enable the other
    if (this._enabled && this._ui && this._ui !== ui) {
      this[this._ui].disable();
      this[ui].enable();

      // also show the UI when switched
      UI[ui].show();

      // stop timers on all other ui modes instantly
      //this.setActiveTimers(ui);
    }

    this._ui = ui;
  },

  // show ui for touch onresize
  _onWindowResize: function() {
    if (Support.mobileTouch) this.show();
  },

  // enable the currently set ui, disable all others
  enable: function() {
    $.each(
      this._modes,
      $.proxy(function(i, mode) {
        UI[mode][mode === this._ui ? "enable" : "disable"]();
      }, this)
    );

    this._enabled = true;
  },

  disable: function() {
    $.each(
      this._modes,
      $.proxy(function(i, mode) {
        UI[mode].disable();
      }, this)
    );

    this._enabled = false;
  },

  adjustPrevNext: function(callback, alternateDuration) {
    // only fullclick adjusts sides
    UI[this._ui].adjustPrevNext(callback, alternateDuration);
  },

  show: function(callback, alternateDuration) {
    UI[this._ui].show(callback, alternateDuration);

    //this.setActiveTimers(this._ui);
  },

  hide: function(callback, alternateDuration) {
    UI[this._ui].hide(callback, alternateDuration);
  },

  // called on Window.reset
  reset: function() {
    $.each(
      this._modes,
      $.proxy(function(i, mode) {
        UI[mode].reset();
      }, this)
    );
  },

  update: function() {
    var page = Pages.page;
    if (!page) return;

    this.set(page._ui);
  } /*,

  // sets the ui to use timers for and disabled timers
  // on all other ui modes
  setActiveTimers: function(ui) {
    $.each(this._modes, function(i, mode) {
      if (mode != ui) UI[mode].clearTimer();
    });
  }*/
};
