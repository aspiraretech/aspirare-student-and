'use strict';

angular.module('smartStudentApp').factory('CalendarFactory', function ($q, $http, LoginFactory) {
    var factory = {};

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getAllCalendarEvents = function (collegeId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/calendar/getAllByCollege/' + collegeId
        }).then(function (success) {
            d.resolve(success);
        }, function (error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.addCalendarEvent = function (event) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/calendar',
            data: event,
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

    factory.deleteEvent = function (event) {
        var d = $q.defer();
        $http({
            method: 'DELETE',
            url: URL + '/calendar',
            data: event,
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