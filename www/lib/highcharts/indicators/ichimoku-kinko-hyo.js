/*
  Highcharts JS v7.0.1 (2018-12-19)

 Indicator series type for Highstock

 (c) 2010-2018 Sebastian Bochan

 License: www.highcharts.com/license
*/
(function(n){"object"===typeof module&&module.exports?module.exports=n:"function"===typeof define&&define.amd?define(function(){return n}):n("undefined"!==typeof Highcharts?Highcharts:void 0)})(function(n){(function(p){function n(a){return a.reduce(function(a,b){return Math.max(a,b[1])},-Infinity)}function E(a){return a.reduce(function(a,b){return Math.min(a,b[2])},Infinity)}function x(a){return{high:n(a),low:E(a)}}function F(a){var c,b,f,l,k;a.series.forEach(function(a){if(a.xData)for(l=a.xData,
k=b=a.xIncrement?1:l.length-1;0<k;k--)if(f=l[k]-l[k-1],c===r||f<c)c=f});return c}function G(a,c,b,f){if(a&&c&&b&&f){var l=c.plotX-a.plotX;c=c.plotY-a.plotY;var k=f.plotX-b.plotX;f=f.plotY-b.plotY;var p=a.plotX-b.plotX,g=a.plotY-b.plotY;b=(-c*p+l*g)/(-k*c+l*f);k=(k*g-f*p)/(-k*c+l*f);if(0<=b&&1>=b&&0<=k&&1>=k)return{plotX:a.plotX+k*l,plotY:a.plotY+k*c}}return!1}function C(a){var c=a.indicator;c.points=a.points;c.nextPoints=a.nextPoints;c.color=a.color;c.options=B(a.options.senkouSpan.styles,a.gap);
c.graph=a.graph;c.fillGraph=!0;w.prototype.drawGraph.call(c)}var r,H=p.seriesType,B=p.merge,y=p.color,I=p.isArray,D=p.defined,w=p.seriesTypes.sma;p.approximations["ichimoku-averages"]=function(){var a=[],c;[].forEach.call(arguments,function(b,f){a.push(p.approximations.average(b));c=!c&&void 0===a[f]});return c?void 0:a};H("ikh","sma",{params:{period:26,periodTenkan:9,periodSenkouSpanB:52},marker:{enabled:!1},tooltip:{pointFormat:'\x3cspan style\x3d"color:{point.color}"\x3e\u25cf\x3c/span\x3e \x3cb\x3e {series.name}\x3c/b\x3e\x3cbr/\x3eTENKAN SEN: {point.tenkanSen:.3f}\x3cbr/\x3eKIJUN SEN: {point.kijunSen:.3f}\x3cbr/\x3eCHIKOU SPAN: {point.chikouSpan:.3f}\x3cbr/\x3eSENKOU SPAN A: {point.senkouSpanA:.3f}\x3cbr/\x3eSENKOU SPAN B: {point.senkouSpanB:.3f}\x3cbr/\x3e'},
tenkanLine:{styles:{lineWidth:1,lineColor:void 0}},kijunLine:{styles:{lineWidth:1,lineColor:void 0}},chikouLine:{styles:{lineWidth:1,lineColor:void 0}},senkouSpanA:{styles:{lineWidth:1,lineColor:void 0}},senkouSpanB:{styles:{lineWidth:1,lineColor:void 0}},senkouSpan:{styles:{fill:"rgba(255, 0, 0, 0.5)"}},dataGrouping:{approximation:"ichimoku-averages"}},{pointArrayMap:["tenkanSen","kijunSen","chikouSpan","senkouSpanA","senkouSpanB"],pointValKey:"tenkanSen",nameComponents:["periodSenkouSpanB","period",
"periodTenkan"],init:function(){w.prototype.init.apply(this,arguments);this.options=B({tenkanLine:{styles:{lineColor:this.color}},kijunLine:{styles:{lineColor:this.color}},chikouLine:{styles:{lineColor:this.color}},senkouSpanA:{styles:{lineColor:this.color,fill:y(this.color).setOpacity(.5).get()}},senkouSpanB:{styles:{lineColor:this.color,fill:y(this.color).setOpacity(.5).get()}},senkouSpan:{styles:{fill:y(this.color).setOpacity(.2).get()}}},this.options)},toYData:function(a){return[a.tenkanSen,a.kijunSen,
a.chikouSpan,a.senkouSpanA,a.senkouSpanB]},translate:function(){var a=this;w.prototype.translate.apply(a);a.points.forEach(function(c){a.pointArrayMap.forEach(function(b){D(c[b])&&(c["plot"+b]=a.yAxis.toPixels(c[b],!0),c.plotY=c["plot"+b],c.tooltipPos=[c.plotX,c["plot"+b]],c.isNull=!1)})})},drawGraph:function(){var a=this,c=a.points,b=c.length,f=a.options,l=a.graph,k=a.color,n={options:{gapSize:f.gapSize}},g=a.pointArrayMap.length,q=[[],[],[],[],[],[]],m={tenkanLine:q[0],kijunLine:q[1],chikouLine:q[2],
senkouSpanA:q[3],senkouSpanB:q[4],senkouSpan:q[5]},z=[],e=a.options.senkouSpan,t=e.color||e.styles.fill,u=e.negativeColor,d=[[],[]],r=[[],[]],x=0,h,v,y,A;for(a.ikhMap=m;b--;){h=c[b];for(v=0;v<g;v++)e=a.pointArrayMap[v],D(h[e])&&q[v].push({plotX:h.plotX,plotY:h["plot"+e],isNull:!1});u&&b!==c.length-1&&(e=m.senkouSpanB.length-1,h=G(m.senkouSpanA[e-1],m.senkouSpanA[e],m.senkouSpanB[e-1],m.senkouSpanB[e]),v={plotX:h.plotX,plotY:h.plotY,isNull:!1,intersectPoint:!0},h&&(m.senkouSpanA.splice(e,0,v),m.senkouSpanB.splice(e,
0,v),z.push(e)))}p.objectEach(m,function(b,c){f[c]&&"senkouSpan"!==c&&(a.points=q[x],a.options=B(f[c].styles,n),a.graph=a["graph"+c],a.fillGraph=!1,a.color=k,w.prototype.drawGraph.call(a),a["graph"+c]=a.graph);x++});a.graphCollection&&a.graphCollection.forEach(function(b){a[b].element.remove();delete a[b]});a.graphCollection=[];if(u&&m.senkouSpanA[0]&&m.senkouSpanB[0]){z.unshift(0);z.push(m.senkouSpanA.length-1);for(g=0;g<z.length-1;g++){e=z[g];h=z[g+1];b=m.senkouSpanB.slice(e,h+1);e=m.senkouSpanA.slice(e,
h+1);if(1<=Math.floor(b.length/2))if(h=Math.floor(b.length/2),b[h].plotY===e[h].plotY){for(A=v=h=0;A<b.length;A++)h+=b[A].plotY,v+=e[A].plotY;h=h>v?0:1}else h=b[h].plotY>e[h].plotY?0:1;else h=b[0].plotY>e[0].plotY?0:1;d[h]=d[h].concat(b);r[h]=r[h].concat(e)}["graphsenkouSpanColor","graphsenkouSpanNegativeColor"].forEach(function(b,c){d[c].length&&r[c].length&&(y=0===c?t:u,C({indicator:a,points:d[c],nextPoints:r[c],color:y,options:f,gap:n,graph:a[b]}),a[b]=a.graph,a.graphCollection.push(b))})}else C({indicator:a,
points:m.senkouSpanB,nextPoints:m.senkouSpanA,color:t,options:f,gap:n,graph:a.graphsenkouSpan}),a.graphsenkouSpan=a.graph;delete a.nextPoints;delete a.fillGraph;a.points=c;a.options=f;a.graph=l},getGraphPath:function(a){var c,b,f=[];a=a||this.points;if(this.fillGraph&&this.nextPoints){b=w.prototype.getGraphPath.call(this,this.nextPoints);b[0]="L";c=w.prototype.getGraphPath.call(this,a);b=b.slice(0,c.length);for(var l=b.length-1;0<l;l-=3)f.push(b[l-2],b[l-1],b[l]);c=c.concat(f)}else c=w.prototype.getGraphPath.apply(this,
arguments);return c},getValues:function(a,c){var b=c.period,f=c.periodTenkan;c=c.periodSenkouSpanB;var l=a.xData,k=a.yData,p=k&&k.length||0;a=F(a.xAxis);var g=[],q=[],m,n,e,t,u,d,w;if(l.length<=b||!I(k[0])||4!==k[0].length)return!1;m=l[0]-b*a;for(d=0;d<b;d++)q.push(m+d*a);for(d=0;d<p;d++)d>=f&&(e=k.slice(d-f,d),e=x(e),e=(e.high+e.low)/2),d>=b&&(t=k.slice(d-b,d),t=x(t),t=(t.high+t.low)/2,w=(e+t)/2),d>=c&&(u=k.slice(d-c,d),u=x(u),u=(u.high+u.low)/2),m=k[d][0],n=l[d],g[d]===r&&(g[d]=[]),g[d+b]===r&&
(g[d+b]=[]),g[d+b][0]=e,g[d+b][1]=t,g[d+b][2]=r,d>=b?g[d-b][2]=m:(g[d+b][3]=r,g[d+b][4]=r),g[d+2*b]===r&&(g[d+2*b]=[]),g[d+2*b][3]=w,g[d+2*b][4]=u,q.push(n);for(d=1;d<=b;d++)q.push(n+d*a);return{values:g,xData:q,yData:g}}})})(n)});
//# sourceMappingURL=ichimoku-kinko-hyo.js.map