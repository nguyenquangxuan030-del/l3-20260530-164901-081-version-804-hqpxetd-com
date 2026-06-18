(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function initMobileMenu() {
        var toggle = document.querySelector(".mobile-toggle");
        var panel = document.querySelector(".nav-panel");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
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
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot") || 0));
                start();
            });
        });
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function matchesCard(card, query, year, type) {
        var keywords = normalize(card.getAttribute("data-keywords"));
        var cardYear = normalize(card.getAttribute("data-year"));
        var cardType = normalize(card.getAttribute("data-type"));
        var queryMatch = !query || keywords.indexOf(query) !== -1;
        var yearMatch = !year || cardYear === year;
        var typeMatch = !type || cardType === type;
        return queryMatch && yearMatch && typeMatch;
    }

    function updateCount(target, count) {
        if (target) {
            target.textContent = count + " 部影片";
        }
    }

    function initSearchPage() {
        var root = document.querySelector("[data-search-page]");
        var results = document.querySelector("[data-search-results]");
        if (!root || !results) {
            return;
        }
        var input = root.querySelector("[data-search-input]");
        var year = root.querySelector("[data-search-year]");
        var type = root.querySelector("[data-search-type]");
        var clear = root.querySelector("[data-search-clear]");
        var count = root.querySelector("[data-search-count]");
        var cards = Array.prototype.slice.call(results.querySelectorAll(".movie-card"));
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get("q") || "";

        if (input) {
            input.value = initialQuery;
        }

        function apply() {
            var query = normalize(input && input.value);
            var selectedYear = normalize(year && year.value);
            var selectedType = normalize(type && type.value);
            var visible = 0;
            cards.forEach(function (card) {
                var keep = matchesCard(card, query, selectedYear, selectedType);
                card.classList.toggle("is-hidden-by-filter", !keep);
                if (keep) {
                    visible += 1;
                }
            });
            updateCount(count, visible);
        }

        [input, year, type].forEach(function (control) {
            if (control) {
                control.addEventListener("input", apply);
                control.addEventListener("change", apply);
            }
        });
        if (clear) {
            clear.addEventListener("click", function () {
                if (input) {
                    input.value = "";
                }
                if (year) {
                    year.value = "";
                }
                if (type) {
                    type.value = "";
                }
                apply();
            });
        }
        apply();
    }

    function initListFilter() {
        var input = document.querySelector("[data-list-filter]");
        var list = document.querySelector("[data-filter-list]");
        if (!input || !list) {
            return;
        }
        var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
        var count = document.querySelector("[data-filter-count]");

        function apply() {
            var query = normalize(input.value);
            var visible = 0;
            cards.forEach(function (card) {
                var keep = !query || normalize(card.getAttribute("data-keywords")).indexOf(query) !== -1;
                card.classList.toggle("is-hidden-by-filter", !keep);
                if (keep) {
                    visible += 1;
                }
            });
            updateCount(count, visible);
        }

        input.addEventListener("input", apply);
    }

    ready(function () {
        initMobileMenu();
        initHero();
        initSearchPage();
        initListFilter();
    });
}());
