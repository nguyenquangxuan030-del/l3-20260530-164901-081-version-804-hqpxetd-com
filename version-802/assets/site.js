const SELECTORS = {
    menu: '[data-menu]',
    menuToggle: '[data-menu-toggle]',
    pageSearch: '[data-page-search]',
    cardList: '[data-card-list]',
    emptyState: '[data-empty-state]',
    resultCount: '[data-result-count]',
    playerBox: '[data-player-box]',
    playButton: '[data-play-button]',
    playerStatus: '[data-player-status]'
};

let hlsConstructorPromise = null;

function normalizeText(value) {
    return String(value || '').toLowerCase().trim();
}

function setupMobileMenu() {
    const toggle = document.querySelector(SELECTORS.menuToggle);
    const menu = document.querySelector(SELECTORS.menu);

    if (!toggle || !menu) {
        return;
    }

    toggle.addEventListener('click', () => {
        menu.classList.toggle('is-open');
    });
}

function setupPageSearch() {
    const searchInput = document.querySelector(SELECTORS.pageSearch);
    const list = document.querySelector(SELECTORS.cardList);

    if (!searchInput || !list) {
        return;
    }

    const cards = Array.from(list.children);
    const emptyState = document.querySelector(SELECTORS.emptyState);
    const resultCount = document.querySelector(SELECTORS.resultCount);
    const urlQuery = new URLSearchParams(window.location.search).get('q');

    function cardText(card) {
        return [
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year,
            card.dataset.tags,
            card.dataset.category,
            card.textContent
        ].map(normalizeText).join(' ');
    }

    function updateCount(visibleCount) {
        if (resultCount) {
            resultCount.textContent = `显示 ${visibleCount} / ${cards.length} 项`;
        }

        if (emptyState) {
            emptyState.classList.toggle('is-visible', visibleCount === 0);
        }
    }

    function filterCards() {
        const query = normalizeText(searchInput.value);
        let visibleCount = 0;

        cards.forEach((card) => {
            const matched = !query || cardText(card).includes(query);
            card.classList.toggle('is-hidden-by-search', !matched);
            if (matched) {
                visibleCount += 1;
            }
        });

        updateCount(visibleCount);
    }

    if (urlQuery) {
        searchInput.value = urlQuery;
        const anchor = document.getElementById('all-movies');
        if (anchor) {
            window.requestAnimationFrame(() => anchor.scrollIntoView({ block: 'start' }));
        }
    }

    searchInput.addEventListener('input', filterCards);
    filterCards();
}

async function getHlsConstructor() {
    if (!hlsConstructorPromise) {
        hlsConstructorPromise = import('./hls.js').then((module) => module.H);
    }

    return hlsConstructorPromise;
}

async function bindHls(video, hlsUrl, status) {
    if (video.dataset.ready === 'true') {
        return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.dataset.ready = 'true';
        if (status) {
            status.textContent = '播放源已加载。';
        }
        return;
    }

    const Hls = await getHlsConstructor();

    if (Hls && Hls.isSupported()) {
        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        video._hlsInstance = hls;
        video.dataset.ready = 'true';

        if (status) {
            status.textContent = '播放源已加载。';
        }
        return;
    }

    video.src = hlsUrl;
    video.dataset.ready = 'true';
    if (status) {
        status.textContent = '当前浏览器可能需要更完整的视频播放支持。';
    }
}

function setupPlayers() {
    const playerBoxes = document.querySelectorAll(SELECTORS.playerBox);

    playerBoxes.forEach((box) => {
        const video = box.querySelector('video[data-hls]');
        const playButton = box.querySelector(SELECTORS.playButton);
        const status = box.querySelector(SELECTORS.playerStatus);

        if (!video || !playButton) {
            return;
        }

        async function startPlayback() {
            const hlsUrl = video.dataset.hls;
            if (!hlsUrl) {
                if (status) {
                    status.textContent = '未找到播放源。';
                }
                return;
            }

            try {
                if (status) {
                    status.textContent = '正在初始化播放源...';
                }
                await bindHls(video, hlsUrl, status);
                playButton.classList.add('is-hidden');
                await video.play();
            } catch (error) {
                playButton.classList.remove('is-hidden');
                if (status) {
                    status.textContent = '播放需要用户再次点击，或在部署后的 HTTPS 环境访问。';
                }
                console.warn('HLS playback failed:', error);
            }
        }

        playButton.addEventListener('click', startPlayback);
        video.addEventListener('play', () => playButton.classList.add('is-hidden'));
        video.addEventListener('pause', () => {
            if (!video.ended) {
                playButton.classList.remove('is-hidden');
            }
        });
    });
}

function setupSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) {
                return;
            }
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    setupPageSearch();
    setupPlayers();
    setupSmoothAnchors();
});
