'use strict';
angular.module('smartStudentApp')
    .controller('UpgradeSkillsController', function($scope, $state, ionicToast, DashboardFactory, LearningReportFactory, LoginFactory, UpgradeSkillsFactory, LessonPlanFactory, SmartTestListFactory, $ionicPopup) {

        $scope.subject = LearningReportFactory.selectedSubject;
        $scope.skill = DashboardFactory.selectedSkill;
        $scope.testQuestions = [];
        $scope.smartTests = [];

        $scope.options = {
            initialSlide: 0,
            onInit: function(swiper) {
                $scope.swiper = swiper;
            },
            onSlideChangeEnd: function(swiper) {
                if (swiper.activeIndex == 0) {
                    $scope.getAllTestQuestionsForSkill();
                } else {
                    $scope.getAllQuizzesForSkill();
                }
            }
        };

        $scope.getAllQuizzesForSkill = function() {
            $scope.smartTests = [];
            var obj = {
                SubjectId: $scope.subject.Id,
                StudentId: LoginFactory.loggedInUser.Id,
                SkillName: $scope.skill.Name
            };
            UpgradeSkillsFactory.getQuizzesForSkill(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.smartTests = success.data.Data;
                        for (var i = 0; i < $scope.smartTests.length; i++) {
                            $scope.getMetrics(i);
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
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

        $scope.getAllTestQuestionsForSkill = function() {
            $scope.testQuestions = [];
            var obj = {
                SubjectId: $scope.subject.Id,
                SkillName: $scope.skill.Name
            };
            UpgradeSkillsFactory.getQuestionsForSkill(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.testQuestions = success.data.Data;
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.questionSelected = function(question) {
            LessonPlanFactory.selectedTopic = { Id: question.TopicId, Name: question.Name };
            LessonPlanFactory.selectedChapter = { Id: question.ChapterId };
            $state.go('topicDetails');
        };

        $scope.testSelected = function(test, isComplete) {
            $scope.selectedTest = test;
            if (isComplete) {
                // SmartTestListFactory.selectedSlide = 1;
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

        $scope.getAllTestQuestionsForSkill();
    });