require.register("src/js/colorBlend.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSVGs = getSVGs;
exports.reloadSVGs = reloadSVGs;
exports.init = init;
var navSvgs = selectSVGs();

function getSVGs() {
  return navSvgs;
}

function reloadSVGs() {
  navSvgs = selectSVGs();
}

function selectSVGs() {
  return [document.getElementById('cr-logo'), document.querySelector('.menu-button--desktop #cr-menu'), document.getElementById('cr-switcher'), document.getElementById('cr-back-top'), document.getElementById('cr-page')].filter(function (svg) {
    return !!svg;
  });
}

function init() {
  var darkSections = findDarkSections(); // TODO: unregister observers on swup page change.

  var svgBlendObservers = navSvgs.map(buildMasksForSVG);
  /**
   * @param {Element} svgEl - DOM SVG Node
   * @returns {IntersectionObserver} - observer watching this SVG
   */

  function buildMasksForSVG(svgEl) {
    // Do not build masks if on a tablet or smaller
    var isMobile = window.matchMedia('only screen and (max-width: 768px)');

    if (isMobile.matches) {
      return false;
    }

    var svgId = svgEl.id;
    var altMaskRect = svgEl.querySelector("#".concat(svgId, "-alt-mask rect"));
    var prevIntersectionRectY = 0;
    var prevIntersectionRatio = 0;
    var prevIntersectionWasDark = false;
    var windowHeight = window.innerHeight; // Dimensionless SVG units -- viewbox height.
    // Todo include fallback when missing viewBox (?)

    var svgVbHeight = svgEl.getAttribute('viewBox').split(' ').pop();
    var svgBoundingRect = svgEl.getBoundingClientRect();
    var svgHeightPx = svgBoundingRect.height;
    var svgTopY = svgBoundingRect.top;
    var svgBottomY = svgHeightPx + svgTopY; // Options for the observers
    // root: null defaults to window
    // rootMargin brings observer window to match the height of the nav logo threshold
    // todo should we be using the SVGs themselves as a 'root'?

    var observerOptions = {
      root: null,
      rootMargin: "".concat(-svgTopY, "px 0px ").concat(svgBottomY - windowHeight, "px 0px"),
      threshold: buildThreshold()
    };
    var observer;

    try {
      observer = new IntersectionObserver(intersectionCallback, observerOptions);
    } catch (e) {
      debugger;
    }

    darkSections.forEach(function (el) {
      return observer.observe(el);
    });
    return observer;

    function intersectionCallback(entries, observer) {
      entries.forEach(function (entry) {
        var isInNewSection = entry.intersectionRect.top !== prevIntersectionRectY;

        if (entry.isIntersecting || isInNewSection) {
          var intersectionRatio = entry.intersectionRect.height / svgHeightPx;
          prevIntersectionRectY = entry.intersectionRect.top;
          requestAnimationFrame(blendLogoMasks.bind(null, intersectionRatio, isInNewSection));
        }
      });
    }
    /**
     * This moves the nav logo svg clip path masks to create the illusion of a changing color
     * @param intersectionRatio
     * @param isInDarkSection
     */


    function blendLogoMasks(intersectionRatio, isInDarkSection) {
      if (isInDarkSection !== prevIntersectionWasDark || intersectionRatio !== prevIntersectionRatio) {
        altMaskRect.setAttribute('y', isInDarkSection ? svgVbHeight * (1 - intersectionRatio) : 0);
        altMaskRect.setAttribute('height', svgVbHeight * intersectionRatio);
        prevIntersectionWasDark = isInDarkSection;
        prevIntersectionRatio = intersectionRatio;
      }
    }
  }
}

function findDarkSections() {
  var sectionClasses = ['content-panel', 'full-panel--background', 'stats-block']; // List of dark background class names for filter check below

  var darkBackgroundColors = ['bg-black', 'bg-darkestgrey', 'bg-darkgrey', 'bg-grey', 'bg-darkblue', 'bg-violet', 'bg-blue', 'bg-orange'];

  function buildCombinations(accumulator, sectionClass) {
    return accumulator.concat(darkBackgroundColors.map(function (bgClass) {
      return ".".concat(sectionClass, ".").concat(bgClass);
    }));
  }

  return document.querySelectorAll(sectionClasses.reduce(buildCombinations, []));
}
/**
 * TODO: calculate needed granularity based on SVG height?
 * @param granularity - Number of steps
 * @returns {number[]}
 */


function buildThreshold() {
  var granularity = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 200;
  // Define thresholds for the intersectionObserver to execute the callback function
  // e.g. callback will run every % of the height of what is being observed
  var threshold = new Array(granularity);
  var increment = 1 / granularity;

  for (var i = 0; i <= granularity; i++) {
    threshold[i] = increment * i;
  }

  return threshold;
}
});