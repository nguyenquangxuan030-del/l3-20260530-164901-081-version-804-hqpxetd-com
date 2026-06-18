(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function setupMobileMenu() {
    var button = document.querySelector("[data-menu-button]");
    var nav = document.querySelector("[data-site-nav]");
    var search = document.querySelector(".nav-search");

    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      if (search) {
        search.classList.toggle("is-open");
      }
    });
  }

  function setupCoverFallbacks() {
    var images = document.querySelectorAll("img[data-cover-image]");

    images.forEach(function (image) {
      image.addEventListener("error", function () {
        var wrap = image.closest(".poster-wrap") || image.closest(".rank-cover");
        if (wrap) {
          wrap.classList.add("cover-fallback");
        }
        image.style.opacity = "0";
      });
    });
  }

  function setupHeroCarousel() {
    var carousel = document.querySelector("[data-hero-carousel]");

    if (!carousel) {
      return;
    }

    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
    var backgrounds = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-bg]"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
    var prev = carousel.querySelector("[data-hero-prev]");
    var next = carousel.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    if (slides.length === 0) {
      return;
    }

    function show(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });

      backgrounds.forEach(function (background, backgroundIndex) {
        background.classList.toggle("is-active", backgroundIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);

    show(0);
    start();
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setupFilters() {
    var searchInput = document.querySelector("[data-local-search]");
    var yearFilter = document.querySelector("[data-year-filter]");
    var container = document.querySelector("[data-filter-targets]");
    var empty = document.querySelector("[data-empty-state]");

    if (!container) {
      return;
    }

    var cards = Array.prototype.slice.call(container.querySelectorAll("[data-movie-card]"));

    function applyQueryFromUrl() {
      if (!searchInput || !searchInput.hasAttribute("data-query-sync")) {
        return;
      }
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q");
      if (query) {
        searchInput.value = query;
      }
    }

    function matchesYear(card, yearValue) {
      if (!yearValue) {
        return true;
      }
      var year = parseInt(card.getAttribute("data-year") || "0", 10);
      var selected = parseInt(yearValue, 10);
      if (selected === 2022) {
        return year <= 2022;
      }
      return year === selected;
    }

    function filterCards() {
      var query = normalize(searchInput ? searchInput.value : "");
      var yearValue = yearFilter ? yearFilter.value : "";
      var visible = 0;

      cards.forEach(function (card) {
        var text = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-year")
        ].join(" "));

        var matched = (!query || text.indexOf(query) !== -1) && matchesYear(card, yearValue);
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    applyQueryFromUrl();

    if (searchInput) {
      searchInput.addEventListener("input", filterCards);
    }

    if (yearFilter) {
      yearFilter.addEventListener("change", filterCards);
    }

    filterCards();
  }

  function setupPlayers() {
    var players = document.querySelectorAll("[data-player]");

    players.forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector("[data-play-button]");
      var status = player.querySelector("[data-player-status]");
      var source = player.getAttribute("data-src");
      var hlsInstance = null;
      var initialized = false;

      if (!video || !source) {
        return;
      }

      video.crossOrigin = "anonymous";

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function attachSource() {
        if (initialized) {
          return;
        }

        initialized = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          setStatus("正在使用原生 HLS 播放");
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
          });

          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);

          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus("播放源已加载");
          });

          hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
            if (data && data.fatal) {
              setStatus("播放源加载异常，请稍后重试");
            }
          });

          return;
        }

        video.src = source;
        setStatus("浏览器正在尝试直接播放");
      }

      function playVideo() {
        attachSource();
        player.classList.add("is-playing");
        setStatus("正在播放");

        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            player.classList.remove("is-playing");
            setStatus("请再次点击播放器开始播放");
          });
        }
      }

      if (button) {
        button.addEventListener("click", playVideo);
      }

      video.addEventListener("click", function () {
        if (video.paused) {
          playVideo();
        }
      });

      video.addEventListener("play", function () {
        player.classList.add("is-playing");
        setStatus("正在播放");
      });

      video.addEventListener("pause", function () {
        if (!video.ended) {
          setStatus("已暂停");
        }
      });

      video.addEventListener("ended", function () {
        player.classList.remove("is-playing");
        setStatus("播放结束");
      });

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  ready(function () {
    setupMobileMenu();
    setupCoverFallbacks();
    setupHeroCarousel();
    setupFilters();
    setupPlayers();
  });
})();
