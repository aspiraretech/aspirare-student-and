import * as globals from "../globals";
import * as Highcharts from "../highcharts.src";
/**
 * Adds the module to the imported Highcharts namespace.
 *
 * @param highcharts
 *        The imported Highcharts namespace to extend.
 */
export function factory(highcharts: typeof Highcharts): void;
declare module "../highcharts.src" {
    interface Axis {
        /**
         * Set predefined left+width and top+height (inverted) for yAxes. This
         * method modifies options param.
         *
         * @param axisPosition
         *        ['left', 'width', 'height', 'top'] or ['top', 'height',
         *        'width', 'left'] for an inverted chart.
         *
         * @param options
         *        Highcharts.Axis#options.
         */
        setParallelPosition(axisPosition: Array<string>, options: AxisOptions): void;
    }
    interface Chart {
        /**
         * Flag used in parallel coordinates plot to check if chart has
         * ||-coords (parallel coords).
         */
        hasParallelCoordinates: boolean;
    }
}
export default factory;
