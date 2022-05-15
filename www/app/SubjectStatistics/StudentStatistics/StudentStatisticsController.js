'use strict';
angular.module('smartStudentApp')
    .controller('StudentStatisticsController', function($scope, $state, ionicToast, SubjectStatisticsFactory, LoginFactory, NotificationsFactory) {

        $scope.student = LoginFactory.loggedInUser;
        $scope.subject = SubjectStatisticsFactory.selected.subject;

        $scope.marksStatistics = {};
        $scope.attendanceStatistics = {};
        $scope.graph = {
            color: "#e33e2b"
        };

        if (LoginFactory.NotificationState != null) {
            LoginFactory.NotificationState = null;
        }
        NotificationsFactory.articleId = null;
        NotificationsFactory.selectedNotification = null;

        $scope.studentAttendance = function() {
            $state.go('menu.studentAttendance');
        };

        $scope.getMarksStatistics = function() {
            SubjectStatisticsFactory.getMarksStatistics(SubjectStatisticsFactory.selected.subject.Id, LoginFactory.loggedInUser.ClassId, $scope.student.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.marksStatistics = success.data.Data;
                        if ($scope.marksStatistics.Average >= 75) {
                            $scope.graph.color = "#2ba14b";
                            $scope.message = 'Im good!';
                        } else if ($scope.marksStatistics.Average >= 50 && $scope.marksStatistics.Average < 75) {
                            $scope.graph.color = "#f1b500";
                            $scope.message = 'Im getting better';
                        } else {
                            $scope.graph.color = "#e33e2b";
                            $scope.message = 'I need some help';
                        }
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getAttendanceStatistics = function() {
            SubjectStatisticsFactory.getAttendanceStatistics(SubjectStatisticsFactory.selected.subject.Id, $scope.student.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.attendanceStatistics = success.data.Data;
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getStudentStats = function() {
            $scope.getAttendanceStatistics();
            $scope.getMarksStatistics();
        };

        $scope.getStudentStats();
    });