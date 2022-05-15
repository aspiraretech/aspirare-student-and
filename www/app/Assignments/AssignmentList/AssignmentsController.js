'use strict';
angular.module('smartStudentApp')
    .controller('AssignmentsController', function($scope, $state, AssignmentFactory, ionicToast, SubjectStatisticsFactory, LoginFactory, NotificationsFactory) {

        $scope.assignments = [];
        $scope.currentYear = new Date().getFullYear();

        $scope.assignmentSelected = function(assignment) {
            AssignmentFactory.selectedAssignment = assignment;
            $state.go('menu.assignmentDetails');
        };

        $scope.getAllAssignments = function(year) {
            var flag = 0;
            $scope.assignments = [];
            AssignmentFactory.getAllAssignments(LoginFactory.loggedInUser.ClassId, LoginFactory.loggedInUser.Id, year)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.assignments = success.data.Data;
                        if (NotificationsFactory.articleId != null) {
                            for (var i = 0; i < $scope.assignments.length; i++) {
                                if ($scope.assignments[i].Id == NotificationsFactory.articleId) {
                                    flag = 1;
                                    AssignmentFactory.selectedAssignment = $scope.assignments[i];
                                }
                            }
                            if (!flag) {
                                ionicToast.show('The share you are searching for has been removed!', 'bottom', false, 2500);
                            }
                        }
                        if (AssignmentFactory.selectedAssignment != null) {
                            $state.go('menu.assignmentDetails');
                        }
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getAllAssignments($scope.currentYear);
    });