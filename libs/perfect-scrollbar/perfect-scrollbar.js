import PerfectScrollbar from 'perfect-scrollbar/dist/perfect-scrollbar';

try {
  window.PerfectScrollbar = PerfectScrollbar;
} catch (e) {}

export { PerfectScrollbar };
