soundcloudClientID = '3bfa6c4e7c64be439b555750443fcab7';
tvpcSoundcloudID = '5035743';

//SC.initialize({
//    client_id: soundcloudClientID
//});

// use the soundcloud api to get TVPC song stats
//SC.get('/users/' + tvpcSoundcloudID + '/tracks/').then(function(tracks) {
//      console.log(tracks);
//      drawSongs(tracks);
//      playTrack(tracks[0]);
//  }).catch(function(error) {
//      alert('Error: ' + error.message);
//});

console.log('Everything seems ship shape');

var popularity = function popularityF (track) {
    return track.favoritings_count;
}

function Scale() {
    // force new to be called
    if (!(this instanceof Scale)) {
        return new Scale(minLoc, maxLoc);
    }

    this.minValue = null;
    this.maxValue = null;
}

Scale.prototype.addValue = function (value) {
    if(this.minValue === null || this.minValue > value)
        this.minValue = value;

    if(this.maxValue === null || this.maxValue < value)
        this.maxValue = value;
}

Scale.prototype.getMinMax = function () {
    console.log('Scale::getMinMax ', this.minValue, ' ', this.maxValue);
    return [this.minValue, this.maxValue];
}

var visualization = (function() {
    var my = {},
        svg = null,
        xAxis = null,
        yAxis = null,
        scales = null,
        trackClicked = false,
        xTickShown = null,
        yTickShown = null,
        padding = 60,
        width = 1200,
        height = 600;

    my.init = function initF () {

        svg = d3.select('div#content')
            .append('div')
            .classed('svg-container', true)
            .classed('inner', true)
            .append('svg')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', '0 0 ' + (width + padding * 2) + ' ' +  (height + padding * 2))
            .classed('svg-content-responsive', true);

        xAxis = d3.svg.axis()
                .orient('bottom')
                .ticks(0);

        yAxis = d3.svg.axis()
                .orient('left')
                .ticks(0);

        // xAxis
        svg.append('g')
            .attr('id', 'xAxis')
            .attr("transform", "translate(0," + (height - padding) + ")")
            .classed('axis', true);

        // yAxis
        svg.append('g')
            .attr('id', 'yAxis')
            .attr("transform", "translate(" + padding + ",0)")
            .classed('axis', true);
    }

    my.calculateScales = function calculateScalesF (tracks) {
        // minCircleSize should be calculated based on the size of the stroke-width
        // maxCircleSize should be calculated based on the size of the viewbox
        // buffer is maxCircleSize + stroke-width
        var minCircleSize = 4,
            maxCircleSize = 15,
            buffer = padding + maxCircleSize + 4;

        var xValues = new Scale();
        var yValues = new Scale();
        var rValues = new Scale();

        for (var i in tracks) {
            if (tracks.hasOwnProperty(i)) {
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

    my.addTracks = function addTracksF (tracks) {
        console.log('visualization::addTracks:', circles);
        scales = my.calculateScales(tracks);

        // add a tick for each value specifically, but hide them
        var xTicks = [],
            yTicks = [];

        for (var i in tracks) {
            if (tracks.hasOwnProperty(i)) {
                xTicks.push(new Date(tracks[i].created_at));
                yTicks.push(tracks[i].duration);
            }
        }

        // sort the x and y axis' and make a mapping of the trackID with the respective x and y tick positions
        // sorts the date from least recent to most recent
        xTicks.sort(function(a, b) {
            // subtract the dates to get a value that is either negative, positive, or zero
            return a - b;
        });
        yTicks.sort();

        var trackAxesPositionMap = {};
        for (var i in tracks) {
            if (tracks.hasOwnProperty(i)) {
                var axesPosition = trackAxesPositionMap[tracks[i].id] = [];

                xPosition = xTicks.map(Number).indexOf(+(new Date(tracks[i].created_at)));
                axesPosition[0] = xPosition;

                console.log('xDate', new Date(tracks[i].created_at), 'xAxesPosition', xPosition);

                axesPosition[1] = yTicks.indexOf(tracks[i].duration);
            }
        }

        xAxis.scale(scales[0])
            .tickFormat(d3.time.day)
            .tickValues(xTicks);

        var xTicks = xAxis.ticks();

        d3.select('#xAxis')
            .call(xAxis);

        yAxis.scale(scales[1])
            .tickValues(yTicks);

        var yTicks = yAxis.ticks();

        d3.select('#yAxis')
            .call(yAxis);

        var ticks = svg.selectAll('.tick')
            .classed('hidden', true);

        var circles = svg.selectAll('circles')
            .data(tracks)
            .enter().append('circle')
            .attr("cx", function(d) { return scales[0](new Date(d.created_at)); })
            .attr("cy", function(d) { return scales[1](d.duration); })
            .attr("r", function(d) { return scales[2](popularity(d)); });

        // declare event handlers for visualization
        circles.on('click', function (d, i) {
            console.log(d, i, ' was clicked');
            console.log(d3.event);

            if(xTickShown !== null) {
                xTickShown.classed('hidden', true);
                yTickShown.classed('hidden', true);
            }

            // clicking on an item unhides its x and y axis tick
            var tickPosition = trackAxesPositionMap[d.id];

            var domXTicks = d3.selectAll('#xAxis .tick')[0];
            var xTickToShow = domXTicks[tickPosition[0]];
            xTickShown = d3.select(xTickToShow)
                .classed('hidden', false);

            var domYTicks = d3.selectAll('#yAxis .tick')[0];
            var yTickToShow = domYTicks[tickPosition[1]];
            yTickShown = d3.select(yTickToShow)
                .classed('hidden', false);

        });

        //circles.on('mouseover', function (d, i) {
        //    console.log(d, i, ' was moused over');
        //    console.log(d3.event);
        //});
    }

    return my;
}());


var player = (function() {
    var my = {},
        tracks = [],
        currentTrack = null,
        isPlaying = 0;

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
        var playPauseIcons = my.div.select('#playToggle').selectAll('.playerIcon')
            .on('click', function (d, i) {
                console.log('Toggling play and pause');
                console.log(d3.event);

                isPlaying = (isPlaying + 1) % 2;
                if (isPlaying) {
                    my.play();
                } else {
                    my.stop();
                }

                // toggle the play and pause button
                var playPauseIcons = my.div.select('#playToggle').selectAll('.playerIcon')
                    .classed('hidden', function (d, i) {
                        console.log(d, ' ', i);
                        // buttons: 0 for play, 1 for pause
                        // isPlaying: 1 for play, 0 for pause
                        if(i === isPlaying)
                            return 0;

                        return 1;
                    });
            });

        var prevNextIcons = my.div.select('#prevNext').selectAll('.playerIcon')
            .on('click', function (d, i) {
                // 0 = prev, 1 = next
                console.log('Touched previous or next', d, i);
                console.log(d3.event);
                if (i === 0) {
                   my.prev();
                } else {
                   my.next();
                }
            });

        var volumeIcons = my.div.select('#volume').selectAll('.playerIcon')
            .on('click', function (d, i) {
                // 0 = prev, 1 = next
                console.log('Touched volume', d, i);
                console.log(d3.event);
            });
    }

    my.addTracks = function addTracksF (newTracks) {
        // extend tracks with tracks
        Array.prototype.push.apply(tracks, newTracks)
        console.log('player::addTracks: currentTracks', tracks);
    }

    my.next = function nextF () {
        console.log('Switching to next song');

        // stop stream of current track
        if (isPlaying) {
            my.stop();
            isPlaying = 0;
            var wasPlaying = true;
        }

        // increment currentTrack unless its at end
        currentTrack++;
        if (currentTrack >= tracks.length)
            currentTrack--;

        // display new track
        displayTrack(currentTrack)

        // start stream of new track
        if (wasPlaying) {
            my.play();
            isPlaying = 1;
        }
    }

    my.prev = function prevF () {
        console.log('Switching to prev song');

        // stop stream of current track
        if (isPlaying) {
            my.stop();
            isPlaying = 0;
            var wasPlaying = true;
        }

        // decrement currentTrack unless its at beginning
        currentTrack--;
        if (currentTrack < 0)
            currentTrack++;

        // display new track
        displayTrack(currentTrack)

        // start stream of new track
        if (wasPlaying) {
            my.play();
            isPlaying = 1;
        }
    }

    my.play = function playF () {
        // start stream of current track

        console.log('Streaming: ', tracks[currentTrack].title);
        //SC.stream('/tracks/' + track.id).then(function(player){
        //  player.play();
        //});
    }

    my.stop = function stopF () {
        // stop stream of current track

        console.log('Stopping: ', tracks[currentTrack].title);
        //SC.stream('/tracks/' + track.id).then(function(player){
        //  player.stop();
        //});
    }

    my.playTrack = function playTrackF (trackID) {
        // stop stream of current track
        if (isPlaying)
            my.stop();

        // play certain track
        console.log('player::playTrack: ', trackID);
        var trackNumber = getTrackNumber(trackID);
        console.log('player::playTrack: trackNumber', trackNumber);
        displayTrack(trackNumber);

        // start stream of new track
        my.play();
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
    player.init('#player');
    visualization.init();
    player.addTracks(fakeTracks);
    visualization.addTracks(fakeTracks);
    //player.playTrack(3);
}

document.addEventListener("DOMContentLoaded", testVis);
