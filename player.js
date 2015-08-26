//
// NOTE
// ----
//
// Variable names that start with dn are references to DOM Nodes.
// These are the things that we are going to manipulate in the page,
// such as control buttons, playlist, etc.
//

var player = (function() {

    var _self = {
        dnWrapper: undefined,
        dnAudio: undefined,
        dnPlayPause: undefined,
        dnPause: undefined,
        dnTimeRemaining: undefined,
        dnHandler: undefined,
        dnGutter: undefined,
        gutterWidth: undefined,
        gutterLeft: undefined
    };

    var conf;

    var dnCurrent;
    var dnPlayer;

    var bDragging = false;

    /**
     * Builds a list of songs and append them to the proper place in the document.
     *
     * @param {array} songList - the list of songs.
     */
    var buildPlaylist = function buildPlaylist(songList) {
        var ul = createNode('ul');
        songList.forEach(function(song) {
            var li = createNode('li');
            li.appendChild(createText(song.name));
            ul.appendChild(li);
        });
        /**
         * TODO: Are we really sure we have an element with the ID of `playlist`?
         * It should since it is provided by the player files itself.
         */
        byId('playlist').appendChild(ul);
    };

    /**
     * Adds the <audio> tags in the document. Plays the first song of the list by default.
     *
     * @param {object} conf - contains the necessary information add an <audio> tag to the dom.
     */
    var buildAudioTags = function buildAudioTags(conf) {

        //
        // The MP3 version.
        //
        var sourceMp3 = createNode('source');
        sourceMp3.setAttribute('src', conf.songs[0].url + '.mp3');
        _self.dnAudio.appendChild(sourceMp3);

        //
        // The OGG version.
        //
        var sourceOgg = createNode('source');
        sourceOgg.setAttribute('src', conf.songs[0].url + '.ogg');
        _self.dnAudio.appendChild(sourceOgg);
    };

    /**
     * Retrive relevant elements related to the player and store them in local variables.
     */
    var initControls = function initControls() {
        _self.dnAudio = byId('audio');
        _self.dnPlayPause = byId('play-pause');
        _self.dnHandler = byId('handler');
        _self.dnTimeRemaining = byId('time-remaining');
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

    /**
     * Updates the “digital clock” that display the current playing time.
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
        _self.dnTimeRemaining.textContent = formatTime(hours, minutes, seconds);
    };

    /**
     * Starts the playing of the song in the <audio> tag.
     */
    var playSong = function playSong() {

        //
        // `duration` is in seconds. Zero if no media data is available. Still, we only
        // get to this function if a `loadeddata` event happens, so, we are probably safe here.
        //
        var dur = _self.dnAudio.duration;
        var pos = undefined;

        //
        // Here, we move the handler/knob in in percentages. Say we are in 23% in the
        // song, it is safe to move the handler 23% from the left in relation to its
        // offsetParent, which is the gutter.
        //
        _self.dnAudio.addEventListener('timeupdate', function() {

            //
            // NOTE: This `setInterval` is an attempt to make the seconds to be updated
            // really about every one second in the user interface. The main problem
            // is that `timeupdate` fires at more random times, which causes our function
            // to update the UI at irregular intervals.
            //
            setInterval(function () {
                pos = _self.dnAudio.currentTime / dur * 100;
                _self.dnHandler.style.left = pos + '%';
                updateClock(_self.dnAudio.currentTime);
            }, 1000);
        });
    };

    /**
     * Deals with playing and pausing the song when the appropriate button is clicked.
     */
    var handlePlayPause = function handlePlayPause() {
        _self.dnPlayPause.addEventListener('click', function(evt) {

            //
            // NOTE: `play()` and `pause()` are properties of `HTMLMediaElement` as
            // is `paused`. We don't need to create those ourselves.
            //

            if (_self.dnAudio.paused) {
                _self.dnAudio.play();
                _self.dnPlayPause.textContent = 'Pause';
            }
            else {
                _self.dnAudio.pause();
                _self.dnPlayPause.textContent = 'Play';
            }
        });
    };

    /**
     * Update the position of the handler/knob on the screen.
     *
     * @param {object} evt - The event object where the mouse was clicked/moded.
     */
    var updateHandler = function updateHandler(evt) {

        var lft = evt.pageX + _self.dnGutter;
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
            // Calculate and go the the new song time.
            //
            // TODO: Move this to a separate function perhaps, since we are
            // in `updateHandler` (which has nothing to do with the song time.
            //
            var gutterPercentage = newHandlerPos * 100 / 300;
            var songDuration = _self.dnAudio.duration;
            var newTimePosition = gutterPercentage * songDuration / 100;
            _self.dnAudio.currentTime = newTimePosition;
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
        _self.dnGutter.addEventListener('mousedown', function(evt) {
            _self.gutterLeft = pageX(this);
            _self.gutterWidth = this.offsetWidth;
            bDragging = true;
            updateHandler(evt);
        });

        //
        // In case the mouse is moving, also assume we want to change the song's playing position.
        // TODO: Perhaps we should not call `updateHandler` here since we might not be “moving”?
        //
        document.addEventListener('mousemove', function(evt) {
            updateHandler(evt);
        });

        //
        // Simple. If the mouse is “up”, we are not “moving” the handler any longer.
        //
        document.addEventListener('mouseup', function(evt) {
            bDragging = false;
        });

    };

    //
    // Starts everything.
    // TODO: Pass configuration object.
    //
    var init = function init(config) {

        //
        // This is the only dom node we have available
        // before fetching the player html. An element with id
        // `player-wrapper` is required in the document.
        //
        _self.dnWrapper = byId('player-wrapper');

        //
        // Cache the configuration in so that the entire main
        // scope has access to it.
        //
        conf = config;

        //
        // Load the core player html elements from a file
        // to keep things more modular.
        //
        ajax({
            type: 'GET',
            url: 'player.html',
            onSuccess: function(playerHtml) {
                byId('player-wrapper').innerHTML = playerHtml;

                //
                // Load CSS just now, so, users can avoid loading
                // unecessary styles with the main web page request.
                // PROBLEM: By the time css finished loading, JS has already done
                // some work and found elements not yet properly styled.
                //loadCss('player.css');

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
                //
                buildAudioTags(conf);

                _self.dnAudio.addEventListener('loadeddata', function() {
                    playSong();

                    //
                    // We start playing now. Set the text to pause.
                    //
                    _self.dnPlayPause.textContent = 'Pause';
                });

                handlePlayPause();

                handleDragHandler();
            }
        });
    };

    _self.init = init;

    return _self;
}());

player.init({
    songs: [
        {url: 'songs/four', name: 'Querendo Chorar'},
        {url: 'songs/one', name: "Never Let Me Go"},
        {url: 'songs/two', name: 'Never Far Away'},
        {url: 'songs/three', name: 'The Truth Will Always Be'}
    ]
});
