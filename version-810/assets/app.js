(function () {
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  var carousel = document.querySelector('[data-hero-carousel]');

  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.hero-dot'));
    var index = 0;

    var showSlide = function (nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle('is-active', itemIndex === index);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle('is-active', itemIndex === index);
      });
    };

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
      });
    });

    setInterval(function () {
      showSlide(index + 1);
    }, 5200);
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
  var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var activeFilter = 'all';

  var normalize = function (value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
  };

  var cardText = function (card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-region'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-type'),
      card.getAttribute('data-tags'),
      card.textContent
    ].join(' '));
  };

  var filterCards = function () {
    var query = normalize(searchInputs.map(function (input) {
      return input.value;
    }).join(' '));

    cards.forEach(function (card) {
      var matchesQuery = !query || cardText(card).indexOf(query) !== -1;
      var matchesFilter = activeFilter === 'all' || cardText(card).indexOf(normalize(activeFilter)) !== -1;
      card.classList.toggle('hidden-by-filter', !(matchesQuery && matchesFilter));
    });
  };

  searchInputs.forEach(function (input) {
    input.addEventListener('input', filterCards);
  });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (item) {
        item.classList.remove('is-active');
      });
      chip.classList.add('is-active');
      activeFilter = chip.getAttribute('data-filter') || 'all';
      filterCards();
    });
  });

  window.SitePlayer = function (video, sourceUrl) {
    if (!video || !sourceUrl) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (video.getAttribute('src') !== sourceUrl) {
        video.setAttribute('src', sourceUrl);
      }
    } else if (window.Hls && window.Hls.isSupported()) {
      if (video.hlsInstance) {
        video.hlsInstance.destroy();
      }
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      video.hlsInstance = hls;
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
    } else {
      video.setAttribute('src', sourceUrl);
    }

    var playResult = video.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(function () {});
    }
  };
})();
