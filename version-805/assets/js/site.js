(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initNavigation() {
    var button = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-main-menu]");

    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
      document.body.classList.toggle("no-scroll", menu.classList.contains("is-open"));
    });

    selectAll("a", menu).forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        document.body.classList.remove("no-scroll");
      });
    });
  }

  function initHero() {
    var slides = selectAll(".hero-slide");
    var dots = selectAll(".hero-dot");

    if (!slides.length) {
      return;
    }

    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        if (timer) {
          window.clearInterval(timer);
        }

        show(index);
        start();
      });
    });

    show(0);
    start();
  }

  function initCardFilters() {
    selectAll("[data-filter-panel]").forEach(function (panel) {
      var grid = document.querySelector(panel.getAttribute("data-target"));
      var empty = document.querySelector(panel.getAttribute("data-empty"));
      var keywordInput = panel.querySelector("[data-filter-keyword]");
      var yearSelect = panel.querySelector("[data-filter-year]");
      var genreSelect = panel.querySelector("[data-filter-genre]");

      if (!grid || !keywordInput) {
        return;
      }

      var cards = selectAll(".movie-card", grid);

      function update() {
        var keyword = keywordInput.value.trim().toLowerCase();
        var year = yearSelect ? yearSelect.value : "";
        var genre = genreSelect ? genreSelect.value : "";
        var shown = 0;

        cards.forEach(function (card) {
          var text = [
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-genre")
          ].join(" ").toLowerCase();
          var yearMatch = !year || card.getAttribute("data-year") === year;
          var genreMatch = !genre || (card.getAttribute("data-genre") || "").indexOf(genre) !== -1;
          var keywordMatch = !keyword || text.indexOf(keyword) !== -1;
          var visible = yearMatch && genreMatch && keywordMatch;

          card.style.display = visible ? "" : "none";

          if (visible) {
            shown += 1;
          }
        });

        if (empty) {
          empty.style.display = shown ? "none" : "block";
        }
      }

      [keywordInput, yearSelect, genreSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", update);
          control.addEventListener("change", update);
        }
      });
    });
  }

  function movieCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    return [
      "<article class=\"movie-card\">",
      "<a href=\"./" + escapeHtml(movie.file) + "\" class=\"movie-card-link\">",
      "<div class=\"movie-image-wrap\">",
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">",
      "<span class=\"movie-type\">" + escapeHtml(movie.type) + "</span>",
      "</div>",
      "<div class=\"movie-card-body\">",
      "<div class=\"movie-meta-line\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.category) + "</span></div>",
      "<h3>" + escapeHtml(movie.title) + "</h3>",
      "<p>" + escapeHtml(movie.oneLine) + "</p>",
      "<div class=\"tag-row\">" + tags + "</div>",
      "</div>",
      "</a>",
      "</article>"
    ].join("");
  }

  function initSearchPage() {
    var form = document.querySelector("[data-search-page-form]");
    var input = document.querySelector("[data-search-page-input]");
    var results = document.querySelector("[data-search-results]");
    var empty = document.querySelector("[data-search-empty]");
    var data = window.MOVIE_SEARCH_INDEX || [];

    if (!form || !input || !results) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    input.value = initial;

    function render(query) {
      var normalized = query.trim().toLowerCase();
      var matches = data.filter(function (movie) {
        if (!normalized) {
          return movie.featured;
        }

        return [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tagsText, movie.oneLine, movie.category]
          .join(" ")
          .toLowerCase()
          .indexOf(normalized) !== -1;
      }).slice(0, 96);

      results.innerHTML = matches.map(movieCard).join("");

      if (empty) {
        empty.style.display = matches.length ? "none" : "block";
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = input.value.trim();
      var nextUrl = query ? "./search.html?q=" + encodeURIComponent(query) : "./search.html";
      window.history.replaceState(null, "", nextUrl);
      render(query);
    });

    input.addEventListener("input", function () {
      render(input.value);
    });

    render(initial);
  }

  function initPlayer(options) {
    var video = document.getElementById(options.videoId);
    var overlay = document.getElementById(options.overlayId);
    var streamUrl = options.streamUrl;
    var isReady = false;
    var hls = null;

    if (!video || !overlay || !streamUrl) {
      return;
    }

    function attachStream() {
      if (isReady) {
        return;
      }

      isReady = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function playVideo() {
      attachStream();
      overlay.classList.add("is-hidden");
      var playAction = video.play();

      if (playAction && typeof playAction.catch === "function") {
        playAction.catch(function () {
          overlay.classList.remove("is-hidden");
        });
      }
    }

    overlay.addEventListener("click", playVideo);

    video.addEventListener("click", function () {
      if (video.paused) {
        playVideo();
      }
    });

    video.addEventListener("play", function () {
      overlay.classList.add("is-hidden");
    });

    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  window.MovieSite = {
    initPlayer: initPlayer
  };

  document.addEventListener("DOMContentLoaded", function () {
    initNavigation();
    initHero();
    initCardFilters();
    initSearchPage();
  });
}());
