//
// NOTE
// ----
//
// Variable names that start with dn are references to DOM Nodes.
// These are the things that we are going to manipulate in the page,
// such as control buttons, playlist, etc.
//

var player = (function () {

    var _self = {
        dnWrapper: undefined,
        dnAudio: undefined,
        dnPlayPause: undefined,
        dnPause: undefined,
        // TODO: dnTimeRemaining: undefined,
        dnHandler: undefined,
        dnGutter: undefined,
        gutterWidth: undefined,
        gutterLeft: undefined,
        intervalId: undefined,
        dnPlayList: []
    };


    /**
     * An object with configuration to be applied to the player.
     * @var {object} conf
     */
    var conf;

    /**
     * Holds state to know when we are dragging the handler or not.
     * @var {boolean} bDragging
     */
    var bDragging = false;

    /**
     * Builds a list of songs and append them to the proper place in the document.
     *
     * @param {array} songList - the list of songs.
     */
    var buildPlaylist = function buildPlaylist(songList) {
        var ul = createNode('ul');
        songList.forEach(function (song, index) {
            var li = createNode('li');
            li.setAttribute('data-index', index);
            li.appendChild(createText(song.name));
            ul.appendChild(li);

            //
            // Store the list of songs beacuse we'll need it later to
            // change the playing song.
            //
            _self.dnPlayList.push(li);
        });
        /**
         * TODO: Are we really sure we have an element with the ID of `playlist`?
         * It should since it is provided by the player files itself.
         */
        byId('playlist').appendChild(ul);
    };

    /**
     * Adds the <audio> tags in the document.
     *
     * @param {object} conf - contains the necessary information add an <audio> tag to the DOM.
     * @param {integer} index - which song on the playlist to play.
     */
    var buildAudioTags = function buildAudioTags(arrSongs, index) {

        //
        // The MP3 version.
        //
        var sourceMp3 = createNode('source');
        sourceMp3.setAttribute('id', 'mp3Path');
        sourceMp3.setAttribute('type', 'audio/mpeg');
        sourceMp3.setAttribute('src', arrSongs[index].url + '.mp3');
        _self.dnAudio.appendChild(sourceMp3);

        //
        // The OGG version.
        //
        var sourceOgg = createNode('source');
        sourceOgg.setAttribute('id', 'oggPath');
        sourceMp3.setAttribute('type', 'audio/ogg');
        sourceOgg.setAttribute('src', arrSongs[index].url + '.ogg');
        _self.dnAudio.appendChild(sourceOgg);
    };

    /**
     * Retrive relevant elements related to the player and save a reference to them.
     */
    var initControls = function initControls() {
        _self.dnAudio = byId('audio');
        _self.dnPlayPause = byId('play-pause');
        _self.dnHandler = byId('handler');
        // TODO: _self.dnTimeRemaining = byId('time-remaining');
        _self.dnGutter = byId('gutter');
        _self.gutterLeft = pageX(_self.dnGutter);
    };


    /**
     * Padds a string with a leading zero if string is 1 char long.
     *
     * @param {integer/string} digitOrString - the digit to be formated.
     *
     * @return {string} - the padded string.
     */
    var strPad = function strPad(digitOrString) {
        //
        // Makes sure it is a string.
        //
        var str = String(digitOrString);

        return str.length === 1 ? '0' + str : str;
    };

    /**
     * Formats hour, minute and second to a clock-like representation.
     *
     *@return {string} - an object containing hour, minute and seconds as strings.
     */
    var formatTime = function formatTime(hours, minutes, seconds) {
        return strPad(hours) + ':' + strPad(minutes) + ':' + strPad(seconds);
    };

    var startUpdateClock = function startUpdateClock () {

        if (_self.intervalId !== undefined) {
            clearInterval(_self.intervalId);
        }

        //
        // Updates the clock every 1 second.
        //
        _self.intervalId = setInterval(function () {
            updateClock(_self.dnAudio.currentTime);
        }, 1000);
    };

    /**
     * Updates the “digital clock” that displays the current playing time.
     *
     * @param {number} secondsEllapased - The number of seconds that have been played so far.
     *                                    If it has decimal places, they are discarded.
     */
    var updateClock = function updateClock(secondsEllapased) {

        var hours, minutes, seconds;

        //
        // Some browsers give seconds + some fractional time, which is useless
        // for our purposes.
        //
        secondsEllapased = Math.floor(secondsEllapased);

        hours = Math.floor(secondsEllapased / 3600);
        minutes = Math.floor((secondsEllapased / 60) % 60);
        seconds = secondsEllapased % 60;

        //
        // Updates the user interface.
        //
        // TODO: _self.dnTimeRemaining.textContent = formatTime(hours, minutes, seconds);
    };


    var playPauseText = function playPauseText () {
        if (_self.dnAudio.paused) {
            _self.dnPlayPause.textContent = 'Play';
            clearInterval(_self.intervalId);
        }
        else {
            _self.dnPlayPause.textContent = 'Pause';
            // TODO: startUpdateClock();
        }
    }

    /**
     * TODO: Rename this function. It doesn't do what it says it does.
     * Starts the playing of the song in the <audio> tag.
     */
    var updateHandlerPosition = function updateHandlerPosition() {
        //
        // `duration` is in seconds. Zero if no media data is available. Still, we only
        // invoke this function if a `loadeddata` event happens, so, we are probably safe here.
        //
        //var dur = _self.dnAudio.duration;
        var pos = undefined;

        //
        // Here, we move the handler/knob in in percentages. Say we are in 23% in the
        // song, it is safe to move the handler 23% from the left in relation to its
        // offsetParent, which is the gutter.
        //
        _self.dnAudio.addEventListener('timeupdate', function () {
            pos = _self.dnAudio.currentTime / _self.dnAudio.duration * 100;

            _self.dnHandler.style.left = pos + '%';
        });

    };


    /**
     * Toggles the icon on the play/pause UI element.
     *
     * @param {boolean} isPaused.
     */
    var togglePlayPauseUI = function togglePlayPauseUI (isPaused) {

        if (isPaused) {
            _self.dnPlayPause.classList.add('paused');
            _self.dnPlayPause.classList.remove('playing');
        }
        else {
            _self.dnPlayPause.classList.add('playing');
            _self.dnPlayPause.classList.remove('paused');
        }
    };

    /**
     * Deals with playing and pausing the song when the appropriate button is clicked.
     */
    var handlePlayPause = function handlePlayPause() {
        _self.dnPlayPause.addEventListener('click', function (evt) {

            //
            // NOTE: `play()` and `pause()` are properties of `HTMLMediaElement` as
            // is `paused`. We don't need to create those ourselves.
            //

            if (_self.dnAudio.paused) {
                _self.dnAudio.play();
                startUpdateClock();
            }
            else {
                _self.dnAudio.pause();
                clearInterval(_self.intervalId);
            }
            togglePlayPauseUI(_self.dnAudio.paused);
        });
    };

    /**
     * Update the position of the handler/knob on the screen.
     *
     * @param {object} evt - The event object produced by the mouse click/drag.
     */
    var updateHandler = function updateHandler(evt) {

        var newHandlerPos;

        //
        // If we are dragging, and we are still withing left and right boundaries.
        //
        if (bDragging
                && evt.pageX >= _self.gutterLeft
                && evt.pageX <= (_self.gutterLeft + _self.gutterWidth)) {

            //
            // Update de handler's position on  the page.
            //
            newHandlerPos = evt.pageX - _self.gutterLeft;
            _self.dnHandler.style.left = newHandlerPos + 'px';

            //
            // Calculate and go the the new position in the song's playing time.
            //
            // TODO: Perhaps move this to a separate function, since we are
            // in `updateHandler` (which has nothing to do with the song time).
            //
            // Divided by the width of the gutter itself!!!
            //
            var handlerPercentageLeftOfGutter = newHandlerPos * 100 / _self.gutterWidth;
            var songDuration = _self.dnAudio.duration;
            var newTimePosition = handlerPercentageLeftOfGutter * songDuration / 100;

            _self.dnAudio.currentTime = newTimePosition;
            _self.dnAudio.play();
            startUpdateClock();
        }
    };

    /**
     * Detects when the user is moving the handler.
     */
    var handleDragHandler = function handleDragHandler() {

        //
        // This actually involves more than keeping an eye out of the handler itself,
        // as the event handlers below show.
        //


        //
        // First, anywhere the user clicks on the gutter, we assume he wants to play
        // "that part" of the song, which also means `moving` should be true.
        //
        _self.dnGutter.addEventListener('mousedown', function (evt) {
            _self.gutterLeft = pageX(this);
            _self.gutterWidth = this.offsetWidth;
            bDragging = true;
            updateHandler(evt);
        });

        //
        // In case the mouse is moving, also assume we want to change the song's playing position.
        //
        document.addEventListener('mousemove', function (evt) {
            updateHandler(evt);
        });

        //
        // Simple. If the mouse is “up”, we are not “moving” the handler any longer.
        //
        document.addEventListener('mouseup', function (evt) {
            togglePlayPauseUI();
            bDragging = false;
        });

    };


    //
    // Event handlers regarding change the playing song →  playlist.
    //

    /**
     * Changes the song being played.
     */
    function changeSong() {

        _self.dnPlayList.forEach(function (song) {
            song.addEventListener('click', function (evt) {
                //
                // DOING:
                // Change path of the <source> tags and play from the beginning
                //
                var index = this.getAttribute('data-index');
                byId('oggPath').setAttribute('src', conf.songs[index].url + '.ogg');
                byId('mp3Path').setAttribute('src', conf.songs[index].url + '.mp3');
                _self.dnAudio.load();
                _self.dnAudio.addEventListener('loadeddata', function () {
                    _self.dnAudio.play();
                    togglePlayPauseUI(_self.dnAudio.paused);
                }, false);
            });
        });

    }


    //
    // Starts everything.
    //
    var init = function init(config) {

        //
        // This is the only dom node we have available before fetching the
        // player html. An element with id `player-wrapper` is required in the
        // document. That is, client code MUST provide that element with that id.
        //
        _self.dnWrapper = byId('player-wrapper');

        //
        // Cache the configuration in so that the entire main scope has access to it.
        //
        conf = config;

        //
        // Load the core player html elements from a file to keep things more modular.
        //
        ajax({
            type: 'GET',
            url: 'player.html',
            onSuccess: function (playerHtml) {
                byId('player-wrapper').innerHTML = playerHtml;

                //
                // Builds the playlist and shows it on the page.
                //
                buildPlaylist(conf.songs);

                //
                // Now that the html is loaded, get references to the
                // controls DOM Nodes.
                //
                initControls();

                //
                // Inserts some audio tags for mp3, ogg, etc.
                // By default, the default is the first song in the array.
                //
                buildAudioTags(conf.songs, 0);

                //
                // DOING: Perhaps `loadeddata` should be listened to from inside updateHandlerPosition(),
                // and then handlePlayPause(), handleDragHandler() should go in there as well.
                //

                _self.dnAudio.addEventListener('loadeddata', function () {
                    updateHandlerPosition();

                    //
                    // We start playing now. Set the text to pause.
                    //
                    //_self.dnPlayPause.textContent = 'Play';
                    togglePlayPauseUI(_self.dnAudio.paused);
                });

                handlePlayPause();

                handleDragHandler();

                changeSong();
            }
        });
    };

    _self.init = init;

    return _self;
}());
