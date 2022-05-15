'use strict';
angular.module('smartStudentApp')
    .controller('StudentAttendanceController', function($scope, $state, SubjectStatisticsFactory, ionicToast, LoginFactory, DashboardFactory) {

        $scope.student = LoginFactory.loggedInUser;
        $scope.keywords = DashboardFactory.keywords;
        $scope.subject = SubjectStatisticsFactory.selected.subject;

        $scope.attendance = [];

        $scope.getAllAttendanceForStudent = function() {
            SubjectStatisticsFactory.getAllAttendance($scope.student.Id, SubjectStatisticsFactory.selected.subject.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.attendance = success.data.Data;
                        // $scope.monthwiseAttendance = $scope.groupDatesMonthwise($scope.attendance);
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                })
        };

        $scope.groupDatesMonthwise = function(items) {
            var groups = [
                    [],
                    [],
                    [],
                    [],
                    [],
                    [],
                    [],
                    [],
                    [],
                    [],
                    [],
                    [],
                ],
                itemGroupedByMonths = [],
                monthLabels = ["January", "February", "March",
                    "April", "May", "June",
                    "July", "August", "September",
                    "October", "November", "December"
                ];
            for (var i = 0; i < items.length; i++) {
                groups[new Date(items[i].AttendanceDate).getMonth()].push(items[i]);
            }
            for (var i = 0; i < groups.length; i++) {
                if (groups[i].length) {
                    itemGroupedByMonths.push({
                        name: monthLabels[i],
                        items: groups[i]
                    });

                }
            }
            return itemGroupedByMonths;
        };

        $scope.getAllAttendanceForStudent();

    });