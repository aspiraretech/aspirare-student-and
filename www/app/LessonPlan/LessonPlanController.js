'use strict';
angular.module('smartStudentApp')
    .controller('LessonPlanController', function($scope, $state, SubjectStatisticsFactory, LessonPlanFactory, ionicToast, ionicDatePicker, LoginFactory, $location, $ionicScrollDelegate) {

        $scope.subject = SubjectStatisticsFactory.selected.subject;

        $scope.chapters = [];

        $scope.dateRange = {
            startDate: moment().subtract(1, 'year').toISOString(),
            endDate: moment().toISOString()
        };

        var ipObj1 = {
            callback: function(val) { //Mandatory
                $scope.dateRange.startDate = moment(val).toISOString();
                $scope.getLessonPlan();
            },
            from: new Date(2017, 0, 1), //Optional
            to: new Date(), //Optional
            inputDate: new Date(), //Optional
            mondayFirst: false, //Optional
            closeOnSelect: true, //Optional
            templateType: 'popup' //Optional
        };
        var ipObj2 = {
            callback: function(val) { //Mandatory
                $scope.dateRange.endDate = moment(val).toISOString();
                $scope.getLessonPlan();
            },
            from: new Date(2017, 0, 1), //Optional
            to: new Date(), //Optional
            inputDate: new Date(), //Optional
            mondayFirst: false, //Optional
            closeOnSelect: true, //Optional
            templateType: 'popup' //Optional
        };

        $scope.openStartDatePicker = function() {
            ionicDatePicker.openDatePicker(ipObj1);
        };
        $scope.openEndDatePicker = function() {
            ionicDatePicker.openDatePicker(ipObj2);
        };

        $scope.getLessonPlan = function() {
            var obj = {
                SubjectId: SubjectStatisticsFactory.selected.subject.Id,
                ClassId: LoginFactory.loggedInUser.ClassId,
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
                        if (LessonPlanFactory.selectedChapterIndex != null) {
                            $scope.toggleChapter($scope.chapters[LessonPlanFactory.selectedChapterIndex]);
                        }
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                })
        };

        $scope.topicSelected = function(topic, chapter, chapterIndex) {
            LessonPlanFactory.selectedTopic = topic;
            LessonPlanFactory.selectedChapter = chapter;
            LessonPlanFactory.selectedChapterIndex = chapterIndex;
            $state.go('topicDetails');
        };

        $scope.toggleChapter = function(chapter) {
            chapter.show = !chapter.show;
            for (var i = 0; i < $scope.chapters.length; i++) {
                if ($scope.chapters[i].Id != chapter.Id) {
                    $scope.chapters[i].show = false;
                }
            }
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

        $scope.takeQuiz = function(chapter) {
            LessonPlanFactory.selectedChapter = chapter;
            $state.go('menu.smartTestList');
        };

        $scope.getLessonPlan();

    });