'use strict';
angular.module('smartStudentApp')
    .controller('TopicDetailsController', function($scope, $state, $ionicPopup, LearningReportFactory, LessonPlanFactory, $sce, $ionicModal, TopicDetailsFactory, ionicToast, $cordovaInAppBrowser, $ionicLoading, LoginFactory, $ionicPopover, DashboardFactory, $ionicHistory) {

        $scope.loggedInUser = LoginFactory.loggedInUser;
        $scope.topic = LessonPlanFactory.selectedTopic;
        $scope.chapter = LessonPlanFactory.selectedChapter;
        $scope.presentationURL = null;
        $scope.subTopics = [];
        $scope.questionCount = 0;
        $scope.isModal1Open = false;
        $scope.isModal2Open = false;
        $scope.keywords = DashboardFactory.keywords;
        $scope.likeStats = null;
        $scope.isVideoPlaying = false;
        $scope.data = {
            comments: ""
        };
        $scope.icons = {
            like: "app/images/like_outline.svg",
            dislike: "app/images/dislike_outline.svg"
        };
        $scope.topicRating = [1, 2, 3, 4, 5];
        $scope.rating = {
            rate: 0,
            max: 5
        };

        var options = {
            title: 'Document Viewer',
            documentView: {
                closeLabel: 'Close'
            },
            navigationView: {
                closeLabel: 'Close'
            },
            email: {
                enabled: false
            },
            print: {
                enabled: false
            },
            openWith: {
                enabled: true
            },
            bookmarks: {
                enabled: false
            },
            search: {
                enabled: false
            },
            autoClose: {
                onPause: true
            }
        };

        if (typeof $scope.topic.VideoURL == "string") {
            $scope.topic.VideoURL = $sce.trustAsResourceUrl($scope.topic.VideoURL);
        }

        $scope.smartLearning = function() {
            $state.go('smartLearning');
        };

        $scope.exitTest = function() {
            $ionicHistory.goBack();
        };

        $scope.getTopicPresentationURL = function() {
            $scope.presentationURL = [];
            TopicDetailsFactory.getTopicPresentationURL($scope.topic.Id, $scope.loggedInUser.CollegeId, $scope.loggedInUser.ClassId)
                .then(function(success) {
                    if (success.data.Code == "S001") {
                        $scope.presentationURL = success.data.Data;
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getDefaultTopicPresentationURL = function() {
            $scope.defaultPresentationURL = [];
            TopicDetailsFactory.getTopicDefaultPresentationURL($scope.chapter.Id, $scope.topic.Id)
                .then(function(success) {
                    if (success.data.Code == "S001") {
                        $scope.defaultPresentationURL = success.data.Data;
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getAllSubTopics = function() {
            $scope.subTopics = [];
            TopicDetailsFactory.subTopics = [];
            var obj = {
                TopicIds: [$scope.topic.Id],
                ClassId: $scope.loggedInUser.ClassId,
                SubjectId: LearningReportFactory.selectedSubject.Id
            };
            TopicDetailsFactory.getAllSubTopics(obj)
                .then(function(success) {
                    if (success.data.Code == "S001") {
                        $scope.subTopics = success.data.Data;
                        for (var i = 0; i < $scope.subTopics.length; i++) {
                            $scope.subTopics[i].VideoURL = $sce.trustAsResourceUrl($scope.subTopics[i].VideoURL);
                        }
                        TopicDetailsFactory.subTopics = success.data.Data;
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getQuestionCountForTopic = function() {
            TopicDetailsFactory.getQuestionCountForTopic($scope.topic.Id)
                .then(function(success) {
                    if (success.data.Code == "S001") {
                        $scope.questionCount = success.data.Data[0].NumberOfQuestions;
                    }
                }, function(error) {
                    ionicToast.show(error.code, 'bottom', false, 2500);
                });
        };

        $scope.getLikeStats = function() {
            TopicDetailsFactory.getLikeStats($scope.topic.Id)
                .then(function(success) {
                    if (success.data.Code == "S001") {
                        $scope.likeStats = success.data.Data[0];
                    }
                }, function(error) {
                    ionicToast.show(error.code, 'bottom', false, 2500);
                });
        };

        $scope.likeTopic = function(topic, flag) {
            var myPopup = $ionicPopup.show({
                templateUrl: 'app/TopicDetails/CommentsTemplate.html',
                title: "Thank you for your review!",
                scope: $scope,
                buttons: [{
                        text: 'Cancel'
                    },
                    {
                        text: '<b>Submit</b>',
                        type: 'button-custom',
                        onTap: function(e) {
                            return $scope.data.comments;
                        }
                    }
                ]
            });

            myPopup.then(function(res) {
                $scope.data.comments = "";
                if (res == undefined) {
                    myPopup.close();
                } else {
                    var obj = {
                        StudentId: LoginFactory.loggedInUser.Id,
                        ChapterId: $scope.chapter.Id,
                        TopicId: topic.Id,
                        HasLiked: flag,
                        Comments: res
                    };
                    TopicDetailsFactory.likeTopic(obj)
                        .then(function(success) {
                            if (success.data.Code == "S001") {
                                ionicToast.show('Thank you for your review', 'bottom', false, 2500);
                                $scope.data.comments = "";
                                $scope.getLikeStats();
                                $scope.getStudentLikeStatus();
                                myPopup.close();
                            }
                        }, function(error) {
                            ionicToast.show(error.code, 'bottom', false, 2500);
                        });
                }
            });

        };

        $scope.getStudentLikeStatus = function() {
            TopicDetailsFactory.getStudentLikeStatus(LoginFactory.loggedInUser.Id, $scope.topic.Id)
                .then(function(success) {
                    if (success.data.Code == "S001") {
                        if (parseInt(success.data.Data[0].HasLiked)) {
                            $scope.icons.like = "app/images/like_filled.svg";
                            $scope.icons.dislike = "app/images/dislike_outline.svg";
                        } else {
                            $scope.icons.like = "app/images/like_outline.svg";
                            $scope.icons.dislike = "app/images/dislike_filled.svg";
                        }
                    }
                }, function(error) {
                    ionicToast.show(error.code, 'bottom', false, 2500);
                });
        };

        $scope.topicRated = function() {
            var obj = {
                StudentId: LoginFactory.loggedInUser.Id,
                ChapterId: $scope.chapter.Id,
                TopicId: $scope.topic.Id,
                ClassId: LoginFactory.loggedInUser.ClassId,
                Rating: $scope.topic.Rating
            };
            DashboardFactory.studentRatesTopic(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        ionicToast.show('Thank you for your feedback', 'bottom', false, 2500);
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getTopicRating = function() {
            var obj = {
                StudentId: LoginFactory.loggedInUser.Id,
                ChapterId: $scope.chapter.Id,
                TopicId: $scope.topic.Id
            };
            TopicDetailsFactory.getStudentRatingForTopic(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.topic.Rating = success.data.Data[0].Rating;
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getTopicPresentationURL();
        $scope.getDefaultTopicPresentationURL();
        // $scope.getQuestionCountForTopic();
        $scope.getAllSubTopics();
        // $scope.getLikeStats();
        // $scope.getStudentLikeStatus();
        $scope.getTopicRating();


        //youtube code
        $scope.playVideo = function(videoURL) {
            var url = $sce.getTrustedResourceUrl(videoURL);
            if (url.indexOf('youtube') == -1) {
                window.VrView.playVideo(url);
            } else {
                // window.screen.orientation.lock('landscape');
                // var ref = cordova.InAppBrowser.open(url, '_blank', 'location=no,clearcache=yes,hideurlbar=yes,zoom=no,useWideViewPort=no,transitionstyle=fliphorizontal');
                // ref.addEventListener('exit', function() {
                //     window.screen.orientation.unlock();
                // });
                TopicDetailsFactory.selectedVideo = url;
                $state.go('video');
            }
        };

        $ionicPopover.fromTemplateUrl('app/TopicDetails/ViewTopicPresentations.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popover = popover;
        });

        $scope.openPopover = function($event) {
            $scope.popover.show($event);
        };

        $scope.closePopover = function() {
            $scope.popover.hide();
        };

        //Document viewer
        $scope.openPDF = function(url) {
            $scope.closePopover();
            var options = {
                location: 'yes',
                clearcache: 'yes',
                toolbar: 'yes'
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

        // window.screen.orientation.unlock();
    });