'use strict';
angular.module('smartStudentApp')
    .controller('CalendarListController', function ($scope, $state, CalendarFactory, ionicToast, LoginFactory) {

        $scope.calendarEvents = [];
        $scope.monthwiseEvents = [];

        $scope.getAllCalendarEvents = function () {
            $scope.calendarEvents = [];
            $scope.monthwiseEvents = [];
            CalendarFactory.getAllCalendarEvents(LoginFactory.loggedInUser.CollegeId)
                .then(function (success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.calendarEvents = success.data.Data;
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function (error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.canShow = function (event) {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var d = new Date(event.EventStartDate);
            d.setHours(0, 0, 0, 0);
            if (d >= today) {
                return true;
            } else {
                return false;
            }
        };

        $scope.isOneDayEvent = function (event) {
            if (new Date(event.EventStartDate).getTime() == new Date(event.EventEndDate).getTime()) {
                return true;
            } else {
                return false;
            }
        };

        $scope.getAllCalendarEvents();
    });
