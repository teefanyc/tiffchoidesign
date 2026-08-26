(function () {
  "use strict";

  var NAV_SCROLL_THRESHOLD = 100;
  var REVEAL_MARGIN = "0px 0px -10% 0px";
  var isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var heroEl = document.querySelector(".hero");
  var mainContentEl = document.querySelector(".main-content");
  var siteNavEl = document.querySelector(".site-nav");

  function heroHeight() {
    return heroEl ? heroEl.offsetHeight : 811;
  }

  function navHeightPx() {
    var value = getComputedStyle(document.documentElement).getPropertyValue("--nav-height");
    return parseInt(value, 10) || 104;
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
    cursorController.setLabel = function (text) {
      labelEl.textContent = text || "";
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
  // Hero letter-by-letter animation
  // ---------------------------------------------------------------
  function splitTextToSpans(el, baseDelay, perCharDelay) {
    var text = el.textContent;
    el.textContent = "";
    var chars = Array.prototype.slice.call(text);
    chars.forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "char" + (ch === " " ? " char--space" : "");
      span.textContent = ch === " " ? " " : ch;
      span.style.animationDelay = baseDelay + i * perCharDelay + "ms";
      el.appendChild(span);
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
        cursorController.setLabel("Go To");
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
        cursorController.setLabel("Home");
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
          }, BLINK_MS * 2);
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
      cursorController.setLabel("→");
    });
    cta.addEventListener("mouseleave", function () {
      cursorController.setHotspot(false);
      cursorController.setLabel("");
    });
  }

  // ---------------------------------------------------------------
  // Home work tile hover -> cursor reads "View" (linked tile only)
  // ---------------------------------------------------------------
  function initWorkTileCursor() {
    var links = document.querySelectorAll(".home-work__tile--link");
    links.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        cursorController.setHotspot(true);
        cursorController.setLabel("View");
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

  function initAccordions() {
    var rows = document.querySelectorAll(".accordion-row");
    if (!rows.length) return;

    rows.forEach(function (row) {
      var toggle = row.querySelector(".accordion-row__toggle");
      if (!toggle) return;
      toggle.addEventListener("click", function () {
        setAccordionRowOpen(row, !row.classList.contains("is-open"));
      });
    });

    var expandAllLinks = document.querySelectorAll("[data-expand-all]");
    expandAllLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var scope = link.getAttribute("data-expand-all");
        var scopedRows = document.querySelectorAll(
          '.accordion-row[data-accordion-group="' + scope + '"]'
        );
        var allOpen = Array.prototype.every.call(scopedRows, function (r) {
          return r.classList.contains("is-open");
        });
        scopedRows.forEach(function (r) { setAccordionRowOpen(r, !allOpen); });
        link.textContent = allOpen ? "Expand all" : "Collapse all";
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
  }

  // ---------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    initCustomCursor();
    initNavScrollState();
    initHeroParallax();
    initHeroLetterAnimation();
    initScrollReveal();
    initProjectNavActiveLink();
    initSiteNavCursor();
    initProjectNavCursor();
    initDeliveryThumbnailCursor();
    initHomeTypewriter();
    initAboutPreviewCursor();
    initWorkTileCursor();
    initRenderingCursor();
    initTooltip();
    initTouchpointTooltips();
    initTraitTooltips();
    initCarousels();
    initBackToTop();
    initHeroHotspotScroll();
    initAccordions();
  });
})();
