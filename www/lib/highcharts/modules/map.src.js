/**
 * @license Highmaps JS v7.0.1 (2018-12-19)
 * Highmaps as a plugin for Highcharts or Highstock.
 *
 * (c) 2011-2018 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */
'use strict';
(function (factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory;
	} else if (typeof define === 'function' && define.amd) {
		define(function () {
			return factory;
		});
	} else {
		factory(typeof Highcharts !== 'undefined' ? Highcharts : undefined);
	}
}(function (Highcharts) {
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var addEvent = H.addEvent,
		    Axis = H.Axis,
		    pick = H.pick;

		// Override to use the extreme coordinates from the SVG shape, not the data
		// values
		addEvent(Axis, 'getSeriesExtremes', function () {
		    var xData = [];

		    // Remove the xData array and cache it locally so that the proceed method
		    // doesn't use it
		    if (this.isXAxis) {
		        this.series.forEach(function (series, i) {
		            if (series.useMapGeometry) {
		                xData[i] = series.xData;
		                series.xData = [];
		            }
		        });
		        this.seriesXData = xData;
		    }

		});

		addEvent(Axis, 'afterGetSeriesExtremes', function () {

		    var xData = this.seriesXData,
		        dataMin,
		        dataMax,
		        useMapGeometry;

		    // Run extremes logic for map and mapline
		    if (this.isXAxis) {
		        dataMin = pick(this.dataMin, Number.MAX_VALUE);
		        dataMax = pick(this.dataMax, -Number.MAX_VALUE);
		        this.series.forEach(function (series, i) {
		            if (series.useMapGeometry) {
		                dataMin = Math.min(dataMin, pick(series.minX, dataMin));
		                dataMax = Math.max(dataMax, pick(series.maxX, dataMax));
		                series.xData = xData[i]; // Reset xData array
		                useMapGeometry = true;
		            }
		        });
		        if (useMapGeometry) {
		            this.dataMin = dataMin;
		            this.dataMax = dataMax;
		        }

		        delete this.seriesXData;
		    }

		});

		// Override axis translation to make sure the aspect ratio is always kept
		addEvent(Axis, 'afterSetAxisTranslation', function () {
		    var chart = this.chart,
		        mapRatio,
		        plotRatio = chart.plotWidth / chart.plotHeight,
		        adjustedAxisLength,
		        xAxis = chart.xAxis[0],
		        padAxis,
		        fixTo,
		        fixDiff,
		        preserveAspectRatio;

		    // Check for map-like series
		    if (this.coll === 'yAxis' && xAxis.transA !== undefined) {
		        this.series.forEach(function (series) {
		            if (series.preserveAspectRatio) {
		                preserveAspectRatio = true;
		            }
		        });
		    }

		    // On Y axis, handle both
		    if (preserveAspectRatio) {

		        // Use the same translation for both axes
		        this.transA = xAxis.transA = Math.min(this.transA, xAxis.transA);

		        mapRatio = plotRatio /
		            ((xAxis.max - xAxis.min) / (this.max - this.min));

		        // What axis to pad to put the map in the middle
		        padAxis = mapRatio < 1 ? this : xAxis;

		        // Pad it
		        adjustedAxisLength = (padAxis.max - padAxis.min) * padAxis.transA;
		        padAxis.pixelPadding = padAxis.len - adjustedAxisLength;
		        padAxis.minPixelPadding = padAxis.pixelPadding / 2;

		        fixTo = padAxis.fixTo;
		        if (fixTo) {
		            fixDiff = fixTo[1] - padAxis.toValue(fixTo[0], true);
		            fixDiff *= padAxis.transA;
		            if (
		                Math.abs(fixDiff) > padAxis.minPixelPadding ||
		                (
		                    padAxis.min === padAxis.dataMin &&
		                    padAxis.max === padAxis.dataMax
		                )
		            ) { // zooming out again, keep within restricted area
		                fixDiff = 0;
		            }
		            padAxis.minPixelPadding -= fixDiff;
		        }
		    }
		});

		// Override Axis.render in order to delete the fixTo prop
		addEvent(Axis, 'render', function () {
		    this.fixTo = null;
		});

	}(Highcharts));
	(function (H) {
		/* *
		 *
		 *  (c) 2010-2018 Torstein Honsi
		 *
		 *  License: www.highcharts.com/license
		 *
		 * */



		var addEvent = H.addEvent,
		    Axis = H.Axis,
		    Chart = H.Chart,
		    color = H.color,
		    ColorAxis,
		    extend = H.extend,
		    isNumber = H.isNumber,
		    Legend = H.Legend,
		    LegendSymbolMixin = H.LegendSymbolMixin,
		    noop = H.noop,
		    merge = H.merge,
		    pick = H.pick;

		// If ColorAxis already exists, we may be loading the heatmap module on top of
		// Highmaps.
		if (!H.ColorAxis) {

		    /**
		     * The ColorAxis object for inclusion in gradient legends.
		     *
		     * @private
		     * @class
		     * @name Highcharts.ColorAxis
		     *
		     * @augments Highcharts.Axis
		     */
		    ColorAxis = H.ColorAxis = function () {
		        this.init.apply(this, arguments);
		    };

		    extend(ColorAxis.prototype, Axis.prototype);

		    extend(ColorAxis.prototype, {

		        /**
		         * A color axis for choropleth maps and heat maps. Visually, the color
		         * axis will appear as a gradient or as separate items inside the
		         * legend, depending on whether the axis is scalar or based on data
		         * classes.
		         *
		         * For supported color formats, see the
		         * [docs article about colors](https://www.highcharts.com/docs/chart-design-and-style/colors).
		         *
		         * A scalar color axis is represented by a gradient. The colors either
		         * range between the [minColor](#colorAxis.minColor) and the
		         * [maxColor](#colorAxis.maxColor), or for more fine grained control the
		         * colors can be defined in [stops](#colorAxis.stops). Often times, the
		         * color axis needs to be adjusted to get the right color spread for the
		         * data. In addition to stops, consider using a logarithmic
		         * [axis type](#colorAxis.type), or setting [min](#colorAxis.min) and
		         * [max](#colorAxis.max) to avoid the colors being determined by
		         * outliers.
		         *
		         * When [dataClasses](#colorAxis.dataClasses) are used, the ranges are
		         * subdivided into separate classes like categories based on their
		         * values. This can be used for ranges between two values, but also for
		         * a true category. However, when your data is categorized, it may be as
		         * convenient to add each category to a separate series.
		         *
		         * See [the Axis object](/class-reference/Highcharts.Axis) for
		         * programmatic access to the axis.
		         *
		         * @extends      xAxis
		         * @excluding    allowDecimals, alternateGridColor, breaks, categories,
		         *               crosshair, dateTimeLabelFormats, lineWidth, linkedTo,
		         *               maxZoom, minRange, minTickInterval, offset, opposite,
		         *               plotBands, plotLines, showEmpty, title
		         * @product      highcharts highmaps
		         * @optionparent colorAxis
		         */
		        defaultColorAxisOptions: {

		            /**
		             * Whether to allow decimals on the color axis.
		             * @type      {boolean}
		             * @default   true
		             * @product   highcharts highmaps
		             * @apioption colorAxis.allowDecimals
		             */

		            /**
		             * Determines how to set each data class' color if no individual
		             * color is set. The default value, `tween`, computes intermediate
		             * colors between `minColor` and `maxColor`. The other possible
		             * value, `category`, pulls colors from the global or chart specific
		             * [colors](#colors) array.
		             *
		             * @sample {highmaps} maps/coloraxis/dataclasscolor/
		             *         Category colors
		             *
		             * @type       {string}
		             * @default    tween
		             * @product    highcharts highmaps
		             * @validvalue ["tween", "category"]
		             * @apioption  colorAxis.dataClassColor
		             */

		            /**
		             * An array of data classes or ranges for the choropleth map. If
		             * none given, the color axis is scalar and values are distributed
		             * as a gradient between the minimum and maximum colors.
		             *
		             * @sample {highmaps} maps/demo/data-class-ranges/
		             *         Multiple ranges
		             *
		             * @sample {highmaps} maps/demo/data-class-two-ranges/
		             *         Two ranges
		             *
		             * @type      {Array<*>}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.dataClasses
		             */

		            /**
		             * The color of each data class. If not set, the color is pulled
		             * from the global or chart-specific [colors](#colors) array. In
		             * styled mode, this option is ignored. Instead, use colors defined
		             * in CSS.
		             *
		             * @sample {highmaps} maps/demo/data-class-two-ranges/
		             *         Explicit colors
		             *
		             * @type      {Highcharts.ColorString}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.dataClasses.color
		             */

		            /**
		             * The start of the value range that the data class represents,
		             * relating to the point value.
		             *
		             * The range of each `dataClass` is closed in both ends, but can be
		             * overridden by the next `dataClass`.
		             *
		             * @type      {number}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.dataClasses.from
		             */

		            /**
		             * The name of the data class as it appears in the legend.
		             * If no name is given, it is automatically created based on the
		             * `from` and `to` values. For full programmatic control,
		             * [legend.labelFormatter](#legend.labelFormatter) can be used.
		             * In the formatter, `this.from` and `this.to` can be accessed.
		             *
		             * @sample {highmaps} maps/coloraxis/dataclasses-name/
		             *         Named data classes
		             *
		             * @sample {highmaps} maps/coloraxis/dataclasses-labelformatter/
		             *         Formatted data classes
		             *
		             * @type      {string}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.dataClasses.name
		             */

		            /**
		             * The end of the value range that the data class represents,
		             * relating to the point value.
		             *
		             * The range of each `dataClass` is closed in both ends, but can be
		             * overridden by the next `dataClass`.
		             *
		             * @type      {number}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.dataClasses.to
		             */

		            /** @ignore-option */
		            lineWidth: 0,

		            /**
		             * Padding of the min value relative to the length of the axis. A
		             * padding of 0.05 will make a 100px axis 5px longer.
		             *
		             * @product highcharts highmaps
		             */
		            minPadding: 0,

		            /**
		             * The maximum value of the axis in terms of map point values. If
		             * `null`, the max value is automatically calculated. If the
		             * `endOnTick` option is true, the max value might be rounded up.
		             *
		             * @sample {highmaps} maps/coloraxis/gridlines/
		             *         Explicit min and max to reduce the effect of outliers
		             *
		             * @type      {number}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.max
		             */

		            /**
		             * The minimum value of the axis in terms of map point values. If
		             * `null`, the min value is automatically calculated. If the
		             * `startOnTick` option is true, the min value might be rounded
		             * down.
		             *
		             * @sample {highmaps} maps/coloraxis/gridlines/
		             *         Explicit min and max to reduce the effect of outliers
		             *
		             * @type      {number}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.min
		             */

		            /**
		             * Padding of the max value relative to the length of the axis. A
		             * padding of 0.05 will make a 100px axis 5px longer.
		             *
		             * @product highcharts highmaps
		             */
		            maxPadding: 0,

		            /**
		             * Color of the grid lines extending from the axis across the
		             * gradient.
		             *
		             * @sample {highmaps} maps/coloraxis/gridlines/
		             *         Grid lines demonstrated
		             *
		             * @type      {Highcharts.ColorString}
		             * @default   #e6e6e6
		             * @product   highcharts highmaps
		             * @apioption colorAxis.gridLineColor
		             */

		            /**
		             * The width of the grid lines extending from the axis across the
		             * gradient of a scalar color axis.
		             *
		             * @sample {highmaps} maps/coloraxis/gridlines/
		             *         Grid lines demonstrated
		             *
		             * @product highcharts highmaps
		             */
		            gridLineWidth: 1,

		            /**
		             * The interval of the tick marks in axis units. When `null`, the
		             * tick interval is computed to approximately follow the
		             * `tickPixelInterval`.
		             *
		             * @type      {number}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.tickInterval
		             */

		            /**
		             * If [tickInterval](#colorAxis.tickInterval) is `null` this option
		             * sets the approximate pixel interval of the tick marks.
		             *
		             * @product highcharts highmaps
		             */
		            tickPixelInterval: 72,

		            /**
		             * Whether to force the axis to start on a tick. Use this option
		             * with the `maxPadding` option to control the axis start.
		             *
		             * @product highcharts highmaps
		             */
		            startOnTick: true,

		            /**
		             * Whether to force the axis to end on a tick. Use this option with
		             * the [maxPadding](#colorAxis.maxPadding) option to control the
		             * axis end.
		             *
		             * @product highcharts highmaps
		             */
		            endOnTick: true,

		            /** @ignore */
		            offset: 0,

		            /**
		             * The triangular marker on a scalar color axis that points to the
		             * value of the hovered area. To disable the marker, set
		             * `marker: null`.
		             *
		             * @sample {highmaps} maps/coloraxis/marker/
		             *         Black marker
		             *
		             * @product highcharts highmaps
		             */
		            marker: {

		                /**
		                 * Animation for the marker as it moves between values. Set to
		                 * `false` to disable animation. Defaults to `{ duration: 50 }`.
		                 *
		                 * @type    {boolean|Highcharts.AnimationOptionsObject}
		                 * @default {"duration": 50}
		                 * @product highcharts highmaps
		                 */
		                animation: {
		                    /** @ignore */
		                    duration: 50
		                },

		                /** @ignore */
		                width: 0.01,

		                /**
		                 * The color of the marker.
		                 *
		                 * @type    {Highcharts.ColorString}
		                 * @product highcharts highmaps
		                 */
		                color: '#999999'
		            },

		            /**
		             * The axis labels show the number for each tick.
		             *
		             * For more live examples on label options, see [xAxis.labels in the
		             * Highcharts API.](/highcharts#xAxis.labels)
		             *
		             * @extends xAxis.labels
		             * @product highcharts highmaps
		             */
		            labels: {

		                /**
		                 * How to handle overflowing labels on horizontal color axis.
		                 * Can be undefined or "justify". If "justify", labels will not
		                 * render outside the legend area. If there is room to move it,
		                 * it will be aligned to the edge, else it will be removed.
		                 *
		                 * @validvalue ["allow", "justify"]
		                 * @product    highcharts highmaps
		                 */
		                overflow: 'justify',

		                rotation: 0

		            },

		            /**
		             * The color to represent the minimum of the color axis. Unless
		             * [dataClasses](#colorAxis.dataClasses) or
		             * [stops](#colorAxis.stops) are set, the gradient starts at this
		             * value.
		             *
		             * If dataClasses are set, the color is based on minColor and
		             * maxColor unless a color is set for each data class, or the
		             * [dataClassColor](#colorAxis.dataClassColor) is set.
		             *
		             * @sample {highmaps} maps/coloraxis/mincolor-maxcolor/
		             *         Min and max colors on scalar (gradient) axis
		             * @sample {highmaps} maps/coloraxis/mincolor-maxcolor-dataclasses/
		             *         On data classes
		             *
		             * @type    {Highcharts.ColorString}
		             * @product highcharts highmaps
		             */
		            minColor: '#e6ebf5',

		            /**
		             * The color to represent the maximum of the color axis. Unless
		             * [dataClasses](#colorAxis.dataClasses) or
		             * [stops](#colorAxis.stops) are set, the gradient ends at this
		             * value.
		             *
		             * If dataClasses are set, the color is based on minColor and
		             * maxColor unless a color is set for each data class, or the
		             * [dataClassColor](#colorAxis.dataClassColor) is set.
		             *
		             * @sample {highmaps} maps/coloraxis/mincolor-maxcolor/
		             *         Min and max colors on scalar (gradient) axis
		             * @sample {highmaps} maps/coloraxis/mincolor-maxcolor-dataclasses/
		             *         On data classes
		             *
		             * @type    {Highcharts.ColorString}
		             * @product highcharts highmaps
		             */
		            maxColor: '#003399',

		            /**
		             * Color stops for the gradient of a scalar color axis. Use this in
		             * cases where a linear gradient between a `minColor` and `maxColor`
		             * is not sufficient. The stops is an array of tuples, where the
		             * first item is a float between 0 and 1 assigning the relative
		             * position in the gradient, and the second item is the color.
		             *
		             * @sample {highmaps} maps/demo/heatmap/
		             *         Heatmap with three color stops
		             *
		             * @type      {Array<Array<number,Highcharts.ColorString>>}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.stops
		             */

		            /**
		             * The pixel length of the main tick marks on the color axis.
		             */
		            tickLength: 5,

		            /**
		             * The type of interpolation to use for the color axis. Can be
		             * `linear` or `logarithmic`.
		             *
		             * @type       {string}
		             * @default    linear
		             * @product    highcharts highmaps
		             * @validvalue ["linear", "logarithmic"]
		             * @apioption  colorAxis.type
		             */

		            /**
		             * Whether to reverse the axis so that the highest number is closest
		             * to the origin. Defaults to `false` in a horizontal legend and
		             * `true` in a vertical legend, where the smallest value starts on
		             * top.
		             *
		             * @type      {boolean}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.reversed
		             */

		            /**
		             * @product   highcharts highmaps
		             * @excluding afterBreaks, pointBreak, pointInBreak
		             * @apioption colorAxis.events
		             */

		            /**
		             * Fires when the legend item belonging to the colorAxis is clicked.
		             * One parameter, `event`, is passed to the function.
		             *
		             * @type      {Function}
		             * @product   highcharts highmaps
		             * @apioption colorAxis.events.legendItemClick
		             */

		            /**
		             * Whether to display the colorAxis in the legend.
		             *
		             * @see [heatmap.showInLegend](#series.heatmap.showInLegend)
		             *
		             * @since   4.2.7
		             * @product highcharts highmaps
		             */
		            showInLegend: true
		        },

		        // Properties to preserve after destroy, for Axis.update (#5881, #6025)
		        keepProps: [
		            'legendGroup',
		            'legendItemHeight',
		            'legendItemWidth',
		            'legendItem',
		            'legendSymbol'
		        ].concat(Axis.prototype.keepProps),

		        /**
		         * Initialize the color axis
		         *
		         * @private
		         * @function Highcharts.ColorAxis#init
		         *
		         * @param {Highcharts.Chart} chart
		         *
		         * @param {Highcharts.ColorAxisOptions} userOptions
		         */
		        init: function (chart, userOptions) {
		            var horiz = chart.options.legend.layout !== 'vertical',
		                options;

		            this.coll = 'colorAxis';

		            // Build the options
		            options = merge(this.defaultColorAxisOptions, {
		                side: horiz ? 2 : 1,
		                reversed: !horiz
		            }, userOptions, {
		                opposite: !horiz,
		                showEmpty: false,
		                title: null,
		                visible: chart.options.legend.enabled
		            });

		            Axis.prototype.init.call(this, chart, options);

		            // Base init() pushes it to the xAxis array, now pop it again
		            // chart[this.isXAxis ? 'xAxis' : 'yAxis'].pop();

		            // Prepare data classes
		            if (userOptions.dataClasses) {
		                this.initDataClasses(userOptions);
		            }
		            this.initStops();

		            // Override original axis properties
		            this.horiz = horiz;
		            this.zoomEnabled = false;

		            // Add default values
		            this.defaultLegendLength = 200;
		        },

		        initDataClasses: function (userOptions) {
		            var chart = this.chart,
		                dataClasses,
		                colorCounter = 0,
		                colorCount = chart.options.chart.colorCount,
		                options = this.options,
		                len = userOptions.dataClasses.length;
		            this.dataClasses = dataClasses = [];
		            this.legendItems = [];

		            userOptions.dataClasses.forEach(function (dataClass, i) {
		                var colors;

		                dataClass = merge(dataClass);
		                dataClasses.push(dataClass);

		                if (!chart.styledMode && dataClass.color) {
		                    return;
		                }

		                if (options.dataClassColor === 'category') {
		                    if (!chart.styledMode) {
		                        colors = chart.options.colors;
		                        colorCount = colors.length;
		                        dataClass.color = colors[colorCounter];
		                    }

		                    dataClass.colorIndex = colorCounter;

		                    // increase and loop back to zero
		                    colorCounter++;
		                    if (colorCounter === colorCount) {
		                        colorCounter = 0;
		                    }
		                } else {
		                    dataClass.color = color(options.minColor).tweenTo(
		                        color(options.maxColor),
		                        len < 2 ? 0.5 : i / (len - 1) // #3219
		                    );
		                }
		            });
		        },

		        /**
		         * Override so that ticks are not added in data class axes (#6914)
		         *
		         * @private
		         * @function Highcharts.ColorAxis#setTickPositions
		         */
		        setTickPositions: function () {
		            if (!this.dataClasses) {
		                return Axis.prototype.setTickPositions.call(this);
		            }
		        },

		        initStops: function () {
		            this.stops = this.options.stops || [
		                [0, this.options.minColor],
		                [1, this.options.maxColor]
		            ];
		            this.stops.forEach(function (stop) {
		                stop.color = color(stop[1]);
		            });
		        },

		        /**
		         * Extend the setOptions method to process extreme colors and color
		         * stops.
		         *
		         * @private
		         * @function Highcharts.ColorAxis#setOptions
		         *
		         * @param {Highcharts.ColorAxisOptions} userOptions
		         */
		        setOptions: function (userOptions) {
		            Axis.prototype.setOptions.call(this, userOptions);

		            this.options.crosshair = this.options.marker;
		        },

		        setAxisSize: function () {
		            var symbol = this.legendSymbol,
		                chart = this.chart,
		                legendOptions = chart.options.legend || {},
		                x,
		                y,
		                width,
		                height;

		            if (symbol) {
		                this.left = x = symbol.attr('x');
		                this.top = y = symbol.attr('y');
		                this.width = width = symbol.attr('width');
		                this.height = height = symbol.attr('height');
		                this.right = chart.chartWidth - x - width;
		                this.bottom = chart.chartHeight - y - height;

		                this.len = this.horiz ? width : height;
		                this.pos = this.horiz ? x : y;
		            } else {
		                // Fake length for disabled legend to avoid tick issues
		                // and such (#5205)
		                this.len = (
		                        this.horiz ?
		                            legendOptions.symbolWidth :
		                            legendOptions.symbolHeight
		                    ) || this.defaultLegendLength;
		            }
		        },

		        normalizedValue: function (value) {
		            if (this.isLog) {
		                value = this.val2lin(value);
		            }
		            return 1 - ((this.max - value) / ((this.max - this.min) || 1));
		        },

		        /**
		         * Translate from a value to a color.
		         *
		         * @private
		         * @function Highcharts.ColorAxis#toColor
		         *
		         * @param {number} value
		         *
		         * @param {Highcharts.Point} point
		         */
		        toColor: function (value, point) {
		            var pos,
		                stops = this.stops,
		                from,
		                to,
		                color,
		                dataClasses = this.dataClasses,
		                dataClass,
		                i;

		            if (dataClasses) {
		                i = dataClasses.length;
		                while (i--) {
		                    dataClass = dataClasses[i];
		                    from = dataClass.from;
		                    to = dataClass.to;
		                    if (
		                        (from === undefined || value >= from) &&
		                        (to === undefined || value <= to)
		                    ) {

		                        color = dataClass.color;

		                        if (point) {
		                            point.dataClass = i;
		                            point.colorIndex = dataClass.colorIndex;
		                        }
		                        break;
		                    }
		                }

		            } else {

		                pos = this.normalizedValue(value);
		                i = stops.length;
		                while (i--) {
		                    if (pos > stops[i][0]) {
		                        break;
		                    }
		                }
		                from = stops[i] || stops[i + 1];
		                to = stops[i + 1] || from;

		                // The position within the gradient
		                pos = 1 - (to[0] - pos) / ((to[0] - from[0]) || 1);

		                color = from.color.tweenTo(
		                    to.color,
		                    pos
		                );
		            }
		            return color;
		        },

		        /**
		         * Override the getOffset method to add the whole axis groups inside
		         * the legend.
		         *
		         * @private
		         * @function Highcharts.ColorAxis#getOffset
		         */
		        getOffset: function () {
		            var group = this.legendGroup,
		                sideOffset = this.chart.axisOffset[this.side];

		            if (group) {

		                // Hook for the getOffset method to add groups to this parent
		                // group
		                this.axisParent = group;

		                // Call the base
		                Axis.prototype.getOffset.call(this);

		                // First time only
		                if (!this.added) {

		                    this.added = true;

		                    this.labelLeft = 0;
		                    this.labelRight = this.width;
		                }
		                // Reset it to avoid color axis reserving space
		                this.chart.axisOffset[this.side] = sideOffset;
		            }
		        },

		        /**
		         * Create the color gradient.
		         *
		         * @private
		         * @function Highcharts.ColorAxis#setLegendColor
		         */
		        setLegendColor: function () {
		            var grad,
		                horiz = this.horiz,
		                reversed = this.reversed,
		                one = reversed ? 1 : 0,
		                zero = reversed ? 0 : 1;

		            grad = horiz ? [one, 0, zero, 0] : [0, zero, 0, one]; // #3190
		            this.legendColor = {
		                linearGradient: {
		                    x1: grad[0], y1: grad[1],
		                    x2: grad[2], y2: grad[3]
		                },
		                stops: this.stops
		            };
		        },

		        /**
		         * The color axis appears inside the legend and has its own legend
		         * symbol.
		         *
		         * @private
		         * @function Highcharts.ColorAxis#drawLegendSymbol
		         *
		         * @param {Highcharts.Legend} legend
		         *
		         * @param {*} item
		         */
		        drawLegendSymbol: function (legend, item) {
		            var padding = legend.padding,
		                legendOptions = legend.options,
		                horiz = this.horiz,
		                width = pick(
		                    legendOptions.symbolWidth,
		                    horiz ? this.defaultLegendLength : 12
		                ),
		                height = pick(
		                    legendOptions.symbolHeight,
		                    horiz ? 12 : this.defaultLegendLength
		                ),
		                labelPadding = pick(
		                    legendOptions.labelPadding,
		                    horiz ? 16 : 30
		                ),
		                itemDistance = pick(legendOptions.itemDistance, 10);

		            this.setLegendColor();

		            // Create the gradient
		            item.legendSymbol = this.chart.renderer.rect(
		                0,
		                legend.baseline - 11,
		                width,
		                height
		            ).attr({
		                zIndex: 1
		            }).add(item.legendGroup);

		            // Set how much space this legend item takes up
		            this.legendItemWidth = width + padding +
		                (horiz ? itemDistance : labelPadding);
		            this.legendItemHeight = height + padding +
		                (horiz ? labelPadding : 0);
		        },

		        /**
		         * Fool the legend
		         *
		         * @private
		         * @function Highcharts.ColorAxis#setState
		         *
		         * @param {*} state
		         */
		        setState: function (state) {
		            this.series.forEach(function (series) {
		                series.setState(state);
		            });
		        },

		        visible: true,

		        setVisible: noop,

		        getSeriesExtremes: function () {
		            var series = this.series,
		                i = series.length;
		            this.dataMin = Infinity;
		            this.dataMax = -Infinity;
		            while (i--) {
		                series[i].getExtremes();
		                if (series[i].valueMin !== undefined) {
		                    this.dataMin = Math.min(this.dataMin, series[i].valueMin);
		                    this.dataMax = Math.max(this.dataMax, series[i].valueMax);
		                }
		            }
		        },

		        drawCrosshair: function (e, point) {
		            var plotX = point && point.plotX,
		                plotY = point && point.plotY,
		                crossPos,
		                axisPos = this.pos,
		                axisLen = this.len;

		            if (point) {
		                crossPos = this.toPixels(point[point.series.colorKey]);
		                if (crossPos < axisPos) {
		                    crossPos = axisPos - 2;
		                } else if (crossPos > axisPos + axisLen) {
		                    crossPos = axisPos + axisLen + 2;
		                }

		                point.plotX = crossPos;
		                point.plotY = this.len - crossPos;
		                Axis.prototype.drawCrosshair.call(this, e, point);
		                point.plotX = plotX;
		                point.plotY = plotY;

		                if (
		                    this.cross &&
		                    !this.cross.addedToColorAxis &&
		                    this.legendGroup
		                ) {
		                    this.cross
		                        .addClass('highcharts-coloraxis-marker')
		                        .add(this.legendGroup);

		                    this.cross.addedToColorAxis = true;

		                    if (!this.chart.styledMode) {
		                        this.cross.attr({
		                            fill: this.crosshair.color
		                        });
		                    }

		                }
		            }
		        },

		        getPlotLinePath: function (a, b, c, d, pos) {
		            // crosshairs only
		            return isNumber(pos) ? // pos can be 0 (#3969)
		                (
		                    this.horiz ? [
		                        'M',
		                        pos - 4, this.top - 6,
		                        'L',
		                        pos + 4, this.top - 6,
		                        pos, this.top,
		                        'Z'
		                    ] : [
		                        'M',
		                        this.left, pos,
		                        'L',
		                        this.left - 6, pos + 6,
		                        this.left - 6, pos - 6,
		                        'Z'
		                    ]
		                ) :
		                Axis.prototype.getPlotLinePath.call(this, a, b, c, d);
		        },

		        update: function (newOptions, redraw) {
		            var chart = this.chart,
		                legend = chart.legend;

		            this.series.forEach(function (series) {
		                // Needed for Axis.update when choropleth colors change
		                series.isDirtyData = true;
		            });

		            // When updating data classes, destroy old items and make sure new
		            // ones are created (#3207)
		            if (newOptions.dataClasses && legend.allItems) {
		                legend.allItems.forEach(function (item) {
		                    if (item.isDataClass && item.legendGroup) {
		                        item.legendGroup.destroy();
		                    }
		                });
		                chart.isDirtyLegend = true;
		            }

		            // Keep the options structure updated for export. Unlike xAxis and
		            // yAxis, the colorAxis is not an array. (#3207)
		            chart.options[this.coll] = merge(this.userOptions, newOptions);

		            Axis.prototype.update.call(this, newOptions, redraw);
		            if (this.legendItem) {
		                this.setLegendColor();
		                legend.colorizeItem(this, true);
		            }
		        },

		        /**
		         * Extend basic axis remove by also removing the legend item.
		         *
		         * @private
		         * @function Highcharts.ColorAxis#remove
		         */
		        remove: function () {
		            if (this.legendItem) {
		                this.chart.legend.destroyItem(this);
		            }
		            Axis.prototype.remove.call(this);
		        },

		        /**
		         * Get the legend item symbols for data classes.
		         *
		         * @private
		         * @function Highcharts.ColorAxis#getDataClassLegendSymbols
		         *
		         * @return {*}
		         */
		        getDataClassLegendSymbols: function () {
		            var axis = this,
		                chart = this.chart,
		                legendItems = this.legendItems,
		                legendOptions = chart.options.legend,
		                valueDecimals = legendOptions.valueDecimals,
		                valueSuffix = legendOptions.valueSuffix || '',
		                name;

		            if (!legendItems.length) {
		                this.dataClasses.forEach(function (dataClass, i) {
		                    var vis = true,
		                        from = dataClass.from,
		                        to = dataClass.to;

		                    // Assemble the default name. This can be overridden
		                    // by legend.options.labelFormatter
		                    name = '';
		                    if (from === undefined) {
		                        name = '< ';
		                    } else if (to === undefined) {
		                        name = '> ';
		                    }
		                    if (from !== undefined) {
		                        name += H.numberFormat(from, valueDecimals) +
		                            valueSuffix;
		                    }
		                    if (from !== undefined && to !== undefined) {
		                        name += ' - ';
		                    }
		                    if (to !== undefined) {
		                        name += H.numberFormat(to, valueDecimals) + valueSuffix;
		                    }
		                    // Add a mock object to the legend items
		                    legendItems.push(extend({
		                        chart: chart,
		                        name: name,
		                        options: {},
		                        drawLegendSymbol: LegendSymbolMixin.drawRectangle,
		                        visible: true,
		                        setState: noop,
		                        isDataClass: true,
		                        setVisible: function () {
		                            vis = this.visible = !vis;
		                            axis.series.forEach(function (series) {
		                                series.points.forEach(function (point) {
		                                    if (point.dataClass === i) {
		                                        point.setVisible(vis);
		                                    }
		                                });
		                            });
		                            chart.legend.colorizeItem(this, vis);
		                        }
		                    }, dataClass));
		                });
		            }
		            return legendItems;
		        },
		        name: '' // Prevents 'undefined' in legend in IE8
		    });

		    /**
		     * Handle animation of the color attributes directly
		     *
		     * @private
		     * @function Highcharts.Fx#fillSetter
		     *//**
		     * Handle animation of the color attributes directly
		     *
		     * @private
		     * @function Highcharts.Fx#strokeSetter
		     */
		    ['fill', 'stroke'].forEach(function (prop) {
		        H.Fx.prototype[prop + 'Setter'] = function () {
		            this.elem.attr(
		                prop,
		                color(this.start).tweenTo(
		                    color(this.end),
		                    this.pos
		                ),
		                null,
		                true
		            );
		        };
		    });

		    // Extend the chart getAxes method to also get the color axis
		    addEvent(Chart, 'afterGetAxes', function () {

		        var options = this.options,
		            colorAxisOptions = options.colorAxis;

		        this.colorAxis = [];
		        if (colorAxisOptions) {
		            new ColorAxis(this, colorAxisOptions); // eslint-disable-line no-new
		        }
		    });


		    // Add the color axis. This also removes the axis' own series to prevent
		    // them from showing up individually.
		    addEvent(Legend, 'afterGetAllItems', function (e) {
		        var colorAxisItems = [],
		            colorAxis = this.chart.colorAxis[0],
		            i;

		        if (colorAxis && colorAxis.options) {
		            if (colorAxis.options.showInLegend) {
		                // Data classes
		                if (colorAxis.options.dataClasses) {
		                    colorAxisItems = colorAxis.getDataClassLegendSymbols();
		                // Gradient legend
		                } else {
		                    // Add this axis on top
		                    colorAxisItems.push(colorAxis);
		                }

		                // Don't add the color axis' series
		                colorAxis.series.forEach(function (series) {
		                    H.erase(e.allItems, series);
		                });
		            }
		        }

		        i = colorAxisItems.length;
		        while (i--) {
		            e.allItems.unshift(colorAxisItems[i]);
		        }
		    });

		    addEvent(Legend, 'afterColorizeItem', function (e) {
		        if (e.visible && e.item.legendColor) {
		            e.item.legendSymbol.attr({
		                fill: e.item.legendColor
		            });
		        }
		    });

		    // Updates in the legend need to be reflected in the color axis (6888)
		    addEvent(Legend, 'afterUpdate', function () {
		        if (this.chart.colorAxis[0]) {
		            this.chart.colorAxis[0].update({}, arguments[2]);
		        }
		    });
		}

	}(Highcharts));
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var defined = H.defined,
		    noop = H.noop,
		    seriesTypes = H.seriesTypes;

		/**
		 * Mixin for maps and heatmaps
		 *
		 * @private
		 * @mixin Highcharts.colorPointMixin
		 */
		H.colorPointMixin = {
		    /**
		     * Color points have a value option that determines whether or not it is
		     * a null point
		     *
		     * @function Highcharts.colorPointMixin.isValid
		     *
		     * @return {boolean}
		     */
		    isValid: function () {
		        // undefined is allowed
		        return (
		            this.value !== null &&
		            this.value !== Infinity &&
		            this.value !== -Infinity
		        );
		    },

		    /**
		     * Set the visibility of a single point
		     *
		     * @function Highcharts.colorPointMixin.setVisible
		     *
		     * @param {boolean} visible
		     */
		    setVisible: function (vis) {
		        var point = this,
		            method = vis ? 'show' : 'hide';

		        point.visible = Boolean(vis);

		        // Show and hide associated elements
		        ['graphic', 'dataLabel'].forEach(function (key) {
		            if (point[key]) {
		                point[key][method]();
		            }
		        });
		    },
		    /**
		     * @function Highcharts.colorPointMixin.setState
		     *
		     * @param {string} state
		     */
		    setState: function (state) {
		        H.Point.prototype.setState.call(this, state);
		        if (this.graphic) {
		            this.graphic.attr({
		                zIndex: state === 'hover' ? 1 : 0
		            });
		        }
		    }
		};

		/**
		 * @private
		 * @mixin Highcharts.colorSeriesMixin
		 */
		H.colorSeriesMixin = {
		    pointArrayMap: ['value'],
		    axisTypes: ['xAxis', 'yAxis', 'colorAxis'],
		    optionalAxis: 'colorAxis',
		    trackerGroups: ['group', 'markerGroup', 'dataLabelsGroup'],
		    getSymbol: noop,
		    parallelArrays: ['x', 'y', 'value'],
		    colorKey: 'value',

		    pointAttribs: seriesTypes.column.prototype.pointAttribs,

		    /**
		     * In choropleth maps, the color is a result of the value, so this needs
		     * translation too
		     *
		     * @function Highcharts.colorSeriesMixin.translateColors
		     */
		    translateColors: function () {
		        var series = this,
		            nullColor = this.options.nullColor,
		            colorAxis = this.colorAxis,
		            colorKey = this.colorKey;

		        this.data.forEach(function (point) {
		            var value = point[colorKey],
		                color;

		            color = point.options.color ||
		                (
		                    point.isNull ?
		                        nullColor :
		                        (colorAxis && value !== undefined) ?
		                            colorAxis.toColor(value, point) :
		                            point.color || series.color
		                );

		            if (color) {
		                point.color = color;
		            }
		        });
		    },

		    /**
		     * Get the color attibutes to apply on the graphic
		     *
		     * @function Highcharts.colorSeriesMixin.colorAttribs
		     *
		     * @param {Highcharts.Point} point
		     *
		     * @return {Highcharts.Dictionary<Highcharts.ColorString>}
		     */
		    colorAttribs: function (point) {
		        var ret = {};
		        if (defined(point.color)) {
		            ret[this.colorProp || 'fill'] = point.color;
		        }
		        return ret;
		    }
		};

	}(Highcharts));
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var addEvent = H.addEvent,
		    Chart = H.Chart,
		    doc = H.doc,
		    extend = H.extend,
		    merge = H.merge,
		    pick = H.pick;

		function stopEvent(e) {
		    if (e) {
		        if (e.preventDefault) {
		            e.preventDefault();
		        }
		        if (e.stopPropagation) {
		            e.stopPropagation();
		        }
		        e.cancelBubble = true;
		    }
		}

		/**
		 * The MapNavigation handles buttons for navigation in addition to mousewheel
		 * and doubleclick handlers for chart zooming.
		 *
		 * @private
		 * @class
		 * @name MapNavigation
		 *
		 * @param {Highcharts.Chart} chart
		 *        The Chart instance.
		 */
		function MapNavigation(chart) {
		    this.init(chart);
		}

		/**
		 * Initiator function.
		 *
		 * @function MapNavigation#init
		 *
		 * @param {Highcharts.Chart} chart
		 *        The Chart instance.
		 */
		MapNavigation.prototype.init = function (chart) {
		    this.chart = chart;
		    chart.mapNavButtons = [];
		};

		/**
		 * Update the map navigation with new options. Calling this is the same as
		 * calling `chart.update({ mapNavigation: {} })`.
		 *
		 * @function MapNavigation#update
		 *
		 * @param {Highcharts.MapNavigationOptions} options
		 *        New options for the map navigation.
		 */
		MapNavigation.prototype.update = function (options) {
		    var chart = this.chart,
		        o = chart.options.mapNavigation,
		        buttonOptions,
		        attr,
		        states,
		        hoverStates,
		        selectStates,
		        outerHandler = function (e) {
		            this.handler.call(chart, e);
		            stopEvent(e); // Stop default click event (#4444)
		        },
		        mapNavButtons = chart.mapNavButtons;

		    // Merge in new options in case of update, and register back to chart
		    // options.
		    if (options) {
		        o = chart.options.mapNavigation =
		            merge(chart.options.mapNavigation, options);
		    }

		    // Destroy buttons in case of dynamic update
		    while (mapNavButtons.length) {
		        mapNavButtons.pop().destroy();
		    }

		    if (pick(o.enableButtons, o.enabled) && !chart.renderer.forExport) {

		        H.objectEach(o.buttons, function (button, n) {
		            buttonOptions = merge(o.buttonOptions, button);

		            // Presentational
		            if (!chart.styledMode) {
		                attr = buttonOptions.theme;
		                attr.style = merge(
		                    buttonOptions.theme.style,
		                    buttonOptions.style // #3203
		                );
		                states = attr.states;
		                hoverStates = states && states.hover;
		                selectStates = states && states.select;
		            }

		            button = chart.renderer.button(
		                buttonOptions.text,
		                0,
		                0,
		                outerHandler,
		                attr,
		                hoverStates,
		                selectStates,
		                0,
		                n === 'zoomIn' ? 'topbutton' : 'bottombutton'
		            )
		            .addClass('highcharts-map-navigation highcharts-' + {
		                zoomIn: 'zoom-in',
		                zoomOut: 'zoom-out'
		            }[n])
		            .attr({
		                width: buttonOptions.width,
		                height: buttonOptions.height,
		                title: chart.options.lang[n],
		                padding: buttonOptions.padding,
		                zIndex: 5
		            })
		            .add();
		            button.handler = buttonOptions.onclick;
		            button.align(
		                extend(buttonOptions, {
		                    width: button.width,
		                    height: 2 * button.height
		                }),
		                null,
		                buttonOptions.alignTo
		            );
		            // Stop double click event (#4444)
		            addEvent(button.element, 'dblclick', stopEvent);

		            mapNavButtons.push(button);

		        });
		    }

		    this.updateEvents(o);
		};

		/**
		 * Update events, called internally from the update function. Add new event
		 * handlers, or unbinds events if disabled.
		 *
		 * @function MapNavigation#updateEvents
		 *
		 * @param {Highcharts.MapNavigationOptions} options
		 *        Options for map navigation.
		 */
		MapNavigation.prototype.updateEvents = function (options) {
		    var chart = this.chart;

		    // Add the double click event
		    if (
		        pick(options.enableDoubleClickZoom, options.enabled) ||
		        options.enableDoubleClickZoomTo
		    ) {
		        this.unbindDblClick = this.unbindDblClick || addEvent(
		            chart.container,
		            'dblclick',
		            function (e) {
		                chart.pointer.onContainerDblClick(e);
		            }
		        );
		    } else if (this.unbindDblClick) {
		        // Unbind and set unbinder to undefined
		        this.unbindDblClick = this.unbindDblClick();
		    }

		    // Add the mousewheel event
		    if (pick(options.enableMouseWheelZoom, options.enabled)) {
		        this.unbindMouseWheel = this.unbindMouseWheel || addEvent(
		            chart.container,
		            doc.onmousewheel === undefined ? 'DOMMouseScroll' : 'mousewheel',
		            function (e) {
		                chart.pointer.onContainerMouseWheel(e);
		                // Issue #5011, returning false from non-jQuery event does
		                // not prevent default
		                stopEvent(e);
		                return false;
		            }
		        );
		    } else if (this.unbindMouseWheel) {
		        // Unbind and set unbinder to undefined
		        this.unbindMouseWheel = this.unbindMouseWheel();
		    }

		};

		// Add events to the Chart object itself
		extend(Chart.prototype, /** @lends Chart.prototype */ {

		    /**
		     * Fit an inner box to an outer. If the inner box overflows left or right,
		     * align it to the sides of the outer. If it overflows both sides, fit it
		     * within the outer. This is a pattern that occurs more places in
		     * Highcharts, perhaps it should be elevated to a common utility function.
		     *
		     * @ignore
		     * @function Highcharts.Chart#fitToBox
		     *
		     * @param {Highcharts.BBoxObject} inner
		     *
		     * @param {Highcharts.BBoxObject} outer
		     *
		     * @return {Highcharts.BBoxObject}
		     *         The inner box
		     */
		    fitToBox: function (inner, outer) {
		        [['x', 'width'], ['y', 'height']].forEach(function (dim) {
		            var pos = dim[0],
		                size = dim[1];

		            if (inner[pos] + inner[size] > outer[pos] + outer[size]) { // right
		                // the general size is greater, fit fully to outer
		                if (inner[size] > outer[size]) {
		                    inner[size] = outer[size];
		                    inner[pos] = outer[pos];
		                } else { // align right
		                    inner[pos] = outer[pos] + outer[size] - inner[size];
		                }
		            }
		            if (inner[size] > outer[size]) {
		                inner[size] = outer[size];
		            }
		            if (inner[pos] < outer[pos]) {
		                inner[pos] = outer[pos];
		            }
		        });


		        return inner;
		    },

		    /**
		     * Highmaps only. Zoom in or out of the map. See also {@link Point#zoomTo}.
		     * See {@link Chart#fromLatLonToPoint} for how to get the `centerX` and
		     * `centerY` parameters for a geographic location.
		     *
		     * @function Highcharts.Chart#mapZoom
		     *
		     * @param {number} [howMuch]
		     *        How much to zoom the map. Values less than 1 zooms in. 0.5 zooms
		     *        in to half the current view. 2 zooms to twice the current view. If
		     *        omitted, the zoom is reset.
		     *
		     * @param {number} [centerX]
		     *        The X axis position to center around if available space.
		     *
		     * @param {number} [centerY]
		     *        The Y axis position to center around if available space.
		     *
		     * @param {number} [mouseX]
		     *        Fix the zoom to this position if possible. This is used for
		     *        example in mousewheel events, where the area under the mouse
		     *        should be fixed as we zoom in.
		     *
		     * @param {number} [mouseY]
		     *        Fix the zoom to this position if possible.
		     */
		    mapZoom: function (howMuch, centerXArg, centerYArg, mouseX, mouseY) {
		        var chart = this,
		            xAxis = chart.xAxis[0],
		            xRange = xAxis.max - xAxis.min,
		            centerX = pick(centerXArg, xAxis.min + xRange / 2),
		            newXRange = xRange * howMuch,
		            yAxis = chart.yAxis[0],
		            yRange = yAxis.max - yAxis.min,
		            centerY = pick(centerYArg, yAxis.min + yRange / 2),
		            newYRange = yRange * howMuch,
		            fixToX = mouseX ? ((mouseX - xAxis.pos) / xAxis.len) : 0.5,
		            fixToY = mouseY ? ((mouseY - yAxis.pos) / yAxis.len) : 0.5,
		            newXMin = centerX - newXRange * fixToX,
		            newYMin = centerY - newYRange * fixToY,
		            newExt = chart.fitToBox({
		                x: newXMin,
		                y: newYMin,
		                width: newXRange,
		                height: newYRange
		            }, {
		                x: xAxis.dataMin,
		                y: yAxis.dataMin,
		                width: xAxis.dataMax - xAxis.dataMin,
		                height: yAxis.dataMax - yAxis.dataMin
		            }),
		            zoomOut = newExt.x <= xAxis.dataMin &&
		                newExt.width >= xAxis.dataMax - xAxis.dataMin &&
		                newExt.y <= yAxis.dataMin &&
		                newExt.height >= yAxis.dataMax - yAxis.dataMin;

		        // When mousewheel zooming, fix the point under the mouse
		        if (mouseX) {
		            xAxis.fixTo = [mouseX - xAxis.pos, centerXArg];
		        }
		        if (mouseY) {
		            yAxis.fixTo = [mouseY - yAxis.pos, centerYArg];
		        }

		        // Zoom
		        if (howMuch !== undefined && !zoomOut) {
		            xAxis.setExtremes(newExt.x, newExt.x + newExt.width, false);
		            yAxis.setExtremes(newExt.y, newExt.y + newExt.height, false);

		        // Reset zoom
		        } else {
		            xAxis.setExtremes(undefined, undefined, false);
		            yAxis.setExtremes(undefined, undefined, false);
		        }

		        // Prevent zooming until this one is finished animating
		        /*
		        chart.holdMapZoom = true;
		        setTimeout(function () {
		            chart.holdMapZoom = false;
		        }, 200);
		        */
		        /*
		        delay = animation ? animation.duration || 500 : 0;
		        if (delay) {
		            chart.isMapZooming = true;
		            setTimeout(function () {
		                chart.isMapZooming = false;
		                if (chart.mapZoomQueue) {
		                    chart.mapZoom.apply(chart, chart.mapZoomQueue);
		                }
		                chart.mapZoomQueue = null;
		            }, delay);
		        }
		        */

		        chart.redraw();
		    }
		});

		// Extend the Chart.render method to add zooming and panning
		addEvent(Chart, 'beforeRender', function () {
		    // Render the plus and minus buttons. Doing this before the shapes makes
		    // getBBox much quicker, at least in Chrome.
		    this.mapNavigation = new MapNavigation(this);
		    this.mapNavigation.update();
		});

		H.MapNavigation = MapNavigation;

	}(Highcharts));
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var extend = H.extend,
		    pick = H.pick,
		    Pointer = H.Pointer,
		    wrap = H.wrap;

		// Extend the Pointer
		extend(Pointer.prototype, {

		    // The event handler for the doubleclick event
		    onContainerDblClick: function (e) {
		        var chart = this.chart;

		        e = this.normalize(e);

		        if (chart.options.mapNavigation.enableDoubleClickZoomTo) {
		            if (
		                chart.pointer.inClass(e.target, 'highcharts-tracker') &&
		                chart.hoverPoint
		            ) {
		                chart.hoverPoint.zoomTo();
		            }
		        } else if (
		            chart.isInsidePlot(
		                e.chartX - chart.plotLeft,
		                e.chartY - chart.plotTop
		            )
		        ) {
		            chart.mapZoom(
		                0.5,
		                chart.xAxis[0].toValue(e.chartX),
		                chart.yAxis[0].toValue(e.chartY),
		                e.chartX,
		                e.chartY
		            );
		        }
		    },

		    // The event handler for the mouse scroll event
		    onContainerMouseWheel: function (e) {
		        var chart = this.chart,
		            delta;

		        e = this.normalize(e);

		        // Firefox uses e.detail, WebKit and IE uses wheelDelta
		        delta = e.detail || -(e.wheelDelta / 120);
		        if (chart.isInsidePlot(
		            e.chartX - chart.plotLeft,
		            e.chartY - chart.plotTop)
		        ) {
		            chart.mapZoom(
		                Math.pow(
		                    chart.options.mapNavigation.mouseWheelSensitivity,
		                    delta
		                ),
		                chart.xAxis[0].toValue(e.chartX),
		                chart.yAxis[0].toValue(e.chartY),
		                e.chartX,
		                e.chartY
		            );
		        }
		    }
		});

		// The pinchType is inferred from mapNavigation options.
		wrap(Pointer.prototype, 'zoomOption', function (proceed) {


		    var mapNavigation = this.chart.options.mapNavigation;

		    // Pinch status
		    if (pick(mapNavigation.enableTouchZoom, mapNavigation.enabled)) {
		        this.chart.options.chart.pinchType = 'xy';
		    }

		    proceed.apply(this, [].slice.call(arguments, 1));

		});

		// Extend the pinchTranslate method to preserve fixed ratio when zooming
		wrap(
		    Pointer.prototype,
		    'pinchTranslate',
		    function (
		        proceed,
		        pinchDown,
		        touches,
		        transform,
		        selectionMarker,
		        clip,
		        lastValidTouch
		    ) {
		        var xBigger;
		        proceed.call(
		            this,
		            pinchDown,
		            touches,
		            transform,
		            selectionMarker,
		            clip,
		            lastValidTouch
		        );

		        // Keep ratio
		        if (this.chart.options.chart.type === 'map' && this.hasZoom) {
		            xBigger = transform.scaleX > transform.scaleY;
		            this.pinchTranslateDirection(
		                !xBigger,
		                pinchDown,
		                touches,
		                transform,
		                selectionMarker,
		                clip,
		                lastValidTouch,
		                xBigger ? transform.scaleX : transform.scaleY
		            );
		        }
		    }
		);

	}(Highcharts));
	(function (H) {
		/* *
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */

		/**
		 * Map data object.
		 *
		 * @interface Highcharts.MapDataObject
		 *//**
		 * The SVG path.
		 * @name Highcharts.MapDataObject#path
		 * @type {Highcharts.SVGPathArray}
		 *//**
		 * The name of the data.
		 * @name Highcharts.MapDataObject#name
		 * @type {string|undefined}
		 *//**
		 * The GeoJSON meta data.
		 * @name Highcharts.MapDataObject#properties
		 * @type {object|undefined}
		 */



		var colorPointMixin = H.colorPointMixin,
		    colorSeriesMixin = H.colorSeriesMixin,
		    extend = H.extend,
		    isNumber = H.isNumber,
		    LegendSymbolMixin = H.LegendSymbolMixin,
		    merge = H.merge,
		    noop = H.noop,
		    pick = H.pick,
		    isArray = H.isArray,
		    Point = H.Point,
		    Series = H.Series,
		    seriesType = H.seriesType,
		    seriesTypes = H.seriesTypes,
		    splat = H.splat;

		/**
		 * @private
		 * @class
		 * @name Highcharts.seriesTypes.map
		 *
		 * @augments Highcharts.Series
		 */
		seriesType('map', 'scatter',
		    /**
		     * The map series is used for basic choropleth maps, where each map area has
		     * a color based on its value.
		     *
		     * @sample maps/demo/all-maps/
		     *         Choropleth map
		     *
		     * @extends      plotOptions.scatter
		     * @excluding    marker
		     * @product      highmaps
		     * @optionparent plotOptions.map
		     */
		    {

		        animation: false, // makes the complex shapes slow

		        dataLabels: {
		            crop: false,
		            formatter: function () { // #2945
		                return this.point.value;
		            },
		            inside: true, // for the color
		            overflow: false,
		            padding: 0,
		            verticalAlign: 'middle'
		        },

		        /** @ignore-option */
		        marker: null,

		        /**
		         * The color to apply to null points.
		         *
		         * In styled mode, the null point fill is set in the
		         * `.highcharts-null-point` class.
		         *
		         * @sample maps/demo/all-areas-as-null/
		         *         Null color
		         *
		         * @type {Highcharts.ColorString}
		         */
		        nullColor: '#f7f7f7',

		        /**
		         * Whether to allow pointer interaction like tooltips and mouse events
		         * on null points.
		         *
		         * @type      {boolean}
		         * @since     4.2.7
		         * @apioption plotOptions.map.nullInteraction
		         */

		        stickyTracking: false,

		        tooltip: {
		            followPointer: true,
		            pointFormat: '{point.name}: {point.value}<br/>'
		        },

		        /** @ignore-option */
		        turboThreshold: 0,

		        /**
		         * Whether all areas of the map defined in `mapData` should be rendered.
		         * If `true`, areas which don't correspond to a data point, are rendered
		         * as `null` points. If `false`, those areas are skipped.
		         *
		         * @sample maps/plotoptions/series-allareas-false/
		         *         All areas set to false
		         *
		         * @type      {boolean}
		         * @default   true
		         * @product   highmaps
		         * @apioption plotOptions.series.allAreas
		         */
		        allAreas: true,

		        /**
		         * The border color of the map areas.
		         *
		         * In styled mode, the border stroke is given in the `.highcharts-point`
		         * class.
		         *
		         * @sample {highmaps} maps/plotoptions/series-border/
		         *         Borders demo
		         *
		         * @type      {Highcharts.ColorString}
		         * @default   '#cccccc'
		         * @product   highmaps
		         * @apioption plotOptions.series.borderColor
		         */
		        borderColor: '#cccccc',

		        /**
		         * The border width of each map area.
		         *
		         * In styled mode, the border stroke width is given in the
		         * `.highcharts-point` class.
		         *
		         * @sample maps/plotoptions/series-border/
		         *         Borders demo
		         *
		         * @type      {number}
		         * @default   1
		         * @product   highmaps
		         * @apioption plotOptions.series.borderWidth
		         */
		        borderWidth: 1,

		        /**
		         * Set this option to `false` to prevent a series from connecting to
		         * the global color axis. This will cause the series to have its own
		         * legend item.
		         *
		         * @type      {boolean}
		         * @product   highmaps
		         * @apioption plotOptions.series.colorAxis
		         */

		        /**
		         * What property to join the `mapData` to the value data. For example,
		         * if joinBy is "code", the mapData items with a specific code is merged
		         * into the data with the same code. For maps loaded from GeoJSON, the
		         * keys may be held in each point's `properties` object.
		         *
		         * The joinBy option can also be an array of two values, where the first
		         * points to a key in the `mapData`, and the second points to another
		         * key in the `data`.
		         *
		         * When joinBy is `null`, the map items are joined by their position in
		         * the array, which performs much better in maps with many data points.
		         * This is the recommended option if you are printing more than a
		         * thousand data points and have a backend that can preprocess the data
		         * into a parallel array of the mapData.
		         *
		         * @sample maps/plotoptions/series-border/
		         *         Joined by "code"
		         * @sample maps/demo/geojson/
		         *         GeoJSON joined by an array
		         * @sample maps/series/joinby-null/
		         *         Simple data joined by null
		         *
		         * @type      {string|Array<string>}
		         * @default   hc-key
		         * @product   highmaps
		         * @apioption plotOptions.series.joinBy
		         */
		        joinBy: 'hc-key',

		        /**
		         * Define the z index of the series.
		         *
		         * @type      {number}
		         * @product   highmaps
		         * @apioption plotOptions.series.zIndex
		         */

		        states: {

		            hover: {

		                halo: null,

		                /**
		                 * The color of the shape in this state.
		                 *
		                 * @sample maps/plotoptions/series-states-hover/
		                 *         Hover options
		                 *
		                 * @type      {Highcharts.ColorString}
		                 * @product   highmaps
		                 * @apioption plotOptions.series.states.hover.color
		                 */

		                /**
		                 * The border color of the point in this state.
		                 *
		                 * @type      {Highcharts.ColorString}
		                 * @product   highmaps
		                 * @apioption plotOptions.series.states.hover.borderColor
		                 */

		                /**
		                 * The border width of the point in this state
		                 *
		                 * @type      {number}
		                 * @product   highmaps
		                 * @apioption plotOptions.series.states.hover.borderWidth
		                 */

		                /**
		                 * The relative brightness of the point when hovered, relative
		                 * to the normal point color.
		                 *
		                 * @type      {number}
		                 * @product   highmaps
		                 * @default   0.2
		                 * @apioption plotOptions.series.states.hover.brightness
		                 */
		                brightness: 0.2

		            },

		            /**
		             * Overrides for the normal state.
		             *
		             * @product   highmaps
		             * @apioption plotOptions.series.states.normal
		             */
		            normal: {

		                /**
		                 * Animation options for the fill color when returning from
		                 * hover state to normal state. The animation adds some latency
		                 * in order to reduce the effect of flickering when hovering in
		                 * and out of for example an uneven coastline.
		                 *
		                 * @sample maps/plotoptions/series-states-animation-false/
		                 *         No animation of fill color
		                 *
		                 * @type      {boolean|Highcharts.AnimationOptionsObject}
		                 * @default   true
		                 * @product   highmaps
		                 * @apioption plotOptions.series.states.normal.animation
		                 */
		                animation: true
		            },

		            select: {
		                color: '#cccccc'
		            }
		        }

		    // Prototype members
		    }, merge(colorSeriesMixin, {
		        type: 'map',
		        getExtremesFromAll: true,
		        useMapGeometry: true, // get axis extremes from paths, not values
		        forceDL: true,
		        searchPoint: noop,
		        // When tooltip is not shared, this series (and derivatives) requires
		        // direct touch/hover. KD-tree does not apply.
		        directTouch: true,
		        // X axis and Y axis must have same translation slope
		        preserveAspectRatio: true,
		        pointArrayMap: ['value'],

		        // Get the bounding box of all paths in the map combined.
		        getBox: function (paths) {
		            var MAX_VALUE = Number.MAX_VALUE,
		                maxX = -MAX_VALUE,
		                minX = MAX_VALUE,
		                maxY = -MAX_VALUE,
		                minY = MAX_VALUE,
		                minRange = MAX_VALUE,
		                xAxis = this.xAxis,
		                yAxis = this.yAxis,
		                hasBox;

		            // Find the bounding box
		            (paths || []).forEach(function (point) {

		                if (point.path) {
		                    if (typeof point.path === 'string') {
		                        point.path = H.splitPath(point.path);
		                    }

		                    var path = point.path || [],
		                        i = path.length,
		                        even = false, // while loop reads from the end
		                        pointMaxX = -MAX_VALUE,
		                        pointMinX = MAX_VALUE,
		                        pointMaxY = -MAX_VALUE,
		                        pointMinY = MAX_VALUE,
		                        properties = point.properties;

		                    // The first time a map point is used, analyze its box
		                    if (!point._foundBox) {
		                        while (i--) {
		                            if (isNumber(path[i])) {
		                                if (even) { // even = x
		                                    pointMaxX = Math.max(pointMaxX, path[i]);
		                                    pointMinX = Math.min(pointMinX, path[i]);
		                                } else { // odd = Y
		                                    pointMaxY = Math.max(pointMaxY, path[i]);
		                                    pointMinY = Math.min(pointMinY, path[i]);
		                                }
		                                even = !even;
		                            }
		                        }
		                        // Cache point bounding box for use to position data
		                        // labels, bubbles etc
		                        point._midX = (
		                            pointMinX + (pointMaxX - pointMinX) * pick(
		                                point.middleX,
		                                properties && properties['hc-middle-x'],
		                                0.5
		                            )
		                        );
		                        point._midY = (
		                            pointMinY + (pointMaxY - pointMinY) * pick(
		                                point.middleY,
		                                properties && properties['hc-middle-y'],
		                                0.5
		                            )
		                        );
		                        point._maxX = pointMaxX;
		                        point._minX = pointMinX;
		                        point._maxY = pointMaxY;
		                        point._minY = pointMinY;
		                        point.labelrank = pick(
		                            point.labelrank,
		                            (pointMaxX - pointMinX) * (pointMaxY - pointMinY)
		                        );
		                        point._foundBox = true;
		                    }

		                    maxX = Math.max(maxX, point._maxX);
		                    minX = Math.min(minX, point._minX);
		                    maxY = Math.max(maxY, point._maxY);
		                    minY = Math.min(minY, point._minY);
		                    minRange = Math.min(
		                        point._maxX - point._minX,
		                        point._maxY - point._minY, minRange
		                    );
		                    hasBox = true;
		                }
		            });

		            // Set the box for the whole series
		            if (hasBox) {
		                this.minY = Math.min(minY, pick(this.minY, MAX_VALUE));
		                this.maxY = Math.max(maxY, pick(this.maxY, -MAX_VALUE));
		                this.minX = Math.min(minX, pick(this.minX, MAX_VALUE));
		                this.maxX = Math.max(maxX, pick(this.maxX, -MAX_VALUE));

		                // If no minRange option is set, set the default minimum zooming
		                // range to 5 times the size of the smallest element
		                if (xAxis && xAxis.options.minRange === undefined) {
		                    xAxis.minRange = Math.min(
		                        5 * minRange,
		                        (this.maxX - this.minX) / 5,
		                        xAxis.minRange || MAX_VALUE
		                    );
		                }
		                if (yAxis && yAxis.options.minRange === undefined) {
		                    yAxis.minRange = Math.min(
		                        5 * minRange,
		                        (this.maxY - this.minY) / 5,
		                        yAxis.minRange || MAX_VALUE
		                    );
		                }
		            }
		        },

		        getExtremes: function () {
		            // Get the actual value extremes for colors
		            Series.prototype.getExtremes.call(this, this.valueData);

		            // Recalculate box on updated data
		            if (this.chart.hasRendered && this.isDirtyData) {
		                this.getBox(this.options.data);
		            }

		            this.valueMin = this.dataMin;
		            this.valueMax = this.dataMax;

		            // Extremes for the mock Y axis
		            this.dataMin = this.minY;
		            this.dataMax = this.maxY;
		        },

		        // Translate the path, so it automatically fits into the plot area box
		        translatePath: function (path) {

		            var series = this,
		                even = false, // while loop reads from the end
		                xAxis = series.xAxis,
		                yAxis = series.yAxis,
		                xMin = xAxis.min,
		                xTransA = xAxis.transA,
		                xMinPixelPadding = xAxis.minPixelPadding,
		                yMin = yAxis.min,
		                yTransA = yAxis.transA,
		                yMinPixelPadding = yAxis.minPixelPadding,
		                i,
		                ret = []; // Preserve the original

		            // Do the translation
		            if (path) {
		                i = path.length;
		                while (i--) {
		                    if (isNumber(path[i])) {
		                        ret[i] = even ?
		                            (path[i] - xMin) * xTransA + xMinPixelPadding :
		                            (path[i] - yMin) * yTransA + yMinPixelPadding;
		                        even = !even;
		                    } else {
		                        ret[i] = path[i];
		                    }
		                }
		            }

		            return ret;
		        },

		        // Extend setData to join in mapData. If the allAreas option is true,
		        // all areas from the mapData are used, and those that don't correspond
		        // to a data value are given null values.
		        setData: function (data, redraw, animation, updatePoints) {
		            var options = this.options,
		                chartOptions = this.chart.options.chart,
		                globalMapData = chartOptions && chartOptions.map,
		                mapData = options.mapData,
		                joinBy = options.joinBy,
		                joinByNull = joinBy === null,
		                pointArrayMap = options.keys || this.pointArrayMap,
		                dataUsed = [],
		                mapMap = {},
		                mapPoint,
		                mapTransforms = this.chart.mapTransforms,
		                props,
		                i;

		            // Collect mapData from chart options if not defined on series
		            if (!mapData && globalMapData) {
		                mapData = typeof globalMapData === 'string' ?
		                    H.maps[globalMapData] :
		                    globalMapData;
		            }

		            if (joinByNull) {
		                joinBy = '_i';
		            }
		            joinBy = this.joinBy = splat(joinBy);
		            if (!joinBy[1]) {
		                joinBy[1] = joinBy[0];
		            }

		            // Pick up numeric values, add index
		            // Convert Array point definitions to objects using pointArrayMap
		            if (data) {
		                data.forEach(function (val, i) {
		                    var ix = 0;
		                    if (isNumber(val)) {
		                        data[i] = {
		                            value: val
		                        };
		                    } else if (isArray(val)) {
		                        data[i] = {};
		                        // Automatically copy first item to hc-key if there is
		                        // an extra leading string
		                        if (
		                            !options.keys &&
		                            val.length > pointArrayMap.length &&
		                            typeof val[0] === 'string'
		                        ) {
		                            data[i]['hc-key'] = val[0];
		                            ++ix;
		                        }
		                        // Run through pointArrayMap and what's left of the
		                        // point data array in parallel, copying over the values
		                        for (var j = 0; j < pointArrayMap.length; ++j, ++ix) {
		                            if (pointArrayMap[j] && val[ix] !== undefined) {
		                                if (pointArrayMap[j].indexOf('.') > 0) {
		                                    H.Point.prototype.setNestedProperty(
		                                        data[i], val[ix], pointArrayMap[j]
		                                    );
		                                } else {
		                                    data[i][pointArrayMap[j]] = val[ix];
		                                }
		                            }
		                        }
		                    }
		                    if (joinByNull) {
		                        data[i]._i = i;
		                    }
		                });
		            }

		            this.getBox(data);

		            // Pick up transform definitions for chart
		            this.chart.mapTransforms = mapTransforms =
		                chartOptions && chartOptions.mapTransforms ||
		                mapData && mapData['hc-transform'] ||
		                mapTransforms;

		            // Cache cos/sin of transform rotation angle
		            if (mapTransforms) {
		                H.objectEach(mapTransforms, function (transform) {
		                    if (transform.rotation) {
		                        transform.cosAngle = Math.cos(transform.rotation);
		                        transform.sinAngle = Math.sin(transform.rotation);
		                    }
		                });
		            }

		            if (mapData) {
		                if (mapData.type === 'FeatureCollection') {
		                    this.mapTitle = mapData.title;
		                    mapData = H.geojson(mapData, this.type, this);
		                }

		                this.mapData = mapData;
		                this.mapMap = {};

		                for (i = 0; i < mapData.length; i++) {
		                    mapPoint = mapData[i];
		                    props = mapPoint.properties;

		                    mapPoint._i = i;
		                    // Copy the property over to root for faster access
		                    if (joinBy[0] && props && props[joinBy[0]]) {
		                        mapPoint[joinBy[0]] = props[joinBy[0]];
		                    }
		                    mapMap[mapPoint[joinBy[0]]] = mapPoint;
		                }
		                this.mapMap = mapMap;

		                // Registered the point codes that actually hold data
		                if (data && joinBy[1]) {
		                    data.forEach(function (point) {
		                        if (mapMap[point[joinBy[1]]]) {
		                            dataUsed.push(mapMap[point[joinBy[1]]]);
		                        }
		                    });
		                }

		                if (options.allAreas) {
		                    this.getBox(mapData);
		                    data = data || [];

		                    // Registered the point codes that actually hold data
		                    if (joinBy[1]) {
		                        data.forEach(function (point) {
		                            dataUsed.push(point[joinBy[1]]);
		                        });
		                    }

		                    // Add those map points that don't correspond to data, which
		                    // will be drawn as null points
		                    dataUsed = '|' + dataUsed.map(function (point) {
		                        return point && point[joinBy[0]];
		                    }).join('|') + '|'; // Faster than array.indexOf

		                    mapData.forEach(function (mapPoint) {
		                        if (
		                            !joinBy[0] ||
		                            dataUsed.indexOf(
		                                '|' + mapPoint[joinBy[0]] + '|'
		                            ) === -1
		                        ) {
		                            data.push(merge(mapPoint, { value: null }));
		                            // #5050 - adding all areas causes the update
		                            // optimization of setData to kick in, even though
		                            // the point order has changed
		                            updatePoints = false;
		                        }
		                    });
		                } else {
		                    this.getBox(dataUsed); // Issue #4784
		                }
		            }
		            Series.prototype.setData.call(
		                this,
		                data,
		                redraw,
		                animation,
		                updatePoints
		            );
		        },

		        // No graph for the map series
		        drawGraph: noop,

		        // We need the points' bounding boxes in order to draw the data labels,
		        // so we skip it now and call it from drawPoints instead.
		        drawDataLabels: noop,

		        // Allow a quick redraw by just translating the area group. Used for
		        // zooming and panning in capable browsers.
		        doFullTranslate: function () {
		            return (
		                this.isDirtyData ||
		                this.chart.isResizing ||
		                this.chart.renderer.isVML ||
		                !this.baseTrans
		            );
		        },

		        // Add the path option for data points. Find the max value for color
		        // calculation.
		        translate: function () {
		            var series = this,
		                xAxis = series.xAxis,
		                yAxis = series.yAxis,
		                doFullTranslate = series.doFullTranslate();

		            series.generatePoints();

		            series.data.forEach(function (point) {

		                // Record the middle point (loosely based on centroid),
		                // determined by the middleX and middleY options.
		                point.plotX = xAxis.toPixels(point._midX, true);
		                point.plotY = yAxis.toPixels(point._midY, true);

		                if (doFullTranslate) {

		                    point.shapeType = 'path';
		                    point.shapeArgs = {
		                        d: series.translatePath(point.path)
		                    };
		                }
		            });

		            series.translateColors();
		        },

		        // Get presentational attributes. In the maps series this runs in both
		        // styled and non-styled mode, because colors hold data when a colorAxis
		        // is used.
		        pointAttribs: function (point, state) {
		            var attr = point.series.chart.styledMode ?
		                this.colorAttribs(point) :
		                seriesTypes.column.prototype.pointAttribs.call(
		                    this, point, state
		                );

		            // Set the stroke-width on the group element and let all point
		            // graphics inherit. That way we don't have to iterate over all
		            // points to update the stroke-width on zooming.
		            attr['stroke-width'] = pick(
		                point.options[
		                    (
		                        this.pointAttrToOptions &&
		                        this.pointAttrToOptions['stroke-width']
		                    ) || 'borderWidth'
		                ],
		                'inherit'
		            );

		            return attr;
		        },

		        // Use the drawPoints method of column, that is able to handle simple
		        // shapeArgs. Extend it by assigning the tooltip position.
		        drawPoints: function () {
		            var series = this,
		                xAxis = series.xAxis,
		                yAxis = series.yAxis,
		                group = series.group,
		                chart = series.chart,
		                renderer = chart.renderer,
		                scaleX,
		                scaleY,
		                translateX,
		                translateY,
		                baseTrans = this.baseTrans,
		                transformGroup,
		                startTranslateX,
		                startTranslateY,
		                startScaleX,
		                startScaleY;

		            // Set a group that handles transform during zooming and panning in
		            // order to preserve clipping on series.group
		            if (!series.transformGroup) {
		                series.transformGroup = renderer.g()
		                    .attr({
		                        scaleX: 1,
		                        scaleY: 1
		                    })
		                    .add(group);
		                series.transformGroup.survive = true;
		            }

		            // Draw the shapes again
		            if (series.doFullTranslate()) {

		                // Individual point actions.
		                if (chart.hasRendered && !chart.styledMode) {
		                    series.points.forEach(function (point) {

		                        // Restore state color on update/redraw (#3529)
		                        if (point.shapeArgs) {
		                            point.shapeArgs.fill = series.pointAttribs(
		                                point,
		                                point.state
		                            ).fill;
		                        }
		                    });
		                }

		                // Draw them in transformGroup
		                series.group = series.transformGroup;
		                seriesTypes.column.prototype.drawPoints.apply(series);
		                series.group = group; // Reset

		                // Add class names
		                series.points.forEach(function (point) {
		                    if (point.graphic) {
		                        if (point.name) {
		                            point.graphic.addClass(
		                                'highcharts-name-' +
		                                point.name.replace(/ /g, '-').toLowerCase()
		                            );
		                        }
		                        if (point.properties && point.properties['hc-key']) {
		                            point.graphic.addClass(
		                                'highcharts-key-' +
		                                point.properties['hc-key'].toLowerCase()
		                            );
		                        }

		                        // In styled mode, apply point colors by CSS
		                        if (chart.styledMode) {
		                            point.graphic.css(
		                                series.pointAttribs(
		                                    point,
		                                    point.selected && 'select'
		                                )
		                            );
		                        }
		                    }
		                });

		                // Set the base for later scale-zooming. The originX and originY
		                // properties are the axis values in the plot area's upper left
		                // corner.
		                this.baseTrans = {
		                    originX: xAxis.min - xAxis.minPixelPadding / xAxis.transA,
		                    originY: (
		                        yAxis.min -
		                        yAxis.minPixelPadding / yAxis.transA +
		                        (yAxis.reversed ? 0 : yAxis.len / yAxis.transA)
		                    ),
		                    transAX: xAxis.transA,
		                    transAY: yAxis.transA
		                };

		                // Reset transformation in case we're doing a full translate
		                // (#3789)
		                this.transformGroup.animate({
		                    translateX: 0,
		                    translateY: 0,
		                    scaleX: 1,
		                    scaleY: 1
		                });

		            // Just update the scale and transform for better performance
		            } else {
		                scaleX = xAxis.transA / baseTrans.transAX;
		                scaleY = yAxis.transA / baseTrans.transAY;
		                translateX = xAxis.toPixels(baseTrans.originX, true);
		                translateY = yAxis.toPixels(baseTrans.originY, true);

		                // Handle rounding errors in normal view (#3789)
		                if (
		                    scaleX > 0.99 &&
		                    scaleX < 1.01 &&
		                    scaleY > 0.99 &&
		                    scaleY < 1.01
		                ) {
		                    scaleX = 1;
		                    scaleY = 1;
		                    translateX = Math.round(translateX);
		                    translateY = Math.round(translateY);
		                }

		                /* Animate or move to the new zoom level. In order to prevent
		                   flickering as the different transform components are set out
		                   of sync (#5991), we run a fake animator attribute and set
		                   scale and translation synchronously in the same step.

		                   A possible improvement to the API would be to handle this in
		                   the renderer or animation engine itself, to ensure that when
		                   we are animating multiple properties, we make sure that each
		                   step for each property is performed in the same step. Also,
		                   for symbols and for transform properties, it should induce a
		                   single updateTransform and symbolAttr call. */
		                transformGroup = this.transformGroup;
		                if (chart.renderer.globalAnimation) {
		                    startTranslateX = transformGroup.attr('translateX');
		                    startTranslateY = transformGroup.attr('translateY');
		                    startScaleX = transformGroup.attr('scaleX');
		                    startScaleY = transformGroup.attr('scaleY');
		                    transformGroup
		                        .attr({ animator: 0 })
		                        .animate({
		                            animator: 1
		                        }, {
		                            step: function (now, fx) {
		                                transformGroup.attr({
		                                    translateX: startTranslateX +
		                                        (translateX - startTranslateX) * fx.pos,
		                                    translateY: startTranslateY +
		                                        (translateY - startTranslateY) * fx.pos,
		                                    scaleX: startScaleX +
		                                        (scaleX - startScaleX) * fx.pos,
		                                    scaleY: startScaleY +
		                                        (scaleY - startScaleY) * fx.pos
		                                });

		                            }
		                        });

		                // When dragging, animation is off.
		                } else {
		                    transformGroup.attr({
		                        translateX: translateX,
		                        translateY: translateY,
		                        scaleX: scaleX,
		                        scaleY: scaleY
		                    });
		                }

		            }

		            /* Set the stroke-width directly on the group element so the
		               children inherit it. We need to use setAttribute directly,
		               because the stroke-widthSetter method expects a stroke color also
		               to be set. */
		            if (!chart.styledMode) {
		                group.element.setAttribute(
		                    'stroke-width',
		                    (
		                        series.options[
		                            (
		                                series.pointAttrToOptions &&
		                                series.pointAttrToOptions['stroke-width']
		                            ) || 'borderWidth'
		                        ] ||
		                        1 // Styled mode
		                    ) / (scaleX || 1)
		                );
		            }

		            this.drawMapDataLabels();

		        },

		        // Draw the data labels. Special for maps is the time that the data
		        // labels are drawn (after points), and the clipping of the
		        // dataLabelsGroup.
		        drawMapDataLabels: function () {

		            Series.prototype.drawDataLabels.call(this);
		            if (this.dataLabelsGroup) {
		                this.dataLabelsGroup.clip(this.chart.clipRect);
		            }
		        },

		        // Override render to throw in an async call in IE8. Otherwise it chokes
		        // on the US counties demo.
		        render: function () {
		            var series = this,
		                render = Series.prototype.render;

		            // Give IE8 some time to breathe.
		            if (series.chart.renderer.isVML && series.data.length > 3000) {
		                setTimeout(function () {
		                    render.call(series);
		                });
		            } else {
		                render.call(series);
		            }
		        },

		        // The initial animation for the map series. By default, animation is
		        // disabled. Animation of map shapes is not at all supported in VML
		        // browsers.
		        animate: function (init) {
		            var chart = this.chart,
		                animation = this.options.animation,
		                group = this.group,
		                xAxis = this.xAxis,
		                yAxis = this.yAxis,
		                left = xAxis.pos,
		                top = yAxis.pos;

		            if (chart.renderer.isSVG) {

		                if (animation === true) {
		                    animation = {
		                        duration: 1000
		                    };
		                }

		                // Initialize the animation
		                if (init) {

		                    // Scale down the group and place it in the center
		                    group.attr({
		                        translateX: left + xAxis.len / 2,
		                        translateY: top + yAxis.len / 2,
		                        scaleX: 0.001, // #1499
		                        scaleY: 0.001
		                    });

		                // Run the animation
		                } else {
		                    group.animate({
		                        translateX: left,
		                        translateY: top,
		                        scaleX: 1,
		                        scaleY: 1
		                    }, animation);

		                    // Delete this function to allow it only once
		                    this.animate = null;
		                }
		            }
		        },

		        // Animate in the new series from the clicked point in the old series.
		        // Depends on the drilldown.js module
		        animateDrilldown: function (init) {
		            var toBox = this.chart.plotBox,
		                level = this.chart.drilldownLevels[
		                    this.chart.drilldownLevels.length - 1
		                ],
		                fromBox = level.bBox,
		                animationOptions = this.chart.options.drilldown.animation,
		                scale;

		            if (!init) {

		                scale = Math.min(
		                    fromBox.width / toBox.width,
		                    fromBox.height / toBox.height
		                );
		                level.shapeArgs = {
		                    scaleX: scale,
		                    scaleY: scale,
		                    translateX: fromBox.x,
		                    translateY: fromBox.y
		                };

		                this.points.forEach(function (point) {
		                    if (point.graphic) {
		                        point.graphic
		                            .attr(level.shapeArgs)
		                            .animate({
		                                scaleX: 1,
		                                scaleY: 1,
		                                translateX: 0,
		                                translateY: 0
		                            }, animationOptions);
		                    }
		                });

		                this.animate = null;
		            }

		        },

		        drawLegendSymbol: LegendSymbolMixin.drawRectangle,

		        // When drilling up, pull out the individual point graphics from the
		        // lower series and animate them into the origin point in the upper
		        // series.
		        animateDrillupFrom: function (level) {
		            seriesTypes.column.prototype.animateDrillupFrom.call(this, level);
		        },


		        // When drilling up, keep the upper series invisible until the lower
		        // series has moved into place
		        animateDrillupTo: function (init) {
		            seriesTypes.column.prototype.animateDrillupTo.call(this, init);
		        }

		    // Point class
		    }), extend({

		        // Extend the Point object to split paths
		        applyOptions: function (options, x) {

		            var point = Point.prototype.applyOptions.call(this, options, x),
		                series = this.series,
		                joinBy = series.joinBy,
		                mapPoint;

		            if (series.mapData) {
		                mapPoint = point[joinBy[1]] !== undefined &&
		                    series.mapMap[point[joinBy[1]]];
		                if (mapPoint) {
		                    // This applies only to bubbles
		                    if (series.xyFromShape) {
		                        point.x = mapPoint._midX;
		                        point.y = mapPoint._midY;
		                    }
		                    extend(point, mapPoint); // copy over properties
		                } else {
		                    point.value = point.value || null;
		                }
		            }

		            return point;
		        },

		        // Stop the fade-out
		        onMouseOver: function (e) {
		            H.clearTimeout(this.colorInterval);
		            if (this.value !== null || this.series.options.nullInteraction) {
		                Point.prototype.onMouseOver.call(this, e);
		            } else {
		                // #3401 Tooltip doesn't hide when hovering over null points
		                this.series.onMouseOut(e);
		            }
		        },

		        /**
		         * Highmaps only. Zoom in on the point using the global animation.
		         *
		         * @sample maps/members/point-zoomto/
		         *         Zoom to points from butons
		         *
		         * @requires module:modules/map
		         *
		         * @function Highcharts.Point#zoomTo
		         */
		        zoomTo: function () {
		            var point = this,
		                series = point.series;

		            series.xAxis.setExtremes(
		                point._minX,
		                point._maxX,
		                false
		            );
		            series.yAxis.setExtremes(
		                point._minY,
		                point._maxY,
		                false
		            );
		            series.chart.redraw();
		        }
		    }, colorPointMixin)
		);

		/**
		 * A map data object containing a `path` definition and optionally additional
		 * properties to join in the data as per the `joinBy` option.
		 *
		 * @sample maps/demo/category-map/
		 *         Map data and joinBy
		 *
		 * @type      {Highcharts.MapDataObject|Array<Highcharts.MapDataObject>}
		 * @product   highmaps
		 * @apioption series.mapData
		 */

		/**
		 * A `map` series. If the [type](#series.map.type) option is not specified, it
		 * is inherited from [chart.type](#chart.type).
		 *
		 * @extends   series,plotOptions.map
		 * @excluding dataParser, dataURL, marker
		 * @product   highmaps
		 * @apioption series.map
		 */

		/**
		 * An array of data points for the series. For the `map` series type, points can
		 * be given in the following ways:
		 *
		 * 1.  An array of numerical values. In this case, the numerical values will be
		 * interpreted as `value` options. Example:
		 *
		 *  ```js
		 *  data: [0, 5, 3, 5]
		 *  ```
		 *
		 * 2.  An array of arrays with 2 values. In this case, the values correspond to
		 * `[hc-key, value]`. Example:
		 *
		 *  ```js
		 *     data: [
		 *         ['us-ny', 0],
		 *         ['us-mi', 5],
		 *         ['us-tx', 3],
		 *         ['us-ak', 5]
		 *     ]
		 *  ```
		 *
		 * 3.  An array of objects with named values. The following snippet shows only a
		 * few settings, see the complete options set below. If the total number of data
		 * points exceeds the series' [turboThreshold](#series.map.turboThreshold), this
		 * option is not available.
		 *
		 *  ```js
		 *     data: [{
		 *         value: 6,
		 *         name: "Point2",
		 *         color: "#00FF00"
		 *     }, {
		 *         value: 6,
		 *         name: "Point1",
		 *         color: "#FF00FF"
		 *     }]
		 *  ```
		 *
		 * @type      {Array<number|Array<string,number>|*>}
		 * @apioption series.map.data
		 */

		/**
		 * Individual color for the point. By default the color is either used
		 * to denote the value, or pulled from the global `colors` array.
		 *
		 * @type      {Highcharts.ColorString}
		 * @product   highmaps
		 * @apioption series.map.data.color
		 */

		/**
		 * Individual data label for each point. The options are the same as
		 * the ones for [plotOptions.series.dataLabels](
		 * #plotOptions.series.dataLabels).
		 *
		 * @sample maps/series/data-datalabels/
		 *         Disable data labels for individual areas
		 *
		 * @type {Object}
		 * @product highmaps
		 * @apioption series.map.data.dataLabels
		 */

		/**
		 * The `id` of a series in the [drilldown.series](#drilldown.series)
		 * array to use for a drilldown for this point.
		 *
		 * @sample maps/demo/map-drilldown/
		 *         Basic drilldown
		 *
		 * @type      {string}
		 * @product   highmaps
		 * @apioption series.map.data.drilldown
		 */

		/**
		 * An id for the point. This can be used after render time to get a
		 * pointer to the point object through `chart.get()`.
		 *
		 * @sample maps/series/data-id/
		 *         Highlight a point by id
		 *
		 * @type      {string}
		 * @product   highmaps
		 * @apioption series.map.data.id
		 */

		/**
		 * When data labels are laid out on a map, Highmaps runs a simplified
		 * algorithm to detect collision. When two labels collide, the one with
		 * the lowest rank is hidden. By default the rank is computed from the
		 * area.
		 *
		 * @type      {number}
		 * @product   highmaps
		 * @apioption series.map.data.labelrank
		 */

		 /**
		 * The relative mid point of an area, used to place the data label.
		 * Ranges from 0 to 1\. When `mapData` is used, middleX can be defined
		 * there.
		 *
		 * @type      {number}
		 * @default   0.5
		 * @product   highmaps
		 * @apioption series.map.data.middleX
		 */

		/**
		 * The relative mid point of an area, used to place the data label.
		 * Ranges from 0 to 1\. When `mapData` is used, middleY can be defined
		 * there.
		 *
		 * @type      {number}
		 * @default   0.5
		 * @product   highmaps
		 * @apioption series.map.data.middleY
		 */

		/**
		 * The name of the point as shown in the legend, tooltip, dataLabel
		 * etc.
		 *
		 * @sample maps/series/data-datalabels/
		 *         Point names
		 *
		 * @type      {string}
		 * @product   highmaps
		 * @apioption series.map.data.name
		 */

		/**
		 * For map and mapline series types, the SVG path for the shape. For
		 * compatibily with old IE, not all SVG path definitions are supported,
		 * but M, L and C operators are safe.
		 *
		 * To achieve a better separation between the structure and the data,
		 * it is recommended to use `mapData` to define that paths instead
		 * of defining them on the data points themselves.
		 *
		 * @sample maps/series/data-path/
		 *         Paths defined in data
		 *
		 * @type      {string}
		 * @product   highmaps
		 * @apioption series.map.data.path
		 */

		/**
		 * The numeric value of the data point.
		 *
		 * @type      {number}
		 * @product   highmaps
		 * @apioption series.map.data.value
		 */


		/**
		 * Individual point events
		 *
		 * @extends   plotOptions.series.point.events
		 * @product   highmaps
		 * @apioption series.map.data.events
		 */

	}(Highcharts));
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var seriesType = H.seriesType,
		    seriesTypes = H.seriesTypes;

		/**
		 * @private
		 * @class
		 * @name Highcharts.seriesTypes.mapline
		 *
		 * @augments Highcharts.Series
		 */
		seriesType('mapline', 'map'

		/**
		 * A mapline series is a special case of the map series where the value colors
		 * are applied to the strokes rather than the fills. It can also be used for
		 * freeform drawing, like dividers, in the map.
		 *
		 * @sample maps/demo/mapline-mappoint/
		 *         Mapline and map-point chart
		 *
		 * @extends      plotOptions.map
		 * @product      highmaps
		 * @optionparent plotOptions.mapline
		 */
		, {
		    /**
		     * The width of the map line.
		     */
		    lineWidth: 1,

		    /**
		     * Fill color for the map line shapes
		     *
		     * @type {Highcharts.ColorString}
		     */
		    fillColor: 'none'
		}, {

		    type: 'mapline',

		    colorProp: 'stroke',

		    pointAttrToOptions: {
		        'stroke': 'color',
		        'stroke-width': 'lineWidth'
		    },

		    /**
		     * Get presentational attributes
		     *
		     * @private
		     * @function Highcharts.seriesTypes.mapline#pointAttribs
		     *
		     * @param {Highcharts.Point} point
		     *
		     * @param {string} state
		     *
		     * @return {Highcharts.Dictionary<*>}
		     */
		    pointAttribs: function (point, state) {
		        var attr = seriesTypes.map.prototype.pointAttribs.call(
		            this,
		            point,
		            state
		        );

		        // The difference from a map series is that the stroke takes the point
		        // color
		        attr.fill = this.options.fillColor;

		        return attr;
		    },

		    drawLegendSymbol: seriesTypes.line.prototype.drawLegendSymbol

		});

		/**
		 * A `mapline` series. If the [type](#series.mapline.type) option is
		 * not specified, it is inherited from [chart.type](#chart.type).
		 *
		 * @extends   series,plotOptions.mapline
		 * @excluding dataParser, dataURL, marker
		 * @product   highmaps
		 * @apioption series.mapline
		 */

		/**
		 * An array of data points for the series. For the `mapline` series type,
		 * points can be given in the following ways:
		 *
		 * 1.  An array of numerical values. In this case, the numerical values
		 * will be interpreted as `value` options. Example:
		 *
		 *  ```js
		 *  data: [0, 5, 3, 5]
		 *  ```
		 *
		 * 2.  An array of arrays with 2 values. In this case, the values correspond
		 * to `[hc-key, value]`. Example:
		 *
		 *  ```js
		 *     data: [
		 *         ['us-ny', 0],
		 *         ['us-mi', 5],
		 *         ['us-tx', 3],
		 *         ['us-ak', 5]
		 *     ]
		 *  ```
		 *
		 * 3.  An array of objects with named values. The following snippet shows only a
		 * few settings, see the complete options set below. If the total number of data
		 * points exceeds the series' [turboThreshold](#series.map.turboThreshold),
		 * this option is not available.
		 *
		 *  ```js
		 *     data: [{
		 *         value: 6,
		 *         name: "Point2",
		 *         color: "#00FF00"
		 *     }, {
		 *         value: 6,
		 *         name: "Point1",
		 *         color: "#FF00FF"
		 *     }]
		 *  ```
		 *
		 * @type      {Array<number|Array<string,number>|object>}
		 * @product   highmaps
		 * @apioption series.mapline.data
		 */

	}(Highcharts));
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var merge = H.merge,
		    Point = H.Point,
		    seriesType = H.seriesType;

		/**
		 * @private
		 * @class
		 * @name Highcharts.seriesTypes.mappoint
		 *
		 * @augments Highcharts.Series
		 */
		seriesType('mappoint', 'scatter',
		    /**
		     * A mappoint series is a special form of scatter series where the points
		     * can be laid out in map coordinates on top of a map.
		     *
		     * @sample maps/demo/mapline-mappoint/
		     *         Map-line and map-point series.
		     *
		     * @extends      plotOptions.scatter
		     * @product      highmaps
		     * @optionparent plotOptions.mappoint
		     */
		    {
		        dataLabels: {
		            /**
		             * @default   {point.name}
		             * @apioption plotOptions.mappoint.dataLabels.format
		             */
		            enabled: true,
		            formatter: function () { // #2945
		                return this.point.name;
		            },
		            crop: false,
		            defer: false,
		            overflow: false,
		            style: {
		                color: '#000000'
		            }
		        }
		    // Prototype members
		    }, {
		        type: 'mappoint',
		        forceDL: true
		    // Point class
		    }, {
		        applyOptions: function (options, x) {
		            var mergedOptions = (
		                options.lat !== undefined &&
		                options.lon !== undefined ?
		                merge(options, this.series.chart.fromLatLonToPoint(options)) :
		                options
		            );
		            return Point.prototype.applyOptions.call(this, mergedOptions, x);
		        }
		    }
		);

		/**
		 * A `mappoint` series. If the [type](#series.mappoint.type) option
		 * is not specified, it is inherited from [chart.type](#chart.type).
		 *
		 *
		 * @extends   series,plotOptions.mappoint
		 * @excluding dataParser, dataURL
		 * @product   highmaps
		 * @apioption series.mappoint
		 */

		/**
		 * An array of data points for the series. For the `mappoint` series
		 * type, points can be given in the following ways:
		 *
		 * 1.  An array of numerical values. In this case, the numerical values
		 * will be interpreted as `y` options. The `x` values will be automatically
		 * calculated, either starting at 0 and incremented by 1, or from `pointStart`
		 * and `pointInterval` given in the series options. If the axis has
		 * categories, these will be used. Example:
		 *
		 *  ```js
		 *  data: [0, 5, 3, 5]
		 *  ```
		 *
		 * 2.  An array of arrays with 2 values. In this case, the values correspond
		 * to `x,y`. If the first value is a string, it is applied as the name
		 * of the point, and the `x` value is inferred.
		 *
		 *  ```js
		 *     data: [
		 *         [0, 1],
		 *         [1, 8],
		 *         [2, 7]
		 *     ]
		 *  ```
		 *
		 * 3.  An array of objects with named values. The following snippet shows only a
		 * few settings, see the complete options set below. If the total number of data
		 * points exceeds the series' [turboThreshold](#series.mappoint.turboThreshold),
		 * this option is not available.
		 *
		 *  ```js
		 *     data: [{
		 *         x: 1,
		 *         y: 7,
		 *         name: "Point2",
		 *         color: "#00FF00"
		 *     }, {
		 *         x: 1,
		 *         y: 4,
		 *         name: "Point1",
		 *         color: "#FF00FF"
		 *     }]
		 *  ```
		 *
		 * @type      {Array<number|Array<number,number>|*>}
		 * @extends   series.map.data
		 * @excluding labelrank, middleX, middleY, path, value
		 * @product   highmaps
		 * @apioption series.mappoint.data
		 */

		/**
		 * The latitude of the point. Must be combined with the `lon` option
		 * to work. Overrides `x` and `y` values.
		 *
		 * @sample {highmaps} maps/demo/mappoint-latlon/
		 *         Point position by lat/lon
		 *
		 * @type      {number}
		 * @since     1.1.0
		 * @product   highmaps
		 * @apioption series.mappoint.data.lat
		 */

		/**
		 * The longitude of the point. Must be combined with the `lon` option
		 * to work. Overrides `x` and `y` values.
		 *
		 * @sample {highmaps} maps/demo/mappoint-latlon/
		 *         Point position by lat/lon
		 *
		 * @type      {number}
		 * @since     1.1.0
		 * @product   highmaps
		 * @apioption series.mappoint.data.lon
		 */

		/**
		 * The x coordinate of the point in terms of the map path coordinates.
		 *
		 * @sample {highmaps} maps/demo/mapline-mappoint/
		 *         Map point demo
		 *
		 * @type      {number}
		 * @product   highmaps
		 * @apioption series.mappoint.data.x
		 */

		/**
		 * The x coordinate of the point in terms of the map path coordinates.
		 *
		 * @sample {highmaps} maps/demo/mapline-mappoint/
		 *         Map point demo
		 *
		 * @type      {number}
		 * @product   highmaps
		 * @apioption series.mappoint.data.y
		 */

	}(Highcharts));
	(function (H) {
		/* *
		 * (c) 2010-2018 Highsoft AS
		 *
		 * Author: Paweł Potaczek
		 *
		 * License: www.highcharts.com/license
		 */

		/**
		 * @interface Highcharts.LegendBubbleLegendFormatterContextObject
		 *//**
		 * The center y position of the range.
		 * @name Highcharts.LegendBubbleLegendFormatterContextObject#center
		 * @type {number}
		 *//**
		 * The radius of the bubble range.
		 * @name Highcharts.LegendBubbleLegendFormatterContextObject#radius
		 * @type {number}
		 *//**
		 * The bubble value.
		 * @name Highcharts.LegendBubbleLegendFormatterContextObject#value
		 * @type {number}
		 */



		var Series = H.Series,
		    Legend = H.Legend,
		    Chart = H.Chart,

		    addEvent = H.addEvent,
		    wrap = H.wrap,
		    color = H.color,
		    isNumber = H.isNumber,
		    numberFormat = H.numberFormat,
		    objectEach = H.objectEach,
		    merge = H.merge,
		    noop = H.noop,
		    pick = H.pick,
		    stableSort = H.stableSort,
		    setOptions = H.setOptions,
		    arrayMin = H.arrayMin,
		    arrayMax = H.arrayMax;

		setOptions({  // Set default bubble legend options
		    legend: {
		        /**
		         * The bubble legend is an additional element in legend which presents
		         * the scale of the bubble series. Individual bubble ranges can be
		         * defined by user or calculated from series. In the case of
		         * automatically calculated ranges, a 1px margin of error is permitted.
		         * Requires `highcharts-more.js`.
		         *
		         * @since        7.0.0
		         * @product      highcharts highstock highmaps
		         * @optionparent legend.bubbleLegend
		         */
		        bubbleLegend: {
		            /**
		             * The color of the ranges borders, can be also defined for an
		             * individual range.
		             *
		             * @sample highcharts/bubble-legend/similartoseries/
		             *         Similat look to the bubble series
		             * @sample highcharts/bubble-legend/bordercolor/
		             *         Individual bubble border color
		             *
		             * @type {Highcharts.ColorString}
		             */
		            borderColor: undefined,
		            /**
		             * The width of the ranges borders in pixels, can be also defined
		             * for an individual range.
		             */
		            borderWidth: 2,
		            /**
		             * An additional class name to apply to the bubble legend' circle
		             * graphical elements. This option does not replace default class
		             * names of the graphical element.
		             *
		             * @sample {highcharts} highcharts/css/bubble-legend/
		             *         Styling by CSS
		             *
		             * @type {string}
		             */
		            className: undefined,
		            /**
		             * The main color of the bubble legend. Applies to ranges, if
		             * individual color is not defined.
		             *
		             * @sample highcharts/bubble-legend/similartoseries/
		             *         Similat look to the bubble series
		             * @sample highcharts/bubble-legend/color/
		             *         Individual bubble color
		             *
		             * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
		             */
		            color: undefined,
		            /**
		             * An additional class name to apply to the bubble legend's
		             * connector graphical elements. This option does not replace
		             * default class names of the graphical element.
		             *
		             * @sample {highcharts} highcharts/css/bubble-legend/
		             *         Styling by CSS
		             *
		             * @type {string}
		             */
		            connectorClassName: undefined,
		            /**
		             * The color of the connector, can be also defined
		             * for an individual range.
		             *
		             * @type {Highcharts.ColorString}
		             */
		            connectorColor: undefined,
		            /**
		             * The length of the connectors in pixels. If labels are centered,
		             * the distance is reduced to 0.
		             *
		             * @sample highcharts/bubble-legend/connectorandlabels/
		             *         Increased connector length
		             */
		            connectorDistance: 60,
		            /**
		             * The width of the connectors in pixels.
		             *
		             * @sample highcharts/bubble-legend/connectorandlabels/
		             *         Increased connector width
		             */
		            connectorWidth: 1,
		            /**
		             * Enable or disable the bubble legend.
		             */
		            enabled: false,
		            /**
		             * Options for the bubble legend labels.
		             */
		            labels: {
		                /**
		                 * An additional class name to apply to the bubble legend
		                 * label graphical elements. This option does not replace
		                 * default class names of the graphical element.
		                 *
		                 * @sample {highcharts} highcharts/css/bubble-legend/
		                 *         Styling by CSS
		                 *
		                 * @type {string}
		                 */
		                className: undefined,
		                /**
		                 * Whether to allow data labels to overlap.
		                 */
		                allowOverlap: false,
		                /**
		                 * A [format string](http://docs.highcharts.com/#formatting)
		                 * for the bubble legend labels. Available variables are the
		                 * same as for `formatter`.
		                 *
		                 * @sample highcharts/bubble-legend/format/
		                 *         Add a unit
		                 *
		                 * @type {string}
		                 */
		                format: '',
		                /**
		                 * Available `this` properties are:
		                 *
		                 * - `this.value`: The bubble value.
		                 *
		                 * - `this.radius`: The radius of the bubble range.
		                 *
		                 * - `this.center`: The center y position of the range.
		                 *
		                 * @type {Highcharts.FormatterCallbackFunction<Highcharts.LegendBubbleLegendFormatterContextObject>}
		                 */
		                formatter: undefined,
		                /**
		                 * The alignment of the labels compared to the bubble legend.
		                 * Can be one of `left`, `center` or `right`.
		                 * @validvalue ["left", "center", "right"]
		                 *
		                 * @sample highcharts/bubble-legend/connectorandlabels/
		                 *         Labels on left
		                 *
		                 * @validvalue ["left", "center", "right"]
		                 */
		                align: 'right',
		                /**
		                 * CSS styles for the labels.
		                 *
		                 * @type {Highcharts.CSSObject}
		                 */
		                style: {
		                    /** @ignore-option */
		                    fontSize: 10,
		                    /** @ignore-option */
		                    color: undefined
		                },
		                /**
		                 * The x position offset of the label relative to the
		                 * connector.
		                 */
		                x: 0,
		                /**
		                 * The y position offset of the label relative to the
		                 * connector.
		                 */
		                y: 0
		            },
		            /**
		             * Miximum bubble legend range size. If values for ranges are not
		             * specified, the `minSize` and the `maxSize` are calculated from
		             * bubble series.
		             */
		            maxSize: 60,  // Number
		            /**
		             * Minimum bubble legend range size. If values for ranges are not
		             * specified, the `minSize` and the `maxSize` are calculated from
		             * bubble series.
		             */
		            minSize: 10,  // Number
		            /**
		             * The position of the bubble legend in the legend.
		             * @sample highcharts/bubble-legend/connectorandlabels/
		             *         Bubble legend as last item in legend
		             */
		            legendIndex: 0, // Number
		            /**
		             * Options for specific range. One range consists of bubble, label
		             * and connector.
		             *
		             * @sample highcharts/bubble-legend/ranges/
		             *         Manually defined ranges
		             * @sample highcharts/bubble-legend/autoranges/
		             *         Auto calculated ranges
		             *
		             * @type {Array<*>}
		             */
		            ranges: {
		               /**
		                * Range size value, similar to bubble Z data.
		                */
		                value: undefined,
		                /**
		                 * The color of the border for individual range.
		                 * @type {Highcharts.ColorString}
		                 */
		                borderColor: undefined,
		                /**
		                 * The color of the bubble for individual range.
		                 * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
		                 */
		                color: undefined,
		                /**
		                 * The color of the connector for individual range.
		                 * @type {Highcharts.ColorString}
		                 */
		                connectorColor: undefined
		            },
		            /**
		             * Whether the bubble legend range value should be represented by
		             * the area or the width of the bubble. The default, area,
		             * corresponds best to the human perception of the size of each
		             * bubble.
		             *
		             * @sample highcharts/bubble-legend/ranges/
		             *         Size by width
		             *
		             * @validvalue ["area", "width"]
		             */
		            sizeBy: 'area',
		            /**
		             * When this is true, the absolute value of z determines the size of
		             * the bubble. This means that with the default zThreshold of 0, a
		             * bubble of value -1 will have the same size as a bubble of value
		             * 1, while a bubble of value 0 will have a smaller size according
		             * to minSize.
		             */
		            sizeByAbsoluteValue: false,
		            /**
		             * Define the visual z index of the bubble legend.
		             */
		            zIndex: 1,
		            /**
		             * Ranges with with lower value than zThreshold, are skipped.
		             */
		            zThreshold: 0
		        }
		    }
		});

		/**
		 * BubbleLegend class.
		 *
		 * @private
		 * @class
		 * @name Highcharts.BubbleLegend
		 *
		 * @param {Highcharts.LegendBubbleLegendOptions} config
		 *        Bubble legend options
		 *
		 * @param {Highcharts.LegendOptions} config
		 *        Legend options
		 */
		H.BubbleLegend = function (options, legend) {
		    this.init(options, legend);
		};

		H.BubbleLegend.prototype = {
		    /**
		     * Create basic bubbleLegend properties similar to item in legend.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#init
		     *
		     * @param {Highcharts.LegendBubbleLegendOptions} config
		     *        Bubble legend options
		     *
		     * @param {Highcharts.LegendOptions} config
		     *        Legend options
		     */
		    init: function (options, legend) {
		        this.options = options;
		        this.visible = true;
		        this.chart = legend.chart;
		        this.legend = legend;
		    },

		    setState: noop,

		    /**
		     * Depending on the position option, add bubbleLegend to legend items.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#addToLegend
		     *
		     * @param {Array<*>}
		     *        All legend items
		     */
		    addToLegend: function (items) {
		        // Insert bubbleLegend into legend items
		        items.splice(this.options.legendIndex, 0, this);
		    },

		    /**
		     * Calculate ranges, sizes and call the next steps of bubbleLegend creation.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#drawLegendSymbol
		     *
		     * @param {Highcharts.Legend} legend
		     *        Legend instance
		     */
		    drawLegendSymbol: function (legend) {
		        var bubbleLegend = this,
		            chart = bubbleLegend.chart,
		            options = bubbleLegend.options,
		            size,
		            itemDistance = pick(legend.options.itemDistance, 20),
		            connectorSpace,
		            ranges = options.ranges,
		            radius,
		            maxLabel,
		            connectorDistance = options.connectorDistance;

		        // Predict label dimensions
		        bubbleLegend.fontMetrics = chart.renderer.fontMetrics(
		            options.labels.style.fontSize.toString() + 'px'
		        );

		        // Do not create bubbleLegend now if ranges or ranges valeus are not
		        // specified or if are empty array.
		        if (!ranges || !ranges.length || !isNumber(ranges[0].value)) {
		            legend.options.bubbleLegend.autoRanges = true;
		            return;
		        }

		        // Sort ranges to right render order
		        stableSort(ranges, function (a, b) {
		            return b.value - a.value;
		        });

		        bubbleLegend.ranges = ranges;

		        bubbleLegend.setOptions();
		        bubbleLegend.render();

		        // Get max label size
		        maxLabel = bubbleLegend.getMaxLabelSize();
		        radius = bubbleLegend.ranges[0].radius;
		        size = radius * 2;

		        // Space for connectors and labels.
		        connectorSpace = connectorDistance - radius + maxLabel.width;
		        connectorSpace = connectorSpace > 0 ? connectorSpace : 0;

		        bubbleLegend.maxLabel = maxLabel;
		        bubbleLegend.movementX = options.labels.align === 'left' ?
		            connectorSpace : 0;

		        bubbleLegend.legendItemWidth = size + connectorSpace + itemDistance;
		        bubbleLegend.legendItemHeight = size + bubbleLegend.fontMetrics.h / 2;
		    },

		    /**
		     * Set style options for each bubbleLegend range.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#setOptions
		     */
		    setOptions: function () {
		        var bubbleLegend = this,
		            ranges = bubbleLegend.ranges,
		            options = bubbleLegend.options,
		            series = bubbleLegend.chart.series[options.seriesIndex],
		            baseline = bubbleLegend.legend.baseline,
		            bubbleStyle = {
		                'z-index': options.zIndex,
		                'stroke-width': options.borderWidth
		            },
		            connectorStyle = {
		                'z-index': options.zIndex,
		                'stroke-width': options.connectorWidth
		            },
		            labelStyle = bubbleLegend.getLabelStyles(),
		            fillOpacity = series.options.marker.fillOpacity,
		            styledMode = bubbleLegend.chart.styledMode;

		        // Allow to parts of styles be used individually for range
		        ranges.forEach(function (range, i) {
		            if (!styledMode) {
		                bubbleStyle.stroke = pick(
		                    range.borderColor,
		                    options.borderColor,
		                    series.color
		                );
		                bubbleStyle.fill = pick(
		                    range.color,
		                    options.color,
		                    fillOpacity !== 1 ?
		                        color(series.color).setOpacity(fillOpacity)
		                            .get('rgba') :
		                        series.color
		                );
		                connectorStyle.stroke = pick(
		                    range.connectorColor,
		                    options.connectorColor,
		                    series.color
		                );
		            }

		            // Set options needed for rendering each range
		            ranges[i].radius = bubbleLegend.getRangeRadius(range.value);
		            ranges[i] = merge(ranges[i], {
		                center: ranges[0].radius - ranges[i].radius + baseline
		            });

		            if (!styledMode) {
		                merge(true, ranges[i], {
		                    bubbleStyle: merge(false, bubbleStyle),
		                    connectorStyle: merge(false, connectorStyle),
		                    labelStyle: labelStyle
		                });
		            }
		        });
		    },

		    /**
		     * Merge options for bubbleLegend labels.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#getLabelStyles
		     */
		    getLabelStyles: function () {
		        var options = this.options,
		            additionalLabelsStyle = {},
		            labelsOnLeft = options.labels.align === 'left',
		            rtl = this.legend.options.rtl;

		        // To separate additional style options
		        objectEach(options.labels.style, function (value, key) {
		            if (key !== 'color' && key !== 'fontSize' && key !== 'z-index') {
		                additionalLabelsStyle[key] = value;
		            }
		        });

		        return merge(false, additionalLabelsStyle, {
		            'font-size': options.labels.style.fontSize,
		            fill: pick(
		                options.labels.style.color,
		                '#000000'
		            ),
		            'z-index': options.zIndex,
		            align: rtl || labelsOnLeft ? 'right' : 'left'
		        });
		    },


		    /**
		     * Calculate radius for each bubble range,
		     * used code from BubbleSeries.js 'getRadius' method.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#getRangeRadius
		     *
		     * @param {number} value
		     *        Range value
		     *
		     * @return {number}
		     *         Radius for one range
		     */
		    getRangeRadius: function (value) {
		        var bubbleLegend = this,
		            options = bubbleLegend.options,
		            seriesIndex = bubbleLegend.options.seriesIndex,
		            bubbleSeries = bubbleLegend.chart.series[seriesIndex],
		            zMax = options.ranges[0].value,
		            zMin = options.ranges[options.ranges.length - 1].value,
		            minSize = options.minSize,
		            maxSize = options.maxSize;

		        return bubbleSeries.getRadius.call(
		            this,
		            zMin,
		            zMax,
		            minSize,
		            maxSize,
		            value
		        );
		    },

		    /**
		     * Render the legendSymbol group.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#render
		     */
		    render: function () {
		        var bubbleLegend = this,
		            renderer = bubbleLegend.chart.renderer,
		            zThreshold = bubbleLegend.options.zThreshold;


		        if (!bubbleLegend.symbols) {
		            bubbleLegend.symbols = {
		                connectors: [],
		                bubbleItems: [],
		                labels: []
		            };
		        }
		        // Nesting SVG groups to enable handleOverflow
		        bubbleLegend.legendSymbol = renderer.g('bubble-legend');
		        bubbleLegend.legendItem = renderer.g('bubble-legend-item');

		        // To enable default 'hideOverlappingLabels' method
		        bubbleLegend.legendSymbol.translateX = 0;
		        bubbleLegend.legendSymbol.translateY = 0;

		        bubbleLegend.ranges.forEach(function (range) {
		            if (range.value >= zThreshold) {
		                bubbleLegend.renderRange(range);
		            }
		        });
		        // To use handleOverflow method
		        bubbleLegend.legendSymbol.add(bubbleLegend.legendItem);
		        bubbleLegend.legendItem.add(bubbleLegend.legendGroup);

		        bubbleLegend.hideOverlappingLabels();
		    },

		    /**
		     * Render one range, consisting of bubble symbol, connector and label.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#renderRange
		     *
		     * @param {Highcharts.LegendBubbleLegendRangesOptions} config
		     *        Range options
		     *
		     * @private
		     */
		    renderRange: function (range) {
		        var bubbleLegend = this,
		            mainRange = bubbleLegend.ranges[0],
		            legend = bubbleLegend.legend,
		            options = bubbleLegend.options,
		            labelsOptions = options.labels,
		            chart = bubbleLegend.chart,
		            renderer = chart.renderer,
		            symbols = bubbleLegend.symbols,
		            labels = symbols.labels,
		            label,
		            elementCenter = range.center,
		            absoluteRadius = Math.abs(range.radius),
		            connectorDistance = options.connectorDistance,
		            labelsAlign = labelsOptions.align,
		            rtl = legend.options.rtl,
		            fontSize = labelsOptions.style.fontSize,
		            connectorLength = rtl || labelsAlign === 'left' ?
		                -connectorDistance : connectorDistance,
		            borderWidth = options.borderWidth,
		            connectorWidth = options.connectorWidth,
		            posX = mainRange.radius,
		            posY = elementCenter - absoluteRadius - borderWidth / 2 +
		                connectorWidth / 2,
		            labelY,
		            labelX,
		            fontMetrics = bubbleLegend.fontMetrics,
		            labelMovement = fontSize / 2 - (fontMetrics.h - fontSize) / 2,
		            crispMovement = (posY % 1 ? 1 : 0.5) -
		                (connectorWidth % 2 ? 0 : 0.5),
		            styledMode = renderer.styledMode;

		        // Set options for centered labels
		        if (labelsAlign === 'center') {
		            connectorLength = 0;  // do not use connector
		            options.connectorDistance = 0;
		            range.labelStyle.align = 'center';
		        }

		        labelY = posY + options.labels.y;
		        labelX = posX + connectorLength + options.labels.x;

		        // Render bubble symbol
		        symbols.bubbleItems.push(
		            renderer
		                .circle(
		                    posX,
		                    elementCenter + crispMovement,
		                    absoluteRadius
		                )
		                .attr(
		                    styledMode ? {} : range.bubbleStyle
		                )
		                .addClass(
		                    (
		                        styledMode ?
		                            'highcharts-color-' +
		                                bubbleLegend.options.seriesIndex + ' ' :
		                            ''
		                    ) +
		                    'highcharts-bubble-legend-symbol ' +
		                    (options.className || '')
		                ).add(
		                    bubbleLegend.legendSymbol
		                )
		        );

		        // Render connector
		        symbols.connectors.push(
		            renderer
		                .path(renderer.crispLine(
		                    ['M', posX, posY, 'L', posX + connectorLength, posY],
		                     options.connectorWidth)
		                )
		                .attr(
		                    styledMode ? {} : range.connectorStyle
		                )
		                .addClass(
		                    (
		                        styledMode ?
		                            'highcharts-color-' +
		                                bubbleLegend.options.seriesIndex + ' ' :
		                            ''
		                    ) +
		                    'highcharts-bubble-legend-connectors ' +
		                    (options.connectorClassName || '')
		                ).add(
		                    bubbleLegend.legendSymbol
		                )
		        );

		        // Render label
		        label = renderer
		            .text(
		                bubbleLegend.formatLabel(range),
		                labelX,
		                labelY + labelMovement
		            )
		            .attr(
		                styledMode ? {} : range.labelStyle
		            )
		            .addClass(
		                'highcharts-bubble-legend-labels ' +
		                (options.labels.className || '')
		            ).add(
		                bubbleLegend.legendSymbol
		            );

		        labels.push(label);
		        // To enable default 'hideOverlappingLabels' method
		        label.placed = true;
		        label.alignAttr = {
		            x: labelX,
		            y: labelY + labelMovement
		        };
		    },

		    /**
		     * Get the label which takes up the most space.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#getMaxLabelSize
		     */
		    getMaxLabelSize: function () {
		        var labels = this.symbols.labels,
		            maxLabel,
		            labelSize;

		        labels.forEach(function (label) {
		            labelSize = label.getBBox(true);

		            if (maxLabel) {
		                maxLabel = labelSize.width > maxLabel.width ?
		                    labelSize : maxLabel;

		            } else {
		                maxLabel = labelSize;
		            }
		        });
		        return maxLabel || {};
		    },

		    /**
		     * Get formatted label for range.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#formatLabel
		     *
		     * @param {Highcharts.LegendBubbleLegendRangesOptions} range
		     *        Range options
		     *
		     * @return {string}
		     *         Range label text
		     */
		    formatLabel: function (range) {
		        var options = this.options,
		            formatter = options.labels.formatter,
		            format = options.labels.format;

		        return format ? H.format(format, range) :
		            formatter ? formatter.call(range) :
		            numberFormat(range.value, 1);
		    },

		    /**
		     * By using default chart 'hideOverlappingLabels' method, hide or show
		     * labels and connectors.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#hideOverlappingLabels
		     */
		    hideOverlappingLabels: function () {
		        var bubbleLegend = this,
		            chart = this.chart,
		            allowOverlap = bubbleLegend.options.labels.allowOverlap,
		            symbols = bubbleLegend.symbols;

		        if (!allowOverlap && symbols) {
		            chart.hideOverlappingLabels(symbols.labels);

		            // Hide or show connectors
		            symbols.labels.forEach(function (label, index) {
		                if (!label.newOpacity) {
		                    symbols.connectors[index].hide();
		                } else if (label.newOpacity !== label.oldOpacity) {
		                    symbols.connectors[index].show();
		                }
		            });
		        }
		    },

		    /**
		     * Calculate ranges from created series.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#getRanges
		     *
		     * @return {Array<Highcharts.LegendBubbleLegendRangesOptions>}
		     *         Array of range objects
		     */
		    getRanges: function () {
		        var bubbleLegend = this.legend.bubbleLegend,
		            series = bubbleLegend.chart.series,
		            ranges,
		            rangesOptions = bubbleLegend.options.ranges,
		            zData,
		            minZ = Number.MAX_VALUE,
		            maxZ = -Number.MAX_VALUE;

		        series.forEach(function (s) {
		            // Find the min and max Z, like in bubble series
		            if (s.isBubble && !s.ignoreSeries) {
		                zData = s.zData.filter(isNumber);

		                if (zData.length) {
		                    minZ = pick(s.options.zMin, Math.min(
		                        minZ,
		                        Math.max(
		                            arrayMin(zData),
		                            s.options.displayNegative === false ?
		                                s.options.zThreshold :
		                                -Number.MAX_VALUE
		                        )
		                    ));
		                    maxZ = pick(
		                        s.options.zMax,
		                        Math.max(maxZ, arrayMax(zData))
		                    );
		                }
		            }
		        });

		        // Set values for ranges
		        if (minZ === maxZ) {
		            // Only one range if min and max values are the same.
		            ranges = [{ value: maxZ }];
		        } else {
		            ranges = [
		                { value: minZ },
		                { value: (minZ + maxZ) / 2 },
		                { value: maxZ, autoRanges: true }
		            ];
		        }
		        // Prevent reverse order of ranges after redraw
		        if (rangesOptions.length && rangesOptions[0].radius) {
		            ranges.reverse();
		        }

		        // Merge ranges values with user options
		        ranges.forEach(function (range, i) {
		            if (rangesOptions && rangesOptions[i]) {
		                ranges[i] = merge(false, rangesOptions[i], range);
		            }
		        });

		        return ranges;
		    },

		    /**
		     * Calculate bubble legend sizes from rendered series.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#predictBubbleSizes
		     *
		     * @return {Array<number,number>}
		     *         Calculated min and max bubble sizes
		     */
		    predictBubbleSizes: function () {
		        var chart = this.chart,
		            fontMetrics = this.fontMetrics,
		            legendOptions = chart.legend.options,
		            floating = legendOptions.floating,
		            horizontal = legendOptions.layout === 'horizontal',
		            lastLineHeight = horizontal ? chart.legend.lastLineHeight : 0,
		            plotSizeX = chart.plotSizeX,
		            plotSizeY = chart.plotSizeY,
		            bubbleSeries = chart.series[this.options.seriesIndex],
		            minSize = Math.ceil(bubbleSeries.minPxSize),
		            maxPxSize = Math.ceil(bubbleSeries.maxPxSize),
		            maxSize = bubbleSeries.options.maxSize,
		            plotSize = Math.min(plotSizeY, plotSizeX),
		            calculatedSize;

		        // Calculate prediceted max size of bubble
		        if (floating || !(/%$/.test(maxSize))) {
		            calculatedSize = maxPxSize;

		        } else {
		            maxSize = parseFloat(maxSize);

		            calculatedSize = ((plotSize + lastLineHeight - fontMetrics.h / 2) *
		               maxSize / 100) / (maxSize / 100 + 1);

		           // Get maxPxSize from bubble series if calculated bubble legend
		           // size will not affect to bubbles series.
		            if (
		               (horizontal && plotSizeY - calculatedSize >=
		               plotSizeX) || (!horizontal && plotSizeX -
		               calculatedSize >= plotSizeY)
		           ) {
		                calculatedSize = maxPxSize;
		            }
		        }

		        return [minSize, Math.ceil(calculatedSize)];
		    },

		    /**
		     * Correct ranges with calculated sizes.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#updateRanges
		     *
		     * @param {number} min
		     *
		     * @param {number} max
		     */
		    updateRanges: function (min, max) {
		        var bubbleLegendOptions = this.legend.options.bubbleLegend;

		        bubbleLegendOptions.minSize = min;
		        bubbleLegendOptions.maxSize = max;
		        bubbleLegendOptions.ranges = this.getRanges();
		    },

		    /**
		     * Because of the possibility of creating another legend line, predicted
		     * bubble legend sizes may differ by a few pixels, so it is necessary to
		     * correct them.
		     *
		     * @private
		     * @function Highcharts.BubbleLegend#correctSizes
		     */
		    correctSizes: function () {
		        var legend = this.legend,
		            chart = this.chart,
		            bubbleSeries = chart.series[this.options.seriesIndex],
		            bubbleSeriesSize = bubbleSeries.maxPxSize,
		            bubbleLegendSize = this.options.maxSize;

		        if (Math.abs(Math.ceil(bubbleSeriesSize) - bubbleLegendSize) > 1) {
		            this.updateRanges(this.options.minSize, bubbleSeries.maxPxSize);
		            legend.render();
		        }
		    }
		};

		// Start the bubble legend creation process.
		addEvent(H.Legend, 'afterGetAllItems', function (e) {
		    var legend = this,
		        bubbleLegend = legend.bubbleLegend,
		        legendOptions = legend.options,
		        options = legendOptions.bubbleLegend,
		        bubbleSeriesIndex = legend.chart.getVisibleBubbleSeriesIndex();

		    // Remove unnecessary element
		    if (bubbleLegend && bubbleLegend.ranges && bubbleLegend.ranges.length) {
		        // Allow change the way of calculating ranges in update
		        if (options.ranges.length) {
		            options.autoRanges = options.ranges[0].autoRanges ? true : false;
		        }
		        // Update bubbleLegend dimensions in each redraw
		        legend.destroyItem(bubbleLegend);
		    }
		    // Create bubble legend
		    if (bubbleSeriesIndex >= 0 &&
		            legendOptions.enabled &&
		            options.enabled
		    ) {
		        options.seriesIndex = bubbleSeriesIndex;
		        legend.bubbleLegend = new H.BubbleLegend(options, legend);
		        legend.bubbleLegend.addToLegend(e.allItems);
		    }
		});

		/**
		 * Check if there is at least one visible bubble series.
		 *
		 * @private
		 * @function Highcharts.Chart#getVisibleBubbleSeriesIndex
		 *
		 * @return {number}
		 *         First visible bubble series index
		 */
		Chart.prototype.getVisibleBubbleSeriesIndex = function () {
		    var series = this.series,
		        i = 0;

		    while (i < series.length) {
		        if (
		            series[i] &&
		            series[i].isBubble &&
		            series[i].visible &&
		            series[i].zData.length
		        ) {
		            return i;
		        }
		        i++;
		    }
		    return -1;
		};

		/**
		 * Calculate height for each row in legend.
		 *
		 * @private
		 * @function Highcharts.Legend#getLinesHeights
		 *
		 * @return {Array<object>}
		 *         Informations about line height and items amount
		 */
		Legend.prototype.getLinesHeights = function () {
		    var items = this.allItems,
		        lines = [],
		        lastLine,
		        length = items.length,
		        i = 0,
		        j = 0;

		    for (i = 0; i < length; i++) {
		        if (items[i].legendItemHeight) {
		            // for bubbleLegend
		            items[i].itemHeight = items[i].legendItemHeight;
		        }
		        if (  // Line break
		            items[i] === items[length - 1] ||
		            items[i + 1] &&
		            items[i]._legendItemPos[1] !==
		            items[i + 1]._legendItemPos[1]
		        ) {
		            lines.push({ height: 0 });
		            lastLine = lines[lines.length - 1];
		            // Find the highest item in line
		            for (j; j <= i; j++) {
		                if (items[j].itemHeight > lastLine.height) {
		                    lastLine.height = items[j].itemHeight;
		                }
		            }
		            lastLine.step = i;
		        }
		    }
		    return lines;
		};

		/**
		 * Correct legend items translation in case of different elements heights.
		 *
		 * @private
		 * @function Highcharts.Legend#retranslateItems
		 *
		 * @param {Array<object>} lines
		 *        Informations about line height and items amount
		 */
		Legend.prototype.retranslateItems = function (lines) {
		    var items = this.allItems,
		        orgTranslateX,
		        orgTranslateY,
		        movementX,
		        rtl = this.options.rtl,
		        actualLine = 0;

		    items.forEach(function (item, index) {
		        orgTranslateX = item.legendGroup.translateX;
		        orgTranslateY = item._legendItemPos[1];

		        movementX = item.movementX;

		        if (movementX || (rtl && item.ranges)) {
		            movementX = rtl ? orgTranslateX - item.options.maxSize / 2 :
		            orgTranslateX + movementX;

		            item.legendGroup.attr({ translateX: movementX });
		        }
		        if (index > lines[actualLine].step) {
		            actualLine++;
		        }

		        item.legendGroup.attr({
		            translateY: Math.round(
		                orgTranslateY + lines[actualLine].height / 2
		            )
		        });
		        item._legendItemPos[1] = orgTranslateY + lines[actualLine].height / 2;
		    });
		};

		// Hide or show bubble legend depending on the visible status of bubble series.
		addEvent(Series, 'legendItemClick', function () {
		    var series = this,
		        chart = series.chart,
		        visible = series.visible,
		        legend = series.chart.legend,
		        status;

		    if (legend && legend.bubbleLegend) {
		        // Visible property is not set correctly yet, so temporary correct it
		        series.visible = !visible;
		        // Save future status for getRanges method
		        series.ignoreSeries = visible;
		        // Check if at lest one bubble series is visible
		        status = chart.getVisibleBubbleSeriesIndex() >= 0;

		        // Hide bubble legend if all bubble series are disabled
		        if (legend.bubbleLegend.visible !== status) {
		            // Show or hide bubble legend
		            legend.update({
		                bubbleLegend: { enabled: status }
		            });

		            legend.bubbleLegend.visible = status; // Restore default status
		        }
		        series.visible = visible;
		    }
		});

		// If ranges are not specified, determine ranges from rendered bubble series and
		// render legend again.
		wrap(Chart.prototype, 'drawChartBox', function (proceed, options, callback) {
		    var chart = this,
		        legend = chart.legend,
		        bubbleSeries = chart.getVisibleBubbleSeriesIndex() >= 0,
		        bubbleLegendOptions,
		        bubbleSizes;

		    if (
		        legend && legend.options.enabled && legend.bubbleLegend &&
		        legend.options.bubbleLegend.autoRanges && bubbleSeries
		    ) {
		        bubbleLegendOptions = legend.bubbleLegend.options;
		        bubbleSizes = legend.bubbleLegend.predictBubbleSizes();

		        legend.bubbleLegend.updateRanges(bubbleSizes[0], bubbleSizes[1]);
		        // Disable animation on init
		        if (!bubbleLegendOptions.placed) {
		            legend.group.placed = false;

		            legend.allItems.forEach(function (item) {
		                item.legendGroup.translateY = null;
		            });
		        }

		        // Create legend with bubbleLegend
		        legend.render();

		        chart.getMargins();

		        chart.axes.forEach(function (axis) {
		            axis.render();

		            if (!bubbleLegendOptions.placed) {
		                axis.setScale();
		                axis.updateNames();
		                // Disable axis animation on init
		                objectEach(axis.ticks, function (tick) {
		                    tick.isNew = true;
		                    tick.isNewLabel = true;
		                });
		            }
		        });
		        bubbleLegendOptions.placed = true;

		        // After recalculate axes, calculate margins again.
		        chart.getMargins();

		        // Call default 'drawChartBox' method.
		        proceed.call(chart, options, callback);

		        // Check bubble legend sizes and correct them if necessary.
		        legend.bubbleLegend.correctSizes();

		        // Correct items positions with different dimensions in legend.
		        legend.retranslateItems(legend.getLinesHeights());

		    } else {
		        proceed.call(chart, options, callback);

		        if (legend && legend.options.enabled && legend.bubbleLegend) {
		            // Allow color change after click in legend on static bubble legend
		            legend.render();
		            legend.retranslateItems(legend.getLinesHeights());
		        }
		    }
		});

	}(Highcharts));
	(function (H) {
		/* *
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var arrayMax = H.arrayMax,
		    arrayMin = H.arrayMin,
		    Axis = H.Axis,
		    color = H.color,
		    isNumber = H.isNumber,
		    noop = H.noop,
		    pick = H.pick,
		    pInt = H.pInt,
		    Point = H.Point,
		    Series = H.Series,
		    seriesType = H.seriesType,
		    seriesTypes = H.seriesTypes;


		/**
		 * A bubble series is a three dimensional series type where each point renders
		 * an X, Y and Z value. Each points is drawn as a bubble where the position
		 * along the X and Y axes mark the X and Y values, and the size of the bubble
		 * relates to the Z value. Requires `highcharts-more.js`.
		 *
		 * @sample {highcharts} highcharts/demo/bubble/
		 *         Bubble chart
		 *
		 * @extends      plotOptions.scatter
		 * @product      highcharts highstock
		 * @optionparent plotOptions.bubble
		 */
		seriesType('bubble', 'scatter', {

		    dataLabels: {
		        formatter: function () { // #2945
		            return this.point.z;
		        },
		        inside: true,
		        verticalAlign: 'middle'
		    },

		    /**
		     * If there are more points in the series than the `animationLimit`, the
		     * animation won't run. Animation affects overall performance and doesn't
		     * work well with heavy data series.
		     *
		     * @since 6.1.0
		     */
		    animationLimit: 250,

		    /**
		     * Whether to display negative sized bubbles. The threshold is given
		     * by the [zThreshold](#plotOptions.bubble.zThreshold) option, and negative
		     * bubbles can be visualized by setting
		     * [negativeColor](#plotOptions.bubble.negativeColor).
		     *
		     * @sample {highcharts} highcharts/plotoptions/bubble-negative/
		     *         Negative bubbles
		     *
		     * @type      {boolean}
		     * @default   true
		     * @since     3.0
		     * @apioption plotOptions.bubble.displayNegative
		     */

		    /**
		     * @extends   plotOptions.series.marker
		     * @excluding enabled, enabledThreshold, height, radius, width
		     */
		    marker: {

		        lineColor: null, // inherit from series.color

		        lineWidth: 1,

		        /**
		         * The fill opacity of the bubble markers.
		         */
		        fillOpacity: 0.5,

		        /**
		         * In bubble charts, the radius is overridden and determined based on
		         * the point's data value.
		         *
		         * @ignore
		         */
		        radius: null,

		        states: {
		            hover: {
		                radiusPlus: 0
		            }
		        },

		        /**
		         * A predefined shape or symbol for the marker. Possible values are
		         * "circle", "square", "diamond", "triangle" and "triangle-down".
		         *
		         * Additionally, the URL to a graphic can be given on the form
		         * `url(graphic.png)`. Note that for the image to be applied to exported
		         * charts, its URL needs to be accessible by the export server.
		         *
		         * Custom callbacks for symbol path generation can also be added to
		         * `Highcharts.SVGRenderer.prototype.symbols`. The callback is then
		         * used by its method name, as shown in the demo.
		         *
		         * @sample     {highcharts} highcharts/plotoptions/bubble-symbol/
		         *             Bubble chart with various symbols
		         * @sample     {highcharts} highcharts/plotoptions/series-marker-symbol/
		         *             General chart with predefined, graphic and custom markers
		         *
		         * @since      5.0.11
		         * @validvalue ["circle", "square", "diamond", "triangle",
		         *             "triangle-down"]
		         */
		        symbol: 'circle'

		    },

		    /**
		     * Minimum bubble size. Bubbles will automatically size between the
		     * `minSize` and `maxSize` to reflect the `z` value of each bubble.
		     * Can be either pixels (when no unit is given), or a percentage of
		     * the smallest one of the plot width and height.
		     *
		     * @sample {highcharts} highcharts/plotoptions/bubble-size/
		     *         Bubble size
		     *
		     * @type    {number|string}
		     * @since   3.0
		     * @product highcharts highstock
		     */
		    minSize: 8,

		    /**
		     * Maximum bubble size. Bubbles will automatically size between the
		     * `minSize` and `maxSize` to reflect the `z` value of each bubble.
		     * Can be either pixels (when no unit is given), or a percentage of
		     * the smallest one of the plot width and height.
		     *
		     * @sample {highcharts} highcharts/plotoptions/bubble-size/
		     *         Bubble size
		     *
		     * @type    {number|string}
		     * @since   3.0
		     * @product highcharts highstock
		     */
		    maxSize: '20%',

		    /**
		     * When a point's Z value is below the
		     * [zThreshold](#plotOptions.bubble.zThreshold) setting, this color is used.
		     *
		     * @sample {highcharts} highcharts/plotoptions/bubble-negative/
		     *         Negative bubbles
		     *
		     * @type      {Highcharts.ColorString|Highcharts.GradientColorObject}
		     * @since     3.0
		     * @product   highcharts
		     * @apioption plotOptions.bubble.negativeColor
		     */

		    /**
		     * Whether the bubble's value should be represented by the area or the
		     * width of the bubble. The default, `area`, corresponds best to the
		     * human perception of the size of each bubble.
		     *
		     * @sample {highcharts} highcharts/plotoptions/bubble-sizeby/
		     *         Comparison of area and size
		     *
		     * @type       {string}
		     * @default    area
		     * @since      3.0.7
		     * @validvalue ["area", "width"]
		     * @apioption  plotOptions.bubble.sizeBy
		     */

		    /**
		     * When this is true, the absolute value of z determines the size of
		     * the bubble. This means that with the default `zThreshold` of 0, a
		     * bubble of value -1 will have the same size as a bubble of value 1,
		     * while a bubble of value 0 will have a smaller size according to
		     * `minSize`.
		     *
		     * @sample    {highcharts} highcharts/plotoptions/bubble-sizebyabsolutevalue/
		     *            Size by absolute value, various thresholds
		     *
		     * @type      {boolean}
		     * @default   false
		     * @since     4.1.9
		     * @product   highcharts
		     * @apioption plotOptions.bubble.sizeByAbsoluteValue
		     */

		    /**
		     * When this is true, the series will not cause the Y axis to cross
		     * the zero plane (or [threshold](#plotOptions.series.threshold) option)
		     * unless the data actually crosses the plane.
		     *
		     * For example, if `softThreshold` is `false`, a series of 0, 1, 2,
		     * 3 will make the Y axis show negative values according to the `minPadding`
		     * option. If `softThreshold` is `true`, the Y axis starts at 0.
		     *
		     * @since   4.1.9
		     * @product highcharts
		     */
		    softThreshold: false,

		    states: {
		        hover: {
		            halo: {
		                size: 5
		            }
		        }
		    },

		    tooltip: {
		        pointFormat: '({point.x}, {point.y}), Size: {point.z}'
		    },

		    turboThreshold: 0,

		    /**
		     * The minimum for the Z value range. Defaults to the highest Z value
		     * in the data.
		     *
		     * @see [zMin](#plotOptions.bubble.zMin)
		     *
		     * @sample {highcharts} highcharts/plotoptions/bubble-zmin-zmax/
		     *         Z has a possible range of 0-100
		     *
		     * @type      {number}
		     * @since     4.0.3
		     * @product   highcharts
		     * @apioption plotOptions.bubble.zMax
		     */

		    /**
		     * The minimum for the Z value range. Defaults to the lowest Z value
		     * in the data.
		     *
		     * @see [zMax](#plotOptions.bubble.zMax)
		     *
		     * @sample {highcharts} highcharts/plotoptions/bubble-zmin-zmax/
		     *         Z has a possible range of 0-100
		     *
		     * @type      {number}
		     * @since     4.0.3
		     * @product   highcharts
		     * @apioption plotOptions.bubble.zMin
		     */

		    /**
		     * When [displayNegative](#plotOptions.bubble.displayNegative) is `false`,
		     * bubbles with lower Z values are skipped. When `displayNegative`
		     * is `true` and a [negativeColor](#plotOptions.bubble.negativeColor)
		     * is given, points with lower Z is colored.
		     *
		     * @sample {highcharts} highcharts/plotoptions/bubble-negative/
		     *         Negative bubbles
		     *
		     * @since   3.0
		     * @product highcharts
		     */
		    zThreshold: 0,

		    zoneAxis: 'z'

		// Prototype members
		}, {
		    pointArrayMap: ['y', 'z'],
		    parallelArrays: ['x', 'y', 'z'],
		    trackerGroups: ['group', 'dataLabelsGroup'],
		    specialGroup: 'group', // To allow clipping (#6296)
		    bubblePadding: true,
		    zoneAxis: 'z',
		    directTouch: true,
		    isBubble: true,

		    pointAttribs: function (point, state) {
		        var markerOptions = this.options.marker,
		            fillOpacity = markerOptions.fillOpacity,
		            attr = Series.prototype.pointAttribs.call(this, point, state);

		        if (fillOpacity !== 1) {
		            attr.fill = color(attr.fill).setOpacity(fillOpacity).get('rgba');
		        }

		        return attr;
		    },

		    // Get the radius for each point based on the minSize, maxSize and each
		    // point's Z value. This must be done prior to Series.translate because
		    // the axis needs to add padding in accordance with the point sizes.
		    getRadii: function (zMin, zMax, series) {
		        var len,
		            i,
		            zData = this.zData,
		            minSize = series.minPxSize,
		            maxSize = series.maxPxSize,
		            radii = [],
		            value;

		        // Set the shape type and arguments to be picked up in drawPoints
		        for (i = 0, len = zData.length; i < len; i++) {
		            value = zData[i];
		            // Separate method to get individual radius for bubbleLegend
		            radii.push(this.getRadius(zMin, zMax, minSize, maxSize, value));
		        }
		        this.radii = radii;
		    },

		    // Get the individual radius for one point.
		    getRadius: function (zMin, zMax, minSize, maxSize, value) {
		        var options = this.options,
		            sizeByArea = options.sizeBy !== 'width',
		            zThreshold = options.zThreshold,
		            pos,
		            zRange = zMax - zMin,
		            radius;

		        // When sizing by threshold, the absolute value of z determines
		        // the size of the bubble.
		        if (options.sizeByAbsoluteValue && value !== null) {
		            value = Math.abs(value - zThreshold);
		            zMax = zRange = Math.max(
		                zMax - zThreshold,
		                Math.abs(zMin - zThreshold)
		            );
		            zMin = 0;
		        }

		        if (!isNumber(value)) {
		            radius = null;
		        // Issue #4419 - if value is less than zMin, push a radius that's
		        // always smaller than the minimum size
		        } else if (value < zMin) {
		            radius = minSize / 2 - 1;
		        } else {
		            // Relative size, a number between 0 and 1
		            pos = zRange > 0 ? (value - zMin) / zRange : 0.5;

		            if (sizeByArea && pos >= 0) {
		                pos = Math.sqrt(pos);
		            }
		            radius = Math.ceil(minSize + pos * (maxSize - minSize)) / 2;
		        }
		        return radius;
		    },

		    // Perform animation on the bubbles
		    animate: function (init) {
		        if (
		            !init &&
		            this.points.length < this.options.animationLimit // #8099
		        ) {
		            this.points.forEach(function (point) {
		                var graphic = point.graphic,
		                    animationTarget;

		                if (graphic && graphic.width) { // URL symbols don't have width
		                    animationTarget = {
		                        x: graphic.x,
		                        y: graphic.y,
		                        width: graphic.width,
		                        height: graphic.height
		                    };

		                    // Start values
		                    graphic.attr({
		                        x: point.plotX,
		                        y: point.plotY,
		                        width: 1,
		                        height: 1
		                    });

		                    // Run animation
		                    graphic.animate(animationTarget, this.options.animation);
		                }
		            }, this);

		            // delete this function to allow it only once
		            this.animate = null;
		        }
		    },

		    // Extend the base translate method to handle bubble size
		    translate: function () {

		        var i,
		            data = this.data,
		            point,
		            radius,
		            radii = this.radii;

		        // Run the parent method
		        seriesTypes.scatter.prototype.translate.call(this);

		        // Set the shape type and arguments to be picked up in drawPoints
		        i = data.length;

		        while (i--) {
		            point = data[i];
		            radius = radii ? radii[i] : 0; // #1737

		            if (isNumber(radius) && radius >= this.minPxSize / 2) {
		                // Shape arguments
		                point.marker = H.extend(point.marker, {
		                    radius: radius,
		                    width: 2 * radius,
		                    height: 2 * radius
		                });

		                // Alignment box for the data label
		                point.dlBox = {
		                    x: point.plotX - radius,
		                    y: point.plotY - radius,
		                    width: 2 * radius,
		                    height: 2 * radius
		                };
		            } else { // below zThreshold
		                // #1691
		                point.shapeArgs = point.plotY = point.dlBox = undefined;
		            }
		        }
		    },

		    alignDataLabel: seriesTypes.column.prototype.alignDataLabel,
		    buildKDTree: noop,
		    applyZones: noop

		// Point class
		}, {
		    haloPath: function (size) {
		        return Point.prototype.haloPath.call(
		            this,
		            // #6067
		            size === 0 ? 0 : (this.marker ? this.marker.radius || 0 : 0) + size
		        );
		    },
		    ttBelow: false
		});

		// Add logic to pad each axis with the amount of pixels necessary to avoid the
		// bubbles to overflow.
		Axis.prototype.beforePadding = function () {
		    var axis = this,
		        axisLength = this.len,
		        chart = this.chart,
		        pxMin = 0,
		        pxMax = axisLength,
		        isXAxis = this.isXAxis,
		        dataKey = isXAxis ? 'xData' : 'yData',
		        min = this.min,
		        extremes = {},
		        smallestSize = Math.min(chart.plotWidth, chart.plotHeight),
		        zMin = Number.MAX_VALUE,
		        zMax = -Number.MAX_VALUE,
		        range = this.max - min,
		        transA = axisLength / range,
		        activeSeries = [];

		    // Handle padding on the second pass, or on redraw
		    this.series.forEach(function (series) {

		        var seriesOptions = series.options,
		            zData;

		        if (
		            series.bubblePadding &&
		            (series.visible || !chart.options.chart.ignoreHiddenSeries)
		        ) {

		            // Correction for #1673
		            axis.allowZoomOutside = true;

		            // Cache it
		            activeSeries.push(series);

		            if (isXAxis) { // because X axis is evaluated first

		                // For each series, translate the size extremes to pixel values
		                ['minSize', 'maxSize'].forEach(function (prop) {
		                    var length = seriesOptions[prop],
		                        isPercent = /%$/.test(length);

		                    length = pInt(length);
		                    extremes[prop] = isPercent ?
		                        smallestSize * length / 100 :
		                        length;

		                });
		                series.minPxSize = extremes.minSize;
		                // Prioritize min size if conflict to make sure bubbles are
		                // always visible. #5873
		                series.maxPxSize = Math.max(extremes.maxSize, extremes.minSize);

		                // Find the min and max Z
		                zData = series.zData.filter(H.isNumber);
		                if (zData.length) { // #1735
		                    zMin = pick(seriesOptions.zMin, Math.min(
		                        zMin,
		                        Math.max(
		                            arrayMin(zData),
		                            seriesOptions.displayNegative === false ?
		                                seriesOptions.zThreshold :
		                                -Number.MAX_VALUE
		                        )
		                    ));
		                    zMax = pick(
		                        seriesOptions.zMax,
		                        Math.max(zMax, arrayMax(zData))
		                    );
		                }
		            }
		        }
		    });

		    activeSeries.forEach(function (series) {

		        var data = series[dataKey],
		            i = data.length,
		            radius;

		        if (isXAxis) {
		            series.getRadii(zMin, zMax, series);
		        }

		        if (range > 0) {
		            while (i--) {
		                if (
		                    isNumber(data[i]) &&
		                    axis.dataMin <= data[i] &&
		                    data[i] <= axis.dataMax
		                ) {
		                    radius = series.radii[i];
		                    pxMin = Math.min(
		                        ((data[i] - min) * transA) - radius,
		                        pxMin
		                    );
		                    pxMax = Math.max(
		                        ((data[i] - min) * transA) + radius,
		                        pxMax
		                    );
		                }
		            }
		        }
		    });

		    // Apply the padding to the min and max properties
		    if (activeSeries.length && range > 0 && !this.isLog) {
		        pxMax -= axisLength;
		        transA *= (
		            axisLength +
		            Math.max(0, pxMin) - // #8901
		            Math.min(pxMax, axisLength)
		        ) / axisLength;
		        [['min', 'userMin', pxMin], ['max', 'userMax', pxMax]].forEach(
		            function (keys) {
		                if (pick(axis.options[keys[0]], axis[keys[1]]) === undefined) {
		                    axis[keys[0]] += keys[2] / transA;
		                }
		            }
		        );
		    }
		};


		/**
		 * A `bubble` series. If the [type](#series.bubble.type) option is
		 * not specified, it is inherited from [chart.type](#chart.type).
		 *
		 * @extends   series,plotOptions.bubble
		 * @excluding dataParser, dataURL, stack
		 * @product   highcharts highstock
		 * @apioption series.bubble
		 */

		/**
		 * An array of data points for the series. For the `bubble` series type,
		 * points can be given in the following ways:
		 *
		 * 1. An array of arrays with 3 or 2 values. In this case, the values correspond
		 *    to `x,y,z`. If the first value is a string, it is applied as the name of
		 *    the point, and the `x` value is inferred. The `x` value can also be
		 *    omitted, in which case the inner arrays should be of length 2\. Then the
		 *    `x` value is automatically calculated, either starting at 0 and
		 *    incremented by 1, or from `pointStart` and `pointInterval` given in the
		 *    series options.
		 *    ```js
		 *    data: [
		 *        [0, 1, 2],
		 *        [1, 5, 5],
		 *        [2, 0, 2]
		 *    ]
		 *    ```
		 *
		 * 2. An array of objects with named values. The following snippet shows only a
		 *    few settings, see the complete options set below. If the total number of
		 *    data points exceeds the series'
		 *    [turboThreshold](#series.bubble.turboThreshold), this option is not
		 *    available.
		 *    ```js
		 *    data: [{
		 *        x: 1,
		 *        y: 1,
		 *        z: 1,
		 *        name: "Point2",
		 *        color: "#00FF00"
		 *    }, {
		 *        x: 1,
		 *        y: 5,
		 *        z: 4,
		 *        name: "Point1",
		 *        color: "#FF00FF"
		 *    }]
		 *    ```
		 *
		 * @sample {highcharts} highcharts/series/data-array-of-arrays/
		 *         Arrays of numeric x and y
		 * @sample {highcharts} highcharts/series/data-array-of-arrays-datetime/
		 *         Arrays of datetime x and y
		 * @sample {highcharts} highcharts/series/data-array-of-name-value/
		 *         Arrays of point.name and y
		 * @sample {highcharts} highcharts/series/data-array-of-objects/
		 *         Config objects
		 *
		 * @type      {Array<Array<(number|string),number>|Array<(number|string),number,number>|*>}
		 * @extends   series.line.data
		 * @excluding marker
		 * @product   highcharts
		 * @apioption series.bubble.data
		 */

		/**
		 * The size value for each bubble. The bubbles' diameters are computed
		 * based on the `z`, and controlled by series options like `minSize`,
		 * `maxSize`, `sizeBy`, `zMin` and `zMax`.
		 *
		 * @type      {number}
		 * @product   highcharts
		 * @apioption series.bubble.data.z
		 */

		/**
		 * @excluding enabled, enabledThreshold, height, radius, width
		 * @apioption series.bubble.marker
		 */

	}(Highcharts));
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var merge = H.merge,
		    Point = H.Point,
		    seriesType = H.seriesType,
		    seriesTypes = H.seriesTypes;

		// The mapbubble series type
		if (seriesTypes.bubble) {

		    /**
		     * @private
		     * @class
		     * @name Highcharts.seriesTypes.mapbubble
		     *
		     * @augments Highcharts.Series
		     */
		    seriesType('mapbubble', 'bubble'

		    /**
		     * A map bubble series is a bubble series laid out on top of a map series,
		     * where each bubble is tied to a specific map area.
		     *
		     * @sample maps/demo/map-bubble/
		     *         Map bubble chart
		     *
		     * @extends      plotOptions.bubble
		     * @product      highmaps
		     * @optionparent plotOptions.mapbubble
		     */
		    , {

		        /**
		         * The main color of the series. This color affects both the fill and
		         * the stroke of the bubble. For enhanced control, use `marker` options.
		         *
		         * @sample {highmaps} maps/plotoptions/mapbubble-color/
		         *         Pink bubbles
		         *
		         * @type      {Highcharts.ColorString}
		         * @apioption plotOptions.mapbubble.color
		         */

		        /**
		         * Whether to display negative sized bubbles. The threshold is given
		         * by the [zThreshold](#plotOptions.mapbubble.zThreshold) option, and
		         * negative bubbles can be visualized by setting [negativeColor](
		         * #plotOptions.bubble.negativeColor).
		         *
		         * @type      {boolean}
		         * @default   true
		         * @apioption plotOptions.mapbubble.displayNegative
		         */

		        /**
		         * @sample {highmaps} maps/demo/map-bubble/
		         *         Bubble size
		         *
		         * @apioption plotOptions.mapbubble.maxSize
		         */

		        /**
		         * @sample {highmaps} maps/demo/map-bubble/
		         *         Bubble size
		         *
		         * @apioption plotOptions.mapbubble.minSize
		         */

		        /**
		         * When a point's Z value is below the
		         * [zThreshold](#plotOptions.mapbubble.zThreshold) setting, this color
		         * is used.
		         *
		         * @sample {highmaps} maps/plotoptions/mapbubble-negativecolor/
		         *         Negative color below a threshold
		         *
		         * @type      {Highcharts.ColorString}
		         * @apioption plotOptions.mapbubble.negativeColor
		         */

		        /**
		         * Whether the bubble's value should be represented by the area or the
		         * width of the bubble. The default, `area`, corresponds best to the
		         * human perception of the size of each bubble.
		         *
		         * @type       {string}
		         * @default    area
		         * @validvalue ["area", "width"]
		         * @apioption  plotOptions.mapbubble.sizeBy
		         */

		        /**
		         * When this is true, the absolute value of z determines the size of
		         * the bubble. This means that with the default `zThreshold` of 0, a
		         * bubble of value -1 will have the same size as a bubble of value 1,
		         * while a bubble of value 0 will have a smaller size according to
		         * `minSize`.
		         *
		         * @sample {highmaps} highcharts/plotoptions/bubble-sizebyabsolutevalue/
		         *         Size by absolute value, various thresholds
		         *
		         * @type      {boolean}
		         * @default   false
		         * @since     1.1.9
		         * @apioption plotOptions.mapbubble.sizeByAbsoluteValue
		         */

		        /**
		         * The minimum for the Z value range. Defaults to the highest Z value
		         * in the data.
		         *
		         * @see [zMax](#plotOptions.mapbubble.zMin)
		         *
		         * @sample {highmaps} highcharts/plotoptions/bubble-zmin-zmax/
		         *         Z has a possible range of 0-100
		         *
		         * @type      {number}
		         * @since     1.0.3
		         * @apioption plotOptions.mapbubble.zMax
		         */

		        /**
		         * The minimum for the Z value range. Defaults to the lowest Z value
		         * in the data.
		         *
		         * @see [zMax](#plotOptions.mapbubble.zMax)
		         *
		         * @sample {highmaps} highcharts/plotoptions/bubble-zmin-zmax/
		         *         Z has a possible range of 0-100
		         *
		         * @type      {number}
		         * @since     1.0.3
		         * @apioption plotOptions.mapbubble.zMin
		         */

		        /**
		         * When [displayNegative](#plotOptions.mapbubble.displayNegative) is
		         * `false`, bubbles with lower Z values are skipped. When
		         * `displayNegative` is `true` and a [negativeColor](
		         * #plotOptions.mapbubble.negativeColor) is given, points with lower Z
		         * is colored.
		         *
		         * @sample {highmaps} maps/plotoptions/mapbubble-negativecolor/
		         *         Negative color below a threshold
		         *
		         * @type      {number}
		         * @default   0
		         * @apioption plotOptions.mapbubble.zThreshold
		         */

		        animationLimit: 500,

		        tooltip: {
		            pointFormat: '{point.name}: {point.z}'
		        }

		    // Prototype members
		    }, {
		        xyFromShape: true,
		        type: 'mapbubble',
		        // If one single value is passed, it is interpreted as z
		        pointArrayMap: ['z'],
		        // Return the map area identified by the dataJoinBy option
		        getMapData: seriesTypes.map.prototype.getMapData,
		        getBox: seriesTypes.map.prototype.getBox,
		        setData: seriesTypes.map.prototype.setData

		    // Point class
		    }, {
		        applyOptions: function (options, x) {
		            var point;
		            if (
		                options &&
		                options.lat !== undefined &&
		                options.lon !== undefined
		            ) {
		                point = Point.prototype.applyOptions.call(
		                    this,
		                    merge(
		                        options,
		                        this.series.chart.fromLatLonToPoint(options)
		                    ),
		                    x
		                );
		            } else {
		                point = seriesTypes.map.prototype.pointClass.prototype
		                    .applyOptions.call(this, options, x);
		            }
		            return point;
		        },
		        isValid: function () {
		            return typeof this.z === 'number';
		        },
		        ttBelow: false
		    });
		}


		/**
		 * A `mapbubble` series. If the [type](#series.mapbubble.type) option
		 * is not specified, it is inherited from [chart.type](#chart.type).
		 *
		 * @extends   series,plotOptions.mapbubble
		 * @excluding dataParser, dataURL
		 * @product   highmaps
		 * @apioption series.mapbubble
		 */

		/**
		 * An array of data points for the series. For the `mapbubble` series
		 * type, points can be given in the following ways:
		 *
		 * 1.  An array of numerical values. In this case, the numerical values
		 * will be interpreted as `z` options. Example:
		 *
		 *  ```js
		 *  data: [0, 5, 3, 5]
		 *  ```
		 *
		 * 2.  An array of objects with named values. The following snippet shows only a
		 * few settings, see the complete options set below. If the total number of data
		 * points exceeds the series' [turboThreshold](
		 * #series.mapbubble.turboThreshold),
		 * this option is not available.
		 *
		 *  ```js
		 *     data: [{
		 *         z: 9,
		 *         name: "Point2",
		 *         color: "#00FF00"
		 *     }, {
		 *         z: 10,
		 *         name: "Point1",
		 *         color: "#FF00FF"
		 *     }]
		 *  ```
		 *
		 * @type      {Array<number|*>}
		 * @extends   series.mappoint.data
		 * @excluding labelrank, middleX, middleY, path, value, x, y, lat, lon
		 * @product   highmaps
		 * @apioption series.mapbubble.data
		 */

		/**
		 * While the `x` and `y` values of the bubble are determined by the
		 * underlying map, the `z` indicates the actual value that gives the
		 * size of the bubble.
		 *
		 * @sample {highmaps} maps/demo/map-bubble/
		 *         Bubble
		 *
		 * @type      {number}
		 * @product   highmaps
		 * @apioption series.mapbubble.data.z
		 */

		/**
		 * @excluding enabled, enabledThreshold, height, radius, width
		 * @apioption series.mapbubble.marker
		 */

	}(Highcharts));
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var colorPointMixin = H.colorPointMixin,
		    colorSeriesMixin = H.colorSeriesMixin,
		    LegendSymbolMixin = H.LegendSymbolMixin,
		    merge = H.merge,
		    noop = H.noop,
		    pick = H.pick,
		    Series = H.Series,
		    seriesType = H.seriesType,
		    seriesTypes = H.seriesTypes;

		/**
		 * @private
		 * @class
		 * @name Highcharts.seriesTypes.heatmap
		 *
		 * @augments Highcharts.Series
		 */
		seriesType('heatmap', 'scatter'

		/**
		 * A heatmap is a graphical representation of data where the individual values
		 * contained in a matrix are represented as colors.
		 *
		 * @sample highcharts/demo/heatmap/
		 *         Simple heatmap
		 * @sample highcharts/demo/heatmap-canvas/
		 *         Heavy heatmap
		 *
		 * @extends      plotOptions.scatter
		 * @excluding    animationLimit, connectEnds, connectNulls, dashStyle,
		 *               findNearestPointBy, getExtremesFromAll, linecap, lineWidth,
		 *               marker, pointInterval, pointIntervalUnit, pointRange,
		 *               pointStart, shadow, softThreshold, stacking, step,
		 *               threshold
		 * @product      highcharts highmaps
		 * @optionparent plotOptions.heatmap
		 */
		, {

		    /**
		     * Animation is disabled by default on the heatmap series.
		     */
		    animation: false,

		    /**
		     * The border width for each heat map item.
		     */
		    borderWidth: 0,

		    /**
		     * Padding between the points in the heatmap.
		     *
		     * @type      {number}
		     * @default   0
		     * @since     6.0
		     * @apioption plotOptions.heatmap.pointPadding
		     */

		    /**
		     * The main color of the series. In heat maps this color is rarely used,
		     * as we mostly use the color to denote the value of each point. Unless
		     * options are set in the [colorAxis](#colorAxis), the default value
		     * is pulled from the [options.colors](#colors) array.
		     *
		     * @type      {Highcharts.ColorString}
		     * @since     4.0
		     * @product   highcharts
		     * @apioption plotOptions.heatmap.color
		     */

		    /**
		     * The column size - how many X axis units each column in the heatmap
		     * should span.
		     *
		     * @sample {highcharts} maps/demo/heatmap/
		     *         One day
		     * @sample {highmaps} maps/demo/heatmap/
		     *         One day
		     *
		     * @type      {number}
		     * @default   1
		     * @since     4.0
		     * @product   highcharts highmaps
		     * @apioption plotOptions.heatmap.colsize
		     */

		    /**
		     * The row size - how many Y axis units each heatmap row should span.
		     *
		     * @sample {highcharts} maps/demo/heatmap/
		     *         1 by default
		     * @sample {highmaps} maps/demo/heatmap/
		     *         1 by default
		     *
		     * @type      {number}
		     * @default   1
		     * @since     4.0
		     * @product   highcharts highmaps
		     * @apioption plotOptions.heatmap.rowsize
		     */

		    /**
		     * The color applied to null points. In styled mode, a general CSS class is
		     * applied instead.
		     *
		     * @type {Highcharts.ColorString}
		     */
		    nullColor: '#f7f7f7',

		    dataLabels: {
		        formatter: function () { // #2945
		            return this.point.value;
		        },
		        inside: true,
		        verticalAlign: 'middle',
		        crop: false,
		        overflow: false,
		        padding: 0 // #3837
		    },

		    /** @ignore */
		    marker: null,

		    /**
		     * @ignore
		     */
		    pointRange: null, // dynamically set to colsize by default

		    tooltip: {
		        pointFormat: '{point.x}, {point.y}: {point.value}<br/>'
		    },

		    states: {

		        hover: {

		            /** @ignore */
		            halo: false, // #3406, halo is disabled on heatmaps by default

		            /**
		             * How much to brighten the point on interaction. Requires the main
		             * color to be defined in hex or rgb(a) format.
		             *
		             * In styled mode, the hover brightening is by default replaced with
		             * a fill-opacity set in the `.highcharts-point:hover` rule.
		             */
		            brightness: 0.2
		        }

		    }

		}, merge(colorSeriesMixin, {

		    pointArrayMap: ['y', 'value'],
		    hasPointSpecificOptions: true,
		    getExtremesFromAll: true,
		    directTouch: true,

		    /**
		     * Override the init method to add point ranges on both axes.
		     *
		     * @private
		     * @function Highcharts.seriesTypes.heatmap#init
		     */
		    init: function () {
		        var options;
		        seriesTypes.scatter.prototype.init.apply(this, arguments);

		        options = this.options;
		        // #3758, prevent resetting in setData
		        options.pointRange = pick(options.pointRange, options.colsize || 1);
		        // general point range
		        this.yAxis.axisPointRange = options.rowsize || 1;
		    },

		    /**
		     * @private
		     * @function Highcharts.seriesTypes.heatmap#translate
		     */
		    translate: function () {
		        var series = this,
		            options = series.options,
		            xAxis = series.xAxis,
		            yAxis = series.yAxis,
		            seriesPointPadding = options.pointPadding || 0,
		            between = function (x, a, b) {
		                return Math.min(Math.max(a, x), b);
		            };

		        series.generatePoints();

		        series.points.forEach(function (point) {
		            var xPad = (options.colsize || 1) / 2,
		                yPad = (options.rowsize || 1) / 2,
		                x1 = between(
		                    Math.round(
		                        xAxis.len -
		                        xAxis.translate(point.x - xPad, 0, 1, 0, 1)
		                    ),
		                    -xAxis.len, 2 * xAxis.len
		                ),
		                x2 = between(
		                    Math.round(
		                        xAxis.len -
		                        xAxis.translate(point.x + xPad, 0, 1, 0, 1)
		                    ),
		                    -xAxis.len, 2 * xAxis.len
		                ),
		                y1 = between(
		                    Math.round(yAxis.translate(point.y - yPad, 0, 1, 0, 1)),
		                    -yAxis.len, 2 * yAxis.len
		                ),
		                y2 = between(
		                    Math.round(yAxis.translate(point.y + yPad, 0, 1, 0, 1)),
		                    -yAxis.len, 2 * yAxis.len
		                ),
		                pointPadding = pick(point.pointPadding, seriesPointPadding);

		            // Set plotX and plotY for use in K-D-Tree and more
		            point.plotX = point.clientX = (x1 + x2) / 2;
		            point.plotY = (y1 + y2) / 2;

		            point.shapeType = 'rect';
		            point.shapeArgs = {
		                x: Math.min(x1, x2) + pointPadding,
		                y: Math.min(y1, y2) + pointPadding,
		                width: Math.abs(x2 - x1) - pointPadding * 2,
		                height: Math.abs(y2 - y1) - pointPadding * 2
		            };
		        });

		        series.translateColors();
		    },

		    /**
		     * @private
		     * @function Highcharts.seriesTypes.heatmap#drawPoints
		     */
		    drawPoints: function () {

		        // In styled mode, use CSS, otherwise the fill used in the style sheet
		        // will take precedence over the fill attribute.
		        var func = this.chart.styledMode ? 'css' : 'attr';

		        seriesTypes.column.prototype.drawPoints.call(this);

		        this.points.forEach(function (point) {
		            point.graphic[func](this.colorAttribs(point));
		        }, this);
		    },

		    /**
		     * @ignore
		     * @deprecated
		     * @function Highcharts.seriesTypes.heatmap#animate
		     */
		    animate: noop,

		    /**
		     * @ignore
		     * @deprecated
		     * @function Highcharts.seriesTypes.heatmap#getBox
		     */
		    getBox: noop,

		    /**
		     * @private
		     * @borrows Highcharts.LegendSymbolMixin.drawRectangle as Highcharts.seriesTypes.heatmap#drawLegendSymbol
		     */
		    drawLegendSymbol: LegendSymbolMixin.drawRectangle,

		    /**
		     * @private
		     * @borrows Highcharts.seriesTypes.column#alignDataLabel as Highcharts.seriesTypes.heatmap#alignDataLabel
		     */
		    alignDataLabel: seriesTypes.column.prototype.alignDataLabel,

		    /**
		     * @private
		     * @function Highcharts.seriesTypes.heatmap#getExtremes
		     */
		    getExtremes: function () {
		        // Get the extremes from the value data
		        Series.prototype.getExtremes.call(this, this.valueData);
		        this.valueMin = this.dataMin;
		        this.valueMax = this.dataMax;

		        // Get the extremes from the y data
		        Series.prototype.getExtremes.call(this);
		    }

		}), H.extend({

		    /**
		     * @private
		     * @function Highcharts.Point#haloPath
		     *
		     * @param {number} size
		     *
		     * @return {Highcharts.SVGPathArray}
		     */
		    haloPath: function (size) {
		        if (!size) {
		            return [];
		        }
		        var rect = this.shapeArgs;
		        return [
		            'M', rect.x - size, rect.y - size,
		            'L', rect.x - size, rect.y + rect.height + size,
		            rect.x + rect.width + size, rect.y + rect.height + size,
		            rect.x + rect.width + size, rect.y - size,
		            'Z'
		        ];
		    }
		}, colorPointMixin));

		/**
		 * A `heatmap` series. If the [type](#series.heatmap.type) option is
		 * not specified, it is inherited from [chart.type](#chart.type).
		 *
		 * @extends   series,plotOptions.heatmap
		 * @excluding dataParser, dataURL, marker, pointRange, stack
		 * @product   highcharts highmaps
		 * @apioption series.heatmap
		 */

		/**
		 * An array of data points for the series. For the `heatmap` series
		 * type, points can be given in the following ways:
		 *
		 * 1.  An array of arrays with 3 or 2 values. In this case, the values
		 * correspond to `x,y,value`. If the first value is a string, it is
		 * applied as the name of the point, and the `x` value is inferred.
		 * The `x` value can also be omitted, in which case the inner arrays
		 * should be of length 2\. Then the `x` value is automatically calculated,
		 * either starting at 0 and incremented by 1, or from `pointStart`
		 * and `pointInterval` given in the series options.
		 *
		 *  ```js
		 *     data: [
		 *         [0, 9, 7],
		 *         [1, 10, 4],
		 *         [2, 6, 3]
		 *     ]
		 *  ```
		 *
		 * 2.  An array of objects with named values. The following snippet shows only a
		 * few settings, see the complete options set below. If the total number of data
		 * points exceeds the series' [turboThreshold](#series.heatmap.turboThreshold),
		 * this option is not available.
		 *
		 *  ```js
		 *     data: [{
		 *         x: 1,
		 *         y: 3,
		 *         value: 10,
		 *         name: "Point2",
		 *         color: "#00FF00"
		 *     }, {
		 *         x: 1,
		 *         y: 7,
		 *         value: 10,
		 *         name: "Point1",
		 *         color: "#FF00FF"
		 *     }]
		 *  ```
		 *
		 * @sample {highcharts} highcharts/chart/reflow-true/
		 *         Numerical values
		 * @sample {highcharts} highcharts/series/data-array-of-arrays/
		 *         Arrays of numeric x and y
		 * @sample {highcharts} highcharts/series/data-array-of-arrays-datetime/
		 *         Arrays of datetime x and y
		 * @sample {highcharts} highcharts/series/data-array-of-name-value/
		 *         Arrays of point.name and y
		 * @sample {highcharts} highcharts/series/data-array-of-objects/
		 *         Config objects
		 *
		 * @type      {Array<Array<number>|*>}
		 * @extends   series.line.data
		 * @excluding marker
		 * @product   highcharts highmaps
		 * @apioption series.heatmap.data
		 */

		/**
		 * The color of the point. In heat maps the point color is rarely set
		 * explicitly, as we use the color to denote the `value`. Options for
		 * this are set in the [colorAxis](#colorAxis) configuration.
		 *
		 * @type      {Highcharts.ColorString}
		 * @product   highcharts highmaps
		 * @apioption series.heatmap.data.color
		 */

		/**
		 * The value of the point, resulting in a color controled by options
		 * as set in the [colorAxis](#colorAxis) configuration.
		 *
		 * @type      {number}
		 * @product   highcharts highmaps
		 * @apioption series.heatmap.data.value
		 */

		/**
		 * The x value of the point. For datetime axes,
		 * the X value is the timestamp in milliseconds since 1970.
		 *
		 * @type      {number}
		 * @product   highcharts highmaps
		 * @apioption series.heatmap.data.x
		 */

		/**
		 * The y value of the point.
		 *
		 * @type      {number}
		 * @product   highcharts highmaps
		 * @apioption series.heatmap.data.y
		 */

		/**
		 * Point padding for a single point.
		 *
		 * @sample maps/plotoptions/tilemap-pointpadding
		 *         Point padding on tiles
		 *
		 * @type      {number}
		 * @product   highcharts highmaps
		 * @apioption series.heatmap.data.pointPadding
		 */


	}(Highcharts));
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */

		/**
		 * A latitude/longitude object.
		 *
		 * @interface Highcharts.MapLatLonObject
		 *//**
		 * The latitude.
		 * @name Highcharts.MapLatLonObject#lat
		 * @type {number}
		 *//**
		 * The longitude.
		 * @name Highcharts.MapLatLonObject#lon
		 * @type {number}
		 */

		/**
		 * Result object of a map transformation.
		 *
		 * @interface Highcharts.MapCoordinateObject
		 *//**
		 * X coordinate on the map.
		 * @name Highcharts.MapCoordinateObject#x
		 * @type {number}
		 *//**
		 * Y coordinate on the map.
		 * @name Highcharts.MapCoordinateObject#y
		 * @type {number}
		 */



		var Chart = H.Chart,
		    extend = H.extend,
		    format = H.format,
		    merge = H.merge,
		    win = H.win,
		    wrap = H.wrap;

		/* *
		 * Test for point in polygon. Polygon defined as array of [x,y] points.
		 */
		function pointInPolygon(point, polygon) {
		    var i,
		        j,
		        rel1,
		        rel2,
		        c = false,
		        x = point.x,
		        y = point.y;

		    for (i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		        rel1 = polygon[i][1] > y;
		        rel2 = polygon[j][1] > y;
		        if (
		            rel1 !== rel2 &&
		            (
		                x < (polygon[j][0] -
		                    polygon[i][0]) * (y - polygon[i][1]) /
		                    (polygon[j][1] - polygon[i][1]) +
		                    polygon[i][0]
		            )
		        ) {
		            c = !c;
		        }
		    }

		    return c;
		}

		/**
		 * Highmaps only. Get point from latitude and longitude using specified
		 * transform definition.
		 *
		 * @requires module:modules/map
		 *
		 * @sample maps/series/latlon-transform/
		 *         Use specific transformation for lat/lon
		 *
		 * @function Highcharts.Chart#transformFromLatLon
		 *
		 * @param {Highcharts.MapLatLonObject} latLon
		 *        A latitude/longitude object.
		 *
		 * @param {object} transform
		 *        The transform definition to use as explained in the
		 *        {@link https://www.highcharts.com/docs/maps/latlon|documentation}.
		 *
		 * @return {Highcharts.MapCoordinateObject}
		 *         An object with `x` and `y` properties.
		 */
		Chart.prototype.transformFromLatLon = function (latLon, transform) {
		    if (win.proj4 === undefined) {
		        H.error(21, false, this);
		        return {
		            x: 0,
		            y: null
		        };
		    }

		    var projected = win.proj4(transform.crs, [latLon.lon, latLon.lat]),
		        cosAngle = transform.cosAngle ||
		            (transform.rotation && Math.cos(transform.rotation)),
		        sinAngle = transform.sinAngle ||
		            (transform.rotation && Math.sin(transform.rotation)),
		        rotated = transform.rotation ? [
		            projected[0] * cosAngle + projected[1] * sinAngle,
		            -projected[0] * sinAngle + projected[1] * cosAngle
		        ] : projected;

		    return {
		        x: (
		            (rotated[0] - (transform.xoffset || 0)) * (transform.scale || 1) +
		            (transform.xpan || 0)
		        ) * (transform.jsonres || 1) +
		        (transform.jsonmarginX || 0),
		        y: (
		            ((transform.yoffset || 0) - rotated[1]) * (transform.scale || 1) +
		            (transform.ypan || 0)
		        ) * (transform.jsonres || 1) -
		        (transform.jsonmarginY || 0)
		    };
		};

		/**
		 * Highmaps only. Get latLon from point using specified transform definition.
		 * The method returns an object with the numeric properties `lat` and `lon`.
		 *
		 * @requires module:modules/map
		 *
		 * @sample maps/series/latlon-transform/
		 *         Use specific transformation for lat/lon
		 *
		 * @function Highcharts.Chart#transformToLatLon
		 *
		 * @param {Highcharts.Point|Highcharts.MapCoordinateObject} point
		 *        A `Point` instance, or any object containing the properties `x` and
		 *        `y` with numeric values.
		 *
		 * @param {object} transform
		 *        The transform definition to use as explained in the
		 *        {@link https://www.highcharts.com/docs/maps/latlon|documentation}.
		 *
		 * @return {Highcharts.MapLatLonObject}
		 *         An object with `lat` and `lon` properties.
		 */
		Chart.prototype.transformToLatLon = function (point, transform) {
		    if (win.proj4 === undefined) {
		        H.error(21, false, this);
		        return;
		    }

		    var normalized = {
		            x: (
		                (
		                    point.x -
		                    (transform.jsonmarginX || 0)
		                ) / (transform.jsonres || 1) -
		                (transform.xpan || 0)
		            ) / (transform.scale || 1) +
		            (transform.xoffset || 0),
		            y: (
		                (
		                    -point.y - (transform.jsonmarginY || 0)
		                ) / (transform.jsonres || 1) +
		                (transform.ypan || 0)
		            ) / (transform.scale || 1) +
		            (transform.yoffset || 0)
		        },
		        cosAngle = transform.cosAngle ||
		            (transform.rotation && Math.cos(transform.rotation)),
		        sinAngle = transform.sinAngle ||
		            (transform.rotation && Math.sin(transform.rotation)),
		        // Note: Inverted sinAngle to reverse rotation direction
		        projected = win.proj4(transform.crs, 'WGS84', transform.rotation ? {
		            x: normalized.x * cosAngle + normalized.y * -sinAngle,
		            y: normalized.x * sinAngle + normalized.y * cosAngle
		        } : normalized);

		    return { lat: projected.y, lon: projected.x };
		};

		/**
		 * Highmaps only. Calculate latitude/longitude values for a point. Returns an
		 * object with the numeric properties `lat` and `lon`.
		 *
		 * @requires module:modules/map
		 *
		 * @sample maps/demo/latlon-advanced/
		 *         Advanced lat/lon demo
		 *
		 * @function Highcharts.Chart#fromPointToLatLon
		 *
		 * @param {Highcharts.Point|Highcharts.MapCoordinateObject} point
		 *        A `Point` instance or anything containing `x` and `y` properties with
		 *        numeric values.
		 *
		 * @return {Highcharts.MapLatLonObject}
		 *         An object with `lat` and `lon` properties.
		 */
		Chart.prototype.fromPointToLatLon = function (point) {
		    var transforms = this.mapTransforms,
		        transform;

		    if (!transforms) {
		        H.error(22, false, this);
		        return;
		    }

		    for (transform in transforms) {
		        if (
		            transforms.hasOwnProperty(transform) &&
		            transforms[transform].hitZone &&
		            pointInPolygon(
		                { x: point.x, y: -point.y },
		                transforms[transform].hitZone.coordinates[0]
		            )
		        ) {
		            return this.transformToLatLon(point, transforms[transform]);
		        }
		    }

		    return this.transformToLatLon(
		        point,
		        transforms['default'] // eslint-disable-line dot-notation
		    );
		};

		/**
		 * Highmaps only. Get chart coordinates from latitude/longitude. Returns an
		 * object with x and y values corresponding to the `xAxis` and `yAxis`.
		 *
		 * @requires module:modules/map
		 *
		 * @sample maps/series/latlon-to-point/
		 *         Find a point from lat/lon
		 *
		 * @function Highcharts.Chart#fromLatLonToPoint
		 *
		 * @param {Highcharts.MapLatLonObject} latLon
		 *        Coordinates.
		 *
		 * @return {Highcharts.MapCoordinateObject}
		 *         X and Y coordinates in terms of chart axis values.
		 */
		Chart.prototype.fromLatLonToPoint = function (latLon) {
		    var transforms = this.mapTransforms,
		        transform,
		        coords;

		    if (!transforms) {
		        H.error(22, false, this);
		        return {
		            x: 0,
		            y: null
		        };
		    }

		    for (transform in transforms) {
		        if (
		            transforms.hasOwnProperty(transform) &&
		            transforms[transform].hitZone
		        ) {
		            coords = this.transformFromLatLon(latLon, transforms[transform]);
		            if (pointInPolygon(
		                { x: coords.x, y: -coords.y },
		                transforms[transform].hitZone.coordinates[0]
		            )) {
		                return coords;
		            }
		        }
		    }

		    return this.transformFromLatLon(
		        latLon,
		        transforms['default'] // eslint-disable-line dot-notation
		    );
		};

		/**
		 * Highmaps only. Restructure a GeoJSON object in preparation to be read
		 * directly by the
		 * {@link https://api.highcharts.com/highmaps/plotOptions.series.mapData|series.mapData}
		 * option. The GeoJSON will be broken down to fit a specific Highcharts type,
		 * either `map`, `mapline` or `mappoint`. Meta data in GeoJSON's properties
		 * object will be copied directly over to {@link Point.properties} in Highmaps.
		 *
		 * @requires module:modules/map
		 *
		 * @sample maps/demo/geojson/
		 *         Simple areas
		 * @sample maps/demo/geojson-multiple-types/
		 *         Multiple types
		 *
		 * @function Highcharts.geojson
		 *
		 * @param {object} geojson
		 *        The GeoJSON structure to parse, represented as a JavaScript object
		 *        rather than a JSON string.
		 *
		 * @param {string} [hType=map]
		 *        The Highmaps series type to prepare for. Setting "map" will return
		 *        GeoJSON polygons and multipolygons. Setting "mapline" will return
		 *        GeoJSON linestrings and multilinestrings. Setting "mappoint" will
		 *        return GeoJSON points and multipoints.
		 *
		 * @return {Array<object>}
		 *         An object ready for the `mapData` option.
		 */
		H.geojson = function (geojson, hType, series) {
		    var mapData = [],
		        path = [],
		        polygonToPath = function (polygon) {
		            var i,
		                len = polygon.length;
		            path.push('M');
		            for (i = 0; i < len; i++) {
		                if (i === 1) {
		                    path.push('L');
		                }
		                path.push(polygon[i][0], -polygon[i][1]);
		            }
		        };

		    hType = hType || 'map';

		    geojson.features.forEach(function (feature) {

		        var geometry = feature.geometry,
		            type = geometry.type,
		            coordinates = geometry.coordinates,
		            properties = feature.properties,
		            point;

		        path = [];

		        if (hType === 'map' || hType === 'mapbubble') {
		            if (type === 'Polygon') {
		                coordinates.forEach(polygonToPath);
		                path.push('Z');

		            } else if (type === 'MultiPolygon') {
		                coordinates.forEach(function (items) {
		                    items.forEach(polygonToPath);
		                });
		                path.push('Z');
		            }

		            if (path.length) {
		                point = { path: path };
		            }

		        } else if (hType === 'mapline') {
		            if (type === 'LineString') {
		                polygonToPath(coordinates);
		            } else if (type === 'MultiLineString') {
		                coordinates.forEach(polygonToPath);
		            }

		            if (path.length) {
		                point = { path: path };
		            }

		        } else if (hType === 'mappoint') {
		            if (type === 'Point') {
		                point = {
		                    x: coordinates[0],
		                    y: -coordinates[1]
		                };
		            }
		        }
		        if (point) {
		            mapData.push(extend(point, {
		                name: properties.name || properties.NAME,

		                /**
		                 * In Highmaps, when data is loaded from GeoJSON, the GeoJSON
		                 * item's properies are copied over here.
		                 *
		                 * @requires module:modules/map
		                 * @name Highcharts.Point#properties
		                 * @type {*}
		                 */
		                properties: properties
		            }));
		        }

		    });

		    // Create a credits text that includes map source, to be picked up in
		    // Chart.addCredits
		    if (series && geojson.copyrightShort) {
		        series.chart.mapCredits = format(
		            series.chart.options.credits.mapText,
		            { geojson: geojson }
		        );
		        series.chart.mapCreditsFull = format(
		            series.chart.options.credits.mapTextFull,
		            { geojson: geojson }
		        );
		    }

		    return mapData;
		};

		// Override addCredits to include map source by default
		wrap(Chart.prototype, 'addCredits', function (proceed, credits) {

		    credits = merge(true, this.options.credits, credits);

		    // Disable credits link if map credits enabled. This to allow for in-text
		    // anchors.
		    if (this.mapCredits) {
		        credits.href = null;
		    }

		    proceed.call(this, credits);

		    // Add full map credits to hover
		    if (this.credits && this.mapCreditsFull) {
		        this.credits.attr({
		            title: this.mapCreditsFull
		        });
		    }
		});

	}(Highcharts));
	(function (H) {
		/**
		 * (c) 2010-2018 Torstein Honsi
		 *
		 * License: www.highcharts.com/license
		 */



		var Chart = H.Chart,
		    defaultOptions = H.defaultOptions,
		    extend = H.extend,
		    merge = H.merge,
		    pick = H.pick,
		    Renderer = H.Renderer,
		    SVGRenderer = H.SVGRenderer,
		    VMLRenderer = H.VMLRenderer;

		// Add language
		extend(defaultOptions.lang, {
		    zoomIn: 'Zoom in',
		    zoomOut: 'Zoom out'
		});

		// Set the default map navigation options

		/**
		 * @product      highmaps
		 * @optionparent mapNavigation
		 */
		defaultOptions.mapNavigation = {

		    /**
		     * General options for the map navigation buttons. Individual options
		     * can be given from the [mapNavigation.buttons](#mapNavigation.buttons)
		     * option set.
		     *
		     * @sample {highmaps} maps/mapnavigation/button-theme/
		     *         Theming the navigation buttons
		     */
		    buttonOptions: {

		        /**
		         * What box to align the buttons to. Possible values are `plotBox`
		         * and `spacingBox`.
		         *
		         * @validvalue ["plotBox", "spacingBox"]
		         */
		        alignTo: 'plotBox',

		        /**
		         * The alignment of the navigation buttons.
		         *
		         * @validvalue ["left", "center", "right"]
		         */
		        align: 'left',

		        /**
		         * The vertical alignment of the buttons. Individual alignment can
		         * be adjusted by each button's `y` offset.
		         *
		         * @validvalue ["top", "middle", "bottom"]
		         */
		        verticalAlign: 'top',

		        /**
		         * The X offset of the buttons relative to its `align` setting.
		         */
		        x: 0,

		        /**
		         * The width of the map navigation buttons.
		         */
		        width: 18,

		        /**
		         * The pixel height of the map navigation buttons.
		         */
		        height: 18,

		        /**
		         * Padding for the navigation buttons.
		         *
		         * @since 5.0.0
		         */
		        padding: 5,

		        /**
		         * Text styles for the map navigation buttons.
		         *
		         * @type    {Highcharts.CSSObject}
		         * @default {"fontSize": "15px", "fontWeight": "bold"}
		         */
		        style: {
		            /** @ignore */
		            fontSize: '15px',
		            /** @ignore */
		            fontWeight: 'bold'
		        },

		        /**
		         * A configuration object for the button theme. The object accepts
		         * SVG properties like `stroke-width`, `stroke` and `fill`. Tri-state
		         * button styles are supported by the `states.hover` and `states.select`
		         * objects.
		         *
		         * @sample {highmaps} maps/mapnavigation/button-theme/
		         *         Themed navigation buttons
		         *
		         * @type    {Highcharts.SVGAttributes}
		         * @default {"stroke-width": 1, "text-align": "center"}
		         */
		        theme: {
		            /** @ignore */
		            'stroke-width': 1,
		            /** @ignore */
		            'text-align': 'center'
		        }

		    },

		    /**
		     * The individual buttons for the map navigation. This usually includes
		     * the zoom in and zoom out buttons. Properties for each button is
		     * inherited from
		     * [mapNavigation.buttonOptions](#mapNavigation.buttonOptions), while
		     * individual options can be overridden. But default, the `onclick`, `text`
		     * and `y` options are individual.
		     */
		    buttons: {

		        /**
		         * Options for the zoom in button. Properties for the zoom in and zoom
		         * out buttons are inherited from
		         * [mapNavigation.buttonOptions](#mapNavigation.buttonOptions), while
		         * individual options can be overridden. By default, the `onclick`,
		         * `text` and `y` options are individual.
		         *
		         * @extends mapNavigation.buttonOptions
		         */
		        zoomIn: {

		            /**
		             * Click handler for the button.
		             *
		             * @type    {Function}
		             * @default function () { this.mapZoom(0.5); }
		             */
		            onclick: function () {
		                this.mapZoom(0.5);
		            },

		            /**
		             * The text for the button. The tooltip (title) is a language option
		             * given by [lang.zoomIn](#lang.zoomIn).
		             */
		            text: '+',

		            /**
		             * The position of the zoomIn button relative to the vertical
		             * alignment.
		             */
		            y: 0
		        },

		        /**
		         * Options for the zoom out button. Properties for the zoom in and
		         * zoom out buttons are inherited from
		         * [mapNavigation.buttonOptions](#mapNavigation.buttonOptions), while
		         * individual options can be overridden. By default, the `onclick`,
		         * `text` and `y` options are individual.
		         *
		         * @extends mapNavigation.buttonOptions
		         */
		        zoomOut: {

		            /**
		             * Click handler for the button.
		             *
		             * @type    {Function}
		             * @default function () { this.mapZoom(2); }
		             */
		            onclick: function () {
		                this.mapZoom(2);
		            },

		            /**
		             * The text for the button. The tooltip (title) is a language option
		             * given by [lang.zoomOut](#lang.zoomIn).
		             */
		            text: '-',

		            /**
		             * The position of the zoomOut button relative to the vertical
		             * alignment.
		             */
		            y: 28
		        }
		    },

		    /**
		     * Whether to enable navigation buttons. By default it inherits the
		     * [enabled](#mapNavigation.enabled) setting.
		     *
		     * @type      {boolean}
		     * @apioption mapNavigation.enableButtons
		     */

		    /**
		     * Whether to enable map navigation. The default is not to enable
		     * navigation, as many choropleth maps are simple and don't need it.
		     * Additionally, when touch zoom and mousewheel zoom is enabled, it breaks
		     * the default behaviour of these interactions in the website, and the
		     * implementer should be aware of this.
		     *
		     * Individual interactions can be enabled separately, namely buttons,
		     * multitouch zoom, double click zoom, double click zoom to element and
		     * mousewheel zoom.
		     *
		     * @type      {boolean}
		     * @default   false
		     * @apioption mapNavigation.enabled
		     */

		    /**
		     * Enables zooming in on an area on double clicking in the map. By default
		     * it inherits the [enabled](#mapNavigation.enabled) setting.
		     *
		     * @type      {boolean}
		     * @apioption mapNavigation.enableDoubleClickZoom
		     */

		    /**
		     * Whether to zoom in on an area when that area is double clicked.
		     *
		     * @sample {highmaps} maps/mapnavigation/doubleclickzoomto/
		     *         Enable double click zoom to
		     *
		     * @type      {boolean}
		     * @default   false
		     * @apioption mapNavigation.enableDoubleClickZoomTo
		     */

		    /**
		     * Enables zooming by mouse wheel. By default it inherits the [enabled](
		     * #mapNavigation.enabled) setting.
		     *
		     * @type      {boolean}
		     * @apioption mapNavigation.enableMouseWheelZoom
		     */

		    /**
		     * Whether to enable multitouch zooming. Note that if the chart covers the
		     * viewport, this prevents the user from using multitouch and touchdrag on
		     * the web page, so you should make sure the user is not trapped inside the
		     * chart. By default it inherits the [enabled](#mapNavigation.enabled)
		     * setting.
		     *
		     * @type      {boolean}
		     * @apioption mapNavigation.enableTouchZoom
		     */

		    /**
		     * Sensitivity of mouse wheel or trackpad scrolling. 1 is no sensitivity,
		     * while with 2, one mousewheel delta will zoom in 50%.
		     *
		     * @since 4.2.4
		     */
		    mouseWheelSensitivity: 1.1

		    // enabled: false,
		    // enableButtons: null, // inherit from enabled
		    // enableTouchZoom: null, // inherit from enabled
		    // enableDoubleClickZoom: null, // inherit from enabled
		    // enableDoubleClickZoomTo: false
		    // enableMouseWheelZoom: null, // inherit from enabled
		};

		/**
		 * Utility for reading SVG paths directly.
		 *
		 * @requires module:modules/map
		 *
		 * @function Highcharts.splitPath
		 *
		 * @param {string} path
		 *
		 * @return {Highcharts.SVGPathArray}
		 */
		H.splitPath = function (path) {
		    var i;

		    // Move letters apart
		    path = path.replace(/([A-Za-z])/g, ' $1 ');
		    // Trim
		    path = path.replace(/^\s*/, '').replace(/\s*$/, '');

		    // Split on spaces and commas
		    path = path.split(/[ ,]+/); // Extra comma to escape gulp.scripts task

		    // Parse numbers
		    for (i = 0; i < path.length; i++) {
		        if (!/[a-zA-Z]/.test(path[i])) {
		            path[i] = parseFloat(path[i]);
		        }
		    }
		    return path;
		};

		/**
		 * Contains all loaded map data for Highmaps.
		 *
		 * @requires module:modules/map
		 *
		 * @name Highcharts.maps
		 * @type {Highcharts.Dictionary<Highcharts.MapDataObject>}
		 */
		H.maps = {};





		// Create symbols for the zoom buttons
		function selectiveRoundedRect(
		    x,
		    y,
		    w,
		    h,
		    rTopLeft,
		    rTopRight,
		    rBottomRight,
		    rBottomLeft
		) {
		    return [
		        'M', x + rTopLeft, y,
		        // top side
		        'L', x + w - rTopRight, y,
		        // top right corner
		        'C', x + w - rTopRight / 2,
		        y, x + w,
		        y + rTopRight / 2, x + w, y + rTopRight,
		        // right side
		        'L', x + w, y + h - rBottomRight,
		        // bottom right corner
		        'C', x + w, y + h - rBottomRight / 2,
		        x + w - rBottomRight / 2, y + h,
		        x + w - rBottomRight, y + h,
		        // bottom side
		        'L', x + rBottomLeft, y + h,
		        // bottom left corner
		        'C', x + rBottomLeft / 2, y + h,
		        x, y + h - rBottomLeft / 2,
		        x, y + h - rBottomLeft,
		        // left side
		        'L', x, y + rTopLeft,
		        // top left corner
		        'C', x, y + rTopLeft / 2,
		        x + rTopLeft / 2, y,
		        x + rTopLeft, y,
		        'Z'
		    ];
		}
		SVGRenderer.prototype.symbols.topbutton = function (x, y, w, h, attr) {
		    return selectiveRoundedRect(x - 1, y - 1, w, h, attr.r, attr.r, 0, 0);
		};
		SVGRenderer.prototype.symbols.bottombutton = function (x, y, w, h, attr) {
		    return selectiveRoundedRect(x - 1, y - 1, w, h, 0, 0, attr.r, attr.r);
		};
		// The symbol callbacks are generated on the SVGRenderer object in all browsers.
		// Even VML browsers need this in order to generate shapes in export. Now share
		// them with the VMLRenderer.
		if (Renderer === VMLRenderer) {
		    ['topbutton', 'bottombutton'].forEach(function (shape) {
		        VMLRenderer.prototype.symbols[shape] =
		            SVGRenderer.prototype.symbols[shape];
		    });
		}


		/**
		 * The factory function for creating new map charts. Creates a new {@link
		 * Highcharts.Chart|Chart} object with different default options than the basic
		 * Chart.
		 *
		 * @requires module:modules/map
		 *
		 * @function Highcharts.mapChart
		 *
		 * @param {string|Highcharts.HTMLDOMElement} [renderTo]
		 *        The DOM element to render to, or its id.
		 *
		 * @param {Highcharts.Options} options
		 *        The chart options structure as described in the
		 *        [options reference](https://api.highcharts.com/highstock).
		 *
		 * @param {Highcharts.ChartCallbackFunction} [callback]
		 *        A function to execute when the chart object is finished loading and
		 *        rendering. In most cases the chart is built in one thread, but in
		 *        Internet Explorer version 8 or less the chart is sometimes
		 *        initialized before the document is ready, and in these cases the
		 *        chart object will not be finished synchronously. As a consequence,
		 *        code that relies on the newly built Chart object should always run in
		 *        the callback. Defining a
		 *        [chart.event.load](https://api.highcharts.com/highstock/chart.events.load)
		 *        handler is equivalent.
		 *
		 * @return {Highcharts.Chart}
		 *         The chart object.
		 */
		H.Map = H.mapChart = function (a, b, c) {

		    var hasRenderToArg = typeof a === 'string' || a.nodeName,
		        options = arguments[hasRenderToArg ? 1 : 0],
		        userOptions = options,
		        hiddenAxis = {
		            endOnTick: false,
		            visible: false,
		            minPadding: 0,
		            maxPadding: 0,
		            startOnTick: false
		        },
		        seriesOptions,
		        defaultCreditsOptions = H.getOptions().credits;

		    /* For visual testing
		    hiddenAxis.gridLineWidth = 1;
		    hiddenAxis.gridZIndex = 10;
		    hiddenAxis.tickPositions = undefined;
		    // */

		    // Don't merge the data
		    seriesOptions = options.series;
		    options.series = null;

		    options = merge(
		        {
		            chart: {
		                panning: 'xy',
		                type: 'map'
		            },
		            credits: {
		                mapText: pick(
		                    defaultCreditsOptions.mapText,
		                    ' \u00a9 <a href="{geojson.copyrightUrl}">' +
		                        '{geojson.copyrightShort}</a>'
		                ),
		                mapTextFull: pick(
		                    defaultCreditsOptions.mapTextFull,
		                    '{geojson.copyright}'
		                )
		            },
		            tooltip: {
		                followTouchMove: false
		            },
		            xAxis: hiddenAxis,
		            yAxis: merge(hiddenAxis, { reversed: true })
		        },
		        options, // user's options

		        { // forced options
		            chart: {
		                inverted: false,
		                alignTicks: false
		            }
		        }
		    );

		    options.series = userOptions.series = seriesOptions;


		    return hasRenderToArg ?
		        new Chart(a, options, c) :
		        new Chart(options, b);
		};

	}(Highcharts));
	return (function () {


	}());
}));