(function () {
  "use strict";

  var NAV_SCROLL_THRESHOLD = 100;
  var REVEAL_MARGIN = "0px 0px -10% 0px";
  var isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var supportsGalleryHijack =
    window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Single source of truth for each project's thumbnail. Any tile marked
  // with data-project="<key>" (Home's work grid, every case study's "More
  // Work" grid) gets its image/label/link filled in from here, so updating
  // a thumbnail in one place updates it everywhere it's featured.
  var PROJECTS = {
    macroverse: {
      href: "macroverse.html",
      thumb: "assets/images/work-macroverse.jpg",
      thumbHover: "assets/images/work-macroverse-hover.jpg",
      name: "Macroverse",
    },
    costco: {
      href: "costco.html",
      thumb: "assets/images/work-costco.jpg",
      thumbHover: "assets/images/work-costco-hover.jpg",
      name: "Costco Auto Program",
    },
    "breakfast-republic": {
      href: "breakfast-republic.html",
      thumb: "assets/images/work-breakfast-republic.jpg",
      thumbHover: "assets/images/work-breakfast-republic-hover.jpg",
      name: "Breakfast Republic",
    },
    "como-ceviche": {
      href: "como-ceviche.html",
      thumb: "assets/images/work-como-ceviche.jpg",
      thumbHover: "assets/images/work-como-ceviche-hover.jpg",
      name: "¡Como Ceviche!",
    },
  };

  // Delight gallery (delight.html) — thumb/full lookup for the image popup.
  var DELIGHT_PROJECTS = {
    "bear-repub": {
      thumb: "assets/images/delight-gallery-bear-repub-thumb.jpg",
      full: "assets/images/delight-gallery-bear-repub-full.jpg",
      name: "Bear Republic",
    },
    "corner-drafthouse": {
      thumb: "assets/images/delight-gallery-corner-drafthouse-thumb.jpg",
      full: "assets/images/delight-gallery-corner-drafthouse-full.jpg",
      name: "Corner Drafthouse",
    },
    npbc: {
      thumb: "assets/images/delight-gallery-npbc-thumb.jpg",
      full: "assets/images/delight-gallery-npbc-full.jpg",
      name: "NPBC",
    },
    "pizza-repub": {
      thumb: "assets/images/delight-gallery-pizza-repub-thumb.jpg",
      full: "assets/images/delight-gallery-pizza-repub-full.jpg",
      name: "Pizza Republic",
    },
    waterbar: {
      thumb: "assets/images/delight-gallery-waterbar-thumb.jpg",
      full: "assets/images/delight-gallery-waterbar-full.jpg",
      name: "Waterbar",
    },
    // Real photography for the Logos section only — Menu Designs and
    // Apparel Design still use the shared placeholder keys above.
    "logos-bear-repub": {
      thumb: "assets/images/delight-logos-bearrepub-thumb.jpg",
      full: "assets/images/delight-logos-bearrepub-expand.jpg",
      name: "Bear Republic",
    },
    "logos-corner-drafthouse": {
      thumb: "assets/images/delight-logos-cornerdraft-thumb.jpg",
      full: "assets/images/delight-logos-cornerdraft-expand.jpg",
      name: "Corner Drafthouse",
    },
    "logos-npbc": {
      thumb: "assets/images/delight-logos-npbc-thumb.jpg",
      full: "assets/images/delight-logos-npbc-expand.jpg",
      name: "NPBC",
    },
    "logos-pizza-repub": {
      thumb: "assets/images/delight-logos-pizzarepub-thumb.jpg",
      full: "assets/images/delight-logos-pizzarepub-expand.jpg",
      name: "Pizza Republic",
    },
    "logos-waterbar": {
      thumb: "assets/images/delight-logos-waterbar-thumb.jpg",
      full: "assets/images/delight-logos-waterbar-expand.jpg",
      name: "Waterbar",
    },
  };

  var RIGHT_ARROW_ICON =
    '<svg class="custom-cursor__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M3 12H21M21 12L14 5M21 12L14 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  var HOME_ICON =
    '<svg class="custom-cursor__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M4 11L12 4L20 11V20C20 20.55 19.55 21 19 21H15V15H9V21H5C4.45 21 4 20.55 4 20V11Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
    "</svg>";

  var PLUS_ICON =
    '<svg class="custom-cursor__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  var MINUS_ICON =
    '<svg class="custom-cursor__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  var heroEl = document.querySelector(".hero");
  var mainContentEl = document.querySelector(".main-content");
  var siteNavEl = document.querySelector(".site-nav");

  function heroHeight() {
    return heroEl ? heroEl.offsetHeight : 811;
  }

  function navHeightPx() {
    var value = getComputedStyle(document.documentElement).getPropertyValue("--nav-height");
    return parseInt(value, 10) || 84;
  }

  // ---------------------------------------------------------------
  // Shared scroll dispatcher — one rAF-throttled listener, many subscribers
  // ---------------------------------------------------------------
  var scrollSubscribers = [];
  function registerScrollHandler(fn) {
    scrollSubscribers.push(fn);
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var y = window.scrollY;
          for (var i = 0; i < scrollSubscribers.length; i++) scrollSubscribers[i](y);
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  // ---------------------------------------------------------------
  // Custom cursor
  // ---------------------------------------------------------------
  var cursorController = { setHotspot: function () {}, setLabel: function () {}, setLight: function () {} };

  function initCustomCursor() {
    if (!isFinePointer) return;

    var cursorEl = document.querySelector(".custom-cursor");
    if (!cursorEl) return;
    var labelEl = cursorEl.querySelector(".custom-cursor__label");

    document.body.classList.add("custom-cursor-enabled");

    var target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var current = { x: target.x, y: target.y };
    var activated = false;

    document.addEventListener("mousemove", function (e) {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!activated) {
        activated = true;
        cursorEl.classList.add("is-active");
      }
    });

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function raf() {
      current.x = lerp(current.x, target.x, 0.45);
      current.y = lerp(current.y, target.y, 0.45);
      cursorEl.style.transform =
        "translate3d(" + current.x + "px," + current.y + "px,0) translate(-50%,-50%)";
      window.requestAnimationFrame(raf);
    }
    window.requestAnimationFrame(raf);

    cursorController.setHotspot = function (isOn) {
      cursorEl.classList.toggle("is-hotspot", isOn);
    };
    cursorController.setLabel = function (text, iconSvg) {
      if (iconSvg) {
        labelEl.innerHTML = iconSvg + (text ? "<span>" + text + "</span>" : "");
      } else {
        labelEl.textContent = text || "";
      }
    };
    cursorController.setLight = function (isOn) {
      cursorEl.classList.toggle("is-light", isOn);
    };
  }

  // ---------------------------------------------------------------
  // Main nav scroll state
  // ---------------------------------------------------------------
  function initNavScrollState() {
    if (!siteNavEl) return;
    registerScrollHandler(function (y) {
      siteNavEl.classList.toggle("scrolled", y > NAV_SCROLL_THRESHOLD);
    });
  }

  // ---------------------------------------------------------------
  // Hero parallax
  // ---------------------------------------------------------------
  function initHeroParallax() {
    var bgEl = document.querySelector(".hero__bg");
    if (!bgEl) return;
    registerScrollHandler(function (y) {
      if (y > heroHeight()) return;
      bgEl.style.transform = "translateY(" + y * 0.35 + "px)";
    });
  }

  // ---------------------------------------------------------------
  // Elements of Delight parallax: dog sketch reveals as section scrolls by
  // ---------------------------------------------------------------
  function initDelightParallax() {
    var section = document.querySelector(".delight");
    var bg = document.querySelector(".delight__bg");
    if (!section || !bg) return;

    registerScrollHandler(function () {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      // progress reaches 1 exactly when the section is vertically centered in the viewport
      var progress = (2 * (vh - rect.top)) / (vh + rect.height);
      progress = Math.max(0, Math.min(1, progress));
      var maxShift = rect.height * 0.25;
      var shift = maxShift - progress * (maxShift * 2);
      bg.style.transform = "translateY(" + shift + "px)";
    });
  }

  // ---------------------------------------------------------------
  // Hero letter-by-letter animation
  // ---------------------------------------------------------------
  function splitTextToSpans(el, baseDelay, perCharDelay) {
    var text = el.textContent;
    el.textContent = "";
    var chars = Array.prototype.slice.call(text);
    var wordEl = null;
    chars.forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "char" + (ch === " " ? " char--space" : "");
      span.textContent = ch;
      span.style.animationDelay = baseDelay + i * perCharDelay + "ms";
      if (ch === " ") {
        el.appendChild(span);
        wordEl = null;
      } else {
        if (!wordEl) {
          wordEl = document.createElement("span");
          wordEl.className = "word";
          el.appendChild(wordEl);
        }
        wordEl.appendChild(span);
      }
    });
    return chars.length;
  }

  function initHeroLetterAnimation() {
    var titleEl = document.querySelector(".hero__title[data-split-text]");
    var subtitleEl = document.querySelector(".hero__subtitle[data-split-text]");
    if (titleEl) {
      var titleCharCount = splitTextToSpans(titleEl, 0, 30);
      if (subtitleEl) {
        splitTextToSpans(subtitleEl, titleCharCount * 30 + 300, 20);
      }
    }

    var others = document.querySelectorAll(
      "[data-split-text]:not(.hero__title):not(.hero__subtitle)"
    );
    others.forEach(function (el) { splitTextToSpans(el, 0, 20); });
  }

  // ---------------------------------------------------------------
  // Letter-by-letter reveal, triggered on scroll-into-view
  // ---------------------------------------------------------------
  function initSplitOnScrollReveal() {
    var els = document.querySelectorAll("[data-split-reveal]");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { splitTextToSpans(el, 0, 20); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          splitTextToSpans(entry.target, 0, 20);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );

    els.forEach(function (el) { observer.observe(el); });
  }

  // ---------------------------------------------------------------
  // Hero bottom-center hotspot -> cursor morph + smooth scroll
  // ---------------------------------------------------------------
  function initHeroHotspotScroll() {
    var hotspot = document.querySelector(".hero__hotspot");
    if (!hotspot) return;

    hotspot.addEventListener("mouseenter", function () {
      cursorController.setHotspot(true);
      cursorController.setLabel("Scroll");
    });
    hotspot.addEventListener("mouseleave", function () {
      cursorController.setHotspot(false);
      cursorController.setLabel("");
    });

    hotspot.addEventListener("click", function () {
      if (!mainContentEl) return;
      var targetY = mainContentEl.getBoundingClientRect().top + window.scrollY - navHeightPx();
      window.scrollTo({ top: targetY, behavior: "smooth" });
    });
  }

  // ---------------------------------------------------------------
  // Main nav (Work/About) hover -> cursor reads "Scroll To ↓"
  // ---------------------------------------------------------------
  function initSiteNavCursor() {
    var links = document.querySelectorAll(".site-nav__link");
    links.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("Go To", RIGHT_ARROW_ICON);
      });
      link.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    });

    var logoLink = document.querySelector(".site-nav__logo-link");
    if (logoLink) {
      logoLink.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("Home", HOME_ICON);
      });
      logoLink.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    }
  }

  // ---------------------------------------------------------------
  // Project nav hover -> cursor morph to "Go to"
  // ---------------------------------------------------------------
  function initProjectNavCursor() {
    var links = document.querySelectorAll(".project-nav__link");
    links.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("Go to");
      });
      link.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    });

    var backLink = document.querySelector(".project-nav__back");
    if (backLink) {
      backLink.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("Home");
      });
      backLink.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    }
  }

  // ---------------------------------------------------------------
  // Delivery thumbnails hover -> cursor reads "Open"
  // ---------------------------------------------------------------
  function initDeliveryThumbnailCursor() {
    var thumbs = document.querySelectorAll(".delivery-column__image");
    thumbs.forEach(function (thumb) {
      thumb.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("Open");
      });
      thumb.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    });
  }

  // ---------------------------------------------------------------
  // Home hero typewriter — types line 1, pauses, types line 2
  // (with an italicized word and an animated word), cursor blinks
  // between/after, then disappears for good.
  // ---------------------------------------------------------------
  function initHomeTypewriter() {
    var line1El = document.querySelector('[data-tw-line="1"]');
    var line2El = document.querySelector('[data-tw-line="2"]');
    var cursor1 = document.querySelector('[data-tw-cursor="1"]');
    var cursor2 = document.querySelector('[data-tw-cursor="2"]');
    if (!line1El || !line2El || !cursor1 || !cursor2) return;

    var CHAR_DELAY = 45;
    var BLINK_MS = 1000;

    function typePlainText(container, text, index, cb) {
      if (index >= text.length) { cb(); return; }
      var span = document.createElement("span");
      span.textContent = text[index];
      container.appendChild(span);
      setTimeout(function () { typePlainText(container, text, index + 1, cb); }, CHAR_DELAY);
    }

    function typePerLetterWord(container, text, index, cb) {
      if (index >= text.length) { cb(); return; }
      var span = document.createElement("span");
      span.className = "interaction-letter";
      span.textContent = text[index];
      container.appendChild(span);
      setTimeout(function () { typePerLetterWord(container, text, index + 1, cb); }, CHAR_DELAY);
    }

    function triggerWordWave(wordEl) {
      var letters = wordEl.querySelectorAll(".interaction-letter");
      letters.forEach(function (letter, i) {
        letter.style.animationDelay = i * 60 + "ms";
        letter.classList.add("wave");
      });
    }

    function typeSegments(container, segments, segIndex, cb) {
      if (segIndex >= segments.length) { cb(); return; }
      var seg = segments[segIndex];
      if (seg.break) {
        container.appendChild(document.createElement("br"));
        typeSegments(container, segments, segIndex + 1, cb);
        return;
      }
      var target = container;
      if (seg.tag) {
        target = document.createElement(seg.tag);
        if (seg.className) target.className = seg.className;
        container.appendChild(target);
      }
      if (seg.perLetter) {
        typePerLetterWord(target, seg.text, 0, function () {
          triggerWordWave(target);
          typeSegments(container, segments, segIndex + 1, cb);
        });
      } else {
        typePlainText(target, seg.text, 0, function () {
          typeSegments(container, segments, segIndex + 1, cb);
        });
      }
    }

    cursor1.classList.add("is-active");
    typePlainText(line1El, "Hi, I’m Tiffany.", 0, function () {
      setTimeout(function () {
        cursor1.classList.remove("is-active");
        cursor2.classList.add("is-active");
        var line2Segments = [
          { text: "I am a designer who meets", tag: null },
          { break: true },
          { text: "identity", tag: "em" },
          { text: " with ", tag: null },
          { text: "interaction", tag: "span", className: "interaction-word", perLetter: true },
          { text: ".", tag: null }
        ];
        typeSegments(line2El, line2Segments, 0, function () {
          setTimeout(function () {
            cursor2.classList.remove("is-active");
            cursor2.classList.add("is-hidden");
          }, BLINK_MS * 4);
        });
      }, BLINK_MS * 1.5);
    });
  }

  // ---------------------------------------------------------------
  // "Read more" (about preview) hover -> cursor shows a right arrow
  // ---------------------------------------------------------------
  function initAboutPreviewCursor() {
    var cta = document.querySelector(".about-preview__cta");
    if (!cta) return;
    cta.addEventListener("mouseenter", function () {
      cursorController.setHotspot(true);
      cursorController.setLabel("", RIGHT_ARROW_ICON);
    });
    cta.addEventListener("mouseleave", function () {
      cursorController.setHotspot(false);
      cursorController.setLabel("");
    });
  }

  // ---------------------------------------------------------------
  // Home work tile hover -> cursor reads "View" (linked tile only)
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  // Fill in project tiles (Home work grid, every "More Work" grid)
  // from the shared PROJECTS registry above.
  // ---------------------------------------------------------------
  function initProjectThumbnails() {
    var slots = document.querySelectorAll("[data-project]");
    slots.forEach(function (slot) {
      var project = PROJECTS[slot.getAttribute("data-project")];
      if (!project) return;
      slot.setAttribute("href", project.href);
      slot.setAttribute("aria-label", "View the " + project.name + " case study");

      var img = document.createElement("img");
      img.src = project.thumb;
      img.alt = project.name + " case study thumbnail";
      img.className = "home-work__tile-image";
      slot.appendChild(img);

      var hoverImg = document.createElement("img");
      hoverImg.src = project.thumbHover;
      hoverImg.alt = "";
      hoverImg.setAttribute("aria-hidden", "true");
      hoverImg.className = "home-work__tile-image home-work__tile-image--hover";
      slot.appendChild(hoverImg);

      var label = document.createElement("h3");
      label.className = "home-work__tile-label";
      label.textContent = project.name;
      slot.appendChild(label);
    });
  }

  function initWorkTileCursor() {
    var EYE_ICON =
      '<svg class="custom-cursor__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="2"/>' +
      "</svg>";

    var links = document.querySelectorAll(".home-work__tile--link");
    links.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("View Project", EYE_ICON);
      });
      link.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    });
  }

  // ---------------------------------------------------------------
  // AI rendering container hover -> cursor turns white
  // ---------------------------------------------------------------
  function initRenderingCursor() {
    var wrap = document.querySelector(".rendering-frame__image-wrap");
    if (!wrap) return;
    wrap.addEventListener("mouseenter", function () { cursorController.setLight(true); });
    wrap.addEventListener("mouseleave", function () { cursorController.setLight(false); });
  }

  // ---------------------------------------------------------------
  // AI Rendering collapse/expand toggle
  // ---------------------------------------------------------------
  function initRenderingToggle() {
    var wrap = document.querySelector("[data-rendering-toggle]");
    if (!wrap) return;
    var buttons = wrap.querySelectorAll("[data-rendering-toggle-btn]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        wrap.classList.toggle("is-expanded");
      });
    });
  }

  // ---------------------------------------------------------------
  // Scroll reveal (text blocks + trait badges), one shared observer
  // ---------------------------------------------------------------
  function initScrollReveal() {
    var targets = document.querySelectorAll(".reveal, .badge");
    if (!targets.length || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var staggerIndex = el.getAttribute("data-stagger-index");
          if (staggerIndex !== null) {
            el.style.transitionDelay = parseInt(staggerIndex, 10) * 100 + "ms";
          }
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: REVEAL_MARGIN }
    );

    targets.forEach(function (el) { observer.observe(el); });
  }

  // ---------------------------------------------------------------
  // Project nav active-link highlighting
  // ---------------------------------------------------------------
  function initProjectNavActiveLink() {
    var sections = document.querySelectorAll(".content-column > .section[id]");
    var links = document.querySelectorAll(".project-nav__link");
    if (!sections.length || !links.length || !("IntersectionObserver" in window)) return;

    function setActive(id) {
      links.forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === "#" + id);
      });
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0, rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach(function (section) { observer.observe(section); });
  }

  // ---------------------------------------------------------------
  // Shared tooltip (trait badges + touchpoint dots)
  // ---------------------------------------------------------------
  var tooltipEl, tooltipTextEl, tooltipArrowEl, tooltipOpenTrigger = null, tooltipCloseCallback = null;

  function initTooltip() {
    tooltipEl = document.querySelector(".tooltip");
    if (!tooltipEl) return;
    tooltipTextEl = tooltipEl.querySelector(".tooltip__text");
    tooltipArrowEl = tooltipEl.querySelector(".tooltip__arrow");

    document.addEventListener("click", function (e) {
      if (!tooltipOpenTrigger) return;
      if (tooltipEl.contains(e.target) || tooltipOpenTrigger.contains(e.target)) return;
      closeTooltip();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeTooltip();
    });
    registerScrollHandler(function () { closeTooltip(); });
  }

  function closeTooltip() {
    if (!tooltipEl) return;
    tooltipEl.classList.remove("is-open");
    tooltipOpenTrigger = null;
    if (tooltipCloseCallback) {
      tooltipCloseCallback();
      tooltipCloseCallback = null;
    }
  }

  function openTooltip(triggerEl, text) {
    if (!tooltipEl) return;
    if (tooltipOpenTrigger === triggerEl) {
      closeTooltip();
      return;
    }
    tooltipTextEl.textContent = text;
    tooltipOpenTrigger = triggerEl;
    tooltipEl.classList.add("is-open");

    var rect = triggerEl.getBoundingClientRect();
    var tooltipRect = tooltipEl.getBoundingClientRect();
    var gap = 12;
    var top, placement;
    if (rect.top - tooltipRect.height - gap > 0) {
      top = rect.top - tooltipRect.height - gap;
      placement = "above";
    } else {
      top = rect.bottom + gap;
      placement = "below";
    }
    var left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipRect.width - 12));

    tooltipEl.style.top = top + "px";
    tooltipEl.style.left = left + "px";
    tooltipEl.classList.toggle("tooltip--above", placement === "above");
    tooltipEl.classList.toggle("tooltip--below", placement === "below");

    var arrowLeft = rect.left + rect.width / 2 - left;
    arrowLeft = Math.max(16, Math.min(arrowLeft, tooltipRect.width - 16));
    tooltipArrowEl.style.left = arrowLeft + "px";
  }

  // ---------------------------------------------------------------
  // Touchpoint dots -> tooltip
  // ---------------------------------------------------------------
  var TOUCHPOINT_DEFINITIONS = {
    "exhibit-onboarding": "Users register their wristbands and receive usernames.",
    "game-checkin": "Users scan in wristbands to queue up for the challenge. They can learn more science facts as they wait.",
    "contribution-kiosks": "Users can contribute their character points to help fill the communal tanks."
  };

  function initTouchpointTooltips() {
    var dots = document.querySelectorAll(".touchpoint-dot");
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var key = dot.getAttribute("data-touchpoint");

        document.querySelectorAll(".touchpoint-dot--selected").forEach(function (el) {
          el.classList.remove("touchpoint-dot--selected");
        });

        var group = document.querySelectorAll('.touchpoint-dot[data-touchpoint="' + key + '"]');
        group.forEach(function (el) { el.classList.add("touchpoint-dot--selected"); });
        tooltipCloseCallback = function () {
          group.forEach(function (el) { el.classList.remove("touchpoint-dot--selected"); });
        };

        openTooltip(dot, TOUCHPOINT_DEFINITIONS[key]);
      });
      dot.addEventListener("mouseenter", function () { cursorController.setHotspot(true); });
      dot.addEventListener("mouseleave", function () { cursorController.setHotspot(false); });
    });
  }

  // ---------------------------------------------------------------
  // Trait badges -> cursor "?" + tooltip
  // ---------------------------------------------------------------
  var TRAIT_DEFINITIONS = {
    curious: "Spark to learn, question, and ponder about the world and how it works.",
    tenacious: "Persistence and grit to embrace opportunities and challenges while exploring and experimenting.",
    collaborative: "Working together in a spirit of kindness to amplify and multiply the power of one.",
    dynamic: "Full of energy and new ideas; stimulating change by taking respectful action."
  };

  function initTraitTooltips() {
    var badges = document.querySelectorAll(".badge[data-trait]");
    badges.forEach(function (badge) {
      badge.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("?");
      });
      badge.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
      badge.addEventListener("click", function () {
        openTooltip(badge, TRAIT_DEFINITIONS[badge.getAttribute("data-trait")]);
      });
    });
  }

  // ---------------------------------------------------------------
  // About accordion rows (Experience/Education) + "expand all"
  // ---------------------------------------------------------------
  function setAccordionRowOpen(row, isOpen) {
    row.classList.toggle("is-open", isOpen);
    var toggle = row.querySelector(".accordion-row__toggle");
    if (toggle) toggle.setAttribute("aria-expanded", String(isOpen));
  }

  function accordionGroupRows(scope) {
    return document.querySelectorAll('.accordion-row[data-accordion-group="' + scope + '"]');
  }

  function accordionGroupAllOpen(scope) {
    var scopedRows = accordionGroupRows(scope);
    return scopedRows.length > 0 && Array.prototype.every.call(scopedRows, function (r) {
      return r.classList.contains("is-open");
    });
  }

  // Groups with a dedicated bottom "Collapse all" link (data-collapse-all)
  // keep the top link fixed on "Expand all" and only reveal the bottom
  // link once every row in the group is open. Groups without one (About's
  // Experience/Education) keep the single link toggling in place.
  function syncAccordionGroupUI(scope) {
    var collapseLink = document.querySelector('[data-collapse-all="' + scope + '"]');
    if (!collapseLink) return;
    var footer = collapseLink.closest(".workshop-accordion__footer") || collapseLink.parentElement;
    footer.classList.toggle("is-visible", accordionGroupAllOpen(scope));
  }

  function initAccordions() {
    var rows = document.querySelectorAll(".accordion-row");
    if (!rows.length) return;

    rows.forEach(function (row) {
      var toggle = row.querySelector(".accordion-row__toggle");
      if (!toggle) return;
      toggle.addEventListener("click", function () {
        setAccordionRowOpen(row, !row.classList.contains("is-open"));
        var scope = row.getAttribute("data-accordion-group");
        if (scope) syncAccordionGroupUI(scope);
      });
      toggle.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("See more");
      });
      toggle.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    });

    var expandAllLinks = document.querySelectorAll("[data-expand-all]");
    expandAllLinks.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("", PLUS_ICON);
      });
      link.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var scope = link.getAttribute("data-expand-all");
        var scopedRows = accordionGroupRows(scope);
        var hasCollapseLink = !!document.querySelector('[data-collapse-all="' + scope + '"]');

        if (hasCollapseLink) {
          scopedRows.forEach(function (r) { setAccordionRowOpen(r, true); });
          syncAccordionGroupUI(scope);
        } else {
          var allOpen = accordionGroupAllOpen(scope);
          scopedRows.forEach(function (r) { setAccordionRowOpen(r, !allOpen); });
          link.textContent = allOpen ? "Expand all" : "Collapse all";
        }
      });
    });

    var collapseAllLinks = document.querySelectorAll("[data-collapse-all]");
    collapseAllLinks.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("", MINUS_ICON);
      });
      link.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var scope = link.getAttribute("data-collapse-all");
        accordionGroupRows(scope).forEach(function (r) { setAccordionRowOpen(r, false); });
        syncAccordionGroupUI(scope);
      });
    });
  }

  // ---------------------------------------------------------------
  // Carousel factory — used for both Discovery and Prototyping carousels
  // ---------------------------------------------------------------
  function createCarousel(rootEl, options) {
    if (!rootEl) return null;
    var loop = !!(options && options.loop);

    var track = rootEl.querySelector(".carousel-track");
    var slides = Array.prototype.slice.call(rootEl.querySelectorAll(".carousel-slide"));
    var prevBtn = rootEl.querySelector(".carousel-arrow--prev");
    var nextBtn = rootEl.querySelector(".carousel-arrow--next");
    var dotsContainer = rootEl.querySelector(".carousel-dots");
    var currentIndex = 0;
    var isClickScrolling = false;

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to slide " + (i + 1));
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", function () { goToSlide(i); });
      dotsContainer.appendChild(dot);
    });

    var dotEls = Array.prototype.slice.call(dotsContainer.children);

    function updateActiveDot(index) {
      dotEls.forEach(function (d, i) { d.classList.toggle("is-active", i === index); });
    }

    function goToSlide(index) {
      index = loop
        ? (index + slides.length) % slides.length
        : Math.max(0, Math.min(index, slides.length - 1));
      currentIndex = index;
      isClickScrolling = true;
      track.scrollTo({ left: slides[index].offsetLeft, behavior: "smooth" });
      updateActiveDot(index);
      window.setTimeout(function () { isClickScrolling = false; }, 500);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goToSlide(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goToSlide(currentIndex + 1); });

    var scrollTicking = false;
    track.addEventListener(
      "scroll",
      function () {
        if (isClickScrolling || scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(function () {
          var nearest = Math.round(track.scrollLeft / track.clientWidth);
          if (nearest !== currentIndex) {
            currentIndex = nearest;
            updateActiveDot(currentIndex);
          }
          scrollTicking = false;
        });
      },
      { passive: true }
    );

    return {
      goToSlide: goToSlide,
      getCurrentIndex: function () { return currentIndex; },
      slideCount: slides.length
    };
  }

  // ---------------------------------------------------------------
  // Discovery carousel arrow hover -> cursor previews the adjacent topic
  // ---------------------------------------------------------------
  function initDiscoveryCarouselCursor(carousel, rootEl) {
    if (!carousel || !rootEl) return;
    var TOPICS = ["Contextual Inquiry", "Subject Matter Interviews", "Affinity Clustering", "Paper Prototyping"];
    var prevBtn = rootEl.querySelector(".carousel-arrow--prev");
    var nextBtn = rootEl.querySelector(".carousel-arrow--next");
    var count = carousel.slideCount;

    if (prevBtn) {
      prevBtn.addEventListener("mouseenter", function () {
        var targetIndex = (carousel.getCurrentIndex() - 1 + count) % count;
        cursorController.setHotspot(true);
        cursorController.setLabel(TOPICS[targetIndex]);
      });
      prevBtn.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("mouseenter", function () {
        var targetIndex = (carousel.getCurrentIndex() + 1) % count;
        cursorController.setHotspot(true);
        cursorController.setLabel(TOPICS[targetIndex]);
      });
      nextBtn.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    }
  }

  // ---------------------------------------------------------------
  // Testing carousel arrow hover -> cursor previews the adjacent slide
  // ---------------------------------------------------------------
  function initTestingCarouselCursor(carousel, rootEl) {
    if (!carousel || !rootEl) return;
    var TOPICS = ["Session 1", "Session 2", "Key Takeaways"];
    var prevBtn = rootEl.querySelector(".carousel-arrow--prev");
    var nextBtn = rootEl.querySelector(".carousel-arrow--next");
    var count = carousel.slideCount;

    if (prevBtn) {
      prevBtn.addEventListener("mouseenter", function () {
        var targetIndex = Math.max(0, carousel.getCurrentIndex() - 1);
        cursorController.setHotspot(true);
        cursorController.setLabel(TOPICS[targetIndex]);
      });
      prevBtn.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("mouseenter", function () {
        var targetIndex = Math.min(count - 1, carousel.getCurrentIndex() + 1);
        cursorController.setHotspot(true);
        cursorController.setLabel(TOPICS[targetIndex]);
      });
      nextBtn.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    }
  }

  function initCarousels() {
    var discoveryEl = document.getElementById("discovery-carousel");
    var discoveryCarousel = createCarousel(discoveryEl, { loop: true });
    initDiscoveryCarouselCursor(discoveryCarousel, discoveryEl);

    var prototypingEl = document.getElementById("prototyping-carousel");
    var prototypingCarousel = createCarousel(prototypingEl);
    initTestingCarouselCursor(prototypingCarousel, prototypingEl);
  }

  // ---------------------------------------------------------------
  // Before/after comparison slider
  // ---------------------------------------------------------------
  function createBeforeAfterSlider(rootEl) {
    if (!rootEl) return null;
    var frame = rootEl.querySelector(".before-after__frame");
    var handle = rootEl.querySelector(".before-after__handle");
    if (!frame || !handle) return null;

    var dragging = false;

    function setSplit(percent) {
      percent = Math.max(0, Math.min(100, percent));
      frame.style.setProperty("--split", percent + "%");
      handle.setAttribute("aria-valuenow", String(Math.round(percent)));
    }

    function percentFromClientX(clientX) {
      var rect = frame.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    function onPointerMove(e) {
      if (!dragging) return;
      setSplit(percentFromClientX(e.clientX));
    }

    function onPointerUp() {
      dragging = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    handle.addEventListener("pointerdown", function (e) {
      dragging = true;
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      e.preventDefault();
    });

    frame.addEventListener("pointerdown", function (e) {
      if (e.target === handle || handle.contains(e.target)) return;
      setSplit(percentFromClientX(e.clientX));
    });

    handle.addEventListener("keydown", function (e) {
      var current = parseFloat(frame.style.getPropertyValue("--split")) || 50;
      if (e.key === "ArrowLeft") { setSplit(current - 5); e.preventDefault(); }
      else if (e.key === "ArrowRight") { setSplit(current + 5); e.preventDefault(); }
      else if (e.key === "Home") { setSplit(0); e.preventDefault(); }
      else if (e.key === "End") { setSplit(100); e.preventDefault(); }
    });

    setSplit(50);
    return { setSplit: setSplit };
  }

  function initBeforeAfterSliders() {
    document.querySelectorAll("[data-before-after]").forEach(function (el) {
      createBeforeAfterSlider(el);
    });
  }

  // ---------------------------------------------------------------
  // Back to top
  // ---------------------------------------------------------------
  function initBackToTop() {
    var btn = document.querySelector(".back-to-top");
    if (!btn) return;
    registerScrollHandler(function (y) {
      btn.classList.toggle("is-visible", y > heroHeight());
    });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    btn.addEventListener("mouseenter", function () {
      cursorController.setHotspot(true);
      cursorController.setLabel("Top");
    });
    btn.addEventListener("mouseleave", function () {
      cursorController.setHotspot(false);
      cursorController.setLabel("");
    });
  }

  // ---------------------------------------------------------------
  // Footer copyright year
  // ---------------------------------------------------------------
  function initCopyrightYear() {
    var els = document.querySelectorAll("[data-current-year]");
    els.forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  // ---------------------------------------------------------------
  // Fallback cursor: any other hoverable link/button that doesn't
  // have its own cursor treatment above still turns into the lime
  // hotspot pill (no label) so it reads as clickable. Must run last,
  // after carousel dots and other dynamically-created controls exist.
  // ---------------------------------------------------------------
  function initDefaultHoverCursor() {
    var HANDLED_SELECTOR = [
      ".site-nav__link",
      ".site-nav__logo-link",
      ".project-nav__link",
      ".project-nav__back",
      ".home-work__tile--link",
      ".about-preview__cta",
      ".delivery-column",
      ".badge[data-trait]",
      ".accordion-row__toggle",
      "[data-expand-all]",
      ".carousel-arrow--prev",
      ".carousel-arrow--next",
      ".back-to-top",
      ".touchpoint-dot",
      ".hero__hotspot",
      ".dg-nav__link",
      ".dg-nav__logo-link",
      ".dg-thumb",
    ].join(", ");

    document.querySelectorAll("a, button").forEach(function (el) {
      if (el.matches(HANDLED_SELECTOR)) return;
      el.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
      });
      el.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
      });
    });
  }

  // ---------------------------------------------------------------
  // Gallery lightbox — click any bento/row image to enlarge, with
  // prev/next navigation scoped to that image's own .project-gallery
  // ---------------------------------------------------------------
  function initGalleryLightbox() {
    var galleries = document.querySelectorAll(".project-gallery");
    if (!galleries.length) return;

    var overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.innerHTML =
      '<button type="button" class="lightbox__close" aria-label="Close">&times;</button>' +
      '<button type="button" class="lightbox__arrow lightbox__arrow--prev" aria-label="Previous image">&#8249;</button>' +
      '<img class="lightbox__image" alt="">' +
      '<button type="button" class="lightbox__arrow lightbox__arrow--next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(overlay);

    var imageEl = overlay.querySelector(".lightbox__image");
    var closeBtn = overlay.querySelector(".lightbox__close");
    var prevBtn = overlay.querySelector(".lightbox__arrow--prev");
    var nextBtn = overlay.querySelector(".lightbox__arrow--next");

    var currentImages = [];
    var currentIndex = 0;

    function show() {
      var img = currentImages[currentIndex];
      imageEl.src = img.currentSrc || img.src;
      imageEl.alt = img.alt || "";
    }

    function open(images, index) {
      currentImages = images;
      currentIndex = index;
      show();
      overlay.classList.add("is-open");
      document.body.classList.add("lightbox-open");
    }

    function close() {
      overlay.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
      imageEl.src = "";
    }

    function next() {
      currentIndex = (currentIndex + 1) % currentImages.length;
      show();
    }

    function prev() {
      currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
      show();
    }

    closeBtn.addEventListener("click", close);
    nextBtn.addEventListener("click", next);
    prevBtn.addEventListener("click", prev);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    });

    galleries.forEach(function (gallery) {
      var images = Array.prototype.slice.call(gallery.querySelectorAll("img"));
      images.forEach(function (img, index) {
        img.addEventListener("click", function () {
          open(images, index);
        });
        img.addEventListener("mouseenter", function () {
          cursorController.setHotspot(true);
          cursorController.setLabel("View");
        });
        img.addEventListener("mouseleave", function () {
          cursorController.setHotspot(false);
          cursorController.setLabel("");
        });
      });
    });
  }

  // ---------------------------------------------------------------
  // Delight gallery (delight.html) — pinned/hijacked horizontal scroll
  // with two parallax tracks per section.
  // ---------------------------------------------------------------
  function initDelightGalleryScroll() {
    var galleryEl = document.querySelector("[data-dg-gallery]");
    if (!galleryEl || !supportsGalleryHijack) return;

    var spacerEl = galleryEl.querySelector("[data-dg-spacer]");
    var pinEl = galleryEl.querySelector("[data-dg-pin]");
    var stripEl = galleryEl.querySelector("[data-dg-strip]");
    var bgEl = galleryEl.querySelector("[data-dg-bg]");
    var sections = Array.prototype.slice.call(galleryEl.querySelectorAll("[data-dg-section]"));
    var tracks = Array.prototype.slice.call(galleryEl.querySelectorAll("[data-dg-track]"));
    var navLinks = document.querySelectorAll(".dg-nav__link[data-dg-nav]");
    if (!spacerEl || !stripEl || sections.length < 2) return;

    var travelDistance = 0;

    function measure() {
      // Drive each section's width from this same window.innerWidth value
      // (via --dg-vw, read by .dg-section's flex-basis) instead of letting
      // CSS use 100vw — on a system where the vertical scrollbar reserves
      // layout space, 100vw and window.innerWidth disagree by its width,
      // which would drift the two out of sync more with each section.
      galleryEl.style.setProperty("--dg-vw", window.innerWidth + "px");
      travelDistance = (sections.length - 1) * window.innerWidth;
      spacerEl.style.height = window.innerHeight + travelDistance + "px";

      // The background parallax (applyProgress below) pans left by up to
      // travelDistance * 0.4, i.e. (sections.length - 1) * 40% of a
      // viewport width — .dg-gallery__bg must be at least that much wider
      // than 100% or it exposes a gap at the trailing edge. Computed here
      // (not hardcoded in CSS) so adding/removing a section can't drift out
      // of sync with this.
      galleryEl.style.setProperty("--dg-bg-w", 100 + (sections.length - 1) * 40 + "%");
    }
    measure();
    window.addEventListener("resize", measure);

    var lastActiveIndex = -1;

    function applyProgress(progress) {
      progress = Math.max(0, Math.min(1, progress));

      stripEl.style.transform = "translateX(" + -progress * travelDistance + "px)";

      if (bgEl) {
        // transform (not background-position) so repositioning the pattern
        // is a compositor-only operation — some browsers paint a large
        // repeat-tiled background incompletely when its background-position
        // is updated every scroll frame, leaving a gap near one edge. The
        // element itself is oversized (see .dg-gallery__bg CSS) so sliding it
        // via transform can never expose a gap at either extreme.
        bgEl.style.transform = "translateX(" + -progress * travelDistance * 0.4 + "px)";
      }

      tracks.forEach(function (track) {
        var speed = parseFloat(track.getAttribute("data-dg-speed")) || 0;
        track.style.transform = "translateX(" + progress * speed + "px)";
      });

      var activeIndex = Math.round(progress * (sections.length - 1));
      if (activeIndex !== lastActiveIndex) {
        navLinks.forEach(function (link, i) {
          link.classList.toggle("is-active", i === activeIndex);
        });
        // Some browsers leave an opacity change stuck showing its old value
        // on an element nested inside this position:fixed nav until
        // something forces a reflow — nudge one so the sparkle indicator
        // actually repaints. Only needed once per section change, not every
        // scroll frame, so this stays cheap.
        navLinks.forEach(function (link) {
          var sparkle = link.querySelector(".dg-nav__sparkle");
          if (!sparkle) return;
          sparkle.style.display = "none";
          void sparkle.offsetHeight;
          sparkle.style.display = "";
        });
        lastActiveIndex = activeIndex;
      }
    }
    applyProgress(0);

    registerScrollHandler(function () {
      var rect = spacerEl.getBoundingClientRect();
      var progress = travelDistance > 0 ? -rect.top / travelDistance : 0;
      applyProgress(progress);
    });

    function scrollToIndex(index, behavior) {
      var targetProgress = sections.length > 1 ? index / (sections.length - 1) : 0;
      var spacerTop = spacerEl.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: spacerTop + targetProgress * travelDistance, behavior: behavior });
      // An instant jump (deep-link on load) has no scroll animation to drive
      // the scroll-event/rAF handler, so apply the matching visual state
      // synchronously instead of waiting for a scroll event that may not
      // arrive before the user sees the page. A "smooth" jump (nav click)
      // skips this — its own scroll events drive the visible glide.
      if (behavior !== "smooth") {
        applyProgress(targetProgress);
        // A large instant jump can leave this sticky pin's children briefly
        // mis-positioned until the browser settles sticky layout on its own
        // next pass. Force that settlement (toggle display to force a
        // reflow) rather than hope it resolves on its own, then re-apply.
        setTimeout(function () {
          [pinEl, bgEl, stripEl].forEach(function (el) {
            if (!el) return;
            el.style.display = "none";
            void el.offsetHeight;
            el.style.display = "";
          });
          applyProgress(targetProgress);
        }, 50);
      }
    }

    navLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        scrollToIndex(parseInt(link.getAttribute("data-dg-nav"), 10), "smooth");
      });
    });

    // Deep links (e.g. from the Home page's "Elements of Delight" tiles)
    // land here as delight.html#dg-section-menu-designs. Native anchor
    // scrolling can't find the right spot since sections are positioned by
    // JS transform, not document flow, so jump manually once on load.
    if (window.location.hash) {
      var targetIndex = sections.findIndex(function (section) {
        return "#" + section.id === window.location.hash;
      });
      if (targetIndex !== -1) {
        scrollToIndex(targetIndex, "auto");
      }
    }

    // Let a horizontal wheel/trackpad gesture also drive the gallery, on top
    // of native vertical scroll. Forwarding into window.scrollBy keeps a
    // single source of truth (window.scrollY) driving progress above, and
    // preventDefault here also blocks the browser's swipe-back/forward
    // navigation gesture that horizontal input can trigger on a page with
    // no horizontal overflow.
    galleryEl.addEventListener(
      "wheel",
      function (e) {
        if (e.deltaX === 0) return;
        e.preventDefault();
        window.scrollBy(0, e.deltaX + e.deltaY);
      },
      { passive: false }
    );
  }

  function initDelightGalleryNavCursor() {
    var links = document.querySelectorAll(".dg-nav__link");
    links.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("Go to", RIGHT_ARROW_ICON);
      });
      link.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    });

    var logoLink = document.querySelector(".dg-nav__logo-link");
    if (logoLink) {
      logoLink.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("Home", HOME_ICON);
      });
      logoLink.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    }
  }

  function initDelightThumbPopup() {
    var overlay = document.querySelector("[data-dg-popup]");
    if (!overlay) return;

    var imageEl = overlay.querySelector("[data-dg-popup-image]");
    var closeBtn = overlay.querySelector("[data-dg-popup-close]");
    var thumbs = document.querySelectorAll(".dg-thumb");
    if (!imageEl) return;

    function open(project) {
      var data = DELIGHT_PROJECTS[project];
      if (!data) return;
      imageEl.src = data.full;
      imageEl.alt = data.name;
      overlay.classList.add("is-open");
      document.body.classList.add("dg-popup-open");
    }

    function close() {
      overlay.classList.remove("is-open");
      document.body.classList.remove("dg-popup-open");
      imageEl.src = "";
    }

    thumbs.forEach(function (thumb) {
      // Menu Designs and Apparel Design aren't ready yet — leave their
      // thumbs with no click handler and no "View" hover affordance (still
      // excluded from the generic hover cursor sweep via HANDLED_SELECTOR),
      // so they read as inert rather than promising a popup that doesn't
      // apply yet.
      if (thumb.closest("#dg-section-menu-designs, #dg-section-apparel-design")) return;

      thumb.addEventListener("click", function () {
        open(thumb.getAttribute("data-dg-project"));
      });
      thumb.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("View");
      });
      thumb.addEventListener("mouseleave", function () {
        cursorController.setHotspot(false);
        cursorController.setLabel("");
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
    });
  }

  // ---------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    initCustomCursor();
    initProjectThumbnails();
    initNavScrollState();
    initHeroParallax();
    initDelightParallax();
    initHeroLetterAnimation();
    initSplitOnScrollReveal();
    initScrollReveal();
    initProjectNavActiveLink();
    initSiteNavCursor();
    initProjectNavCursor();
    initDeliveryThumbnailCursor();
    initHomeTypewriter();
    initAboutPreviewCursor();
    initWorkTileCursor();
    initRenderingCursor();
    initRenderingToggle();
    initTooltip();
    initTouchpointTooltips();
    initTraitTooltips();
    initCarousels();
    initBeforeAfterSliders();
    initBackToTop();
    initHeroHotspotScroll();
    initAccordions();
    initGalleryLightbox();
    initDelightGalleryScroll();
    initDelightGalleryNavCursor();
    initDelightThumbPopup();
    initCopyrightYear();
    initDefaultHoverCursor();
  });
})();
