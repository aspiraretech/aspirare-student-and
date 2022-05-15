'use strict';
angular.module('smartStudentApp')
    .controller('ChangePasswordController', function ($scope, $state, LoginFactory, ionicToast, ChangePasswordFactory) {
        $scope.showPasswordIsChecked = false;
        $scope.data = {
            CurrentPassword: "",
            NewPassword: "",
            ConfirmPassword: "",
            UserId: LoginFactory.loggedInUser.Id
        };
        $scope.errorMessage = null;

        $scope.changePassword = function () {
            if ($scope.data.CurrentPassword == "" || $scope.data.NewPassword == "" || $scope.data.ConfirmPassword == "") {
                ionicToast.show('Please enter all the fields to change the password', 'bottom', false, 2500);
            } else if ($scope.data.NewPassword != $scope.data.ConfirmPassword){
                ionicToast.show('New password should match confirm password', 'bottom', false, 2500);
            } else {
                $scope.errorMessage = null;
                ChangePasswordFactory.changePassword($scope.data)
                    .then(function (success) {
                        if (success.data.Code != "S001") {
                            $scope.errorMessage = success.data.Message;
                        } else {
                            ionicToast.show('Password changed successfully. Please login with your new password.', 'bottom', false, 2500);
                            LoginFactory.logout();
                            $state.go('login');
                        }
                    }, function (error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
            }
        };
    });
