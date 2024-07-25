import Popper from '@popperjs/core/dist/umd/popper.min';

// Required to enable animations on dropdowns/tooltips/popovers
// Popper.Defaults.modifiers.computeStyle.gpuAcceleration = false

try {
  window.Popper = Popper;
} catch (e) {}

export { Popper };
