(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            if (window.Hls) {
                resolve();
                return;
            }
            var script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function setupPlayer(player) {
        var video = player.querySelector("video");
        var cover = player.querySelector("[data-player-cover]");
        var button = player.querySelector("[data-player-button]");
        var message = player.querySelector("[data-player-message]");
        var source = video ? video.getAttribute("data-source") : "";
        var initialized = false;
        var hlsInstance = null;

        if (!video || !source) {
            return;
        }

        function showMessage(text) {
            if (message) {
                message.textContent = text || "";
            }
        }

        function attachSource() {
            if (initialized) {
                return Promise.resolve();
            }
            initialized = true;
            showMessage("正在加载播放源...");
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
                return Promise.resolve();
            }
            return loadScript("https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js").then(function () {
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            showMessage("播放源加载失败，请刷新页面后重试。");
                        }
                    });
                    return;
                }
                throw new Error("hls unsupported");
            });
        }

        function play() {
            attachSource().then(function () {
                if (cover) {
                    cover.classList.add("is-hidden");
                }
                showMessage("");
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {
                        showMessage("浏览器阻止了自动播放，请再次点击播放按钮。");
                    });
                }
            }).catch(function () {
                showMessage("当前浏览器暂不支持该 HLS 播放源。");
            });
        }

        if (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                play();
            });
        }
        if (cover) {
            cover.addEventListener("click", play);
        }
        video.addEventListener("play", function () {
            if (cover) {
                cover.classList.add("is-hidden");
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance && typeof hlsInstance.destroy === "function") {
                hlsInstance.destroy();
            }
        });
    }

    ready(function () {
        Array.prototype.slice.call(document.querySelectorAll("[data-player]")).forEach(setupPlayer);
    });
}());
