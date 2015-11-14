soundcloudClientID = '3bfa6c4e7c64be439b555750443fcab7';
tvpcSoundcloudID = '5035743';

//SC.initialize({
//    client_id: soundcloudClientID
//});

// use the soundcloud api to get TVPC song stats
console.log('Everything seems ship shape');

//SC.get('/users/' + tvpcSoundcloudID + '/tracks/').then(function(tracks) {
//      console.log(tracks);
//      drawSongs(tracks);
//      playTrack(tracks[0]);
//  }).catch(function(error) {
//      alert('Error: ' + error.message);
//});

function playTrack(track) {
    console.log('Streaming: ', track.title);
    //SC.stream('/tracks/' + track.id).then(function(player){
    //  player.play();
    //});
}

function stopTrack(track) {
    console.log('Stopping: ', track.title);
    //SC.stream('/tracks/' + track.id).then(function(player){
    //  player.stop();
    //});
}

var popularity = function popularityF (track) {
    return track.favoritings_count;
}

function Scale() {
    // force new to be called
    if (!(this instanceof Scale)) {
        return new Scale(minLoc, maxLoc);
    }

    console.log('Scale initialized: ');
    this.minValue = null;
    this.maxValue = null;
}

Scale.prototype.addValue = function (value) {
    console.log('addValue ' + value);
    if(this.minValue === null || this.minValue > value)
        this.minValue = value;

    if(this.maxValue === null || this.maxValue < value)
        this.maxValue = value;
}

Scale.prototype.getMinMax = function () {
    console.log('Scale::getMinMax ', this.minValue, ' ', this.maxValue);
    return [this.minValue, this.maxValue];
}

var calculateScales = function calculateScalesF (tracks) {
    // minCircleSize should be calculated based on the size of the stroke-width
    // maxCircleSize should be calculated based on the size of the viewbox
    // buffer is maxCircleSize + stroke-width
    var width = 1200,
        height = 600,
        minCircleSize = 4,
        maxCircleSize = 15,
        buffer = maxCircleSize + 4;

    var xValues = new Scale();
    var yValues = new Scale();
    var rValues = new Scale();

    for (var i in tracks) {
        if (tracks.hasOwnProperty(i)) {
            console.log('adding', i, ":", tracks[i]);

            xValues.addValue(new Date(tracks[i].created_at));
            yValues.addValue(tracks[i].duration);
            rValues.addValue(popularity(tracks[i]));
        }
    }

    var xScale = d3.time.scale()
        .domain(xValues.getMinMax())
        .range([buffer, width - buffer]);

    var yScale = d3.scale.linear()
        .domain(yValues.getMinMax())
        .range([buffer, height - buffer]);

    var rScale = d3.scale.log()
        .domain(rValues.getMinMax())
        .range([minCircleSize, maxCircleSize]);

    return [xScale, yScale, rScale];
}

function drawSongs(tracks) {
    // create the svg with a 2x1 aspect ratio (echoed in CSS)
    var svg = d3.select('div#content')
        .append('div')
        .classed('svg-container', true)
        .classed('inner', true)
        .append('svg')
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', '0 0 1200 600')
        .classed('svg-content-responsive', true);

    var scales = calculateScales(tracks);
    console.log('drawing tracks');

    var circle = svg.selectAll("circle")
        .data(tracks)
        .enter().append("circle")
        .attr("cx", function(d) { return scales[0](new Date(d.created_at)); })
        .attr("cy", function(d) { return scales[1](d.duration); })
        .attr("r", function(d) { return scales[2](popularity(d)); })
}


var player = (function() {
    var my = {},
        tracks = [],
        currentTrack = null;

    my.div = null;

    // private methods
    var getTrackNumber = function getTrackNumberF (trackID) {
        for (var i in tracks) {
            if (tracks.hasOwnProperty(i)) {
                console.log('searching', i, ":", tracks[i]);
                if (tracks[i].id === trackID)
                    return i;
            }
        }
        return null;
    }

    var displayTrack = function displayTrackF (trackNumber) {
        var name = my.div.select('#name');
        console.log('player::displayTrack: trackNumber', trackNumber);
        currentTrack = trackNumber;
        // perhaps cut off the name and add ...
        name.html(tracks[currentTrack].title);
    }

    // public methods
    my.init = function initF (div) {
        // create html if want to do it that way
        my.div = d3.select(div);

        // declare event handlers for player buttons
        var playerIcon = my.div.selectAll('.playerIcon')
            .on('click', function (d, i) {
                console.log(d, ' ', i);
                console.log(d3.event);
            });

        // declare event handlers for visualization

    }

    my.addTracks = function addTracksF (newTracks) {
        // extend tracks with tracks
        Array.prototype.push.apply(tracks, newTracks)
        console.log('player::addTracks: currentTracks', tracks);
    }

    my.next = function nextF () {
        // stop stream of current track
        // increment currentTrack unless its at end
        // start stream of new track
    }

    my.prev = function prevF () {
        // stop stream of current track
        // decrement currentTrack unless its at beginning
        // start stream of new track
    }

    my.play = function playF () {
        // start stream of current track
    }

    my.stop = function stopF () {
        // stop stream of current track
    }

    my.playTrack = function playTrackF (trackID) {
        // stop stream of current track
        // play certain track

        console.log('player::playTrack: ', trackID);
        var trackNumber = getTrackNumber(trackID);
        console.log('player::playTrack: trackNumber', trackNumber);
        displayTrack(trackNumber);
        // start stream of new track
    }

    return my;
}());


function testVis() {
    var fakeTracks = [];

    fakeTracks[0] = {
        'id': 0,
        'duration': 5000,
        'created_at': "2013/12/22 19:00:31 +0000",
        'favoritings_count': 5,
        'title': 'Fun'
    };

    fakeTracks[1] = {
        'id': 1,
        'duration': 3000,
        'created_at': "2013/10/22 19:00:31 +0000",
        'favoritings_count': 100,
        'title': 'superFun'
    };

    fakeTracks[2] = {
        'id': 2,
        'duration': 1000,
        'created_at': "2013/8/22 19:00:31 +0000",
        'favoritings_count': 5000,
        'title': 'TVPCMusic'
    };

    fakeTracks[3] = {
        'id': 3,
        'duration': 2560,
        'created_at': "2013/7/22 19:00:31 +0000",
        'favoritings_count': 20000,
        'title': 'TVPCMusic is super fun'
    };

    console.log(fakeTracks);
    drawSongs(fakeTracks);
    player.init('#player');
    player.addTracks(fakeTracks);
    player.playTrack(3);
}

document.addEventListener("DOMContentLoaded", testVis);
