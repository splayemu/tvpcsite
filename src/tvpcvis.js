soundcloudClientID = '3bfa6c4e7c64be439b555750443fcab7';
tvpcSoundcloudID = '5035743';

SC.initialize({
    client_id: soundcloudClientID
});

// use the soundcloud api to get TVPC song stats
SC.get('/users/' + tvpcSoundcloudID + '/tracks/').then(function(tracks) {
      visualization.init();
      visualization.addTracks(tracks);
  }).catch(function(error) {
      alert('Error: ' + error.message);
});

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
        viewVis = null,
        xAxis = null,
        yAxis = null,
        scales = null,
        trackSelected = null,
        outerWidth = 1200,
        outerHeight = 600,
        margin = {left: 150, right: 150, top: 40, bottom: 40},
        width = outerWidth - margin.left - margin.right,
        height = outerHeight - margin.top - margin.bottom,
        xAxisValue = 'created_at',
        yAxisValue = 'playback_count',
        rAxisValue = 'favoritings_count',
        attributeNameMapping = {
            'title': 'Title:',
            'created_at': 'Released:',
            'duration': 'Duration:',
            'favoritings_count': 'Favorites:',
            'playback_count': 'Listens:',
            'download_count': 'Downloads:',
        },
        attributeFormatters = {
            'created_at': function(dateString) { return d3.time.format("%B %e %Y")(new Date(dateString)); },
            'duration': function(miliseconds) {
                var seconds = Math.floor(miliseconds / 1000),
                    minutes = Math.floor(seconds / 60),
                    seconds = seconds % 60;
                if (seconds < 10) seconds = '0' + seconds;
                return minutes + ':' + seconds},
            'favoritings_count': d3.format("s"),
        };

    var updateTrackInformation = function displayTrackInformationF () {

        var attributes = ['title', 'created_at', 'duration', 'playback_count', 'favoritings_count', 'download_count'];
        var trackValues = [];
        for (var i in attributes) {
            if (attributes.hasOwnProperty(i)) {
                var attr = attributes[i];
            }
            if (trackSelected !== null && trackSelected.hasOwnProperty(attr)) {
                var attributeName = attr,
                    attributeValue = trackSelected[attr];
                if (attributeNameMapping.hasOwnProperty(attr))
                    attributeName = attributeNameMapping[attr];
                if (attributeFormatters.hasOwnProperty(attr))
                    attributeValue = attributeFormatters[attr](attributeValue);

                trackValues.push([attributeName, attributeValue]);
            }
        }

        var boundingBox = d3.select('div#content')[0][0].getBoundingClientRect();
        var infoBox = d3.select('#trackInformation')
            .style({'top': boundingBox.top + 'px', 'left': boundingBox.right + 'px'});

        var rows = infoBox.select('tbody').selectAll('tr')
            .data(trackValues)
            .html(function (d, i) { return '<td>' + d[0] + '</td><td>' + d[1] + '</td>'; });

        rows.enter()
            .append('tr')
            .html(function (d, i) { return '<td>' + d[0] + '</td><td>' + d[1] + '</td>'; });

        rows.exit()
            .remove();

        infoBox.classed('hidden', !rows[0].length);
    }

    my.init = function initF () {

        svg = d3.select('div#content')
            .append('div')
            .classed('svg-container', true)
            .classed('inner', true)
            .append('svg')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', '0 0 ' + outerWidth + ' ' + outerHeight)
            .classed('svg-content-responsive', true);


        xAxis = d3.svg.axis()
                .orient('bottom')
                .ticks(0);

        yAxis = d3.svg.axis()
                .orient('left')
                .ticks(0);

        viewVis = svg.append('g')
                      .attr('id', 'viewVis')
                      .attr('width', width)
                      .attr('height', height)
                      .attr("transform", "translate(" + margin.left  + "," + margin.top + ")")


        // xAxis
        svg.append('g')
            .attr('id', 'xAxis')
            .attr("transform", "translate(" + margin.left + "," + (margin.top + height) + ")")
            .classed('axis', true);

        // yAxis
        svg.append('g')
            .attr('id', 'yAxis')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .classed('axis', true);
    }

    my.calculateScales = function calculateScalesF (tracks) {
        var minCircleSize = 4,
            maxCircleSize = 15,
            strokeWidth = 6,
            xBuffer = maxCircleSize + strokeWidth,
            yBuffer = maxCircleSize + strokeWidth;

        var xValues = new Scale();
        var yValues = new Scale();
        var rValues = new Scale();

        for (var i in tracks) {
            if (tracks.hasOwnProperty(i)) {
                xValues.addValue(new Date(tracks[i][xAxisValue]));
                yValues.addValue(tracks[i][yAxisValue]);
                rValues.addValue(tracks[i][rAxisValue]);
            }
        }

        var xScale = d3.time.scale()
            .domain(xValues.getMinMax())
            .range([xBuffer, width - xBuffer]);

        var yScale = d3.scale.log()
            .domain(yValues.getMinMax())
            .range([height - yBuffer, yBuffer]);

        var rScale = d3.scale.log()
            .domain(rValues.getMinMax())
            .range([minCircleSize, maxCircleSize]);

        return [xScale, yScale, rScale];
    }

    my.addTracks = function addTracksF (tracks) {
        scales = my.calculateScales(tracks);

        // add a tick for each value specifically, but hide them
        var xTickValues = [],
            yTickValues = [];

        for (var i in tracks) {
            if (tracks.hasOwnProperty(i)) {
                xTickValues.push(new Date(tracks[i][xAxisValue]));
                yTickValues.push(tracks[i][yAxisValue]);
            }
        }

        xAxis.scale(scales[0])
            .tickFormat(d3.time.format("%B %Y"))
            .tickValues(xTickValues);

        var xTicks = xAxis.ticks();

        d3.select('#xAxis')
            .call(xAxis);

        yAxis.scale(scales[1])
            .tickFormat(function(d) {
                var prefix = d3.formatPrefix(d);
                return prefix.scale(d).toFixed() + prefix.symbol + " listens"; })
            .tickValues(yTickValues);

        var yTicks = yAxis.ticks();

        d3.select('#yAxis')
            .call(yAxis);

        var ticks = svg.selectAll('.tick')
            .classed('hidden', true);

        // for some reason, selectAll returns the tick [] the same order as tickValues
        // (works out really well for us)
        var domXTicks = d3.selectAll('#xAxis .tick')[0];
        var domYTicks = d3.selectAll('#yAxis .tick')[0];

        var trackAxesPositionMap = {};
        for (var i in tracks) {
            if (tracks.hasOwnProperty(i)) {
                var xPosition = xTickValues.map(Number).indexOf(+(new Date(tracks[i][xAxisValue])));
                var yPosition = yTickValues.indexOf(tracks[i][yAxisValue]);

                var additionalValues = tracks[i].additionalValues = {}
                additionalValues.xTick = domXTicks[xPosition];
                additionalValues.yTick = domYTicks[yPosition];
            }
        }

        var circles = viewVis.selectAll('circles')
            .data(tracks)
            .enter().append('circle')
            .attr("cx", function(d) { return scales[0](new Date(d[xAxisValue])); })
            .attr("cy", function(d) { return scales[1](d[yAxisValue]); })
            .attr("r", function(d) { return scales[2](d[rAxisValue]); });

        // declare event handlers for visualization
        circles.on('click', function (d, i) {
            var sameCircleClicked = d === trackSelected;
            if(trackSelected !== null) {
                var xTickShown = d3.select(trackSelected.additionalValues.xTick)
                    .classed('hidden', true);

                var yTickShown = d3.select(trackSelected.additionalValues.yTick)
                    .classed('hidden', true);

            }

            console.log('trackSelected:', trackSelected, 'd:', d, 'd === trackSelected', d === trackSelected);

            trackSelected = trackSelected === null || ! sameCircleClicked
                ? d: null;
            console.log('trackSelected:', trackSelected);

            // new circle's ticks
            var xTickShown = d3.select(d.additionalValues.xTick)
                .classed('hidden', sameCircleClicked);

            var yTickShown = d3.select(d.additionalValues.yTick)
                .classed('hidden', sameCircleClicked);

            // hide or display track information
            updateTrackInformation();

        });

        //circles.on('mouseover', function (d, i) {
        //    console.log(d, i, ' was moused over');
        //    console.log(d3.event);
        //});
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
    visualization.addTracks(fakeTracks);
}

//document.addEventListener("DOMContentLoaded", testVis);
