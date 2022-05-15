'use strict';

angular.module('smartStudentApp').directive("averageStarRating", function () {
    return {
        restrict: "EA",
        template: "<div class='average-rating-container'>" +
        "  <ul class='rating background' class='readonly'>" +
        "    <li ng-repeat='star in stars' class='star'>" +
        "      <i class='icon ion-android-star-outline'></i>" + //&#9733
        "    </li>" +
        "  </ul>" +
        "  <ul class='rating foreground' class='readonly' style='width:{{filledInStarsContainerWidth}}%'>" +
        "    <li ng-repeat='star in stars' class='star filled'>" +
        "      <i class='icon ion-android-star'></i>" + //&#9733
        "    </li>" +
        "  </ul>" +
        "</div>",
        scope: {
            averageRatingValue: "=ngModel",
            max: "=?", //optional: default is 5
        },
        link: function (scope, elem, attrs) {
            if (scope.max == undefined) { scope.max = 5; }
            function updateStars() {
                scope.stars = [];
                for (var i = 0; i < scope.max; i++) {
                    scope.stars.push({});
                }
                var starContainerMaxWidth = 100; //%
                scope.filledInStarsContainerWidth = (scope.averageRatingValue == undefined) ? 0 : scope.averageRatingValue;
            };
            scope.$watch("averageRatingValue", function (oldVal, newVal) {
                updateStars();
            });
        }
    };
})