'use strict';
angular.module('smartStudentApp')
    .controller('SidemenuController', function($scope, $state, LoginFactory, $rootScope, LearningReportFactory, ionicToast, $ionicPopup) {

        $rootScope.$on('userLoggedIn', function(event) {
            console.log($scope.loggedInUser);
            $scope.loggedInUser = LoginFactory.loggedInUser;
        });

        if (LoginFactory.isAuthenticated) {
            console.log($scope.loggedInUser);
            $scope.loggedInUser = LoginFactory.loggedInUser;
        }

        $scope.sayAssessments = function() {
            LearningReportFactory.selectedSubject = LearningReportFactory.saySubject;
            $state.go('menu.learningReport')
        };

        $scope.logout = function() {
            LoginFactory.logout();
            $state.go('login');
        };

        $scope.launchMeeting = function() {
            if (LoginFactory.loggedInUser.MeetingURL == null) {
                ionicToast.show('Meeting URL has not been set yet!', 'bottom', false, 2500);
            } else {
                if ($scope.loggedInUser.MeetingCredentials) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Meeting Credentials',
                        template: 'Password: ' + $scope.loggedInUser.MeetingCredentials
                    });

                    alertPopup.then(function(res) {
                        window.location.href = LoginFactory.loggedInUser.MeetingURL;
                    });
                } else {
                    window.location.href = LoginFactory.loggedInUser.MeetingURL;
                }
            }
        };
    });