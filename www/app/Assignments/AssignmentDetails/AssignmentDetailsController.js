'use strict';
angular.module('smartStudentApp')
    .controller('AssignmentDetailsController', function($scope, $state, AssignmentFactory, ionicToast, $sce, NotificationsFactory, $cordovaInAppBrowser, $ionicLoading, $cordovaFileTransfer, $cordovaSocialSharing, $q, LoginFactory) {

        $scope.assignment = AssignmentFactory.selectedAssignment;
        AssignmentFactory.selectedAssignment = null;
        NotificationsFactory.articleId = null;
        NotificationsFactory.selectedNotification = null;
        if ($scope.assignment.VideoURL != "" || $scope.assignment.VideoURL != null) {
            $scope.assignment.VideoURL = $sce.trustAsResourceUrl($scope.assignment.VideoURL);
        }
        $scope.assignment.Images = [];

        var str = $scope.assignment.Description;
        var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
        var result = str.replace(urlRegEx, "<a ng-click=\"launchExternalLink('$1')\">$1</a>");
        $scope.DescriptionToShow = result;

        $scope.getImagesForAssignment = function() {
            AssignmentFactory.getAssignmentImages($scope.assignment.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show('There are no images attached for this shared content', 'bottom', false, 2500);
                    } else {
                        for (var i = 0; i < success.data.Data.length; i++) {
                            var template = {
                                src: success.data.Data[i].ImageURL
                            };
                            $scope.assignment.Images.push(template);
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.viewDocument = function() {
            var options = {
                location: 'yes',
                clearcache: 'yes',
                toolbar: 'yes',
                shouldPauseOnSuspend: 'yes'
            };
            $cordovaInAppBrowser.open($scope.assignment.DocumentURL, '_blank', options)
                .then(function(event) {
                    // success
                    console.log(event);
                })
                .catch(function(event) {
                    // error
                    console.log(event);
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

        $scope.checkPermission = function(flag) {
            $scope.toShare = flag;
            if ($scope.assignment.Images.length != 0) {
                cordova.plugins.diagnostic.getPermissionAuthorizationStatus(function(status) {
                    switch (status) {
                        case cordova.plugins.diagnostic.runtimePermissionStatus.GRANTED:
                            console.log("Permission granted to use the storage");
                            $scope.download();
                            break;
                        case cordova.plugins.diagnostic.runtimePermissionStatus.NOT_REQUESTED:
                            console.log("Permission to use the storage has not been requested yet");
                            $scope.getPermission();
                            break;
                        case cordova.plugins.diagnostic.runtimePermissionStatus.DENIED:
                            ionicToast.show('Permission denied to use external storage!', 'bottom', false, 2500);
                            $scope.getPermission();
                            break;
                        case cordova.plugins.diagnostic.runtimePermission.DENIED_ALWAYS:
                            ionicToast.show('Permission denied to use external storage!', 'bottom', false, 2500);
                            $scope.getPermission();
                            break;
                    }
                }, function(error) {
                    console.error("The following error occurred: " + error);
                }, cordova.plugins.diagnostic.runtimePermission.WRITE_EXTERNAL_STORAGE);
            } else {
                if (flag) {
                    $scope.openShareDialog();
                } else {
                    ionicToast.show('There are no images attached to this event to download', 'bottom', false, 2500);
                }
            }
        };

        $scope.getPermission = function() {
            cordova.plugins.diagnostic.requestRuntimePermission(function(status) {
                switch (status) {
                    case cordova.plugins.diagnostic.runtimePermissionStatus.GRANTED:
                        console.log("Permission granted to use the storage");
                        $scope.download();
                        break;
                    case cordova.plugins.diagnostic.runtimePermissionStatus.NOT_REQUESTED:
                        console.log("Permission to use the storage has not been requested yet");
                        $scope.getPermission();
                        break;
                    case cordova.plugins.diagnostic.runtimePermissionStatus.DENIED:
                        ionicToast.show('Permission denied to use external storage!', 'bottom', false, 2500);
                        break;
                }
            }, function(error) {
                console.error("The following error occurred: " + error);
            }, cordova.plugins.diagnostic.runtimePermission.WRITE_EXTERNAL_STORAGE);
        };

        $scope.download = function() {
            $ionicLoading.show({
                template: '<ion-spinner icon="android"></ion-spinner><div>Loading',
                animation: 'fade-in',
                showBackdrop: false,
            });

            var promises = [];

            $scope.assignment.Images.forEach(function(i, x) {
                var targetPath = cordova.file.externalRootDirectory + i.src.split("/").pop();
                promises.push($cordovaFileTransfer.download(i.src, targetPath, {}, true));
            });

            if ($scope.toShare && LoginFactory.loggedInUser.ShareImageURL != null) {
                var targetPath = cordova.file.externalRootDirectory + LoginFactory.loggedInUser.ShareImageURL.split("/").pop();
                promises.push($cordovaFileTransfer.download(LoginFactory.loggedInUser.ShareImageURL, targetPath, {}, true))
            }

            $q.all(promises).then(function(res) {
                $scope.imageNativeUrls = [];
                for (var i = 0; i < res.length; i++) {
                    $scope.imageNativeUrls.push(res[i].nativeURL);
                    refreshMedia.refresh(res[i].nativeURL);
                }
                $ionicLoading.hide();
                ionicToast.show('Download Complete', 'bottom', false, 2500);
                if ($scope.toShare) {
                    $scope.openShareDialog();
                }
            });
        };

        $scope.openShareDialog = function() {
            $cordovaSocialSharing
                .share($scope.assignment.Name + " | " + $scope.assignment.Description, null, $scope.imageNativeUrls, " | " + $sce.getTrustedResourceUrl($scope.assignment.VideoURL)) // Share via native share sheet
                .then(function(result) {
                    console.log(success);
                    ionicToast.show('Sharing was successful!', 'bottom', false, 2500);
                }, function(err) {
                    console.log(err);
                });
        };

        $scope.getImagesForAssignment();
    });