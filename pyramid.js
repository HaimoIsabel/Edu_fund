d3.pyramid = function() {
  var size = [1,1],
      value = function(d) { return d.value},
      coordinates;

  var percentageValues = function (dataMetrics) {
    var values = dataMetrics.map(value);
    var sum = d3.sum(values, function (d){
      return +d;
    });
    var percentValues = dataMetrics.map(function (d,i){
      d.value = +values[i];
      return values[i]/sum*100;
    });
    // percentValues.sort(function(a,b){
    //   return b-a;
    // });
    return percentValues;
  }

  var coordinatesCalculation = function(dataMetrics){
    var w = size[0],
        h = size[1],
        ratio = (w/2)/h,
        percentValues = percentageValues(dataMetrics),
        coordinates = [],
        area_of_triangle = (w * h) / 2;

    function d3Sum (i) {
      return d3.sum(percentValues,function (d, j){
        if (j<= 5-i) {
          return d;
        }
      });
    }
    for (var i=0,len=dataMetrics.length;i<len; i++){

      var selectedPercentValues = d3Sum(i),
          area_of_element = selectedPercentValues/100 * area_of_triangle,
          height1 = Math.sqrt(area_of_element/ratio),
          base = 2 * ratio * height1,
          xwidth = (w-base)/2;
      if (i===0){
        coordinates[i] = {"values":[{"x":w/2,"y":0},{"x":xwidth,"y":height1},{"x":base+xwidth,"y":height1}]};
      }else{
        coordinates[i] = {"values":[coordinates[i-1].values[1],{"x":xwidth,"y":height1},{"x":base+xwidth,"y":height1},coordinates[i-1].values[2]]};
      }

    }
    coordinates[0].values[1] = coordinates[coordinates.length-1].values[1];
    coordinates[0].values[2] = coordinates[coordinates.length-1].values[2];
    var first_dataMetrics = coordinates.splice(0,1);
    coordinates = coordinates.reverse();
    coordinates.splice(0,0,first_dataMetrics[0]);
    return coordinates;
  } 
  function pyramid(dataMetrics) {
    var i = 0,
        coordinates = coordinatesCalculation(dataMetrics);
        percentails = percentageValues(dataMetrics);
    
    // dataMetrics.sort(function(a,b) {
    //   return a.value - b.value;
    // })
    
    dataMetrics.forEach(function(){
      dataMetrics[i].coordinates = coordinates[i].values;
      dataMetrics[i].percentail = percentails[i];
      i++;
    })
    return dataMetrics;
  }
  pyramid.size = function(s){
    if(s.length === 2) {
      size = s;                    
    }
    return pyramid;
  }
  pyramid.value = function(v) {
    if (!arguments.length) return value;
    value = v;
    return pyramid;
  };
  return pyramid;
}