'use strict';
angular.module('smartStudentApp')
    .controller('SubjectListController', function($scope, $state, LoginFactory, SubjectStatisticsFactory, ionicToast, $stateParams, NotificationsFactory, DashboardFactory, $ionicHistory) {

        if (parseInt($stateParams.toStatistics) == 0) {
            $scope.toState = 'menu.assignments';
        } else if (parseInt($stateParams.toStatistics) == 1) {
            $scope.toState = 'menu.dashboard';
        } else if (parseInt($stateParams.toStatistics) == 3) {
            $scope.toState = 'menu.lessonPlan';
        } else {
            $scope.toState = 'menu.smartTestList';
        }

        $scope.keywords = DashboardFactory.keywords;

        $scope.getAllSubjects = function() {
            var flag = 0;
            SubjectStatisticsFactory.getAllSubjects(LoginFactory.loggedInUser.CourseId, LoginFactory.loggedInUser.BranchId, LoginFactory.loggedInUser.SemesterId, LoginFactory.loggedInUser.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.subjects = success.data.Data;
                        if (NotificationsFactory.articleId != null) {
                            for (var i = 0; i < $scope.subjects.length; i++) {
                                if ($scope.subjects[i].Id == NotificationsFactory.articleId) {
                                    flag = 1;
                                    SubjectStatisticsFactory.selected.subject = $scope.subjects[i];
                                }
                            }
                            if (!flag) {
                                ionicToast.show('The subject you are searching for has been removed!', 'bottom', false, 2500);
                            } else {
                                $scope.subjectSelected(SubjectStatisticsFactory.selected.subject);
                            }
                        }
                        if (LoginFactory.NotificationState != null && SubjectStatisticsFactory.selected.subject != null) {
                            for (var i = 0; i < $scope.subjects.length; i++) {
                                if ($scope.subjects[i].Id == SubjectStatisticsFactory.selected.subject.Id) {
                                    flag = 1;
                                    SubjectStatisticsFactory.selected.subject = $scope.subjects[i];
                                }
                            }
                            if (!flag) {
                                ionicToast.show('The subject you are searching for has been removed!', 'bottom', false, 2500);
                            } else {
                                $scope.subjectSelected(SubjectStatisticsFactory.selected.subject);
                            }
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.subjectSelected = function(subject) {
            SubjectStatisticsFactory.selected.subject = subject;
            LoginFactory.NotificationState = null;
            LoginFactory.NotificationArgs = null;
            if (parseInt($stateParams.toStatistics) == 1) {
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
            }
            $state.go($scope.toState);
        };

        $scope.getAllSubjects();

    });