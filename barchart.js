var HisWidth = document.getElementById('barchartSum').clientWidth;
var HisHeight = document.getElementById('barchartSum').clientHeight;

console.log(HisWidth,HisHeight)

// sizing information, including margins so there is space for labels, etc
var HisMargin =  { top: 30, right: 50, bottom: 10, left:50},
    HisWidth = HisWidth - HisMargin.left - HisMargin.right,
    HisHeight =  HisHeight - HisMargin.top - HisMargin.bottom;

// some colours to use for the bars
var colour_scale = d3.scaleQuantile()
                        .range(["#fd6423","#f6834e","#ffa300","#fdb12b","#ffc053"].reverse());
// var colour_scale = d3.scaleQuantile()
//         .range(colorbrewer.OrRd[6]);

console.log(HisWidth,HisHeight)

// mathematical scales for the x and y axes
var x_scale = d3.scaleLinear()
                .range([0, HisWidth]);
var y_scale = d3.scaleBand()
                .paddingInner(0.4)
                .paddingOuter(0)
                .range([0, HisHeight]);

// rendering for the x and y axes
var yAxis = d3.axisLeft()
                .scale(y_scale)
                .tickSize(0);


////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
var barData;

d3.csv("DataSmallMulti.csv", function(error, data) {

    data.map (function (d) {
        if (d.year==="2018")
        d.year = "2018H1"
    })
    console.log(data)
    // 汇总每年的投资额和投资数量
    barData = d3.nest()
        .key(function(d) { return d.year; })
        .rollup(function(v) { return {
            count: v.length,
            sum: d3.sum(v, function(d) { return +d.volume/100;})
        }; })
        .entries(data);

    drawHischart('#barchartSum',"sum")
    drawHischart('#barchartCount',"count")

    console.log(barData)

});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function drawHischart(divname = '#barchartSum', valuename = "sum") {

    // something for us to render the chart into
    var HisSvg = d3.select(divname)
                    .append("svg")
                    .attr("class", "BerifBar")
                    .attr("width", HisWidth + HisMargin.left + HisMargin.right)
                    .attr("height", HisHeight + HisMargin.top + HisMargin.bottom);


    var Bmain = HisSvg.append("g")
                    .attr("class", "BerifBar")
                    .attr("transform", "translate(" + HisMargin.left + "," + HisMargin.top + ")");

    // draw the axes now that they are fully set up
    Bmain.append("g")
        .attr("class", "yAxis")
        .attr("transform", "translate(0," + 0 + ")")
        .call(yAxis)
        .select("text")
        .style("text-anchor", "end");

    console.log(HisWidth,HisHeight);

    // set scale
    var years = barData.map(function(d){ return d.key; });
    y_scale.domain(years);

    var max_value = d3.max(barData, function(d){ return d.value[valuename]; });
    x_scale.domain([0, max_value]);

    colour_scale.domain([0, max_value]);

    // redraw the bars on the Bmain chart
   // draw the bars
    var BmainBars = Bmain.selectAll(".minibar").data(barData)

    BmainBars
        .exit()
        .remove();

    BmainBars
        .enter()
            .append("rect")
            .attr("class", ".minibar")
            // .attr("transform", function(d) { return "translate(" + x(+d.count) + ",0)"; })
            // .attr("width", function(d) { return xBBmain(+d.Sumofcount); })
            // .attr("height", yBBmain.bandwidth())
            .attr('x', 0)
            .attr("y", function(d) { return y_scale(d.key);})
            .attr("fill", "white")
        .merge(BmainBars)
            .transition()
            .duration(600)
            .attr('x', 0)
            .attr("y", function(d) { return y_scale(d.key); })
            .attr("width", function(d) { return x_scale(d.value[valuename]); })
            .attr("height", y_scale.bandwidth())
            .attr("fill", function(d) { return colour_scale(d.value[valuename]); });

    // redraw the x axis of the Bmain chart
    Bmain.select(".yAxis").call(yAxis);

    // draw topic
    if (valuename=="sum")
        { topic = "Amount of Investments(million RMB)"} 
    else { topic = "No. of Investments"}

    HisSvg.append("text")
      .attr("class", "topicBar")
      .attr("transform", "translate(" + HisMargin.left*0.5 + "," + HisMargin.top*0.6 + ")")
      .attr("font-size",12)
      .attr("fill", "#666")
      .text(topic);


    Bmain.selectAll('.bartext')
        .data(barData)
        .enter()
        .append('text')
        .attr('class', 'bartext')
        .attr('x', function(d){ return x_scale(d.value[valuename]) + 5; })
        .attr('y', function(d){ return y_scale(d.key) + y_scale.bandwidth(); })
        .attr('fill', function(d){ return colour_scale(d.value[valuename]);})
        .attr("font-size",10)
        .attr("fill", "#999")
        .text(function(d) { return Math.round(d.value[valuename])})
        // .attr('text-anchor','middle');

};