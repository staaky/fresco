# Fresco

A Beautiful Responsive Lightbox.

Fresco comes with thumbnail support, fullscreen zoom, Youtube and Vimeo integration for HTML5 video and a powerful Javascript API.

![fresco_preview](https://user-images.githubusercontent.com/5575/129450865-d63abd2e-2794-4209-ad84-bf0f6a3e08ac.jpg)

- [Fresco](#fresco)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Basic usage](#basic-usage)
    - [Setting Options](#setting-options)
    - [Groups](#groups)
    - [User Interface](#user-interface)
    - [Overflow](#overflow)
    - [Thumbnails](#thumbnails)
    - [Performance, best practices](#performance-best-practices)
    - [Media types](#media-types)
      - [Image](#image)
      - [Youtube](#youtube)
      - [Vimeo](#vimeo)
  - [Javascript API](#javascript-api)
    - [Groups](#groups-1)
    - [Position](#position)
    - [Links](#links)
  - [Options](#options)
  - [Callbacks](#callbacks)
  - [Skins](#skins)
    - [Adding a new skin](#adding-a-new-skin)
    - [Custom CSS](#custom-css)
    - [Changing the default skin](#changing-the-default-skin)

## Usage

### Installation

[Download Fresco](https://github.com/staaky/fresco/releases) and include it below the latest 3.x release of [jQuery](https://www.jquery.com):

```html
<script
  type="text/javascript"
  src="https://code.jquery.com/jquery-3.6.0.min.js"
></script>
<script type="text/javascript" src="/fresco/dist/js/fresco.min.js"></script>
<link rel="stylesheet" type="text/css" href="/fresco/dist/css/fresco.css" />
```

Alternatively Fresco can be installed using [npm](https://www.npmjs.com/package/@staaky/fresco) or [yarn](https://yarnpkg.com):

```bash
npm i @staaky/fresco
```

```bash
yarn add @staaky/fresco
```

### Basic usage

The easiest way to use Fresco is by adding the class `fresco` to a link.

```html
<a href="image.jpg" class="fresco">Show image</a>
```

The alternative is using the Javascript API. For more on this see the [API docs](#javascript-api).

```js
Fresco.show("image.jpg");
```

```html
<a href="image.jpg" class="fresco" data-fresco-caption="Caption below the image"
  >Caption</a
>
```

### Setting Options

Extra [Options](#options) and [Callbacks](#callbacks) can be added using the `data-fresco-options` attribute.

```html
<a
  href="image.jpg"
  class="fresco"
  data-fresco-caption="Caption on top of the image"
  data-fresco-options="ui: 'inside'"
  >Caption on top</a
>
```

### Groups

Create groups by giving links a `data-fresco-group` attribute. Each group should have a unique name. Groups can contain multiple types of content, images can be mixed with Youtube videos for example:

```html
<a
  href="image1.jpg"
  class="fresco"
  data-fresco-group="shared_options"
  data-fresco-group-options="ui: 'inside'"
  >This group</a
>
<a href="image2.jpg" class="fresco" data-fresco-group="shared_options"
  >has shared</a
>
<a href="image3.jpg" class="fresco" data-fresco-group="shared_options"
  >options</a
>
```

### User Interface

There are two types of user interface settings, `outside` and `inside`. `outside` is the default and will put user interface elements outside of the window.

```html
data-fresco-group-options="ui: 'outside'"
```

The alternative is `inside`, it puts the elements inside the window:

```html
data-fresco-group-options="ui: 'inside'"
```

On small screens Fresco will switch to an alternative UI mode to optimize use of the viewport. This mode uses the entire screen for navigation and doesn't close Fresco when clicking the overlay.

**Note**: Touch devices will **always** use `ui: 'outside'` no matter which ui option is selected.

**Important**: `ui: 'outside'` will be **forced** whenever a group contains more than images. The reason for this is that interaction with content like Youtube videos would be impossible if it had overlapping user interface elements.

### Overflow

Overflow can be used to create a zoom-like effect. By default the overflow options is set to `false`, which resizes images to fit within the viewport. Using overflow `true` will allow overflow along the y-axis.

Here's a popular usecase of overflow combined with vertical thumbnails:

```html
<a
  href="large_image_2.jpg"
  class="fresco"
  data-fresco-group="overflow-example"
  data-fresco-group-options="overflow: true, thumbnails: 'vertical', onClick: 'close'"
  >Overflow</a
>
<a href="large_image_2.jpg" class="fresco" data-fresco-group="overflow-example"
  >2</a
>
```

**Note**: Overflow is not supported on touch based devices.

### Thumbnails

Thumbnails are enabled by default and are automatically generated for images and Youtube videos. They can also be disabled by setting the `thumbnails` option to false:

```html
data-fresco-group-options="thumbnails: false"
```

By default the thumbnails option is set to `horizontal`, the alternative is `vertical`:

```html
data-fresco-group-options="thumbnails: 'vertical'"
```

### Performance, best practices

To improve performance it's recommended to create your own thumbnails. This avoids having to load entire source images to generate them on the fly. Providing thumbnails using the `thumbnail` option speeds up load times and saves bandwidth, especially noticeable with groups containing large images.

```html
<a
  href="image1.jpg"
  class="fresco"
  data-fresco-group="thumbnail-example"
  data-fresco-options="thumbnail: 'thumbnail1.jpg'"
  >Generated Thumbnails</a
>
<a
  href="image2.jpg"
  class="fresco"
  data-fresco-group="thumbnail-example"
  data-fresco-options="thumbnail: 'thumbnail2.jpg'"
  >2</a
>
```

**Note**: The thumbnail generated is set to **240x240px** because the maximum dimensions of a thumbnail are 120x120px. Having double the size available will make sure the thumbnails look good on Retina displays.

### Media types

Fresco attempts to automatically detect the media type using the given url. The type can also be set to one of the following values using the `data-fresco-type` attribute: `image`, `youtube` or `vimeo`.

#### Image

Most of the time setting the type will not be required for images, it will be required in cases where Fresco cannot detect it based on the url:

```html
<a href="/images/?id=1337" class="fresco" data-fresco-type="image">Image</a>
```

#### Youtube

Links to Youtube videos will be embedded using the Youtube `<iframe>` API.

```html
<a href="http://www.youtube.com/watch?v=c0KYU2j0TM4" class="fresco">Youtube</a>
```

Options of the Youtube `<iframe>` API can be set using the `youtube` option, see [YouTube Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters?playerVersion=HTML5) for all the available options. Setting the `width` and `height` option might also be desired:

```html
<a
  href="http://www.youtube.com/watch?v=7gFwvozMHR4"
  class="fresco"
  data-fresco-options="
      width: 853,
      height: 480,
      youtube: { autoplay: 0 }
    "
  >Youtube - Dimensions and options</a
>
```

#### Vimeo

Vimeo links are embedded using the Vimeo API:

```html
<a href="http://vimeo.com/32071937" class="fresco">Vimeo</a>
```

Options of the Vimeo Player API can be set using the `vimeo` option. See Vimeo Player Embedding for all the available options:

```html
<a
  href="http://vimeo.com/108057431"
  class="fresco"
  data-fresco-options="
     width: 853,
     height: 480,
     vimeo: { autoplay: 0 }
   "
  >Dimensions and options</a
>
```

**Note**: Vimeo videos don't have a thumbnail by default, this can be set using the `thumbnail` option.

## Javascript API

The API allows Fresco to be used with just Javascript, as an alternative to using the `fresco` class on links. The most common use of the API is [opening multiple items from a single link](#groups-1).

<table>
<thead>
  <tr>
    <th>Method</th>
    <th></th>
  </tr>
</thead>
<tbody>
<tr><td valign="top">

`Fresco.show()`

</td><td>

A single item can be shown by giving `Fresco.show()` a url:

```html
<a href="#" id="example-1">Show Image</a>

<script type="text/javascript">
  $(document).ready(function () {
    $("#example-1").on("click", function (event) {
      // the page will scroll up without this
      event.preventDefault();

      // Fresco API code goes here
      Fresco.show("image.jpg");
    });
  });
</script>
```

Add a caption by using an object instead:

```js
Fresco.show({
  url: "image.jpg",
  caption: "Caption below the image",
});
```

This object also accepts [options](#options) to customize Fresco:

```js
Fresco.show({
  url: "http://www.youtube.com/watch?v=c0KYU2j0TM4",
  options: {
    width: 853,
    height: 480,
    youtube: { autoplay: 0 },
  },
});
```

### Groups

Groups can be shown by giving `Fresco.show()` an array with multiple items:

```js
// use urls
Fresco.show(["image1.jpg", "image2.jpg"]);

// or objects
Fresco.show([
  { url: "image1.jpg", caption: "Caption for this image" },
  { url: "image2.jpg", caption: "Another caption" },
]);
```

[Options](#options) for the entire group can be set using the second argument:

```js
Fresco.show(["image1.jpg", "image2.jpg"], {
  thumbnails: false,
});
```

### Position

Open Fresco at a specific position by setting a number as the last argument:

```js
Fresco.show(["image1.jpg", "image2.jpg"], 2);
```

### Links

Links that use the `fresco` class can also be opened by passing `Fresco.show()` an element:

```js
Fresco.show($("#elementid")[0]);
```

 </td></tr>
 <tr><td valign="top">

`Fresco.hide()`

</td><td>

Close Fresco at any time by calling `Fresco.hide()`:

```js
Fresco.hide();
```

</td></tr>
<tr><td valign="top">

`Fresco.disable()`

</td><td>

Disables Fresco. When disabled, links using the `fresco` class will no longer open Fresco but work as regular links. Calls to `Fresco.show()` will use a fallback to make them behave like regular links.

```js
Fresco.disable();
```

Use `Fresco.fallback(false)` should you need to disable this fallback as well:

```js
Fresco.fallback(false).disable();
```

</td></tr>
<tr><td valign="top">

`Fresco.enable()`

</td><td>

Enable Fresco if it was previously disabled.

```js
Fresco.disable();
```

</td></tr>
<tr><td valign="top">

`Fresco.fallback()`

</td><td>

When Fresco is disabled it will fallback to making `Fresco.show()` calls open as regular links. By disabling this fallback API calls will do nothing at all.

```js
Fresco.fallback(false);
```

</td></tr>
<tr><td valign="top">

`Fresco.setDefaultSkin()`

</td><td>

Sets the name of the default skin, this skin will be used when no skin option is provided.

```js
Fresco.setDefaultSkin("custom");
```

</td></tr>
 
 </tbody>
 </table>
 
## Options

Options can be set using the `data-fresco-options` attribute.

```html
<a href="image.jpg" class="fresco" data-fresco-options="ui: 'inside'"
  >Show Image</a
>
```

Or when used with groups, the `data-fresco-group-options` attribute.

```html
<a
  href="image1.jpg"
  class="fresco"
  data-fresco-group="options_example"
  data-fresco-group-options="thumbnails: false, ui: 'inside'"
  >Image 1</a
>
<a href="image2.jpg" class="fresco" data-fresco-group="options_example"
  >Image 2</a
>
<a href="image3.jpg" class="fresco" data-fresco-group="options_example"
  >Image 3</a
>
```

When using the [Javascript API](#javascript-api) these would translate to:

```js
Fresco.show({ url: "image.jpg", options: { ui: "inside" } });
```

```js
Fresco.show(["image1.jpg", "image2.jpg", "image3.jpg"], {
  thumbnails: false,
  ui: "inside",
});
```

<table>
<thead>
  <tr>
    <th>Option</th>
    <th></th>
  </tr>
</thead>
<tbody>
<tr><td valign="top">

`effects`

</td><td>

Sets the duration ofindividual effects, or disables them when set to _false_.

```
effects: false
```

These are all the available options:

```js
effects: {
  content: { show: 0, hide: 0 },
  spinner: { show: 150, hide: 150 },
  window: { show: 440, hide: 300 },
  thumbnail: { show: 300, delay: 150 },
  thumbnails: { slide: 0 }
}
```

 </td></tr>
<tr><td valign="top">

`height`

</td><td>

This option only affects `youtube` content, for everything else this option will translate to maxHeight.

```
height: 720
```

</td></tr>
<tr><td valign="top">

`initialTypeOptions`

</td><td>

Initial options for different types, available types are `image`, `vimeo` and `youtube`. This option is there for use within [skins](#skins) where it can help to adjust defaults and avoid code repetition.

```js
initialTypeOptions: {
  'image': { },
  'vimeo': {
    width: 1280
  },
  'youtube': {
    width: 1280,
    height: 720
  }
}
```

 </td></tr>
 <tr><td valign="top">

`keyboard`

</td><td>

Enable or disable individual keyboard buttons or all of them when set to _false_. Useful for when the content requires keyboard interaction.

```
keyboard: false
```

Use an object to toggle individual buttons:

```js
keyboard: {
  left: true,
  right: true,
  esc: false
}
```

**Note:** The keys `left` and `right` are only enabled when using the `image` type. Any other type of content might require these keys.

</td></tr>
<tr><td valign="top">

`loadedMethod`

</td><td>

Sets the method used to decide when an image is loaded. The default is `naturalWidth`, which starts showing the image as soon as dimensions are known.

The alternative is using `onload`, which shows the image as soon as onload fires. This can give the image more time to render, but is slower.

```
loadedMethod: 'onload'
```

</td></tr>
<tr><td valign="top">

`loop`

</td><td valign="top">

When set to _true_ a group becomes a continuous loop, keeping navigation buttons enabled at all times:

```
loop: true
```

</td></tr>
<tr><td valign="top">

`maxHeight`

</td><td>

Sets a maximum height for the content.

```
maxHeight: 500
```

</td></tr>
<tr><td valign="top">

`maxWidth`

</td><td>

Sets a maximum width for the content.

```
maxWidth: 500
```

</td></tr>
<tr><td valign="top">

`overflow`

</td><td>

Sets overflow along the y-axis, creating a zoom like effect whenever an image overflows.

See the [documentation on overflow](#overflow) for examples on using this option.

```
overflow: true
```

**Note:** Overflow is not supported on touch based devices.

</td></tr>
<tr><td valign="top">

`overlay`

</td><td>

Options of the overlay, setting `close: false` will prevents clicks on the overlay from closing the window.

```
overlay: { close: false }
```

</td></tr>
<tr><td valign="top">

`onClick`

</td><td>

What to do when clicking the area overlapping an image. Available options are: `'previous-next'` or `'close'`

</td></tr>
<tr><td valign="top">

`position`

</td><td>

Shows a position indicator when set to _true_, or hides it when set to _false_.

```
position: false
```

</td></tr>
<tr><td valign="top">

`preload`

</td><td>

Sets the items to preload before and after the current item, or disables preloading when set to _false_.

```
preload: [1, 2] // preload 1 before and 2 after
```

```
preload: false // disables preloading
```

</td></tr>
<tr><td valign="top">

`spinner`

</td><td>

Disables the loading icon when set to _false_.

```
spinner: false
```

</td></tr>
<tr><td valign="top">

`skin`

</td><td>

Sets the skin, the options of this skin will be applied as a starting point for other options. Available skins are: `fresco` and any added custom skins.

```
skin: 'fresco'
```

**Note:** See [documentation on Skins](#skins) for instructions on creating and customizing skins.

</td></tr>
<tr><td valign="top">

`sync`

</td><td>

Hides the current item while showing the next one when set to _true_ (the default). Setting it to _false_ will hide the current item before showing the next one.

```
sync: false
```

</td></tr>
<tr><td valign="top">

`thumbnail`

</td><td>

This option can be used to set an alternative thumbnail image, it will be based on the source if this option isn't set.

```
thumbnail: 'thumbnail.jpg'
```

**Note:** See the [documentation on performance](#performance-best-practices) more information on optimizing thumbnails for performance.

</td></tr>
<tr><td valign="top">

`thumbnails`

</td><td>

Enabled or disables the thumbnails below the content.

```
thumbnails: false
```

**Note:** Thumbnails aren't used on touch based devices for performance reasons.

</td></tr>
<tr><td valign="top">

`ui`

</td><td>

Sets position of user interface elements. The default is `outside` which positions everything outside of the content, `inside` puts the elements on top of the content:

```
ui: 'inside'
```

On small screens Fresco will switch to an alternative UI mode to optimize use of the viewport. This mode uses the entire screen for navigation and doesn't close Fresco when clicking the overlay.

</td></tr>
<tr><td valign="top">

`uiDelay`

</td><td>

The duration in miliseconds to wait before hiding UI elements that can be toggled on mouseover:

```
uiDelay: 3000
```

</td></tr>
<tr><td valign="top">

`vimeo`

</td><td>

Sets the player parameters of a Vimeo video, available options can be found in the Vimeo documentation: [Vimeo Player Embedding](http://developer.vimeo.com/player/embedding).

```js
vimeo: {
  autoplay: 1,
  title: 1,
  byline: 1,
  portrait: 0,
  loop: 0
}
```

</td></tr>
<tr><td valign="top">

`width`

</td><td>

This option only affects `youtube` content, for everything else this option will translate to `maxWidth`.

```
width: 1280
```

</td></tr>
<tr><td valign="top">

`youtube`

</td><td>

Sets the player parameters of a Youtube video, available options can be found in the Youtube documentation: [YouTube Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters?playerVersion=HTML5).

```js
youtube: {
  autohide: 1,
  autoplay: 1,
  controls: 1,
  enablejsapi: 1,
  hd: 1,
  iv_load_policy: 3,
  loop: 0,
  modestbranding: 1,
  rel: 0,
  vq: 'hd1080'
}
```

</td></tr>

</tbody>
</table>

## Callbacks

Callbacks can be used alongside other [Options](#options).

<table>
<thead>
  <tr>
    <th>Callback</th>
    <th></th>
  </tr>
</thead>
<tbody>
<tr><td valign="top">

`afterPosition`

</td><td>

A function to call after the position changes. The first argument is the current position within the loaded group.

```js
afterPosition: function(position) {
  alert("You've reached position " + position);
}
```

 </td></tr>
 <tr><td valign="top">

`afterHide`

</td><td>

A function to call when Fresco hides.

```js
afterHide: function() {
  alert('Fresco is no longer visible');
}
```

 </td></tr>
  <tr><td valign="top">

`onShow`

</td><td>

A function to call when Fresco comes into view.

```js
onShow: function() {
  alert('Fresco is visible');
}
```

 </td></tr>

 </tbody>
 </table>

## Skins

Skins are a combination of Javascript [Options](#options), CSS and an SVG/PNG sprite. To use a skin the only option required is the `skin` option. Options of the selected skin are then applied as a starting point. Additional options will overwrite what's defined on the skin:

```
skin: 'fresco', ui: 'inside'
```

When creating your own skins it's highly recommended to place all custom Javascript and CSS in separate files included below the Fresco files. This will allow upgrading without losing any of your custom skins. Here's an example:

```html
<script
  type="text/javascript"
  src="https://unpkg.com/@staaky/fresco@2.3.0/dist/js/fresco.js"
></script>
<link
  rel="stylesheet"
  type="text/css"
  href="'https://unpkg.com/@staaky/fresco@2.3.0/dist/css/fresco.css"
/>

<script type="text/javascript" src="/fresco/custom-skin.js"></script>
<link rel="stylesheet" type="text/css" href="/fresco/custom-skin.css" />

<script type="text/javascript">
  // make a custom skin the new default
  Fresco.setDefaultSkin("custom");
</script>
```

### Adding a new skin

A custom skin requires Javascript, CSS and sprite images. Let's start with the Javascript.

All skins inherit their options from a `base` skin defined in `Fresco.skins`. Because of this inheritance the only [Options](#options) that have to be defined are those different from the base skin. A custom skin is created by extending the `Fresco.Skins` object, here's how it could be defined:

```js
$.extend(Fresco.Skins, {
  custom: {
    ui: "inside",
  },
});
```

After the skin has been created it can be applied using the `skin` option:

```html
<a href="image.jpg" class="fresco" data-fresco-options="skin: 'custom'"
  >Custom skin</a
>
```

When using groups the best way to apply the skin is using the `data-fresco-group-options`:

```html
<a
  href="image1.jpg"
  class="fresco"
  data-fresco-group="example"
  data-fresco-group-options="skin: 'custom'"
  >Same</a
>
<a href="image2.jpg" class="fresco" data-fresco-group="example">Skin</a>
```

### Custom CSS

Once the Javascript for a skin is in place a skin will need CSS and sprites for styling. To help with styling Fresco adds the name of the skin to certain classnames:

```
.fr-window-skin-SKINNAME
.fr-overlay-skin-SKINNAME
.fr-spinner-skin-SKINNAME
```

It is recommended to copy the fresco skin defined in `fresco.css` as a starting point for new skins. To do this copy all the definitions of the `fresco` skin into to a separate css file.

This means all definitions starting with `.fr-window-fresco`, `.fr-overlay-fresco` and `.fr-spinner-fresco`. Rename those to match your new skin. For example, if your skin is named `custom` the CSS rules would start with:

```
.fr-window-skin-custom
.fr-overlay-skin-custom
.fr-spinner-skin-custom
```

### Changing the default skin

To avoid having to set the `skin` option all the time the default skin can be changed using `Fresco.setDefaultSkin()`. It should be called after the file that defines custom skins, for example:

```html
<script type="text/javascript" src="/js/fresco/fresco.js"></script>
<link rel="stylesheet" type="text/css" href="/css/fresco/fresco.css" />

<script type="text/javascript" src="/js/fresco/fresco-custom-skins.js"></script>
<link
  rel="stylesheet"
  type="text/css"
  href="/css/fresco/fresco-custom-skins.css"
/>

<script type="text/javascript">
  // make a custom skin the new default
  Fresco.setDefaultSkin("custom");
</script>
```

---

Fresco has been open-sourced under the [Creative Commons BY 4.0
license](https://creativecommons.org/licenses/by/4.0) as of oct. 26 2019.
