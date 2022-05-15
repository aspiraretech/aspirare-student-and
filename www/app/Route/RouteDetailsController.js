'use strict';
angular.module('smartStudentApp')
    .controller('RouteDetailsController', function($scope, $state, ionicToast, $ionicPopup, RoutesFactory, $ionicHistory, LoginFactory, $interval) {

        $scope.loggedInUser = LoginFactory.loggedInUser;
        $scope.route = null;
        $scope.promise = null;


        $scope.getRouteDetails = function() {
            RoutesFactory.getRouteByStudent($scope.loggedInUser.RouteId)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.route = success.data.Data[0];
                        if ($scope.route.Latitude == null || $scope.route.Latitude == 'null') {
                            ionicToast.show('The bus has not started yet', 'bottom', false, 2500);
                        } else {
                            initialize();
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
            $interval.cancel($scope.promise);
        });

        $scope.callStaff = function(phoneNumber) {
            var call = "tel:" + phoneNumber;
            document.location.href = call;
        };

        $scope.startPolling = function() {
            $scope.promise = $interval(function() {
                RoutesFactory.getRouteByStudent($scope.loggedInUser.RouteId)
                    .then(function(success) {
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            $scope.route = success.data.Data[0];
                            if ($scope.route.Latitude == null || $scope.route.Latitude == 'null') {
                                ionicToast.show('The bus has not started yet', 'bottom', false, 2500);
                            } else {
                                updateMarker($scope.route.Latitude, $scope.route.Longitude);
                            }
                        }
                    }, function(error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
            }, 1000 * 10);
        };

        function initialize() {
            var mapOptions = {
                center: new google.maps.LatLng($scope.route.Latitude, $scope.route.Longitude),
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var map = new google.maps.Map(document.getElementById("map"), mapOptions);

            $scope.marker = new google.maps.Marker({
                position: new google.maps.LatLng($scope.route.Latitude, $scope.route.Longitude),
                icon: "app/images/bus.png",
                map: map
            });

            // Stop the side bar from dragging when mousedown/tapdown on the map
            google.maps.event.addDomListener(document.getElementById('map'), 'mousedown', function(e) {
                e.preventDefault();
                return false;
            });

            $scope.map = map;
            $scope.startPolling();
        };

        function updateMarker(lat, lng) {
            var latlng = new google.maps.LatLng(lat, lng);
            $scope.marker.setPosition(latlng);
            $scope.map.setCenter(latlng);
        };

        $scope.callStaff = function(phoneNumber) {
            var call = "tel:" + phoneNumber;
            document.location.href = call;
        };

        $scope.getRouteDetails();
    });