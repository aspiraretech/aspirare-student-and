'use strict';
angular.module('smartStudentApp')
    .controller('SmartTestController', function($scope, $state, $stateParams, SmartTestListFactory, $ionicHistory, $timeout, SmartTestFactory, ionicToast, $sce, LoginFactory, SmartLearningFactory, $ionicPopup) {

        $scope.test = SmartTestListFactory.selectedTest;
        $scope.prefilledAnswer = null;

        $scope.isComplete = parseInt($stateParams.isComplete);
        $scope.timeConstraintDisabled = true;
        $scope.questions = [];
        $scope.currentQuestion = null;
        $scope.currentIndex = 0;
        $scope.selectedOption = null;
        $scope.completeOption = null;
        $scope.data = {
            remarks: null
        };
        $scope.reportFlag = 0;
        $scope.icons = {
            nextIcon: "app/images/next.svg",
            previousIcon: "app/images/previous.svg"
        };

        $scope.options = [];

        $scope.getAllOptionsForQuestion = function(questionId) {
            SmartTestFactory.getAllOptionsForQuestion(questionId, LoginFactory.loggedInUser.PackageCode)
                .then(function(success) {
                    $scope.options = [];
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.options = success.data.Data;
                        $scope.selectedOption = null;
                        $scope.completeOption = null;
                        $scope.maxMarksForQuestion = Math.max.apply(Math, $scope.options.map(function(item) { return item.OptionValue; }));
                        if ($scope.isComplete) {
                            $scope.getResultsForQuestion($scope.currentQuestion.Id, LoginFactory.loggedInUser.Id);
                        } else {
                            if (parseInt($scope.test.EnableTimeConstraint)) {
                                $scope.timeConstraintDisabled = false;
                                $scope.$broadcast('timer-set-countdown-seconds', $scope.currentQuestion.TimeToSolveInSeconds);
                                $scope.$broadcast('timer-start');
                            }
                        }
                    }
                }, function(error) {
                    ionicToast.show(error.code, 'bottom', false, 2500);
                });
        };

        $scope.getResultsForQuestion = function(questionId, studentId) {
            SmartTestFactory.getResultsForQuestion(questionId, studentId)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.prefilledAnswer = success.data.Data[0].SelectedOption;
                        var selector = document.getElementsByClassName('test-option-item');
                        for (var i = 0; i < $scope.options.length; i++) {
                            selector[i].children[1].children[0].style.background = "#fff";
                            selector[i].children[1].children[0].style.color = "#444";
                            if ($scope.options[i].OptionValue == 1) {
                                selector[i].children[1].children[0].style.background = "#2ba14b";
                                selector[i].children[1].children[0].style.color = "#fff";
                            }
                        }
                    }
                }, function(error) {
                    ionicToast.show(error.code, 'bottom', false, 2500);
                });
        };

        $scope.getAllQuestionsForTest = function() {
            SmartTestFactory.getAllQuestionsForTest($scope.test.Id)
                .then(function(success) {
                    $scope.questions = [];
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.questions = success.data.Data;
                        $scope.currentQuestion = $scope.questions[0];
                        $scope.currentIndex = 0;
                        $scope.getAllOptionsForQuestion($scope.currentQuestion.Id);
                    }
                }, function(error) {
                    ionicToast.show(error.code, 'bottom', false, 2500);
                });
        };

        $scope.getAllQuestionsForTopic = function() {
            SmartLearningFactory.getAllQuestionsForTopic(SmartTestListFactory.selectedTopic.Id, true)
                .then(function(success) {
                    $scope.questions = [];
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.questions = success.data.Data;
                        $scope.currentQuestion = $scope.questions[0];
                        $scope.currentIndex = 0;
                        $scope.getAllOptionsForQuestion($scope.currentQuestion.Id);
                    }
                }, function(error) {
                    ionicToast.show(error.code, 'bottom', false, 2500);
                });
        };

        $scope.exitTest = function() {
            // $state.go('menu.smartTestList');
            $ionicHistory.goBack();
        };

        $scope.goBack = function() {
            $ionicHistory.goBack();
        };

        $scope.stopTimerAndStoreAnswer = function() {
            if ($scope.isComplete) {
                $scope.getNextQuestion();
            } else {
                if ($scope.timeConstraintDisabled) {
                    $scope.studentAnswersQuestion(0);
                } else {
                    $scope.$broadcast('timer-stop');
                }
            }
        };

        $scope.previousQuestion = function() {
            if ($scope.currentIndex - 1 >= 0) {
                $scope.currentIndex--;
                $scope.currentQuestion = $scope.questions[$scope.currentIndex];
                if ($scope.currentQuestion.QuestionForm == 'VIDEO' && typeof $scope.currentQuestion.QuestionMediaURL == 'string') {
                    $scope.currentQuestion.QuestionMediaURL = $sce.trustAsResourceUrl($scope.currentQuestion.QuestionMediaURL);
                }
                $scope.getAllOptionsForQuestion($scope.currentQuestion.Id);
            }
        };

        $scope.optionSelected = function(option, optionIndex) {
            $scope.completeOption = option;
            $scope.selectedOption = option.Id;
        };

        $scope.$on('timer-stopped', function(event, data) {
            if ($scope.reportFlag) {
                $scope.reportFlag = 0;
            } else {
                $scope.studentAnswersQuestion(data.seconds);
            }
        });

        $scope.studentAnswersQuestion = function(seconds) {
            var obj = {
                SmartTestId: $scope.test.Id,
                HasCompleted: false,
                StudentId: LoginFactory.loggedInUser.Id,
                QuestionId: $scope.currentQuestion.Id,
                SelectedOption: $scope.selectedOption,
                ResultPercentage: 0,
                TimeTakenInSeconds: ($scope.currentQuestion.TimeToSolveInSeconds - seconds)
            };
            if ($scope.completeOption != null) {
                obj.ResultPercentage = ($scope.completeOption.OptionValue / $scope.maxMarksForQuestion) * 100
            }
            if ($scope.currentIndex == $scope.questions.length - 1) {
                obj.HasCompleted = true;
            }
            SmartTestFactory.studentAnswersQuestion(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.getNextQuestion();
                    }
                }, function(error) {
                    ionicToast.show(error.code, 'bottom', false, 2500);
                });
        };

        $scope.getNextQuestion = function() {
            if ($scope.questions[$scope.currentIndex + 1] != undefined) {
                $scope.currentIndex++;
                $scope.currentQuestion = $scope.questions[$scope.currentIndex];
                if ($scope.currentQuestion.QuestionForm == 'VIDEO' && typeof $scope.currentQuestion.QuestionMediaURL == 'string') {
                    $scope.currentQuestion.QuestionMediaURL = $sce.trustAsResourceUrl($scope.currentQuestion.QuestionMediaURL);
                }
                if ($scope.currentIndex == $scope.questions.length - 1 && !$scope.isComplete) {
                    $scope.icons.nextIcon = "app/images/submit.svg"
                }
                $scope.getAllOptionsForQuestion($scope.currentQuestion.Id);
            } else {
                if (!$scope.isComplete) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Complete!',
                        template: 'You have successfully completed the quiz'
                    });
                    $state.go('menu.smartTestList');
                } else {
                    $scope.goBack();
                }
            }
        };

        $scope.reportQuestion = function() {
            $scope.reportFlag = 1;
            $scope.$broadcast('timer-stop');
            var myPopup = $ionicPopup.show({
                template: '<textarea ng-model="data.remarks" placeholder="Remarks" rows="5"></textarea>',
                title: "Enter remarks",
                scope: $scope,
                buttons: [{
                        text: 'Cancel'
                    },
                    {
                        text: '<b>Report</b>',
                        type: 'button-custom',
                        onTap: function(e) {
                            return $scope.data.remarks;
                        }
                    }
                ]
            });

            myPopup.then(function(res) {
                if (res == undefined) {
                    myPopup.close();
                    $scope.$broadcast('timer-resume');
                } else {
                    var obj = {
                        StudentId: LoginFactory.loggedInUser.Id,
                        QuestionId: $scope.currentQuestion.Id,
                        Remarks: res
                    };
                    SmartTestFactory.studentReportsQuestion(obj)
                        .then(function(success) {
                            if (success.data.Code != "S001") {
                                ionicToast.show(success.data.Message, 'bottom', false, 2500);
                            } else {
                                ionicToast.show('Question has been reported successfully!', 'bottom', false, 2500);
                                $scope.$broadcast('timer-resume');
                            }
                        }, function(error) {
                            ionicToast.show(error.code, 'bottom', false, 2500);
                        });
                }
            });
        };

        $scope.getAllQuestionsForTest();

    });