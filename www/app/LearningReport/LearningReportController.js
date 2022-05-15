'use strict';
angular.module('smartStudentApp')
    .controller('LearningReportController', function($scope, $state, ionicToast, LoginFactory, LearningReportFactory, $stateParams, LessonPlanFactory, SmartTestListFactory, $location, $ionicScrollDelegate, $ionicPopover) {

        $scope.chapters = [];
        $scope.completedTopics = null;
        $scope.subject = LearningReportFactory.selectedSubject;
        $scope.loggedInUser = LoginFactory.loggedInUser;

        $ionicPopover.fromTemplateUrl('app/LearningReport/FilterResultTemplate.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popover2 = popover;
        });

        $scope.openPopover2 = function($event) {
            $scope.popover2.show($event);
        };

        $scope.closePopover2 = function() {
            $scope.popover2.hide();
        };

        $scope.getLessonPlan = function() {
            var obj = {
                SubjectIds: [$scope.subject.Id],
                ClassIds: [LoginFactory.loggedInUser.ClassId],
                DateRange: {
                    startDate: moment().subtract(1, 'year').toISOString(),
                    endDate: moment().toISOString()
                }
            };
            LessonPlanFactory.getLessonPlan(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.chapters = success.data.Data;
                        $scope.chaptersToShow = angular.copy($scope.chapters);
                        $scope.getTopicsForClass();
                        if (LessonPlanFactory.selectedChapterIndex != null) {
                            $scope.toggleChapter($scope.chapters[LessonPlanFactory.selectedChapterIndex]);
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                })
        };

        $scope.getTopicsForClass = function() {
            LearningReportFactory.getTopicsForStudent(LoginFactory.loggedInUser.Id, $scope.subject.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.completedTopics = success.data.Data;
                        if ($scope.completedTopics[0].TopicId != null) {
                            var chapterScore = 0,
                                topicsCompleted = 0;
                            for (var i = 0; i < $scope.chapters.length; i++) {
                                chapterScore = 0;
                                topicsCompleted = 0;
                                for (var j = 0; j < $scope.chapters[i].Topics.length; j++) {
                                    $scope.chapters[i].Topics[j].IsCompleted = false;
                                    for (var k = 0; k < $scope.completedTopics.length; k++) {
                                        if ($scope.chapters[i].Topics[j].Id == $scope.completedTopics[k].TopicId) {
                                            if ($scope.completedTopics[k].TopicAverage == null && $scope.completedTopics[k].TopicTestAverage == null) {
                                                $scope.chapters[i].Topics[j].TopicAverage = null;
                                            } else {
                                                $scope.chapters[i].Topics[j].IsCompleted = true;
                                                if ($scope.completedTopics[k].TopicAverage == null) {
                                                    $scope.chapters[i].Topics[j].TopicAverage = $scope.completedTopics[k].TopicTestAverage;
                                                } else {
                                                    $scope.chapters[i].Topics[j].TopicAverage = $scope.completedTopics[k].TopicAverage;
                                                }
                                                topicsCompleted++;
                                            }
                                        }
                                    }
                                    if ($scope.chapters[i].Topics[j].TopicAverage != null) {
                                        chapterScore += parseFloat($scope.chapters[i].Topics[j].TopicAverage);
                                    }
                                }
                                if (topicsCompleted) {
                                    $scope.chapters[i].ChapterAverage = chapterScore / topicsCompleted;
                                } else {
                                    $scope.chapters[i].ChapterAverage = null;
                                }
                            }
                        }
                    }
                    $scope.chaptersToShow = angular.copy($scope.chapters);
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                })
        };

        $scope.toggleChapter = function(chapter) {
            var currentStatus = chapter.show;
            for (var i = 0; i < $scope.chaptersToShow.length; i++) {
                $scope.chaptersToShow[i].show = false;
            }
            chapter.show = !currentStatus;
            if (LessonPlanFactory.selectedChapterIndex != null) {
                LessonPlanFactory.selectedChapterIndex = null;
                $scope.scrollTo(chapter);
            }
        };

        $scope.isChapterShown = function(chapter) {
            return chapter.show;
        };

        $scope.scrollTo = function(chapter) {
            $location.hash('item' + chapter.Id);
            $ionicScrollDelegate.anchorScroll(true);
        };

        $scope.takeQuiz = function(chapter, chapterIndex) {
            LessonPlanFactory.selectedChapter = chapter;
            LessonPlanFactory.selectedChapterIndex = chapterIndex;
            $state.go('menu.smartTestList');
        };

        $scope.topicSelected = function(topic, chapter, chapterIndex) {
            if ($scope.loggedInUser.PackageCode != "EXTENDED") {
                LessonPlanFactory.selectedTopic = topic;
                LessonPlanFactory.selectedChapter = chapter;
                LessonPlanFactory.selectedChapterIndex = chapterIndex;
                $state.go('topicDetails');
            }
        };

        $scope.filterSelected = function(value) {
            $scope.closePopover2();
            if (value == 1) {
                var chaps = [];
                angular.forEach($scope.chapters, function(chapter) {
                    var chap = angular.copy(chapter);
                    chap.Topics = [];
                    angular.forEach(chapter.Topics, function(topic) {
                        if (topic.TopicAverage < 50) {
                            chap.Topics.push(topic);
                        }
                    });
                    if (chap.Topics.length > 0) {
                        chaps.push(chap);
                    }
                });
                $scope.chaptersToShow = chaps;
            } else if (value == 2) {
                var chaps = [];
                angular.forEach($scope.chapters, function(chapter) {
                    var chap = angular.copy(chapter);
                    chap.Topics = [];
                    angular.forEach(chapter.Topics, function(topic) {
                        if (topic.TopicAverage < 75 && topic.TopicAverage >= 50) {
                            chap.Topics.push(topic);
                        }
                    });
                    if (chap.Topics.length > 0) {
                        chaps.push(chap);
                    }
                });
                $scope.chaptersToShow = chaps;
            } else if (value == 3) {
                var chaps = [];
                angular.forEach($scope.chapters, function(chapter) {
                    var chap = angular.copy(chapter);
                    chap.Topics = [];
                    angular.forEach(chapter.Topics, function(topic) {
                        if (topic.TopicAverage >= 75) {
                            chap.Topics.push(topic);
                        }
                    });
                    if (chap.Topics.length > 0) {
                        chaps.push(chap);
                    }
                });
                $scope.chaptersToShow = chaps;
            } else {
                $scope.chaptersToShow = angular.copy($scope.chapters);
            }
        };

        $scope.getLessonPlan();
    });