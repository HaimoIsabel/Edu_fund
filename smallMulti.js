var multiWidth = document.getElementById('smallMulti').clientWidth*0.9;
var multiHeight = document.getElementById('smallMulti').clientHeight;

var multiMargin = {top: 30, right: 50, bottom: 20, left: 150},
    multiWidth = multiWidth - multiMargin.left - multiMargin.right,
    multiHeight = 110 - multiMargin.top - multiMargin.bottom;

var parseDate = d3.timeParse("%b %Y");

var band_scale = d3.scaleBand()
    .range([0, multiWidth]);

var x = d3.scaleTime()
    .range([0, multiWidth]);

var y = d3.scaleLinear()
    .range([multiHeight, 0]);

var area = d3.area()
    .x(function(d) { return x(d.parsedDate); })
    .y0(multiHeight)
    .y1(function(d) { return y(d.volume); });

var line = d3.line()
    .x(function(d) { return x(d.parsedDate); })
    .y(function(d) { return y(d.volume); });

var lineTooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip');

var linesData;

d3.csv("DataSmallMulti.csv", type, function(error, data) {
  linesData = data
  updateMulti()
});

var preStart=0, preEnd=0;

function updateMulti(startInd = 1, endInd =805) {

  var choiceYear = [];
  d3.selectAll(".check_year").each(function(d){
      cb = d3.select(this);
      if(cb.property("checked")){
          choiceYear.push(cb.property("value"));
      }
  });

  // 按年份筛选数据
  filteredData = linesData.filter(function(d) {
      if (choiceYear.includes(d.year)) {
          return d
      }
  });

  // 汇总每个公司的投资额
  var data2 = d3.nest()
    .key(function(d) { return d.company; })
    .rollup(function(v) { return {
      sum: d3.sum(v, function(d) { return +d.volume; }),
      }; })
    .entries(filteredData);

  // 排序 按照每个公司的投资总额
  data3 = data2.slice().sort(function(a,b){ 
      return b.value['sum'] - a.value['sum'];
  });

  sortedCompany =[]
  data3.forEach (function(d) {
    sortedCompany.push(d.key)
  })
  // console.log(sortedCompany);

  linesData.forEach(function(d,i) {
    d.CurrrentRank = sortedCompany.indexOf(d.company)+1 ;
  })
  ////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////

  if ( preStart == startInd && preEnd == endInd ) {
    startInd = 1;
    endInd =805;
    preStart = 0;
    preEnd = 0;
  } else {
    preStart = startInd;
    preEnd = endInd;
  }

  // console.log(filtereddata)
  linesData.sort(function(a,b){ 
      return parseDate(a.date) - parseDate(b.date);
  });
  
  // Nest data by symbol.
  var symbols = d3.nest()
      .key(function(d) { return d.company; })
      .entries(linesData);

  // 将rank存在原始的数据中
  symbols.forEach(function(d,i) {
    d.rank = sortedCompany.indexOf(d.key)+1 ;
  })

  symbols.sort(function(a,b){ 
      return a.rank - b.rank;
  });

  // 按年份筛选数据
  symbols = symbols.filter(function(d) {
      if (d.rank>=startInd && d.rank<=endInd) {
          return d
      }
  });

  // Compute the maximum price per symbol, needed for the y-domain.
  symbols.forEach(function(s) {
    s.maxVolume = d3.max(s.values, function(d) { return d.volume; });

    maxVolumeTemp = d3.max(s.values, function(d) { return d.volume; });
    s.values.map(function(d) {
      d.maxVolume = maxVolumeTemp
    })
  });

  // set domain of band_scale 
  xExtent = linesData.map(function(d) { return d.date});
  var uniqXExtent = [];
  xExtent.forEach(function(item) {
       if(uniqXExtent.indexOf(item) < 0) {
          uniqXExtent.push(parseDate(item));
       }
  });
  band_scale.domain(uniqXExtent.sort((a,b)=> a-b));

  // console.log(band_scale.bandwidth())

  // set domain of x
  x.domain(d3.extent(linesData, function(d) {return d.parsedDate}));

  xAxis = d3.axisBottom()
            .scale(x)
            .ticks(6);

  d3.selectAll(".multiBar").remove();
  // Add an SVG element for each symbol, with the desired dimensions and margin.
  var svg = d3.select("#smallMulti")
      .selectAll("svg")
      .data(symbols)
    .enter().append("svg")
      .attr("class", "multiBar")
      .attr("width", multiWidth + multiMargin.left + multiMargin.right)
      .attr("height", multiHeight + multiMargin.top + multiMargin.bottom)
    .append("g")
      .attr("transform", "translate(" + multiMargin.left + "," + multiMargin.top + ")");

  svg.append("g")
    .attr("transform", "translate(" + 0 + "," + multiHeight + ")")
    .attr("class", "xAxis")
    .call(xAxis);

  // Add the line path elements. Note: the y-domain is set per element.
  svg.append("path")
      .attr("class", "line")
      .attr("d", function(d) { y.domain([0, d.maxVolume]); return line(d.values); })
      .style("stroke-dasharray", ("3, 3"));


  svg.selectAll("dot")
      .data(function(d) {return d.values;})
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("id", function(d,i) {return "dot_"+d.company+"_"+i })
      .attr("r", 6)
      .attr("cx", function(d) { return x(d.parsedDate); })
      .attr("cy", function(d) {y.domain([0, d.maxVolume]); return y(d.volume); })
      .attr("stroke", function(d) {console.log(d); 
          if (choiceYear.includes(d.year)) {
            return "lightblue"; 
          } else {
            return "#999"; 
          }
        })
      .attr("stroke-width", "3px")
      .attr("fill", "white")
      .on("mouseover",DotMouseOver)
      .on("mousemove",DotMouseMove)
      .on("mouseout",DotMouseOut);


    svg.selectAll("bar")
      .data(function(d) {return d.values;})
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("id", function(d,i) {return "bar_"+d.company+"_"+i })
      .attr("x", function(d) { return x(d.parsedDate) - band_scale.bandwidth()/3*0.5; })
      .attr("y", 0)
      .attr('width', band_scale.bandwidth())
      .attr('height', multiHeight)
      .attr('fill', 'lightblue')
      .attr('opacity', 0)
      .on("mouseover",DotMouseOver)
      .on("mousemove",DotMouseMove)
      .on("mouseout",DotMouseOut);

  // Add a small label for the symbol name.
  svg.append("text")
      .attr("x", multiWidth - 6)
      .attr("y", multiHeight - 6)
      .style("text-anchor", "end")
      .text(function(d) { return d.key; })
      .attr("font-size", "11px")
      .attr('fill',"#666");

  // Add a small label for the symbol name.

  svg.append("circle")
    .attr("transform", "translate(" + (-multiMargin.left*0.5) + "," + (multiMargin.top*1.2) + ")")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 25)
    .attr('fill',"#049dec")
    .attr("opacity", 0.2);

  svg.append("text")
      .attr("transform", "translate(" + (-multiMargin.left*0.5) + "," + multiMargin.top*1.2 + ")")
      .text(function(d) { return "Rank" })
      .style("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr('fill',"#049dec");

  svg.append("text")
      .attr("transform", "translate(" + (-multiMargin.left*0.5) + "," + (multiMargin.top*1.2+15) + ")")
      .text(function(d) { return d.rank })
      .style("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr('fill',"#049dec");

  //////////////////////////////////
  function DotMouseOver(d,i){
    d3.selectAll("#dot_"+ d.company +"_"+i)
        .transition()
        .duration(100)
        .style('fill', "lightblue");

    d3.selectAll("#bar_"+ d.company +"_"+i)
        .transition()
        .duration(100)
        .style('opacity', 1)
        .attr('width', band_scale.bandwidth()/3);

    if (+d.volume_desc===0) {
      volumeDesc='undisclosed'
    } else {
      volumeDesc=d.volume_desc/100 + ' million RMB'
    };

    lineTooltip
        .style('display', null)
        .html( '<p>Time: '+ d.date
          + '<br>Round: ' + d.round 
          + '<br>Investment: ' + volumeDesc + '</p>');

    // console.log(InsNumByName)
    };

    function DotMouseMove(d){
      lineTooltip
          .style('top', (d3.event.pageY -15) + "px")
          .style('left', (d3.event.pageX +15) + "px");
    };


    function DotMouseOut(d){
      d3.selectAll(".dot")
          .transition()
          .duration(100)
          .style('fill', "white");

      d3.selectAll(".bar")
          .transition()
          .duration(100)
          .style('opacity', 0)
          .attr('width', band_scale.bandwidth());

      lineTooltip
          .style('display', 'none');

    };
}

function type(d) {
  d.volume = +d.volume;
  d.parsedDate = parseDate(d.date);
  return d;
}