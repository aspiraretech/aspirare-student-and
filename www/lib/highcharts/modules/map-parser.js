/*
 Highmaps JS v7.0.1 (2018-12-19)

 (c) 2009-2018 Torstein Honsi

 License: www.highcharts.com/license
*/
(function(A){"object"===typeof module&&module.exports?module.exports=A:"function"===typeof define&&define.amd?define(function(){return A}):A("undefined"!==typeof Highcharts?Highcharts:void 0)})(function(A){(function(p){p.ajax=function(b){var m=p.merge(!0,{url:!1,type:"GET",dataType:"json",success:!1,error:!1,data:!1,headers:{}},b);b={json:"application/json",xml:"application/xml",text:"text/plain",octet:"application/octet-stream"};var f=new XMLHttpRequest;if(!m.url)return!1;f.open(m.type.toUpperCase(),
m.url,!0);f.setRequestHeader("Content-Type",b[m.dataType]||b.text);p.objectEach(m.headers,function(b,m){f.setRequestHeader(m,b)});f.onreadystatechange=function(){var b;if(4===f.readyState){if(200===f.status){b=f.responseText;if("json"===m.dataType)try{b=JSON.parse(b)}catch(u){m.error&&m.error(f,u);return}return m.success&&m.success(b)}m.error&&m.error(f,f.responseText)}};try{m.data=JSON.stringify(m.data)}catch(q){}f.send(m.data||!0)}})(A);(function(p){var b=p.addEvent,m=p.Chart,f=p.win.document,q=
p.objectEach,u=p.pick,y=p.isNumber,k=p.merge,v=p.splat,l=p.fireEvent,n,x=function(a,c,d){this.init(a,c,d)};p.extend(x.prototype,{init:function(a,c,d){var b=a.decimalPoint,g;c&&(this.chartOptions=c);d&&(this.chart=d);"."!==b&&","!==b&&(b=void 0);this.options=a;this.columns=a.columns||this.rowsToColumns(a.rows)||[];this.firstRowAsNames=u(a.firstRowAsNames,this.firstRowAsNames,!0);this.decimalRegex=b&&new RegExp("^(-?[0-9]+)"+b+"([0-9]+)$");this.rawColumns=[];this.columns.length&&(this.dataFound(),g=
!0);g||(g=this.fetchLiveData());g||(g=!!this.parseCSV().length);g||(g=!!this.parseTable().length);g||(g=this.parseGoogleSpreadsheet());!g&&a.afterComplete&&a.afterComplete()},getColumnDistribution:function(){var a=this.chartOptions,c=this.options,d=[],b=function(a){return(p.seriesTypes[a||"line"].prototype.pointArrayMap||[0]).length},g=a&&a.chart&&a.chart.type,e=[],f=[],l=0,c=c&&c.seriesMapping||a&&a.series&&a.series.map(function(){return{x:0}})||[],h;(a&&a.series||[]).forEach(function(a){e.push(b(a.type||
g))});c.forEach(function(a){d.push(a.x||0)});0===d.length&&d.push(0);c.forEach(function(c){var d=new n,r=e[l]||b(g),t=p.seriesTypes[((a&&a.series||[])[l]||{}).type||g||"line"].prototype.pointArrayMap||["y"];d.addColumnReader(c.x,"x");q(c,function(a,c){"x"!==c&&d.addColumnReader(a,c)});for(h=0;h<r;h++)d.hasReader(t[h])||d.addColumnReader(void 0,t[h]);f.push(d);l++});c=p.seriesTypes[g||"line"].prototype.pointArrayMap;void 0===c&&(c=["y"]);this.valueCount={global:b(g),xColumns:d,individual:e,seriesBuilders:f,
globalPointArrayMap:c}},dataFound:function(){this.options.switchRowsAndColumns&&(this.columns=this.rowsToColumns(this.columns));this.getColumnDistribution();this.parseTypes();!1!==this.parsed()&&this.complete()},parseCSV:function(a){function c(a,c,d,e){function g(c){w=a[c];l=a[c-1];h=a[c+1]}function b(a){z.length<k+1&&z.push([a]);z[k][z[k].length-1]!==a&&z[k].push(a)}function f(){m>C||C>p?(++C,t=""):(!isNaN(parseFloat(t))&&isFinite(t)?(t=parseFloat(t),b("number")):isNaN(Date.parse(t))?b("string"):
(t=t.replace(/\//g,"-"),b("date")),n.length<k+1&&n.push([]),d||(n[k][c]=t),t="",++k,++C)}var r=0,w="",l="",h="",t="",C=0,k=0;if(a.trim().length&&"#"!==a.trim()[0]){for(;r<a.length;r++){g(r);if("#"===w){f();return}if('"'===w)for(g(++r);r<a.length&&('"'!==w||'"'===l||'"'===h);){if('"'!==w||'"'===w&&'"'!==l)t+=w;g(++r)}else e&&e[w]?e[w](w,t)&&f():w===q?f():t+=w}f()}}function d(a){var c=0,d=0,b=!1;a.some(function(a,e){var g=!1,b,f,r="";if(13<e)return!0;for(var l=0;l<a.length;l++){e=a[l];b=a[l+1];f=a[l-
1];if("#"===e)break;else if('"'===e)if(g){if('"'!==f&&'"'!==b){for(;" "===b&&l<a.length;)b=a[++l];"undefined"!==typeof B[b]&&B[b]++;g=!1}}else g=!0;else"undefined"!==typeof B[e]?(r=r.trim(),isNaN(Date.parse(r))?!isNaN(r)&&isFinite(r)||B[e]++:B[e]++,r=""):r+=e;","===e&&d++;"."===e&&c++}});b=B[";"]>B[","]?";":",";e.decimalPoint||(e.decimalPoint=c>d?".":",",g.decimalRegex=new RegExp("^(-?[0-9]+)"+e.decimalPoint+"([0-9]+)$"));return b}function b(a,c){var d,b,f=0,r=!1,n=[],t=[],h;if(!c||c>a.length)c=a.length;
for(;f<c;f++)if("undefined"!==typeof a[f]&&a[f]&&a[f].length)for(d=a[f].trim().replace(/\//g," ").replace(/\-/g," ").replace(/\./g," ").split(" "),b=["","",""],h=0;h<d.length;h++)h<b.length&&(d[h]=parseInt(d[h],10),d[h]&&(t[h]=!t[h]||t[h]<d[h]?d[h]:t[h],"undefined"!==typeof n[h]?n[h]!==d[h]&&(n[h]=!1):n[h]=d[h],31<d[h]?b[h]=100>d[h]?"YY":"YYYY":12<d[h]&&31>=d[h]?(b[h]="dd",r=!0):b[h].length||(b[h]="mm")));if(r){for(h=0;h<n.length;h++)!1!==n[h]?12<t[h]&&"YY"!==b[h]&&"YYYY"!==b[h]&&(b[h]="YY"):12<t[h]&&
"mm"===b[h]&&(b[h]="dd");3===b.length&&"dd"===b[1]&&"dd"===b[2]&&(b[2]="YY");a=b.join("/");return(e.dateFormats||g.dateFormats)[a]?a:(l("deduceDateFailed"),"YYYY/mm/dd")}return"YYYY/mm/dd"}var g=this,e=a||this.options,f=e.csv,n;a="undefined"!==typeof e.startRow&&e.startRow?e.startRow:0;var h=e.endRow||Number.MAX_VALUE,m="undefined"!==typeof e.startColumn&&e.startColumn?e.startColumn:0,p=e.endColumn||Number.MAX_VALUE,q,k=0,z=[],B={",":0,";":0,"\t":0};n=this.columns=[];f&&e.beforeParse&&(f=e.beforeParse.call(this,
f));if(f){f=f.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split(e.lineDelimiter||"\n");if(!a||0>a)a=0;if(!h||h>=f.length)h=f.length-1;e.itemDelimiter?q=e.itemDelimiter:(q=null,q=d(f));for(var v=0,k=a;k<=h;k++)"#"===f[k][0]?v++:c(f[k],k-a-v);e.columnTypes&&0!==e.columnTypes.length||!z.length||!z[0].length||"date"!==z[0][1]||e.dateFormat||(e.dateFormat=b(n[0]));this.dataFound()}return n},parseTable:function(){var a=this.options,c=a.table,d=this.columns,b=a.startRow||0,g=a.endRow||Number.MAX_VALUE,e=a.startColumn||
0,l=a.endColumn||Number.MAX_VALUE;c&&("string"===typeof c&&(c=f.getElementById(c)),[].forEach.call(c.getElementsByTagName("tr"),function(a,c){c>=b&&c<=g&&[].forEach.call(a.children,function(a,g){("TD"===a.tagName||"TH"===a.tagName)&&g>=e&&g<=l&&(d[g-e]||(d[g-e]=[]),d[g-e][c-b]=a.innerHTML)})}),this.dataFound());return d},fetchLiveData:function(){function a(l){function h(f,h,r){function n(){g&&c.liveDataURL===f&&(c.liveDataTimeout=setTimeout(a,e))}if(!f||0!==f.indexOf("http"))return f&&d.error&&d.error("Invalid URL"),
!1;l&&(clearTimeout(c.liveDataTimeout),c.liveDataURL=f);p.ajax({url:f,dataType:r||"json",success:function(a){c&&c.series&&h(a);n()},error:function(a,c){3>++b&&n();return d.error&&d.error(c,a)}});return!0}h(f.csvURL,function(a){c.update({data:{csv:a}})},"text")||h(f.rowsURL,function(a){c.update({data:{rows:a}})})||h(f.columnsURL,function(a){c.update({data:{columns:a}})})}var c=this.chart,d=this.options,b=0,g=d.enablePolling,e=1E3*(d.dataRefreshRate||2),f=k(d);if(!d||!d.csvURL&&!d.rowsURL&&!d.columnsURL)return!1;
1E3>e&&(e=1E3);delete d.csvURL;delete d.rowsURL;delete d.columnsURL;a(!0);return d&&(d.csvURL||d.rowsURL||d.columnsURL)},parseGoogleSpreadsheet:function(){function a(c){var g=["https://spreadsheets.google.com/feeds/cells",b,e,"public/values?alt\x3djson"].join("/");p.ajax({url:g,dataType:"json",success:function(e){c(e);d.enablePolling&&setTimeout(function(){a(c)},d.dataRefreshRate)},error:function(a,c){return d.error&&d.error(c,a)}})}var c=this,d=this.options,b=d.googleSpreadsheetKey,g=this.chart,
e=d.googleSpreadsheetWorksheet||1,f=d.startRow||0,l=d.endRow||Number.MAX_VALUE,h=d.startColumn||0,n=d.endColumn||Number.MAX_VALUE,m=1E3*(d.dataRefreshRate||2);4E3>m&&(m=4E3);b&&(delete d.googleSpreadsheetKey,a(function(a){var d=[];a=a.feed.entry;var e,b=(a||[]).length,r=0,t,m,k;if(!a||0===a.length)return!1;for(k=0;k<b;k++)e=a[k],r=Math.max(r,e.gs$cell.col);for(k=0;k<r;k++)k>=h&&k<=n&&(d[k-h]=[]);for(k=0;k<b;k++)e=a[k],r=e.gs$cell.row-1,t=e.gs$cell.col-1,t>=h&&t<=n&&r>=f&&r<=l&&(m=e.gs$cell||e.content,
e=null,m.numericValue?e=0<=m.$t.indexOf("/")||0<=m.$t.indexOf("-")?m.$t:0<m.$t.indexOf("%")?100*parseFloat(m.numericValue):parseFloat(m.numericValue):m.$t&&m.$t.length&&(e=m.$t),d[t-h][r-f]=e);d.forEach(function(a){for(k=0;k<a.length;k++)void 0===a[k]&&(a[k]=null)});g&&g.series?g.update({data:{columns:d}}):(c.columns=d,c.dataFound())}));return!1},trim:function(a,c){"string"===typeof a&&(a=a.replace(/^\s+|\s+$/g,""),c&&/^[0-9\s]+$/.test(a)&&(a=a.replace(/\s/g,"")),this.decimalRegex&&(a=a.replace(this.decimalRegex,
"$1.$2")));return a},parseTypes:function(){for(var a=this.columns,c=a.length;c--;)this.parseColumn(a[c],c)},parseColumn:function(a,c){var d=this.rawColumns,b=this.columns,g=a.length,e,f,l,h,n=this.firstRowAsNames,k=-1!==this.valueCount.xColumns.indexOf(c),m,p=[],q=this.chartOptions,u,x=(this.options.columnTypes||[])[c],q=k&&(q&&q.xAxis&&"category"===v(q.xAxis)[0].type||"string"===x);for(d[c]||(d[c]=[]);g--;)e=p[g]||a[g],l=this.trim(e),h=this.trim(e,!0),f=parseFloat(h),void 0===d[c][g]&&(d[c][g]=l),
q||0===g&&n?a[g]=""+l:+h===f?(a[g]=f,31536E6<f&&"float"!==x?a.isDatetime=!0:a.isNumeric=!0,void 0!==a[g+1]&&(u=f>a[g+1])):(l&&l.length&&(m=this.parseDate(e)),k&&y(m)&&"float"!==x?(p[g]=e,a[g]=m,a.isDatetime=!0,void 0!==a[g+1]&&(e=m>a[g+1],e!==u&&void 0!==u&&(this.alternativeFormat?(this.dateFormat=this.alternativeFormat,g=a.length,this.alternativeFormat=this.dateFormats[this.dateFormat].alternative):a.unsorted=!0),u=e)):(a[g]=""===l?null:l,0!==g&&(a.isDatetime||a.isNumeric)&&(a.mixed=!0)));k&&a.mixed&&
(b[c]=d[c]);if(k&&u&&this.options.sort)for(c=0;c<b.length;c++)b[c].reverse(),n&&b[c].unshift(b[c].pop())},dateFormats:{"YYYY/mm/dd":{regex:/^([0-9]{4})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{1,2})$/,parser:function(a){return Date.UTC(+a[1],a[2]-1,+a[3])}},"dd/mm/YYYY":{regex:/^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{4})$/,parser:function(a){return Date.UTC(+a[3],a[2]-1,+a[1])},alternative:"mm/dd/YYYY"},"mm/dd/YYYY":{regex:/^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{4})$/,parser:function(a){return Date.UTC(+a[3],
a[1]-1,+a[2])}},"dd/mm/YY":{regex:/^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{2})$/,parser:function(a){var c=+a[3],c=c>(new Date).getFullYear()-2E3?c+1900:c+2E3;return Date.UTC(c,a[2]-1,+a[1])},alternative:"mm/dd/YY"},"mm/dd/YY":{regex:/^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{2})$/,parser:function(a){return Date.UTC(+a[3]+2E3,a[1]-1,+a[2])}}},parseDate:function(a){var c=this.options.parseDate,d,b,g=this.options.dateFormat||this.dateFormat,e;if(c)d=c(a);else if("string"===typeof a){if(g)(c=
this.dateFormats[g])||(c=this.dateFormats["YYYY/mm/dd"]),(e=a.match(c.regex))&&(d=c.parser(e));else for(b in this.dateFormats)if(c=this.dateFormats[b],e=a.match(c.regex)){this.dateFormat=b;this.alternativeFormat=c.alternative;d=c.parser(e);break}e||(e=Date.parse(a),"object"===typeof e&&null!==e&&e.getTime?d=e.getTime()-6E4*e.getTimezoneOffset():y(e)&&(d=e-6E4*(new Date(e)).getTimezoneOffset()))}return d},rowsToColumns:function(a){var c,d,b,g,e;if(a)for(e=[],d=a.length,c=0;c<d;c++)for(g=a[c].length,
b=0;b<g;b++)e[b]||(e[b]=[]),e[b][c]=a[c][b];return e},parsed:function(){if(this.options.parsed)return this.options.parsed.call(this,this.columns)},getFreeIndexes:function(a,c){var d,b=[],g=[],e;for(d=0;d<a;d+=1)b.push(!0);for(a=0;a<c.length;a+=1)for(e=c[a].getReferencedColumnIndexes(),d=0;d<e.length;d+=1)b[e[d]]=!1;for(d=0;d<b.length;d+=1)b[d]&&g.push(d);return g},complete:function(){var a=this.columns,c,d=this.options,b,g,e,f,l=[],h;if(d.complete||d.afterComplete){if(this.firstRowAsNames)for(e=0;e<
a.length;e++)a[e].name=a[e].shift();b=[];g=this.getFreeIndexes(a.length,this.valueCount.seriesBuilders);for(e=0;e<this.valueCount.seriesBuilders.length;e++)h=this.valueCount.seriesBuilders[e],h.populateColumns(g)&&l.push(h);for(;0<g.length;){h=new n;h.addColumnReader(0,"x");e=g.indexOf(0);-1!==e&&g.splice(e,1);for(e=0;e<this.valueCount.global;e++)h.addColumnReader(void 0,this.valueCount.globalPointArrayMap[e]);h.populateColumns(g)&&l.push(h)}0<l.length&&0<l[0].readers.length&&(h=a[l[0].readers[0].columnIndex],
void 0!==h&&(h.isDatetime?c="datetime":h.isNumeric||(c="category")));if("category"===c)for(e=0;e<l.length;e++)for(h=l[e],g=0;g<h.readers.length;g++)"x"===h.readers[g].configName&&(h.readers[g].configName="name");for(e=0;e<l.length;e++){h=l[e];g=[];for(f=0;f<a[0].length;f++)g[f]=h.read(a,f);b[e]={data:g};h.name&&(b[e].name=h.name);"category"===c&&(b[e].turboThreshold=0)}a={series:b};c&&(a.xAxis={type:c},"category"===c&&(a.xAxis.uniqueNames=!1));d.complete&&d.complete(a);d.afterComplete&&d.afterComplete(a)}},
update:function(a,c){var d=this.chart;a&&(a.afterComplete=function(a){a.xAxis&&d.xAxis[0]&&a.xAxis.type===d.xAxis[0].options.type&&delete a.xAxis;d.update(a,c,!0)},k(!0,this.options,a),this.init(this.options))}});p.Data=x;p.data=function(a,c,d){return new x(a,c,d)};b(m,"init",function(a){var c=this,d=a.args[0],b=a.args[1];d&&d.data&&!c.hasDataDef&&(c.hasDataDef=!0,c.data=new x(p.extend(d.data,{afterComplete:function(a){var e,g;if(d.hasOwnProperty("series"))if("object"===typeof d.series)for(e=Math.max(d.series.length,
a&&a.series?a.series.length:0);e--;)g=d.series[e]||{},d.series[e]=k(g,a&&a.series?a.series[e]:{});else delete d.series;d=k(a,d);c.init(d,b)}}),d,c),a.preventDefault())});n=function(){this.readers=[];this.pointIsArray=!0};n.prototype.populateColumns=function(a){var c=!0;this.readers.forEach(function(c){void 0===c.columnIndex&&(c.columnIndex=a.shift())});this.readers.forEach(function(a){void 0===a.columnIndex&&(c=!1)});return c};n.prototype.read=function(a,c){var b=this.pointIsArray,f=b?[]:{},g;this.readers.forEach(function(e){var d=
a[e.columnIndex][c];b?f.push(d):0<e.configName.indexOf(".")?p.Point.prototype.setNestedProperty(f,d,e.configName):f[e.configName]=d});void 0===this.name&&2<=this.readers.length&&(g=this.getReferencedColumnIndexes(),2<=g.length&&(g.shift(),g.sort(function(a,c){return a-c}),this.name=a[g.shift()].name));return f};n.prototype.addColumnReader=function(a,c){this.readers.push({columnIndex:a,configName:c});"x"!==c&&"y"!==c&&void 0!==c&&(this.pointIsArray=!1)};n.prototype.getReferencedColumnIndexes=function(){var a,
c=[],b;for(a=0;a<this.readers.length;a+=1)b=this.readers[a],void 0!==b.columnIndex&&c.push(b.columnIndex);return c};n.prototype.hasReader=function(a){var c,b;for(c=0;c<this.readers.length;c+=1)if(b=this.readers[c],b.configName===a)return!0}})(A);(function(p){p.wrap(p.Data.prototype,"init",function(b,m){b.call(this,m);m.svg&&this.loadSVG()});p.extend(p.Data.prototype,{pathToArray:function(b,m){var f=0,q=0,p,y,k=[0,0],v=[0,0],l,n,x=function(a,c){return[c.a*a[0]+c.c*a[1]+c.e,c.b*a[0]+c.d*a[1]+c.f]};
b=b.replace(/[0-9]+e-?[0-9]+/g,function(a){return+a}).replace(/([A-Za-z])/g," $1 ").replace(/-/g," -").replace(/^\s*/,"").replace(/\s*$/,"").replace(/\s+/g," ").split(/[ ,]+/);if(1===b.length)return[];for(f=0;f<b.length;f++)if(p=/[a-zA-Z]/.test(b[f])){n=b[f];y=2;if("c"===n||"C"===n)y=6;"m"===n?v=[parseFloat(b[f+1])+v[0],parseFloat(b[f+2])+v[1]]:"M"===n&&(v=[parseFloat(b[f+1]),parseFloat(b[f+2])]);if("m"===n||"l"===n||"c"===n)b[f]=n.toUpperCase(),l=!0;else if("M"===n||"L"===n||"C"===n)l=!1;else if("h"===
n)l=!0,b[f]="L",b.splice(f+2,0,0);else if("v"===n)l=!0,b[f]="L",b.splice(f+1,0,0);else if("s"===n)l=!0,b[f]="L",b.splice(f+1,2);else if("S"===n)l=!1,b[f]="L",b.splice(f+1,2);else if("H"===n||"h"===n)l=!1,b[f]="L",b.splice(f+2,0,k[1]);else if("V"===n||"v"===n)l=!1,b[f]="L",b.splice(f+1,0,k[0]);else if("z"===n||"Z"===n)k=v}else b[f]=parseFloat(b[f]),l&&(b[f]+=k[q%2]),1===q%2&&m&&(!l||"m"===n&&3>f)&&(p=x([b[f-1],b[f]],m),b[f-1]=p[0],b[f]=p[1]),q===y-1?(k=[b[f-1],b[f]],q=0):q+=1;"number"===typeof b[0]&&
4<=b.length&&(b.unshift("M"),b.splice(3,0,"L"));return b},pathToString:function(b){b.forEach(function(b){var f=b.path,f=f.join(","),f=f.replace(/,?([a-zA-Z]),?/g,"$1");b.path=f});return b},roundPaths:function(b,m){var f=p.seriesTypes.map.prototype,q,u;q={xAxis:{translate:p.Axis.prototype.translate,options:{},minPixelPadding:0},yAxis:{translate:p.Axis.prototype.translate,options:{},minPixelPadding:0}};f.getBox.call(q,b);u=Math.max(q.maxX-q.minX,q.maxY-q.minY);m=m||1E3;u=m/u;q.xAxis.transA=q.yAxis.transA=
u;q.xAxis.len=q.yAxis.len=m;q.xAxis.min=q.minX;q.yAxis.min=(q.minY+m)/u;b.forEach(function(b){var k,m;b.path=m=f.translatePath.call(q,b.path,!0);for(k=m.length;k--;)"number"===typeof m[k]&&(m[k]=Math.round(m[k]));delete b._foundBox});return b},loadSVG:function(){function b(b){return Array.prototype.slice.call(b.getElementsByTagName("path")).concat(Array.prototype.slice.call(b.getElementsByTagName("polygon"))).concat(Array.prototype.slice.call(b.getElementsByTagName("rect")))}function m(b){if("path"===
b.nodeName)return b.getAttribute("d");if("polygon"===b.nodeName)return b.getAttribute("points");if("rect"===b.nodeName){var f=+b.getAttribute("x"),l=+b.getAttribute("y"),a=+b.getAttribute("width");b=+b.getAttribute("height");return[f,l,f+a,l,f+a,l+b,f,l+b,f,l].join(" ")}}function f(b){b=b.getCTM();if(!isNaN(b.f))return b}function p(b){var f=b.getElementsByTagName("desc");return(f=f[0]&&f[0].getElementsByTagName("name"))&&f[0]&&f[0].innerText||b.getAttribute("inkscape:label")||b.getAttribute("id")||
b.getAttribute("class")}function u(b){return!/fill[\s]?\:[\s]?none/.test(b.getAttribute("style"))&&"none"!==b.getAttribute("fill")}function y(l){var n=[],q,a,c,d,r;k.$frame=k.$frame||$("\x3cdiv\x3e").css({position:"absolute",top:"-9999em"}).appendTo($(document.body));k.$frame.html(l);l=$("svg",k.$frame)[0];l.removeAttribute("viewBox");a=b(l);["defs","clipPath"].forEach(function(a){l.getElementsByTagName(a).forEach(function(a){a.getElementsByTagName("path").forEach(function(a){a.skip=!0})})});a.forEach(function(a,
b){if(!a.skip){var e=[];0<b&&a.parentNode!==q&&(r=!0);for(q=a.parentNode;a;)e.push(a),a=a.parentNode;e.reverse();if(c)for(a=0;a<c.length;a++)c[a]!==e[a]&&(c=c.slice(0,a));else c=e}});d=c[c.length-1];r&&d.getElementsByTagName("g").forEach(function(a){var c=[],d;b(a).forEach(function(a){a.skip||(c=c.concat(k.pathToArray(m(a),f(a))),u(a)&&(d=!0),a.skip=!0)});n.push({name:p(a),path:c,hasFill:d})});a.forEach(function(a){a.skip||n.push({name:p(a),path:k.pathToArray(m(a),f(a)),hasFill:u(a)})});k.roundPaths(n);
v.complete({series:[{data:n}]})}var k=this,v=this.options;-1!==v.svg.indexOf("\x3csvg")?y(v.svg):jQuery.ajax({url:v.svg,dataType:"text",success:y})}})})(A)});
//# sourceMappingURL=map-parser.js.map