(function () {
  function initPlayer(shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('[data-play-button]');
    var message = shell.querySelector('[data-player-message]');
    var source = shell.getAttribute('data-src') || (video && video.getAttribute('data-src'));
    var hls = null;
    var attached = false;

    if (!video || !source) {
      return;
    }

    function setMessage(text) {
      if (message) {
        message.textContent = text || '';
      }
    }

    function attachSource() {
      if (attached) {
        return;
      }
      attached = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (_, data) {
          if (data && data.fatal) {
            setMessage('播放加载遇到问题，请刷新后重试。');
            try {
              hls.destroy();
            } catch (error) {}
            attached = false;
          }
        });
        return;
      }

      video.src = source;
    }

    function playVideo(event) {
      if (event) {
        event.preventDefault();
      }
      attachSource();
      shell.classList.add('is-playing');
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          setMessage('请再次点击播放器开始播放。');
          shell.classList.remove('is-playing');
        });
      }
    }

    if (button) {
      button.addEventListener('click', playVideo);
    }

    shell.addEventListener('click', function (event) {
      if (event.target === video || event.target === shell) {
        playVideo(event);
      }
    });

    video.addEventListener('play', function () {
      shell.classList.add('is-playing');
      setMessage('');
    });

    video.addEventListener('ended', function () {
      shell.classList.remove('is-playing');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('[data-video-player]')).forEach(initPlayer);
  });
})();
