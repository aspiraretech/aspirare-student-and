'use strict';
angular.module('smartStudentApp')
    .controller('SmartTestListController', function($scope, $state, LoginFactory, ionicToast, SmartTestListFactory, $ionicPopup, LessonPlanFactory, NotificationsFactory) {

        $scope.chapter = LessonPlanFactory.selectedChapter;
        NotificationsFactory.articleId = null;
        NotificationsFactory.selectedNotification = null;
        LoginFactory.NotificationState = null;
        LoginFactory.NotificationArgs = null;
        $scope.loggedInUser = LoginFactory.loggedInUser;

        $scope.smartTests = [];
        $scope.pendingTestsCount = 0;

        $scope.getAllSmartTests = function() {
            var type;
            if ($scope.chapter.Id != 0) {
                type = 1;
            } else {
                type = 2
            }
            SmartTestListFactory.getAllSmartTestsForStudent(LoginFactory.loggedInUser.BranchId, $scope.chapter.Id, LoginFactory.loggedInUser.Id, type)
                .then(function(success) {
                        $scope.smartTests = [];
                        $scope.pendingTestsCount = 0;
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            $scope.smartTests = success.data.Data;
                            for (var i = 0; i < $scope.smartTests.length; i++) {
                                if (!$scope.smartTests[i].IsComplete) {
                                    $scope.pendingTestsCount++;
                                }
                                $scope.getMetrics(i);
                            }
                        }
                    },
                    function(error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
        };

        $scope.testSelected = function(test, isComplete) {
            $scope.selectedTest = test;
            if (isComplete) {
                SmartTestListFactory.selectedSlide = 1;
                SmartTestListFactory.selectedTest = test;
                $state.go('smartTest', { isComplete: isComplete });
            } else {
                // $scope.getAllTopicsForSmartTest(test);
                if (test.Instructions != null || test.Instructions != "") {
                    var confirmPopup = $ionicPopup.show({
                        title: 'General Instructions',
                        templateUrl: 'app/SmartTestList/InstructionsTemplate.html',
                        scope: $scope,
                        buttons: [{
                                text: 'Cancel'
                            },
                            {
                                text: '<b>Proceed</b>',
                                type: 'button-custom',
                                onTap: function(e) {
                                    SmartTestListFactory.selectedSlide = 0;
                                    SmartTestListFactory.selectedTest = test;
                                    $state.go('smartTest', { isComplete: isComplete });
                                }
                            }
                        ]
                    });
                } else {
                    ionicToast.show('Test is not yet ready', 'bottom', false, 2500);
                }
            }
        };

        $scope.viewResult = function(test, isComplete) {
            SmartTestListFactory.selectedTest = test;
            $state.go('smartTest', { isComplete: isComplete });
        };

        $scope.getMetrics = function(smartTestIndex) {
            $scope.smartTests[smartTestIndex].Metrics = [];
            SmartTestListFactory.getSmartTestMetrics(LoginFactory.loggedInUser.Id, $scope.smartTests[smartTestIndex].Id)
                .then(function(success) {
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            $scope.smartTests[smartTestIndex].Metrics = success.data.Data[0];
                        }
                    },
                    function(error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
        };

        $scope.getAllSmartTests();
    });