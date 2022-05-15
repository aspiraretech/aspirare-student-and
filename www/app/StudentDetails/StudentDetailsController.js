'use strict';
angular.module('smartStudentApp')
    .controller('StudentDetailsController', function($scope, $state, ionicToast, LoginFactory, StudentDetailsFactory, NotificationsFactory, $ionicPopup) {

        $scope.balanceFees = 0;
        $scope.loggedInUser = LoginFactory.loggedInUser;
        NotificationsFactory.articleId = null;
        NotificationsFactory.selectedNotification = null;
        $scope.v1 = true;

        $scope.loginType = localStorage.getItem("loginType");

        $scope.getStudentDetails = function() {
            StudentDetailsFactory.getStudentDetails(LoginFactory.loggedInUser.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.studentDetails = success.data.Data[0];
                        if ($scope.studentDetails.ProfileImageURL == null) {
                            $scope.studentDetails.ProfileImageURL = 'app/images/defaultProfileImage.svg';
                        }
                        if ($scope.studentDetails.FatherImageURL == null) {
                            $scope.studentDetails.FatherImageURL = 'app/images/defaultProfileImage.svg';
                        }
                        if ($scope.studentDetails.MotherImageURL == null) {
                            $scope.studentDetails.MotherImageURL = 'app/images/defaultProfileImage.svg';
                        }
                        $scope.calculateBalanceFees();
                        $scope.getBorrowedBooks();
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.calculateBalanceFees = function() {
            var obj = {
                StudentId: LoginFactory.loggedInUser.Id,
                BranchId: LoginFactory.loggedInUser.BranchId
            };
            StudentDetailsFactory.getBalanceFeesforStudent(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        var balance = success.data.Data.BalanceDevelopmentFees + success.data.Data.BalanceTuitionFees;
                        $scope.balanceFees = balance;
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.showBankInfo = function() {
            var alertPopup = $ionicPopup.alert({
                title: 'Bank Information',
                template: $scope.loggedInUser.BankAccountInfo
            });
        }

        $scope.toggle = function() {
            $scope.v1 = !$scope.v1;
        };

        $scope.changePassword = function() {
            $state.go('menu.changePassword');
        };

        $scope.call = function(PhoneNumber) {
            var call = "tel:" + PhoneNumber;
            document.location.href = call;
        };

        $scope.getBorrowedBooks = function() {
            StudentDetailsFactory.getBorrowedBooks(LoginFactory.loggedInUser.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.books = success.data.Data;
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.showPicture = function(value) {
            console.log(value);
        };

        $scope.getStudentDetails();
    });