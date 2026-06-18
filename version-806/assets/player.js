import { H as Hls } from './hls.js';

export function initMoviePlayer(source) {
  var video = document.getElementById('movie-player');
  var coverButton = document.getElementById('play-cover');
  var hls = null;
  var loaded = false;

  if (!video || !source) {
    return;
  }

  var load = function () {
    if (loaded) {
      return;
    }

    loaded = true;

    if (video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL')) {
      video.src = source;
      return;
    }

    if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(source);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        video.play().catch(function () {});
      });
    } else {
      video.src = source;
    }
  };

  var play = function () {
    load();

    if (coverButton) {
      coverButton.classList.add('is-hidden');
    }

    video.play().catch(function () {});
  };

  if (coverButton) {
    coverButton.addEventListener('click', play);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      play();
    }
  });

  video.addEventListener('play', function () {
    if (coverButton) {
      coverButton.classList.add('is-hidden');
    }
  });

  window.addEventListener('pagehide', function () {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
}
