import jQuery from 'jquery/dist/jquery';

const $ = jQuery;
try {
  window.jQuery = window.$ = jQuery;
} catch (e) {}

export { jQuery, $ };
