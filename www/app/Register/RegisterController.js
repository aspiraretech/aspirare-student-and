'use strict';
angular.module('smartStudentApp')
    .controller('RegisterController', function ($scope, $state, RegisterFactory, ionicToast, $cordovaCamera, $ionicHistory) {

        $scope.registrationCheck = {
            FindInboxId: null
        };

        $scope.registrationData = null;
        $scope.showPasswordIsChecked = false;

        $scope.checkRegistrationStatus = function () {
            if ($scope.registrationCheck.FindInboxId == "" || $scope.registrationCheck.FindInboxId == null) {
                ionicToast.show('Please enter the FindInboxId to Register', 'bottom', false, 2500);
            } else {
                RegisterFactory.checkRegistrationStatus($scope.registrationCheck.FindInboxId)
                    .then(function (success) {
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            $scope.registrationData = success.data.Data[0];
                        }
                    }, function (error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
            }
        };

        $scope.idCardCapture = function () {
            var options = {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                encodingType: Camera.EncodingType.JPEG,
            };

            $cordovaCamera.getPicture(options)
                .then(function (image) {
                    $scope.registrationData.IdCardImage = "data:image/jpeg;base64," + image;
                },
                function (err) {
                    console.log(err);
                });
        };

        $scope.submitRegistration = function () {
            if ($scope.registrationData.Password == "" || $scope.registrationData.Password == null || $scope.registrationData.IdCardImage == undefined || $scope.registrationData.IdCardImage == "") {
                ionicToast.show('Please fill Password and capture Id Card Image to proceed', 'bottom', false, 2500);
            } else {
                RegisterFactory.register($scope.registrationData)
                    .then(function (success) {
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            ionicToast.show('Registration sent for approval. Please login after 4 hours.', 'bottom', false, 2500);
                            $ionicHistory.nextViewOptions({
                                disableBack: true
                            });
                            $state.go('login');
                        }
                    }, function (error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
            }
        }

    });
