soundcloudClientID = '3bfa6c4e7c64be439b555750443fcab7';
tvpcSoundcloudID = '5035743';

//SC.initialize({
//    client_id: soundcloudClientID
//});
// use the soundcloud api to get TVPC song stats
console.log('Everything seems ship shape');

//SC.get('/users/' + tvpcSoundcloudID + '/tracks/')
//  .then(function(tracks){
//      console.log(tracks);
//      drawSongs(tracks);})
//  .catch(function(error){
//      alert('Error: ' + error.message);
//});

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

            xValues.addValue(tracks[i].created_at);
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
        .attr("cx", function(d) { return scales[0](d.created_at); })
        .attr("cy", function(d) { return scales[1](d.duration); })
        .attr("r", function(d) { return scales[2](popularity(d)); })
}

function testVis() {
    var fakeTracks = [];

    fakeTracks[0] = {
        'duration': 5000,
        'created_at': new Date(300000),
        'favoritings_count': 5
    };

    fakeTracks[1] = {
        'duration': 3000,
        'created_at': new Date(600000),
        'favoritings_count': 100
    };

    fakeTracks[2] = {
        'duration': 1000,
        'created_at': new Date(900000),
        'favoritings_count': 5000
    };

    fakeTracks[3] = {
        'duration': 2560,
        'created_at': new Date(105000),
        'favoritings_count': 20000
    };

    console.log(fakeTracks);
    drawSongs(fakeTracks);
}

document.addEventListener("DOMContentLoaded", testVis);
