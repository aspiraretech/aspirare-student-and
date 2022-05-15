'use strict';
angular.module('smartStudentApp')
    .controller('AnalyseSkillsController', function($scope, $state, ionicToast, DashboardFactory, $ionicModal, LearningReportFactory, LoginFactory) {

        $scope.tags = DashboardFactory.tags;
        $scope.barGraphSeries = [];
        $scope.tagsForFilter = [{
            Id: 999990,
            Name: "Basic",
            DisplayType: 0
        }, {
            Id: 999991,
            Name: "Intermediary",
            DisplayType: 0
        }, {
            Id: 999992,
            Name: "Advanced",
            DisplayType: 0
        }, {
            Id: 999993,
            Name: "Easy",
            DisplayType: 1
        }, {
            Id: 999994,
            Name: "Moderate",
            DisplayType: 1
        }, {
            Id: 999995,
            Name: "Hard",
            DisplayType: 1
        }];
        for (var i = 0; i < $scope.tags.length; i++) {
            $scope.tags[i].DisplayType = 2;
            $scope.tagsForFilter.push($scope.tags[i]);
        }
        $scope.subject = LearningReportFactory.selectedSubject;
        $scope.loggedInUser = LoginFactory.loggedInUser;
        $scope.selectedItem = 1;

        $ionicModal.fromTemplateUrl('app/AnalyseSkills/FilterPopoverTemplate.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.filterModal = modal;
        });
        $scope.openFilterModal = function() {
            $scope.filterModal.show();
            $scope.isFilterModalOpen = true;
        };
        $scope.closeFilterModal = function() {
            if ($scope.isFilterModalOpen) {
                $scope.filterModal.hide();
                $scope.isFilterModalOpen = false;
            }
        };

        $scope.searchwordItemSelected = function(value) {
            $scope.selectedItem = value;
        };

        $scope.isActive = function(value) {
            return $scope.selectedItem == value;
        };

        $scope.getStatsForTags = function(tags) {
            var iterations = 0;
            angular.forEach(tags, function(tag, tagIndex) {
                tag.Result = 0;
                var obj = {
                    StudentId: $scope.loggedInUser.Id,
                    ClassId: $scope.loggedInUser.ClassId,
                    SubjectId: $scope.subject.Id,
                    Tag: tag.Name
                };
                DashboardFactory.getSubjectStatsForPrimeKeyword(obj)
                    .then(function(success) {
                        iterations++;
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            var avg_from_exam = (success.data.Data.AverageFromExam == null) ? 0 : success.data.Data.AverageFromExam;
                            var avg_from_test = (success.data.Data.AverageFromTest == null) ? 0 : success.data.Data.AverageFromTest;
                            var avg_from_quiz = (success.data.Data.AverageFromQuiz == null) ? 0 : success.data.Data.AverageFromQuiz;
                            var overallAvg = DashboardFactory.calculateAverageWithWeightage(avg_from_test, avg_from_exam, avg_from_quiz);
                            if (overallAvg >= 0.01) {
                                tag.Result = overallAvg;
                            }
                            if (iterations == tags.length) {
                                var tagsForBarGraph = tags.filter(a => a.Result > 0.01)
                                if (tagsForBarGraph.length > 0) {
                                    $scope.barGraphSeries = tagsForBarGraph.map(a => a.Result);
                                    var chart = new Highcharts.Chart({
                                        chart: {
                                            renderTo: 'graph',
                                            type: 'column'
                                        },
                                        title: {
                                            text: 'Skill Report'
                                        },
                                        credits: {
                                            enabled: false
                                        },
                                        tooltip: {
                                            formatter: function() {
                                                var format = '<b>' + this.x + '</b>' + ': ' + Highcharts.numberFormat(this.y, 2);
                                                return format;
                                            }
                                        },
                                        xAxis: {
                                            categories: tagsForBarGraph.map(a => a.Name),
                                            crosshair: true
                                        },
                                        yAxis: {
                                            title: {
                                                text: ''
                                            }
                                        },
                                        series: [{
                                            showInLegend: false,
                                            data: $scope.barGraphSeries
                                        }]
                                    });
                                }
                            }
                        }
                    }, function(error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
            });
        };

        $scope.filtersSelected = function() {
            $scope.closeFilterModal();

            var selectedTags = [];
            for (var i = 0; i < $scope.tagsForFilter.length; i++) {
                if ($scope.tagsForFilter[i].IsSelected) {
                    selectedTags.push($scope.tagsForFilter[i]);
                }
            }
            if (selectedTags.length == 0) {
                $scope.getStatsForTags($scope.tags);
            } else {
                $scope.getStatsForTags(selectedTags);
            }
        };

        $scope.reset = function() {
            $scope.closeFilterModal();
            for (var i = 0; i < $scope.tagsForFilter.length; i++) {
                $scope.tagsForFilter[i].IsSelected = false;
            }
            $scope.getStatsForTags($scope.tags);
        };

        $scope.getStatsForTags($scope.tags);
    });