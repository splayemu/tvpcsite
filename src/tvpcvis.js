soundcloudClientID = '3bfa6c4e7c64be439b555750443fcab7';
tvpcSoundcloudID = '5035743';

SC.initialize({
    client_id: soundcloudClientID
});
// use the soundcloud api to get TVPC song stats
console.log('Everything seems ship shape');

SC.get('/users/' + tvpcSoundcloudID + '/tracks/')
  .then(function(tracks){
      console.log(tracks);
      drawSongs(tracks);})
  .catch(function(error){
      alert('Error: ' + error.message);
});

var popularity = function popularityF (track) {
    return track.favoritings_count;
}

function Scale(minLoc, maxLoc) {
    // force new to be called
    if (!(this instanceof Scale)) {
        return new Scale(minLoc, maxLoc);
    }

    this.minLoc = minLoc;
    this.maxLoc = maxLoc;
    this.minValue = null;
    this.maxValue = null;
    this.buffer = 0;
}

Scale.prototype.addValue = function (value) {
    console.log('addValue ' + value);
    if(this.minValue === null || this.minValue > value)
        this.minValue = value;

    if(this.maxValue === null || this.maxValue < value)
        this.maxValue = value;
}

Scale.prototype.toScale = function (value) {
    if(this.minValue === null)
        return null;

    // rate = plot / value
    var valueRate = Math.max(1, this.maxValue - this.minValue);
    var rate = (this.maxLoc - this.minLoc - 2 * this.buffer) / valueRate;

    return this.minLoc + this.buffer + rate * (value - this.minValue);
}

var calculateScales = function calculateScalesF (tracks) {
    // need to put everything into scale
    // x axis is date released
    // y axis is bpm? length?

    var vis = d3.select('#vis')
    var maxCircleSize = 0;

    var xScale = new Scale(0, 800);
    var yScale = new Scale(0, 600);

    for (var i in tracks) {
        if (tracks.hasOwnProperty(i)) {
            console.log('adding', i, ":", tracks[i]);
            yScale.addValue(tracks[i].duration);

            var birthSeconds = Date.parse(tracks[i].created_at)
            xScale.addValue(birthSeconds);

            // radius
            if (popularity(tracks[i]) > maxCircleSize)
                maxCircleSize = popularity(tracks[i]);
        }
    }
    xScale.buffer = maxCircleSize + 1;
    yScale.buffer = maxCircleSize + 1;

    return [xScale, yScale];
}

// use d3 to draw circles based on the number of likes
function drawSongs(tracks) {

    var scales = calculateScales(tracks);
    console.log('drawing tracks');
    var circle = d3.select("#vis").selectAll("circle")
        .data(tracks)
        .enter().append("circle")
        .attr("cx", function(d) { return scales[0].toScale(Date.parse(d.created_at)); })
        .attr("cy", function(d) { return scales[1].toScale(d.duration); })
        .attr("r", popularity);
}

//document.addEventListener("DOMContentLoaded", main);
