var width = 800, height = 500;
var svg = d3.select("body").append('svg').attr({
    width: width,
    height: height,
    id: "mainsvg"
});
// var fileList = ["WikiNews","Huffington","CrooksAndLiars","EmptyWheel","Esquire","FactCheck"
//                 ,"VIS_papers","IMDB","PopCha","Cards_PC","Cards_Fries"]

var fileList = ["WikiNews", "Huffington", "CrooksAndLiars", "EmptyWheel","Esquire","FactCheck", "VIS_papers", "IMDB","PopCha"]

var initialDataset = "EmptyWheel";
var categories = ["person","location","organization","miscellaneous"];

var fileName;


addDatasetsOptions();
function addDatasetsOptions() {
    var select = document.getElementById("datasetsSelect");   
    for(var i = 0; i < fileList.length; i++) {
        var opt = fileList[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        el["data-image"]="images2/datasetThumnails/"+fileList[i]+".png";
        select.appendChild(el);
    }        
    document.getElementById('datasetsSelect').value = initialDataset;  //************************************************
    fileName = document.getElementById("datasetsSelect").value;
    loadData();
}
var spinner;
function loadData(){
    // START: loader spinner settings ****************************
    var opts = {
        lines: 25, // The number of lines to draw
        length: 15, // The length of each line
        width: 5, // The line thickness
        radius: 25, // The radius of the inner circle
        color: '#000', // #rgb or #rrggbb or array of colors
        speed: 2, // Rounds per second
        trail: 50, // Afterglow percentage
        className: 'spinner', // The CSS class to assign to the spinner
    };
    var target = document.getElementById('loadingSpinner');
    spinner = new Spinner(opts).spin(target);
    // END: loader spinner settings ****************************
    fileName = "data/"+fileName+".tsv"; // Add data folder path
    if (fileName.indexOf("Cards_Fries")>=0){
        categories = ["increases_activity", "decreases_activity"];
    }
    else if (fileName.indexOf("Cards_PC")>=0){
        categories = ["adds_modification", "removes_modification", "increases","decreases", "binds", "translocation"];
    }
    else if (fileName.indexOf("PopCha")>=0){
        categories = ["Comedy","Drama","Action", "Fantasy", "Horror"];
        loadAuthorData(draw);
    }
    else if (fileName.indexOf("IMDB")>=0){
        categories = ["Comedy","Drama","Action", "Family"];
        loadAuthorData(draw);
    }
    else if (fileName.indexOf("VIS")>=0){
        categories = categories = ["Vis","VAST","InfoVis","SciVis"];
        loadAuthorData(draw);
    }
    else{
        categories = ["person","location","organization","miscellaneous"];
        loadBlogPostData(draw);
    } 
}
function loadNewData(event) {
    svg.selectAll("*").remove();
    fileName = this.options[this.selectedIndex].text;
    loadData();
}

function draw(data){
    //Layout data
    var interpolation = "cardinal";
    var axisPadding = 10;
    var margins = {left: 20, top: 20, right: 10, bottom: 30};
    var ws = d3.layout.wordStream()
    .size([width, height])
    .interpolate(interpolation)
    //.fontScale(d3.scale.pow().exponent(2))
    .fontScale(d3.scale.linear())
    .minFontSize(4)
    .maxFontSize(36)
    .data(data);
    var boxes = ws.boxes();
    
    //Display data
    var legendFontSize = 12;
    var legendHeight = boxes.topics.length*legendFontSize;
    //set svg data.
    svg.attr({
        width: width + margins.left + margins.top,
        height: height + margins.top + margins.bottom + axisPadding + legendHeight
    });

    var area = d3.svg.area()
    .interpolate(interpolation)
    .x(function(d){return (d.x);})
    .y0(function(d){return d.y0;})
    .y1(function(d){return (d.y0 + d.y); });
    var color = d3.scale.category10();
    //Display time axes
    var dates = [];
    boxes.data.forEach(row =>{
        dates.push(row.date);
    });
    
    var xAxisScale = d3.scale.ordinal().domain(dates).rangeBands([0, width]);
    var xAxis = d3.svg.axis().orient('bottom').scale(xAxisScale);
    var axisGroup = svg.append('g').attr('transform', 'translate(' + (margins.left) + ',' + (height+margins.top+axisPadding+legendHeight) + ')');
    var axisNodes = axisGroup.call(xAxis);
    styleAxis(axisNodes);
    //Display the vertical gridline
    var xGridlineScale = d3.scale.ordinal().domain(d3.range(0, dates.length+1)).rangeBands([0, width+width/boxes.data.length]);
    var xGridlinesAxis = d3.svg.axis().orient('bottom').scale(xGridlineScale);
    var xGridlinesGroup = svg.append('g').attr('transform', 'translate(' + (margins.left-width/boxes.data.length/2) + ',' + (height+margins.top + axisPadding+legendHeight+margins.bottom) + ')');
    var gridlineNodes = xGridlinesGroup.call(xGridlinesAxis.tickSize(-height-axisPadding-legendHeight-margins.bottom, 0, 0).tickFormat(''));
    styleGridlineNodes(gridlineNodes);
    //Main group
    var mainGroup = svg.append('g').attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');
    var wordStreamG = mainGroup.append('g');
    
    var topics = boxes.topics;
    mainGroup.selectAll('path')
        .data(boxes.layers)
        .enter()
        .append('path')
        .attr('d', area)
        .style('fill', function (d, i) {
            return color(i);
        })
        .attr({
            'fill-opacity': 0.1,
            stroke: 'black',
            'stroke-width': 0.3,
            topic: function(d, i){return topics[i];}
        }); 
    var allWords = [];
    d3.map(boxes.data, function(row){
        boxes.topics.forEach(topic=>{
            allWords = allWords.concat(row.words[topic]);
        });
    });
    var c20 = d3.scale.category20b();
    //Color based on the topic
    var topicColorMap = d3.scale.ordinal().domain(topics).range(c20.range());
    //Color based on term
    var terms = [];
    for(i=0; i< allWords.length; i++){
        terms.concat(allWords[i].text);
    }
    var uniqueTerms = d3.set(terms).values();
    var termColorMap = d3.scale.ordinal()
        .domain(uniqueTerms)
        .range(c20.range());
    var placed = true;
    mainGroup.selectAll('g').data(allWords).enter().append('g')
    .attr({
        transform: function(d){return 'translate('+d.x+', '+d.y+')rotate('+d.rotate+')';}
    }).append('text')
    .text(function(d){return d.text;})
    .attr({
        'font-family': 'Impact',
        'font-size': function(d){return d.fontSize;},
        //fill: function(d){return topicColorMap(d.topic);},
        //fill: function(d, i){return color(i);},
        fill: function(d, i){return termColorMap(d.text);},
        'text-anchor': 'middle',
        'alignment-baseline': 'middle',
        topic: function(d){return d.topic;},
        visibility: function(d, i){ return d.placed ? (placed? "visible": "hidden"): (placed? "hidden": "visible");}
    });
    //Try
    var prevColor;
    //Highlight
    mainGroup.selectAll('text').on('mouseenter', function(){
        var thisText = d3.select(this);
        thisText.style('cursor', 'pointer');
        prevColor = thisText.attr('fill');
        var text = thisText.text();
        var topic = thisText.attr('topic');
        var allTexts = mainGroup.selectAll('text').filter(t =>{
            return t && t.text === text &&  t.topic === topic;
        });
        allTexts.attr({
            stroke: 'red',
            'stroke-width': 1
        });
    });
    mainGroup.selectAll('text').on('mouseout', function(){
        var thisText = d3.select(this);
        thisText.style('cursor', 'default');
        var text = thisText.text();
        var topic = thisText.attr('topic');
        var allTexts = mainGroup.selectAll('text').filter(t =>{
            return t && !t.cloned && t.text === text &&  t.topic === topic;
        });
        allTexts.attr({
            stroke: 'none',
            'stroke-width': '0'
        });
    });
    //Click
    mainGroup.selectAll('text').on('click', function(){
        var thisText = d3.select(this);
        var text = thisText.text();
        var topic = thisText.attr('topic');
        var allTexts = mainGroup.selectAll('text').filter(t =>{
            return t && t.text === text &&  t.topic === topic;
        });
        //Select the data for the stream layers
        var streamLayer = d3.select("path[topic='"+ topic+"']" )[0][0].__data__;
        //Push all points
        var points = Array();
        //Initialize all points
        streamLayer.forEach(elm => {
            points.push({
                x: elm.x,
                y0: elm.y0+elm.y,
                y: 0//zero as default
            });
        });
        allTexts[0].forEach(t => {
            var data = t.__data__;
            var fontSize = data.fontSize;
            //The point
            var thePoint = points[data.timeStep+1];;//+1 since we added 1 to the first point and 1 to the last point.
            thePoint.y = -data.streamHeight;
            //Set it to visible.
            //Clone the nodes.
            var clonedNode = t.cloneNode(true);
            d3.select(clonedNode).attr({
                visibility: "visible",
                stroke: 'none',
                'stroke-size': 0,
            });
            var clonedParentNode = t.parentNode.cloneNode(false);
            clonedParentNode.appendChild(clonedNode);
            
            t.parentNode.parentNode.appendChild(clonedParentNode);
            d3.select(clonedParentNode).attr({
                cloned: true,
                topic: topic
            }).transition().duration(300).attr({
                transform: function(d, i){return 'translate('+thePoint.x+','+(thePoint.y0+thePoint.y-fontSize/2)+')';},
            });
        });
        //Add the first and the last points
        points[0].y = points[1].y;//First point
        points[points.length-1].y = points[points.length-2].y;//Last point
        //Append stream
        wordStreamG.append('path')
            .datum(points)
            .attr('d', area)
            .style('fill', prevColor)
            .attr({
                'fill-opacity': 1,
                stroke: 'black',
                'stroke-width': 0.3,
                topic: topic,
                wordStream: true
            });
        //Hide all other texts
        var allOtherTexts = mainGroup.selectAll('text').filter(t =>{
            return t && !t.cloned &&  t.topic === topic;
        });
        allOtherTexts.attr('visibility', 'hidden');
    });
    topics.forEach(topic=>{
        d3.select("path[topic='"+ topic+"']" ).on('click', function(){
            mainGroup.selectAll('text').filter(t=>{
                return t && !t.cloned && t.placed && t.topic === topic;
            }).attr({
                visibility: 'visible'
            });
            //Remove the cloned element
            document.querySelectorAll("g[cloned='true'][topic='"+topic+"']").forEach(node=>{
                node.parentNode.removeChild(node);
            });
            //Remove the added path for it
            document.querySelectorAll("path[wordStream='true'][topic='"+topic+"']").forEach(node=>{
                node.parentNode.removeChild(node);
            });
        });

    });
    
    //Build the legends
    var legendGroup = svg.append('g').attr('transform', 'translate(' + margins.left + ',' + (height+margins.top) + ')');
    var legendNodes = legendGroup.selectAll('g').data(boxes.topics).enter().append('g')
    .attr('transform', function(d, i){return 'translate(' + 10 + ',' + (i*legendFontSize) + ')';});
    legendNodes.append('circle').attr({
        r: 5,
        fill: function(d, i){return color(i);},
        'fill-opacity': 0.1,
        stroke: 'black',
        'stroke-width': .5,
    });
    legendNodes.append('text').text(function(d){return d;}).attr({
        'font-size': legendFontSize,
        'alignment-baseline': 'middle',
        dx: 8
    });
    spinner.stop();
};
function styleAxis(axisNodes){
    axisNodes.selectAll('.domain').attr({
        fill: 'none'
    });
    axisNodes.selectAll('.tick line').attr({
        fill: 'none',
    });
    axisNodes.selectAll('.tick text').attr({
        'font-family': 'serif',
        'font-size': 10
    });
}
function styleGridlineNodes(gridlineNodes){
    gridlineNodes.selectAll('.domain').attr({
        fill: 'none',
        stroke: 'none'
    });
    gridlineNodes.selectAll('.tick line').attr({
        fill: 'none',
        'stroke-width': 0.7,
        stroke: 'lightgray'
    });
}