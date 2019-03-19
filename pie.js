///////////////////////////////////////////////////////////////////
var width = document.getElementById('piechart').clientWidth;
var height = document.getElementById('piechart').clientHeight*0.95;

var margin = {top: 10, right: 50, bottom: 10, left: 50};

width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;

var donut = donutChart()
    .width(width)
    .height(height)
    .transTime(750) // length of transitions in ms
    .cornerRadius(3) // sets how rounded the corners are on each slice
    .padAngle(0.015) // effectively dictates the gap between slices
    .variable('percentage')
    .category('key');

/////////////////////////////////////////
////////////////load data////////////////
var pie_data;
var domain_key;

var svgPie = d3.select('#piechart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + (width / 2 + margin.left)+ ',' + (height / 2 + 2*margin.top) + ')');


// topic
svgPie.append("text")
    .attr("class", "topicPie")
    .attr("transform", "translate("+ ( - width/2 - margin.left) +","+ (-height/2 ) + ")")
    .attr("font-size",13)
    .attr('fill',"#049dec");


var initialData;

d3.csv("DataSmallMulti.csv", function(error, data) {
    // console.log(data)
    initialData=data
    updatePie([1,1000])
});

var pre_rank;
function updatePie(rank,range) {

    var choiceYear = [];
    d3.selectAll(".check_year").each(function(d){
        cb = d3.select(this);
        if(cb.property("checked")){
            choiceYear.push(cb.property("value"));
        }
    });


    if (rank[0] == 1 && rank[1] == 1000 ) {
        range = 'Total'
        svgPie.select(".topicPie")
            .text('Company: '+range);
    } else {
        svgPie.select(".topicPie")
            .text('Company: '+range);
    }

 
    // 数据筛选和筛选后的汇总
    // 筛选年份
    pieData = initialData.filter(function(d) {
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
        .entries(pieData);

    //按总额排序
    data3 = data2.slice().sort(function(a,b){ 
        return b.value['sum'] - a.value['sum'];
    });

    sortedCompany =[]
    data3.forEach (function(d) {
        sortedCompany.push(d.key)
    })

    pieData.forEach(function(d,i) {
        d.CurrrentRank = sortedCompany.indexOf(d.company)+1 ;
    })

    // console.log(pyramidData)
    var dataMetrics=[
        {key: 'K12'},
        {key: 'Language Learning'},
        {key: 'Vocational Edu.'},
        {key: 'Early Childhood Edu.'},
        {key: 'Holistic Edu.'},
        {key: 'Paid Knowledge'},
        {key: 'STEAM'},
        {key: 'Higher Edu.'},
        {key: 'Edu. Informationization'},
        {key: 'Study Abroad Services'},
        {key: 'Edu. SaaS'},
        {key: 'Others'}]

    // 按照排序筛选
    dataMetrics.forEach(function (d,i) {
        sum=0;
        pieData.filter(function(v) {
            // console.log(v.Rank,d.key,rank[0],v.track)
        if (v.CurrrentRank>=rank[0] && v.CurrrentRank<=rank[1] && v.track == d.key) {
            sum=sum+(+v.volume)
        }
        });

        d.value = sum;
    })
    // console.log(dataMetrics)

    sum=0;
    dataMetrics.forEach(function(d,i){
        sum=sum+(+d.value)
        i++;
    })

    // console.log(dataMetrics)
    //calculate percentage
    dataMetrics.map(function(d){
        d.percentage = +d.value/sum
    })
    // console.log(dataMetrics)

    donut.data(dataMetrics);
    svgPie.call(donut);

}

function donutChart() {
    var data = [],
        width,
        height,
        margin = {top: 30, right: 30, bottom: 30, left: 30},
        colour = d3.scaleOrdinal()
                  .domain(["K12", "Language Learning", "Vocational Edu.", "Early Childhood Edu.", "Holistic Edu.", "Paid Knowledge", "STEAM", "Higher Edu.",  "Edu. Informationization", "Study Abroad Services", "Edu. SaaS", "Others"])
                  .range(["#0262a2","#0384ca","#0293cf","#049dec","#04b9fa","#84e2fc","#bceafc","#ffc053","#fdb12b","#ffa300","#fd6423"]), // colour scheme ,"#c0cbde"
        variable, // value in data that will dictate proportions on chart
        category, // compare data by
        padAngle, // effectively dictates the gap between slices
        transTime, // transition time
        updateData,
        floatFormat = d3.format('.4r'),
        cornerRadius, // sets how rounded the corners are on each slice
        percentFormat = d3.format(',.2%');


    function chart(){

            // ===========================================================================================
            // Set up constructors for making donut. See https://github.com/d3/d3-shape/blob/master/README.md
            var radius = Math.min(width, height) / 2;

            // creates a new pie generator
            var pie = d3.pie()
                .value(function(d) { return floatFormat(d[variable]); })
                // .sort(function(d) { return d[category]; })
                .startAngle(-0.8);

            // contructs and arc generator. This will be used for the donut. The difference between outer and inner
            // radius will dictate the thickness of the donut
            var arc = d3.arc()
                .outerRadius(radius * 0.65)
                .innerRadius(radius * 0.4)
                .cornerRadius(cornerRadius)
                .padAngle(padAngle);

            // this arc is used for aligning the text labels
            var outerArc = d3.arc()
                .outerRadius(radius * 0.95)
                .innerRadius(radius * 0.8);
            // ===========================================================================================
            // colour.domain()
            // colour.range()
            // ===========================================================================================
            // g elements to keep elements within svg modular
            svgPie.append('g').attr('class', 'slices');
            svgPie.append('g').attr('class', 'labelName');
            svgPie.append('g').attr('class', 'lines');
            // ===========================================================================================

            // ===========================================================================================
            // add and colour the donut slices
            var path = svgPie.select('.slices')
                .selectAll('path')
                .data(pie(data))
                .enter().append('path')
                .attr('fill', function(d) { 
                    return colour(d.data[category]); })
                .attr('d', arc)
                .each(function(d) { this._current = d; }); // store the initial angles
            // ===========================================================================================

            // ===========================================================================================
            // add text labels
            var label = svgPie.select('.labelName').selectAll('text')
                .data(pie(data))
                .enter().append('text')
                .attr('dy', '.35em')
                .html(updateLabelText)
                .attr('transform', labelTransform)
                .style('text-anchor', function(d) {
                    // if slice centre is on the left, anchor text to start, otherwise anchor to end
                    return (midAngle(d)) < Math.PI ? 'start' : 'end';
                })
                .attr('fill','#666')
                .attr('opacity', function (d,i) {
                    if (d.value === 0) {
                        return 0
                    } else {
                        return 1
                    }
                });
            // ===========================================================================================

            // ===========================================================================================
            // add lines connecting labels to slice. A polyline creates straight lines connecting several points
            var polyline = svgPie.select('.lines')
                .selectAll('polyline')
                .data(pie(data))
              .enter().append('polyline')
                .attr('points', calculatePoints)
                .attr('opacity', function (d,i) {
                    if (d.value === 0) {
                        return 0
                    } else {
                        return 0.2
                    }
                });

            // ===========================================================================================

            // ===========================================================================================
            // add tooltip to mouse events on slices and labels
            d3.selectAll('.labelName text, .slices path').call(toolTip);
            // ===========================================================================================

            // ===========================================================================================
            // FUNCTION TO UPDATE CHART
            updateData = function() {

                var updatePath = d3.select('.slices').selectAll('path');
                var updateLines = d3.select('.lines').selectAll('polyline');
                var updateLabels = d3.select('.labelName').selectAll('text');

                var data0 = path.data(), // store the current data before updating to the new
                    data1 = pie(data);

                // update data attached to the slices, labels, and polylines. the key function assigns the data to
                // the correct element, rather than in order of how the data appears. This means that if a category
                // already exists in the chart, it will have its data updated rather than removed and re-added.
                updatePath = updatePath.data(data1, key);
                updateLines = updateLines.data(data1, key);
                updateLabels = updateLabels.data(data1, key);


                // removes slices/labels/lines that are not in the current dataset
                updatePath.exit()
                    .transition()
                    .duration(transTime)
                    .attrTween("d", arcTween1)
                    .remove();

                updateLines.exit()
                    .transition()
                    .duration(transTime)
                    .attrTween("points", pointTween)
                    .remove();

                updateLabels.exit()
                    .remove();


                // adds new slices/lines/labels
                var new_updatePath = updatePath.enter().append('path')
                    .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
                    .attr('d', arc)
                    .attr('fill', function(d) { 
                        return colour(d.data[category]);
                    });

                var new_updateLines = updateLines.enter().append('polyline')
                    .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
                    .attr('points', calculatePoints)
                    .attr('opacity', function (d,i) {
                        if (d.value === 0) {
                            return 0
                        } else {
                            return 0.2
                        }
                    });

                var new_updateLabels = updateLabels.enter().append('text')
                    .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
                    .html(updateLabelText)
                    .attr('transform', labelTransform)
                    .attr('color','#666666')
                    .style('text-anchor', function(d) { return (midAngle(d)) < Math.PI ? 'start' : 'end'; })
                    .attr('opacity', function (d,i) {
                        if (d.value === 0) {
                            return 0
                        } else {
                            return 1
                        }
                    });


                // animates the transition from old angle to new angle for slices/lines/labels
                new_updatePath.merge(updatePath)
                    .transition()
                    .duration(transTime)
                    .attrTween('d', arcTween)
                    .attr('fill', function(d) { 
                        return colour(d.data[category]);
                    });

                new_updateLines.merge(updateLines)
                    .attr('opacity', function (d,i) {
                        if (d.value === 0) {
                            return 0
                        } else {
                            return 0.2
                        }
                    })
                    .transition()
                    .duration(transTime)
                    .attrTween('points', pointTween);

                new_updateLabels.merge(updateLabels)
                    .attr('color','#666666')
                    .attr('opacity', function (d,i) {
                        if (d.value === 0) {
                            return 0
                        } else {
                            return 1
                        }
                    })
                    .transition()
                    .duration(transTime)
                    .attrTween('transform', labelTween)
                    .styleTween('text-anchor', labelStyleTween);


                updateLabels.html(updateLabelText); // update the label text

                // add tooltip to mouse events on slices and labels
                d3.selectAll('.labelName text, .slices path').call(toolTip);

            };
            // ===========================================================================================
            // Functions
            // calculates the angle for the middle of a slice
            function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

            // function that creates and adds the tool tip to a selected element
            function toolTip(selection) {

                // add tooltip (svg circle element) when mouse enters label or slice
                selection.on('mouseenter', function (data) {

                    svgPie.append('text')
                        .attr('class', 'toolCircle')
                        .attr('dy', 0) // hard-coded. can adjust this to adjust text vertical alignment in tooltip
                        .html(toolTipHTML(data)) // add text to the circle.
                        // .style('font-size', '.7em')
                        .style('text-anchor', 'middle'); // centres text in tooltip

                    svgPie.append('circle')
                        .attr('class', 'toolCircle')
                        .attr('r', radius * 0.39) // radius of tooltip circle
                        .style('fill', colour(data.data[category])) // colour based on category mouse is over
                        .style('fill-opacity', 0.35);

                });

                // remove the tooltip when mouse leaves the slice/label
                selection.on('mouseout', function () {
                    d3.selectAll('.toolCircle').remove();
                });
            }

            // function to create the HTML string for the tool tip. Loops through each key in data object
            // and returns the html string key: value
            function toolTipHTML(data) {
                var tip = '',
                    i   = 0;
                var keyName = ['Category','Percentage']
                for (var key in data.data) {
                  if (i>=0 && i!=1) {
                    // if value is a number, format it as a percentage
                    var value;
                    if (key === 'count') {
                      value=parseFloat(data.data[key])
                    } else if (key === 'percentage'){
                      value=percentFormat(data.data[key])
                    } else {
                      value=data.data[key]
                    }

                    // leave off 'dy' attr for first tspan so the 'dy' attr on text element works. The 'dy' attr on
                    // tspan effectively imitates a line break.
                    if (i === 0) tip += '<tspan x="0" class="dounut_category">' + value + '</tspan>';
                    else tip += '<tspan x="0" dy="1.2em">' + keyName[i-1] + ': ' + value + '</tspan>';                
                  }
                    i++;
                }

                return tip;
            }

            // calculate the points for the polyline to pass through
            function calculatePoints(d) {
                // see label transform function for explanations of these three lines.
                var pos = outerArc.centroid(d);
                pos[0] = radius * 0.8 * (midAngle(d) < Math.PI ? 1 : -1);

                // console.log(arc.centroid(d), outerArc.centroid(d), pos)
                return [arc.centroid(d), outerArc.centroid(d), pos]
            }

            function labelTransform(d) {
                // effectively computes the centre of the slice.
                // see https://github.com/d3/d3-shape/blob/master/README.md#arc_centroid
                var pos = outerArc.centroid(d);

                // changes the point to be on left or right depending on where label is.
                pos[0] = radius * 0.8 * (midAngle(d) < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            }

            function updateLabelText(d) {
                // console.log(d.data[variable])
                // if (d.data[variable]>0) {
                    return  d.data[category] +
                    ':<tspan>' + percentFormat(d.data[variable]) + '</tspan>';
                // }
                
                // return '<p>' + d.data[category] + '<br>' + percentFormat(d.data[variable]) + '</p>';
            }

            // function that calculates transition path for label and also it's text anchoring
            function labelStyleTween(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t){
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? 'start':'end';
                };
            };

            function labelTween(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t){
                    var d2  = interpolate(t),
                        pos = outerArc.centroid(d2); // computes the midpoint [x,y] of the centre line that would be
                    // generated by the given arguments. It is defined as startangle + endangle/2 and innerR + outerR/2
                    pos[0] = radius * 0.8 * (midAngle(d2) < Math.PI ? 1 : -1); // aligns the labels on the sides
                    return 'translate(' + pos + ')';
                };
            };

            function pointTween(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t){
                    var d2  = interpolate(t),
                        pos = outerArc.centroid(d2);
                    pos[0] = radius * 0.8 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [arc.centroid(d2), outerArc.centroid(d2), pos]; 
                };
            }

            // function to calculate the tween for an arc's transition.
            // see http://bl.ocks.org/mbostock/5100636 for a thorough explanation.
            function arcTween(d) {
                var i = d3.interpolate(this._current, d);
                this._current = i(0);
                return function(t) {
                    return arc(i(t));
                };
            };

            function arcTween1(d) {
                var i = d3.interpolate(this._current, d);
                this._current = i(0);
                return function(t) {
                    return arc(i(t));
                };
            };



            function findNeighborArc(i, data0, data1, key) {
                var d;
                return (d = findPreceding(i, data0, data1, key)) ? {startAngle: d.endAngle, endAngle: d.endAngle}
                    : (d = findFollowing(i, data0, data1, key)) ? {startAngle: d.startAngle, endAngle: d.startAngle}
                        : null;
            }

            // Find the element in data0 that joins the highest preceding element in data1.
            function findPreceding(i, data0, data1, key) {
                var m = data0.length;
                while (--i >= 0) {
                    var k = key(data1[i]);
                    for (var j = 0; j < m; ++j) {
                        if (key(data0[j]) === k) return data0[j];
                    }
                }
            }

            function key(d) {
                return d.data[category];
            }

            // Find the element in data0 that joins the lowest following element in data1.
            function findFollowing(i, data0, data1, key) {
                var n = data1.length, m = data0.length;
                while (++i < n) {
                    var k = key(data1[i]);
                    for (var j = 0; j < m; ++j) {
                        if (key(data0[j]) === k) return data0[j];
                    }
                }
            }

            // ===========================================================================================

        // });
    }

    // getter and setter functions. See Mike Bostocks post "Towards Reusable Charts" for a tutorial on how this works.
    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.margin = function(value) {
        if (!arguments.length) return margin;
        margin = value;
        return chart;
    };

    chart.radius = function(value) {
        if (!arguments.length) return radius;
        radius = value;
        return chart;
    };

    chart.padAngle = function(value) {
        if (!arguments.length) return padAngle;
        padAngle = value;
        return chart;
    };

    chart.cornerRadius = function(value) {
        if (!arguments.length) return cornerRadius;
        cornerRadius = value;
        return chart;
    };

    chart.colour = function(value) {
        if (!arguments.length) return colour;
        colour = value;
        return chart;
    };

    chart.variable = function(value) {
        if (!arguments.length) return variable;
        variable = value;
        return chart;
    };

    chart.category = function(value) {
        if (!arguments.length) return category;
        category = value;
        return chart;
    };

    chart.transTime = function(value) {
        if (!arguments.length) return transTime;
        transTime = value;
        return chart;
    };

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
        return chart;
    };

    return chart;
}

