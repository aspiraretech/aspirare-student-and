'use strict';
angular.module('smartStudentApp')
    .controller('PersonalMessageController', function($scope, $state, PersonalMessageFactory, ionicToast, LoginFactory, $ionicScrollDelegate, $cordovaInAppBrowser) {

        $scope.messages = [];
        $scope.loggedInUser = LoginFactory.loggedInUser;

        $scope.newMessage = {
            StudentId: LoginFactory.loggedInUser.Id,
            UserId: null,
            Message: ""
        };

        $scope.sendMessage = function() {
            if ($scope.newMessage.Message != "") {
                PersonalMessageFactory.sendMessage($scope.newMessage)
                    .then(function(success) {
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            $scope.newMessage.Message = "";
                            $scope.getAllMessages();
                        }
                    }, function(error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
            }
        };

        $scope.getAllMessages = function() {
            PersonalMessageFactory.getAllMessages(LoginFactory.loggedInUser.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.messages = success.data.Data;
                        for (var i = 0; i < $scope.messages.length; i++) {
                            var str = $scope.messages[i].Message;
                            var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
                            var result = str.replace(urlRegEx, "<a ng-click=\"launchExternalLink('$1')\">$1</a>");
                            $scope.messages[i].MessageToShow = result;
                        }
                        $ionicScrollDelegate.scrollBottom(true);
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.launchExternalLink = function(url) {
            var options = {
                location: 'yes',
                clearcache: 'yes',
                toolbar: 'yes',
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

        $scope.getAllMessages();
    });