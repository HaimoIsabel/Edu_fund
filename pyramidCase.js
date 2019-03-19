var width = document.getElementById('pyramid').clientWidth;
var height = document.getElementById('pyramid').clientHeight;


// var width = 550;
// var height = 450;
var margin = {top: 55, right: 50, bottom: 50, left: 50};


width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;


var color = d3.scaleOrdinal()
        .range(["#0293cf","#049dec","#04b9fa","#40cfff","#84e2fc","#bceafc"].reverse());
    // .range(["#255aee","#3a6fff","#4f84ff","rgb(101,154,302)","rgb(122,175,323)", "rgb(144,197,345)"]);           

var svgPyramid = d3.select('#pyramid')
    .append('svg')
    .attr('width', width + margin.left + margin.right )
    .attr('height', height + margin.top + margin.bottom )
  .append('g')
    .attr('transform', 'translate(' + ( margin.left)+ ',' + ( margin.top*0.9) + ')');

var percentailformat = d3.format(".1%");


var initialData;
d3.csv("DataSmallMulti.csv", function(error, data) {
    // console.log(data)
    initialData=data
    updatePyramid()
});

function updatePyramid (year='total') {

    // get choice
    var choiceYear = [];
    d3.selectAll(".check_year").each(function(d){
        cb = d3.select(this);
        if(cb.property("checked")){
            choiceYear.push(cb.property("value"));
        }
    });
 
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // 筛选年份
    pyramidData = initialData.filter(function(d) {
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
        .entries(pyramidData);

    /////////////////////总额
    data3 = data2.slice().sort(function(a,b){ 
        return b.value['sum'] - a.value['sum'];
    });

    sortedCompany =[]
    data3.forEach (function(d) {
        sortedCompany.push(d.key)
    })

    pyramidData.forEach(function(d,i) {
        d.CurrrentRank = sortedCompany.indexOf(d.company)+1 ;
    })

    // console.log(initialData)
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////

    var dataMetrics=[
        {key: 'Top1', range: [1,1]},
        {key: 'Top2-5', range: [2,5]},
        {key: 'Top6-10', range: [6,10]},
        {key: 'Top11-20', range: [11,20]},
        {key: 'Top21-50', range: [21,50]},
        {key: 'After Top50', range: [51,1000]}]

    dataMetrics.forEach(function (d,i) {
        sum=0;
        pyramidData.filter(function(v) {
        if (v.CurrrentRank>=d.range[0] && v.CurrrentRank<=d.range[1]) {
            sum=sum+(+v.volume)
        }
        });

        d.value = sum;
    })

    // console.log(dataMetrics)

    if (dataMetrics.length >0 ) {

        d3.selectAll(".pyramid-group").remove();
        var pyramid = d3.pyramid()
            .size([width,height*0.75])
            .value(function(d) {return d.value; });
        
        var line = d3.line()
            .x(function(d,i) { return d.x; })
            .y(function(d,i) { return d.y; });
        
        var g = svgPyramid.selectAll(".pyramid-group")
            .data(pyramid(dataMetrics))
            .enter().append("g")
            .attr("class", "pyramid-group");
        
        g.append("path")
            .attr("d", function (d){ return line(d.coordinates); })
            .style("fill", function(d) { return color(d.key); })
            .on("click",function(d) { return updateVis(d.range, d.key); });
        
        g.append("text")
            .attr("y", function (d,i) {
                    if(d.coordinates.length === 4) {
                        return (((d.coordinates[0].y-d.coordinates[1].y)/2)+d.coordinates[1].y) + 5;
                    } else {
                        return (d.coordinates[0].y + d.coordinates[1].y)/2 + 10;
                    } })
            .attr("x", function (d,i) { return width/2 ;})
            .attr("text-anchor", "middle")
            .attr("fill", "#FFF")
            .text(function(d) { return d.key+": "+ percentailformat(d.percentail/100); });


        // topic

        d3.selectAll(".topicPyramid").remove();

        svgPyramid
            .append("text")
            .attr("class", "topicPyramid")
            .attr("font-size",13)
            .attr("transform", "translate("+ (- margin.left) +","+ (- 30 ) + ")")
            .text('The top 1 company got ' + percentailformat(dataMetrics[0].percentail/100) + ' of total investment')
            .attr('fill',"#049dec");
        svgPyramid
            .append("text")
            .attr("class", "topicPyramid")
            .attr("font-size",13)
            .attr("transform", "translate("+ (- margin.left)  +","+ (- 10 ) + ")")
            .text('The top 2-5 companies got ' + percentailformat(dataMetrics[1].percentail/100) + ' of total investment')
            .attr('fill',"#049dec");
        svgPyramid
            .append("text")
            .attr("class", "topicPyramid")
            .attr("font-size",13)
            .attr("transform", "translate("+ (- margin.left)  +","+ ( 10 ) + ")")
            .text('...')
            .attr('fill',"#049dec");

    }


    
    // d3.select("body").append("table")
    //     .attr({
    //         "id" : "footer",
    //         "width": width + "px"
    //     })
    
    // d3.select("body #footer").append("tr")
    //     .attr({
    //         "class" : "PykCharts-credits",
    //         "id" : "credit-datasource"
    //     })
    //     .append("td")
    //     .style("text-align","left")
    //     .html("<span style='pointer-events:none;'>Credits: </span><a href='http://pykcharts.com' target='_blank'>"+  "Pykcharts" +"</a>");

};

    
var preRange;
function updateVis (range,key) {

    if (range === preRange) {
        range = [1,1000];
        preRange = range;
    } else {
        preRange = range;
    }

    updatePie(range,key);
    updateMulti(range[0],range[1]);
}