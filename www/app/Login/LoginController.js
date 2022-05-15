'use strict';
angular.module('smartStudentApp')
    .controller('LoginController', function($scope, $state, LoginFactory, $ionicHistory, ionicDatePicker, $ionicTabsDelegate) {

        $scope.loginData = {
            PhoneNumber: null,
            Password: '',
            DeviceId: LoginFactory.DeviceId,
            AppVersion: '1.0.0',
            OperatingSystem: ionic.Platform.platform()
        };

        $scope.parentLoginData = {
            PhoneNumber: null,
            DateOfBirth: moment().toISOString(),
            DeviceId: LoginFactory.DeviceId,
            AppVersion: '1.0.0',
            OperatingSystem: ionic.Platform.platform()
        };

        $scope.options = {
            initialSlide: 0
        };

        var ipObj1 = {
            callback: function(val) { //Mandatory
                $scope.parentLoginData.DateOfBirth = moment(val).utcOffset(0).add(1, 'days').hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
            },
            from: new Date(1980, 0, 1), //Optional
            to: new Date(2040, 12, 31), //Optional
            inputDate: new Date(), //Optional
            mondayFirst: false, //Optional
            closeOnSelect: true, //Optional
            templateType: 'popup' //Optional
        };

        $scope.openDatePicker = function() {
            ionicDatePicker.openDatePicker(ipObj1);
        };

        $scope.errorMessage = null;
        $scope.parentErrorMessage = null;
        $scope.showUpdateButton = false;

        $scope.performLogin = function() {
            LoginFactory.login($scope.loginData)
                .then(function(success) {
                    if (success.data.Code == "E010") {
                        $scope.errorMessage = success.data.Message;
                        $scope.showUpdateButton = true;
                    } else if (success.data.Code != "S001") {
                        $scope.errorMessage = success.data.Message;
                    } else {
                        $scope.errorMessage = null;
                        $scope.showUpdateButton = false;
                        LoginFactory.students = success.data.Data;
                        LoginFactory.loginStudent(success.data.Data[0], 'student', $scope.loginData);
                        if (LoginFactory.NotificationState != null) {
                            if (LoginFactory.NotificationState == "menu.subjectList") {
                                $state.go(LoginFactory.NotificationState, LoginFactory.NotificationArgs);
                            } else {
                                $state.go(LoginFactory.NotificationState);
                            }
                        } else {
                            $state.go('menu.dashboard');
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.login = function() {
            if ($scope.loginData.PhoneNumber == undefined || $scope.loginData.PhoneNumber == "") {
                $scope.errorMessage = 'Enter a valid Phone Number';
            } else if ($scope.loginData.Password == undefined || $scope.loginData.Password == "") {
                $scope.errorMessage = 'Enter Password';
            } else {
                // if ($scope.loginData.DeviceId != null) {
                $scope.performLogin();
                // }
            }
        };

        $scope.register = function() {
            $state.go('register');
        };

        $scope.$on('deviceRegistered', function(event) {
            $scope.loginData.DeviceId = LoginFactory.DeviceId;
            $scope.loginData.AppVersion = LoginFactory.AppVersion;
            $scope.parentLoginData.DeviceId = LoginFactory.DeviceId;
            $scope.parentLoginData.AppVersion = LoginFactory.AppVersion;
            if (localStorage.getItem("isLoggedIn")) {
                if (localStorage.getItem("loginType") == "student") {
                    $scope.performLogin();
                } else {
                    $scope.performParentLogin();
                }
            }
        });

        $scope.performParentLogin = function() {
            LoginFactory.parentLogin($scope.parentLoginData)
                .then(function(success) {
                    if (success.data.Code == "E010") {
                        $scope.parentErrorMessage = success.data.Message;
                        $scope.showUpdateButton = true;
                    } else if (success.data.Code != "S001") {
                        $scope.parentErrorMessage = success.data.Message;
                    } else {
                        $scope.parentErrorMessage = null;
                        $scope.showUpdateButton = false;
                        LoginFactory.students = success.data.Data;
                        LoginFactory.loginStudent(success.data.Data[0], 'parent', $scope.parentLoginData);
                        if (LoginFactory.NotificationState != null) {
                            if (LoginFactory.NotificationState == "menu.subjectList") {
                                $state.go(LoginFactory.NotificationState, { toStatistics: 1 });
                            } else {
                                $state.go(LoginFactory.NotificationState);
                            }
                        } else {
                            $state.go('menu.dashboard');
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.parentLogin = function() {
            $scope.options.initialSlide = 1;
            if ($scope.parentLoginData.PhoneNumber == undefined || $scope.parentLoginData.PhoneNumber == "") {
                $scope.errorMessage = 'Enter a valid Phone Number';
            } else if ($scope.parentLoginData.DateOfBirth == "Select" || $scope.parentLoginData.DateOfBirth == "") {
                $scope.errorMessage = 'Select a date of birth';
            } else {
                // if ($scope.parentLoginData.DeviceId != null) {
                $scope.performParentLogin();
                // }
            }
        };

        if (localStorage.getItem("isLoggedIn")) {
            if (localStorage.getItem("loginType") == "student") {
                $scope.loginData.PhoneNumber = localStorage.getItem("PhoneNumber");
                $scope.loginData.Password = localStorage.getItem("Password");
                $scope.login();
            } else {
                $scope.parentLoginData.PhoneNumber = localStorage.getItem("PhoneNumber");
                $scope.parentLoginData.DateOfBirth = localStorage.getItem("DateOfBirth");
                $scope.parentLogin();
            }
        }

        $scope.update = function() {
            window.location.href = "https://play.google.com/store/apps/details?id=com.findinboxStudent.www";
        };
    });