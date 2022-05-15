'use strict';

angular.module('smartStudentApp').factory('RegisterFactory', function ($q, $http, LoginFactory) {
    var factory = {};

    var URL = LoginFactory.getBaseUrl();

    factory.checkRegistrationStatus = function (fiid) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/student/checkRegistrationStatus/' + fiid
        }).then(function (success) {
            d.resolve(success);
        }, function (error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.register = function (obj) {
        var d = $q.defer();
        $http({
            method: 'PUT',
            url: URL + '/student/register',
            data: obj,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (success) {
            d.resolve(success);
        }, function (error) {
            d.reject(error);
        });
        return d.promise;
    };

    return factory;
});