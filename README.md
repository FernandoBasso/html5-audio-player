# html5-audio-player
A pure HTML5 and JavaScript audio player.


## Getting Started ##

First of all, make sure your page has a div/section with and id
of `player-wrapper`.

```html
...
<div id='player-wrapper'><!-- Your player will appear here. --></div>
...
```

Then add the song list to the `init` method:

```javascript
player.init({
    songs: [
        //{url: 'https://upload.wikimedia.org/wikipedia/en/4/45/ACDC_-_Back_In_Black-sample', name: 'Black in Black'},
        {url: 'songs/one', name: 'Querendo Chorar'},
        {url: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Bach_Prelude_Fugue_BWV_542', name: 'Prelude and Fugue'},
        {url: 'songs/two', name: 'Amberdawn'},
        {url: 'songs/three', name: 'Orange Blossom Special'}
    ]
});
```


## Code Style

Let's just use this one. It can't be that wrong. :)

https://google.github.io/styleguide/javascriptguide.xml
=======
A pure HTML5 and JavaScript audio player. No jQuery or other third party library required.

For now, take a look at the devel branch.
