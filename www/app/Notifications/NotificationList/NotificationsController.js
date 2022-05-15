'use strict';
angular.module('smartStudentApp')
    .controller('NotificationsController', function($scope, $state, ionicToast, LoginFactory, NotificationsFactory, $ionicHistory) {

        $scope.notifications = [];

        $scope.notificationSelected = function(notification) {
            NotificationsFactory.selectedNotification = notification;
            NotificationsFactory.articleId = notification.ArticleId;
            var toState = "";
            switch (notification.NotificationCode) {
                case "N001":
                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });
                    toState = "menu.assignments";
                    break;
                case "N002":
                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });
                    toState = "menu.events";
                    break;
                case "N003":
                    toState = "menu.studentDetails";
                    break;
                case "N005":
                    toState = "menu.subjectList";
                    break;
                case "N007":
                    toState = "menu.subjectList";
                    break;
                case "N008":
                    toState = "menu.studentDetails";
                    break;
                default:
                    toState = "menu.notificationDetails";
                    break;
            }
            if (notification.NotificationCode == "N005") {
                $state.go(toState, { toStatistics: 1 });
            } else if (notification.NotificationCode == "N007") {
                $state.go(toState, { toStatistics: 2 });
            } else {
                $state.go(toState);
            }
        };

        $scope.getAllNotifications = function() {
            $scope.notifications = [];
            NotificationsFactory.getAllNotifications(LoginFactory.loggedInUser.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.notifications = success.data.Data;
                        var groupedNotifications = groupBy($scope.notifications, 'CreatedAt');
                        $scope.groupedNotifications = Object.entries(groupedNotifications);
                        if (NotificationsFactory.selectedNotification != null) {
                            $scope.notificationSelected(NotificationsFactory.selectedNotification);
                        }
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        function groupBy(objectArray, property) {
            return objectArray.reduce((acc, obj) => {
                const key = moment(obj[property]).format("DD/MM/YYYY");
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(obj);
                return acc;
            }, {});
        };

        $scope.orderByDate = function(item) {
            var parts = item[0].split('/');
            var number = parseInt(parts[2] + parts[1] + parts[0]);

            return -number;
        };

        $scope.getAllNotifications();


    });