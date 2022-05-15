'use strict';
angular.module('smartStudentApp')
    .controller('NotificationDetailsController', function($scope, $state, NotificationsFactory, $cordovaInAppBrowser, $sce) {

        $scope.notification = NotificationsFactory.selectedNotification;
        NotificationsFactory.selectedNotification = null;
        var str = $scope.notification.Description;
        var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
        var result = str.replace(urlRegEx, "<a ng-click=\"launchExternalLink('$1')\">Click Here</a>");
        $scope.DescriptionToShow = result;

        if ($scope.notification.VideoURL != "" || $scope.notification.VideoURL != null) {
            $scope.notification.VideoURL = $sce.trustAsResourceUrl($scope.notification.VideoURL);
        }

        if ($scope.notification.ImageURL != "" || $scope.notification.ImageURL != null) {
            $scope.notification.ImageURL = $sce.trustAsResourceUrl($scope.notification.ImageURL);
        }

        $scope.launchExternalLink = function(url) {
            if (url.indexOf('meet') == -1 && url.indexOf('zoom') == -1 && url.indexOf('teams') == -1 && url.indexOf('jio') == -1) {
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
            } else {
                window.location.href = url;
            }
        };

    });