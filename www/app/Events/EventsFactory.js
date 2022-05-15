'use strict';

angular.module('smartStudentApp').factory('EventsFactory', function($q, $http, LoginFactory) {
    var factory = {
        selectedEvent: null
    };

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getAllEvents = function(collegeId, year) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/event/getAllByCollege/' + collegeId + "/" + year
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getEventImages = function(eventId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/event/getImages/' + eventId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    return factory;
});