'use strict';
angular.module('smartStudentApp')
    .controller('SmartLearningController', function($scope, $state, LessonPlanFactory, $ionicHistory, $timeout, SmartLearningFactory, ionicToast, $sce, $ionicModal, $ionicSlideBoxDelegate, TopicDetailsFactory, $cordovaInAppBrowser, LoginFactory) {

        $scope.topic = LessonPlanFactory.selectedTopic;
        $scope.presentationURL = TopicDetailsFactory.presentationURL;
        $scope.subTopics = TopicDetailsFactory.subTopics;

        $scope.questions = [];
        $scope.currentQuestion = null;
        $scope.currentIndex = 0;

        $scope.options = [];

        $scope.getAllOptionsForQuestion = function(questionId) {
            SmartLearningFactory.getAllOptionsForQuestion(questionId, LoginFactory.loggedInUser.PackageCode)
                .then(function(success) {
                    $scope.options = [];
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.options = success.data.Data;
                    }
                }, function(error) {
                    ionicToast.show(error.code, 'bottom', false, 2500);
                });
        };

        $scope.getAllQuestionsForTopic = function() {
            SmartLearningFactory.getAllQuestionsForTopic($scope.topic.Id, false)
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
            $state.go('topicDetails');
        };

        $scope.nextQuestion = function() {
            if ($scope.questions[$scope.currentIndex + 1] != undefined) {
                $scope.currentIndex++;
                $scope.currentQuestion = $scope.questions[$scope.currentIndex];
                if ($scope.currentQuestion.QuestionForm == 'VIDEO' && typeof $scope.currentQuestion.QuestionMediaURL == 'string') {
                    $scope.currentQuestion.QuestionMediaURL = $sce.trustAsResourceUrl($scope.currentQuestion.QuestionMediaURL);
                }
                $scope.getAllOptionsForQuestion($scope.currentQuestion.Id);
            } else {
                ionicToast.show('You have successfully completed all the questions!', 'bottom', false, 2500);
                $state.go('topicDetails');
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
            var selector = document.getElementsByClassName('option-item');
            for (var i = 0; i < $scope.options.length; i++) {
                selector[i].children[1].children[0].style.background = "#fff";
                selector[i].children[1].children[0].style.color = "#444";
                if ($scope.options[i].OptionValue == 1) {
                    selector[i].children[1].children[0].style.background = "#2ba14b";
                    selector[i].children[1].children[0].style.color = "#fff";
                }
            }
            if (option.OptionValue != 1) {
                selector[optionIndex].children[1].children[0].style.background = "#e33e2b";
                selector[optionIndex].children[1].children[0].style.color = "#fff";
            }
        };

        $ionicModal.fromTemplateUrl('app/SmartLearning/SubTopicsModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal1 = modal;
        });
        $scope.openModal1 = function() {
            $scope.modal1.show();
            $scope.isModal1Open = true;
        };
        $scope.closeModal1 = function() {
            if ($scope.isModal1Open) {
                $scope.modal1.hide();
                $scope.isModal1Open = false;
            }
        };
        // Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modal1.remove();
        });

        $scope.playVideo = function(videoURL) {
            $scope.closeModal1();
            player.loadVideoByUrl($sce.getTrustedResourceUrl(videoURL));
        };

        $scope.getAllQuestionsForTopic();

        document.addEventListener("fullscreenchange", function() {
            if (!document.fullscreenElement) {
                player.stopVideo();
                $scope.openModal1();
            }
        }, false);

        document.addEventListener("msfullscreenchange", function() {
            if (!document.msFullscreenElement) {
                player.stopVideo();
                $scope.openModal1();
            }
        }, false);

        document.addEventListener("mozfullscreenchange", function() {
            if (!document.mozFullScreen) {
                player.stopVideo();
                $scope.openModal1();
            }
        }, false);

        document.addEventListener("webkitfullscreenchange", function() {
            if (!document.webkitIsFullScreen) {
                player.stopVideo();
                $scope.openModal1();
            }
        }, false);

        var player = new YT.Player('slplayer', {
            height: '0',
            width: '0',
            playerVars: {
                'showinfo': 0,
                'rel': 0
            },
            events: {
                'onStateChange': onPlayerStateChange
            }
        });

        function fullScreen() {
            var e = document.getElementById("slplayer");
            if (e.requestFullscreen) {
                e.requestFullscreen();
            } else if (e.webkitRequestFullscreen) {
                e.webkitRequestFullscreen();
            } else if (e.mozRequestFullScreen) {
                e.mozRequestFullScreen();
            } else if (e.msRequestFullscreen) {
                e.msRequestFullscreen();
            }
        }

        function onPlayerStateChange(event) {
            switch (event.data) {
                case -1:
                    fullScreen();
                    break;
                default:
                    break;
            }
        }

        function stopVideo() {
            player.stopVideo();
        }

        //document viewer
        $scope.openPDF = function(url) {
            var options = {
                location: 'no',
                clearcache: 'yes',
                toolbar: 'yes',
                closebuttoncaption: 'Done',
                shouldPauseOnSuspend: 'yes'
            };
            $cordovaInAppBrowser.open(url, '_blank', options)
                .then(function(event) {
                    // success
                    console.log(event);
                })
                .catch(function(event) {
                    // error
                    console.log(event);
                });
        };
    });