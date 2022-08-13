'use strict';

angular.module('smartStudentApp').factory('LoginFactory', function($q, $http) {
    var factory = {
        loggedInUser: {},
        isAuthenticated: false,
        DeviceId: null,
        NotificationState: null,
        NotificationArgs: null,
        students: []
    };

    var website = 'https://aspirare-smart-api.herokuapp.com';
    var URL = website;

    factory.login = function(obj) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/studentLogin',
            data: obj,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            factory.isAuthenticated = false;
            d.reject(error);
        });
        return d.promise;
    };

    factory.parentLogin = function(obj) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/parentLogin',
            data: obj,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            factory.isAuthenticated = false;
            d.reject(error);
        });
        return d.promise;
    };

    factory.storeLoginSession = function(loginType, loginData) {
        factory.isLoggedIn = true;
        if (loginType == 'student') {
            localStorage.setItem("PhoneNumber", loginData.PhoneNumber);
            localStorage.setItem("Password", loginData.Password);
        } else {
            if (loginData != undefined) {
                localStorage.setItem("PhoneNumber", loginData.PhoneNumber);
                localStorage.setItem("DateOfBirth", loginData.DateOfBirth);
            }
        }
        localStorage.setItem("loginType", loginType);
        localStorage.setItem("isLoggedIn", factory.isLoggedIn);
    };

    factory.removeLoginSession = function() {
        factory.isLoggedIn = false;
        localStorage.removeItem("PhoneNumber");
        localStorage.removeItem("Password");
        localStorage.removeItem("DateOfBirth");
        localStorage.removeItem("loginType");
        localStorage.removeItem("isLoggedIn");
    };

    factory.logout = function() {
        factory.isAuthenticated = false;
        factory.removeLoginSession();
    };

    factory.getBaseUrl = function() {
        return website;
    };

    factory.loginStudent = function(selectedStudent, loginType, loginData) {
        factory.loggedInUser = selectedStudent;
        // factory.loggedInUser.OldPackageCode = factory.loggedInUser.PackageCode;
        // if (factory.loggedInUser.CourseId == 1) { //1 is course id for preschool
        //     factory.loggedInUser.OldPackageCode = factory.loggedInUser.PackageCode;
        //     factory.loggedInUser.PackageCode = 'LM';
        // } else {
        //     factory.loggedInUser.PackageCode = factory.loggedInUser.OldPackageCode;
        // }
        $http.defaults.headers.common['Authorization'] = selectedStudent.Token;
        factory.isAuthenticated = true;
        factory.storeLoginSession(loginType, loginData);
    };

    return factory;
});