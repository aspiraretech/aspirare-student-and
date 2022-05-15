/*
  Highcharts JS v7.0.1 (2018-12-19)

 Indicator series type for Highstock

 (c) 2010-2018 Daniel Studencki

 License: www.highcharts.com/license
*/
(function(e){"object"===typeof module&&module.exports?module.exports=e:"function"===typeof define&&define.amd?define(function(){return e}):e("undefined"!==typeof Highcharts?Highcharts:void 0)})(function(e){var t=function(b){var g=b.each,e=b.merge,q=b.error,r=b.defined,h=b.seriesTypes.sma;return{pointArrayMap:["top","bottom"],pointValKey:"top",linesApiNames:["bottomLine"],getTranslatedLinesNames:function(a){var c=[];g(this.pointArrayMap,function(d){d!==a&&c.push("plot"+d.charAt(0).toUpperCase()+d.slice(1))});
return c},toYData:function(a){var c=[];g(this.pointArrayMap,function(d){c.push(a[d])});return c},translate:function(){var a=this,c=a.pointArrayMap,d=[],b,d=a.getTranslatedLinesNames();h.prototype.translate.apply(a,arguments);g(a.points,function(m){g(c,function(c,l){b=m[c];null!==b&&(m[d[l]]=a.yAxis.toPixels(b,!0))})})},drawGraph:function(){var a=this,c=a.linesApiNames,d=a.points,b=d.length,m=a.options,w=a.graph,l={options:{gapSize:m.gapSize}},n=[],k=a.getTranslatedLinesNames(a.pointValKey),f;g(k,
function(a,c){for(n[c]=[];b--;)f=d[b],n[c].push({x:f.x,plotX:f.plotX,plotY:f[a],isNull:!r(f[a])});b=d.length});g(c,function(c,b){n[b]?(a.points=n[b],m[c]?a.options=e(m[c].styles,l):q('Error: "There is no '+c+' in DOCS options declared. Check if linesApiNames are consistent with your DOCS line names." at mixin/multiple-line.js:34'),a.graph=a["graph"+c],h.prototype.drawGraph.call(a),a["graph"+c]=a.graph):q('Error: "'+c+" doesn't have equivalent in pointArrayMap. To many elements in linesApiNames relative to pointArrayMap.\"")});
a.points=d;a.options=m;a.graph=w;h.prototype.drawGraph.call(a)}}}(e);(function(b,e){var g=b.seriesTypes.sma,q=b.seriesTypes.ema,r=b.seriesTypes.atr,h=b.merge,a=b.correctFloat;b.seriesType("keltnerchannels","sma",{params:{period:20,periodATR:10,multiplierATR:2},bottomLine:{styles:{lineWidth:1,lineColor:void 0}},topLine:{styles:{lineWidth:1,lineColor:void 0}},tooltip:{pointFormat:'\x3cspan style\x3d"color:{point.color}"\x3e\u25cf\x3c/span\x3e\x3cb\x3e {series.name}\x3c/b\x3e\x3cbr/\x3eUpper Channel: {point.top}\x3cbr/\x3eEMA({series.options.params.period}): {point.middle}\x3cbr/\x3eLower Channel: {point.bottom}\x3cbr/\x3e'},
marker:{enabled:!1},dataGrouping:{approximation:"averages"},lineWidth:1},h(e,{pointArrayMap:["top","middle","bottom"],pointValKey:"middle",nameBase:"Keltner Channels",nameComponents:["period","periodATR","multiplierATR"],linesApiNames:["topLine","bottomLine"],requiredIndicators:["ema","atr"],init:function(){g.prototype.init.apply(this,arguments);this.options=h({topLine:{styles:{lineColor:this.color}},bottomLine:{styles:{lineColor:this.color}}},this.options)},getValues:function(c,b){var d=b.period,
e=b.periodATR,g=b.multiplierATR,l=c.yData,l=l?l.length:0,n=[],k,f,h;b=q.prototype.getValues(c,{period:d,index:b.index});var t=r.prototype.getValues(c,{period:e}),u=[],v=[],p;if(l<d)return!1;for(p=d;p<=l;p++)k=b.values[p-d],f=t.values[p-e],h=k[0],c=a(k[1]+g*f[1]),f=a(k[1]-g*f[1]),k=k[1],n.push([h,c,k,f]),u.push(h),v.push([c,k,f]);return{values:n,xData:u,yData:v}}}))})(e,t)});
//# sourceMappingURL=keltner-channels.js.map