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
        dnHandler: undefined,
        dnPlayPause: undefined,
        dnPause: undefined,
        dnTimeRemaining: undefined
    };

    var conf;

    var dnCurrent;
    var dnPlayer;

    var buildPlaylist = function buildPlaylist(songList) {
        var ul = createNode('ul');
        songList.forEach(function(song) {
            var li = createNode('li');
            li.appendChild(createText(song.name));
            ul.appendChild(li);
        });
        byId('playlist').appendChild(ul);
    };

    var buildAudioTags = function buildAudioTags(conf) {
        var sourceMp3 = createNode('source');
        sourceMp3.setAttribute('src', conf.songs[0].url + '.mp3');
        _self.dnAudio.appendChild(sourceMp3);

         // <source src='songs/one.mp3' type='audio/mpeg'>
         // <source src='songs/one.ogg' type='audio/ogg'>
         var sourceOgg = createNode('source');
         sourceOgg.setAttribute('src', conf.songs[0].url + '.ogg');
         _self.dnAudio.appendChild(sourceOgg);
    };

    var initControls = function initControls() {
        _self.dnAudio = byId('audio');
        _self.dnPlayPause = byId('play-pause');
        _self.dnHandler = byId('handler');
        _self.dnTimeRemaining = byId('time-remaining');
    };

    var playSong = function playSong() {

        var dur = _self.dnAudio.duration;
        var pos = undefined;

        _self.dnAudio.play();

        _self.dnAudio.addEventListener('timeupdate', function() {
        pos = _self.dnAudio.currentTime / dur * 100;
        _self.dnHandler.style.left = pos + '%';
          console.log(pos);
        });
    };

    var handlePlayPause = function handlePlayPause() {
        _self.dnPlayPause.addEventListener('click', function(evt) {
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
                //
                loadCss('player.css');

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
            }
        });
    };

    _self.init = init;

    return _self;
}());

player.init({
  songs: [
    {url: 'songs/one', name: "Never Let Me Go"},
    {url: 'songs/two', name: 'Never Far Away'},
    {url: 'songs/three', name: 'The Truth Will Always Be'}
  ]
});
