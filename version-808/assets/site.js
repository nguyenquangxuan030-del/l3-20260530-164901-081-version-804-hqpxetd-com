(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.querySelector('.mobile-nav');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      var isOpen = nav.hasAttribute('hidden');
      if (isOpen) {
        nav.removeAttribute('hidden');
      } else {
        nav.setAttribute('hidden', '');
      }
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = selectAll('.hero-slide', hero);
    var dots = selectAll('.hero-dot', hero);
    var prev = hero.querySelector('.hero-prev');
    var next = hero.querySelector('.hero-next');
    var current = 0;
    var timer;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-slide')) || 0);
        restart();
      });
    });
    show(0);
    restart();
  }

  function initHomeSearch() {
    var form = document.querySelector('[data-home-search]');
    if (!form) {
      return;
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="q"]');
      var value = input ? input.value.trim() : '';
      var target = './search.html';
      if (value) {
        target += '?q=' + encodeURIComponent(value);
      }
      window.location.href = target;
    });
  }

  function initSearchPage() {
    var form = document.querySelector('[data-search-form]');
    var results = document.querySelector('[data-search-results]');
    if (!form || !results) {
      return;
    }
    var input = form.querySelector('input[name="q"]');
    var items = selectAll('.search-item', results);
    var filterButtons = selectAll('[data-filter]');
    var params = new URLSearchParams(window.location.search);
    var activeFilter = '';

    function apply() {
      var query = input.value.trim().toLowerCase();
      items.forEach(function (item) {
        var text = item.getAttribute('data-search') || '';
        var queryMatch = !query || text.indexOf(query) !== -1;
        var filterMatch = !activeFilter || text.indexOf(activeFilter.toLowerCase()) !== -1;
        item.hidden = !(queryMatch && filterMatch);
      });
    }

    if (params.get('q')) {
      input.value = params.get('q');
    }
    input.addEventListener('input', apply);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      apply();
    });
    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeFilter = button.getAttribute('data-filter') || '';
        filterButtons.forEach(function (item) {
          item.classList.toggle('active', item === button);
        });
        apply();
      });
    });
    apply();
  }

  function initMoviePlayer(options) {
    var video = document.getElementById('movie-player');
    var button = document.getElementById('play-button');
    var stage = document.querySelector('.video-stage');
    var source = options && options.source;
    if (!video || !source) {
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
      window.addEventListener('beforeunload', function () {
        hls.destroy();
      });
    } else {
      video.src = source;
    }

    function playVideo() {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener('click', playVideo);
    }
    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      }
    });
    video.addEventListener('play', function () {
      if (stage) {
        stage.classList.add('is-playing');
      }
    });
    video.addEventListener('pause', function () {
      if (stage) {
        stage.classList.remove('is-playing');
      }
    });
  }

  function init() {
    initMenu();
    initHero();
    initHomeSearch();
    initSearchPage();
  }

  window.Site = {
    init: init,
    initMoviePlayer: initMoviePlayer
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
