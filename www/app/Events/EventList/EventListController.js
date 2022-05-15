'use strict';
angular.module('smartStudentApp')
    .controller('EventListController', function($scope, $state, EventsFactory, ionicToast, LoginFactory, NotificationsFactory, $ionicPopover) {

        $scope.events = [];
        $scope.years = [];
        $scope.currentYear = new Date().getFullYear();

        $scope.eventSelected = function(event) {
            EventsFactory.selectedEvent = event;
            $state.go('menu.eventDetails');
        };

        $scope.getAllEvents = function(year) {
            var flag = 0;
            EventsFactory.getAllEvents(LoginFactory.loggedInUser.CollegeId, year)
                .then(function(success) {
                    $scope.events = [];
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.events = success.data.Data;
                        if (NotificationsFactory.articleId != null) {
                            for (var i = 0; i < $scope.events.length; i++) {
                                if ($scope.events[i].Id == NotificationsFactory.articleId) {
                                    flag = 1;
                                    EventsFactory.selectedEvent = $scope.events[i];
                                }
                            }
                            if (!flag) {
                                ionicToast.show('The event you are searching for has been removed!', 'bottom', false, 2500);
                            }
                        }
                        if (EventsFactory.selectedEvent != null) {
                            $state.go('menu.eventDetails');
                        }
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getAllEvents($scope.currentYear);
    });