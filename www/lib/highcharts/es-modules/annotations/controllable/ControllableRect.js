import H from '../../parts/Globals.js';
import '../../parts/Utilities.js';
import controllableMixin from './controllableMixin.js';
import ControllablePath from './ControllablePath.js';

/**
 * A controllable rect class.
 *
 * @class
 * @mixes Annotation.controllableMixin
 * @memberOf Annotation
 *
 * @param {Highcharts.Annotation} annotation an annotation instance
 * @param {Object} options a rect's options
 **/
function ControllableRect(annotation, options) {
    this.init(annotation, options);
}

/**
 * @typedef {Annotation.ControllablePath.AttrsMap}
 *          Annotation.ControllableRect.AttrsMap
 * @property {string} width=width
 * @property {string} height=height
 */

/**
 * A map object which allows to map options attributes to element attributes
 *
 * @type {Annotation.ControllableRect.AttrsMap}
 */
ControllableRect.attrsMap = H.merge(ControllablePath.attrsMap, {
    width: 'width',
    height: 'height'
});

H.merge(
    true,
    ControllableRect.prototype,
    controllableMixin, /** @lends Annotation.ControllableRect# */ {
        /**
         * @type 'rect'
         */
        type: 'rect',

        render: function (parent) {
            var attrs = this.attrsFromOptions(this.options);

            this.graphic = this.annotation.chart.renderer
                .rect(0, -9e9, 0, 0)
                .attr(attrs)
                .add(parent);

            controllableMixin.render.call(this);
        },

        redraw: function (animation) {
            var position = this.anchor(this.points[0]).absolutePosition;

            if (position) {
                this.graphic[animation ? 'animate' : 'attr']({
                    x: position.x,
                    y: position.y,
                    width: this.options.width,
                    height: this.options.height
                });
            } else {
                this.attr({
                    x: 0,
                    y: -9e9
                });
            }

            this.graphic.placed = Boolean(position);

            controllableMixin.redraw.call(this, animation);
        },

        translate: function (dx, dy) {
            this.translatePoint(dx, dy, 0);
        }
    }
);

export default ControllableRect;
