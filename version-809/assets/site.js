(function() {
  var navButton = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (navButton && mobileNav) {
    navButton.addEventListener("click", function() {
      mobileNav.classList.toggle("is-open");
      navButton.setAttribute("aria-expanded", mobileNav.classList.contains("is-open") ? "true" : "false");
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
  var current = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    current = (index + slides.length) % slides.length;

    slides.forEach(function(slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === current);
    });

    dots.forEach(function(dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  }

  if (slides.length) {
    dots.forEach(function(dot, index) {
      dot.addEventListener("click", function() {
        showSlide(index);
      });
    });

    showSlide(0);

    window.setInterval(function() {
      showSlide(current + 1);
    }, 5200);
  }

  var filterInputs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-input]"));

  filterInputs.forEach(function(input) {
    input.addEventListener("input", function() {
      var value = input.value.trim().toLowerCase();
      var target = input.getAttribute("data-filter-input") || "movie";
      var cards = Array.prototype.slice.call(document.querySelectorAll('[data-filter-card="' + target + '"]'));

      cards.forEach(function(card) {
        var text = (card.getAttribute("data-filter-text") || card.textContent || "").toLowerCase();
        card.classList.toggle("hide-by-search", value.length > 0 && text.indexOf(value) === -1);
      });
    });
  });

  var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

  players.forEach(function(player) {
    var video = player.querySelector("video");
    var coverButton = player.querySelector("[data-play-cover]");
    var source = player.getAttribute("data-src");
    var hlsInstance = null;
    var hasLoaded = false;

    function loadVideo() {
      if (!video || !source || hasLoaded) {
        return;
      }

      hasLoaded = true;

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else {
        video.src = source;
      }
    }

    function startVideo() {
      if (!video) {
        return;
      }

      loadVideo();

      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function() {});
      }
    }

    if (coverButton) {
      coverButton.addEventListener("click", function(event) {
        event.preventDefault();
        startVideo();
      });
    }

    if (video) {
      video.addEventListener("play", function() {
        player.classList.add("is-playing");
      });

      video.addEventListener("pause", function() {
        if (video.currentTime === 0 || video.ended) {
          player.classList.remove("is-playing");
        }
      });

      video.addEventListener("ended", function() {
        player.classList.remove("is-playing");
      });

      video.addEventListener("click", function() {
        loadVideo();
      });
    }

    player.addEventListener("click", function(event) {
      if (event.target === video || event.target === coverButton || (coverButton && coverButton.contains(event.target))) {
        return;
      }

      startVideo();
    });

    window.addEventListener("beforeunload", function() {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
})();
