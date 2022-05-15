/*
  Highcharts JS v7.0.1 (2018-12-19)

 Indicator series type for Highstock

 (c) 2010-2018 Sebastian Bochan

 License: www.highcharts.com/license
*/
(function(l){"object"===typeof module&&module.exports?module.exports=l:"function"===typeof define&&define.amd?define(function(){return l}):l("undefined"!==typeof Highcharts?Highcharts:void 0)})(function(l){(function(e){var l=e.seriesType,p=e.merge,h=e.defined,m=e.seriesTypes.sma,n=e.seriesTypes.ema,q=e.correctFloat;l("macd","sma",{params:{shortPeriod:12,longPeriod:26,signalPeriod:9,period:26},signalLine:{zones:[],styles:{lineWidth:1,lineColor:void 0}},macdLine:{zones:[],styles:{lineWidth:1,lineColor:void 0}},
threshold:0,groupPadding:.1,pointPadding:.1,states:{hover:{halo:{size:0}}},tooltip:{pointFormat:'\x3cspan style\x3d"color:{point.color}"\x3e\u25cf\x3c/span\x3e \x3cb\x3e {series.name}\x3c/b\x3e\x3cbr/\x3eValue: {point.MACD}\x3cbr/\x3eSignal: {point.signal}\x3cbr/\x3eHistogram: {point.y}\x3cbr/\x3e'},dataGrouping:{approximation:"averages"},minPointLength:0},{nameComponents:["longPeriod","shortPeriod","signalPeriod"],requiredIndicators:["ema"],pointArrayMap:["y","signal","MACD"],parallelArrays:["x",
"y","signal","MACD"],pointValKey:"y",markerAttribs:e.noop,getColumnMetrics:e.seriesTypes.column.prototype.getColumnMetrics,crispCol:e.seriesTypes.column.prototype.crispCol,init:function(){m.prototype.init.apply(this,arguments);this.options&&(this.options=p({signalLine:{styles:{lineColor:this.color}},macdLine:{styles:{color:this.color}}},this.options),this.macdZones={zones:this.options.macdLine.zones,startIndex:0},this.signalZones={zones:this.macdZones.zones.concat(this.options.signalLine.zones),startIndex:this.macdZones.zones.length},
this.resetZones=!0)},toYData:function(a){return[a.y,a.signal,a.MACD]},translate:function(){var a=this,b=["plotSignal","plotMACD"];e.seriesTypes.column.prototype.translate.apply(a);a.points.forEach(function(d){[d.signal,d.MACD].forEach(function(c,e){null!==c&&(d[b[e]]=a.yAxis.toPixels(c,!0))})})},destroy:function(){this.graph=null;this.graphmacd=this.graphmacd&&this.graphmacd.destroy();this.graphsignal=this.graphsignal&&this.graphsignal.destroy();m.prototype.destroy.apply(this,arguments)},drawPoints:e.seriesTypes.column.prototype.drawPoints,
drawGraph:function(){for(var a=this,b=a.points,d=b.length,c=a.options,e=a.zones,k={options:{gapSize:c.gapSize}},g=[[],[]],f;d--;)f=b[d],h(f.plotMACD)&&g[0].push({plotX:f.plotX,plotY:f.plotMACD,isNull:!h(f.plotMACD)}),h(f.plotSignal)&&g[1].push({plotX:f.plotX,plotY:f.plotSignal,isNull:!h(f.plotMACD)});["macd","signal"].forEach(function(b,d){a.points=g[d];a.options=p(c[b+"Line"].styles,k);a.graph=a["graph"+b];a.currentLineZone=b+"Zones";a.zones=a[a.currentLineZone].zones;m.prototype.drawGraph.call(a);
a["graph"+b]=a.graph});a.points=b;a.options=c;a.zones=e;a.currentLineZone=null},getZonesGraphs:function(a){var b=m.prototype.getZonesGraphs.call(this,a),d=b;this.currentLineZone&&(d=b.splice(this[this.currentLineZone].startIndex+1),d.length?d.splice(0,0,a[0]):d=[a[0]]);return d},applyZones:function(){var a=this.zones;this.zones=this.signalZones.zones;m.prototype.applyZones.call(this);this.options.macdLine.zones.length&&this.graphmacd.hide();this.zones=a},getValues:function(a,b){var d=0,c=[],e=[],
k=[],g,f;if(a.xData.length<b.longPeriod+b.signalPeriod)return!1;g=n.prototype.getValues(a,{period:b.shortPeriod});f=n.prototype.getValues(a,{period:b.longPeriod});g=g.values;f=f.values;for(a=1;a<=g.length;a++)h(f[a-1])&&h(f[a-1][1])&&h(g[a+b.shortPeriod+1])&&h(g[a+b.shortPeriod+1][0])&&c.push([g[a+b.shortPeriod+1][0],0,null,g[a+b.shortPeriod+1][1]-f[a-1][1]]);for(a=0;a<c.length;a++)e.push(c[a][0]),k.push([0,null,c[a][3]]);b=n.prototype.getValues({xData:e,yData:k},{period:b.signalPeriod,index:2});
b=b.values;for(a=0;a<c.length;a++)c[a][0]>=b[0][0]&&(c[a][2]=b[d][1],k[a]=[0,b[d][1],c[a][3]],null===c[a][3]?(c[a][1]=0,k[a][0]=0):(c[a][1]=q(c[a][3]-b[d][1]),k[a][0]=q(c[a][3]-b[d][1])),d++);return{values:c,xData:e,yData:k}}})})(l)});
//# sourceMappingURL=macd.js.map