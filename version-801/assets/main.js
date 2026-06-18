(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMenu() {
    var toggle = qs('[data-menu-toggle]');
    var drawer = qs('[data-mobile-drawer]');
    if (!toggle || !drawer) {
      return;
    }

    toggle.addEventListener('click', function () {
      var opened = drawer.classList.toggle('is-open');
      toggle.classList.toggle('is-open', opened);
      toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
      document.body.classList.toggle('menu-open', opened);
    });
  }

  function initBrokenImages() {
    qsa('img').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) {
        img.classList.add('is-missing');
      }
    });
  }

  function initLocalFilters() {
    var inputs = qsa('[data-card-search]');
    if (!inputs.length) {
      return;
    }

    inputs.forEach(function (input) {
      var scopeSelector = input.getAttribute('data-filter-scope');
      var scope = scopeSelector ? qs(scopeSelector) : document;
      var regionSelect = scope ? qs('[data-region-filter]', scope) : null;
      var typeSelect = scope ? qs('[data-type-filter]', scope) : null;
      var note = scope ? qs('[data-result-note]', scope) : null;
      var empty = scope ? qs('[data-empty-state]', scope) : null;
      var cards = scope ? qsa('[data-movie-card]', scope) : [];

      function applyFilter() {
        var query = normalize(input.value);
        var region = regionSelect ? normalize(regionSelect.value) : '';
        var type = typeSelect ? normalize(typeSelect.value) : '';
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year')
          ].join(' '));
          var matchQuery = !query || haystack.indexOf(query) !== -1;
          var matchRegion = !region || normalize(card.getAttribute('data-region')) === region;
          var matchType = !type || normalize(card.getAttribute('data-type')) === type;
          var show = matchQuery && matchRegion && matchType;
          card.style.display = show ? '' : 'none';
          if (show) {
            visible += 1;
          }
        });

        if (note) {
          note.textContent = '当前显示 ' + visible + ' 部影片';
        }
        if (empty) {
          empty.classList.toggle('is-visible', visible === 0);
        }
      }

      input.addEventListener('input', applyFilter);
      if (regionSelect) {
        regionSelect.addEventListener('change', applyFilter);
      }
      if (typeSelect) {
        typeSelect.addEventListener('change', applyFilter);
      }
      applyFilter();
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function getPrefix() {
    var marker = document.body.getAttribute('data-depth') || '0';
    var depth = parseInt(marker, 10) || 0;
    return '../'.repeat(depth);
  }

  function renderSearchResults() {
    var box = qs('[data-global-search]');
    var results = qs('[data-search-results]');
    var count = qs('[data-search-count]');
    var empty = qs('[data-search-empty]');
    if (!box || !results || !window.MOVIE_SEARCH_DATA) {
      return;
    }

    var prefix = getPrefix();
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    box.value = initialQuery;

    function createItem(item) {
      var article = document.createElement('article');
      article.className = 'search-result-item';
      article.innerHTML = [
        '<a href="' + prefix + escapeHtml(item.url) + '">',
        '<img src="' + prefix + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy" onerror="this.classList.add(\'is-missing\')">',
        '</a>',
        '<div>',
        '<h3><a href="' + prefix + escapeHtml(item.url) + '">' + escapeHtml(item.title) + '</a></h3>',
        '<p>' + escapeHtml(item.oneLine) + '</p>',
        '<div class="search-result-meta">',
        '<span>' + escapeHtml(item.year) + '</span>',
        '<span>' + escapeHtml(item.region) + '</span>',
        '<span>' + escapeHtml(item.type) + '</span>',
        '<span>' + escapeHtml(item.category) + '</span>',
        '</div>',
        '</div>',
        '<a class="btn btn-emerald" href="' + prefix + escapeHtml(item.url) + '">播放</a>'
      ].join('');
      return article;
    }

    function runSearch() {
      var query = normalize(box.value);
      var words = query.split(/\s+/).filter(Boolean);
      var data = window.MOVIE_SEARCH_DATA;
      var filtered = data.filter(function (item) {
        var haystack = normalize([
          item.title,
          item.region,
          item.type,
          item.year,
          item.genre,
          item.tags,
          item.oneLine,
          item.category
        ].join(' '));
        return words.every(function (word) {
          return haystack.indexOf(word) !== -1;
        });
      }).slice(0, 200);

      results.innerHTML = '';
      filtered.forEach(function (item) {
        results.appendChild(createItem(item));
      });

      if (count) {
        count.textContent = query ? '找到 ' + filtered.length + ' 条相关结果' : '显示 200 条热门索引结果';
      }
      if (empty) {
        empty.classList.toggle('is-visible', filtered.length === 0);
      }
    }

    box.addEventListener('input', runSearch);
    runSearch();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initBrokenImages();
    initLocalFilters();
    renderSearchResults();
  });
})();
