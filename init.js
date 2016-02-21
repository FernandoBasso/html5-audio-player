/**
 * The literal object is the `config` object.
 */
player.init({
    loop: 'one', // 'none', 'one', 'all'. Default: 'none'.
    songs: [
        //{url: 'https://upload.wikimedia.org/wikipedia/en/4/45/ACDC_-_Back_In_Black-sample', name: 'Black in Black'},
        {url: 'songs/one', name: 'Amberdawn'},
        {url: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Bach_Prelude_Fugue_BWV_542', name: 'Prelude and Fugue'},
        {url: 'songs/two', name: 'Fire In The Sky'},
        {url: 'songs/three', name: 'Orange Blossom Special'}
    ]
});
