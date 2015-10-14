var app = angular.module("widget",[]);

app.controller("widgetController", ["$scope","$timeout","$interval","responseTime", function($scope, $timeout, $interval, responseTime) {	
	$scope.test = [];
	function loop() {
		var promise = responseTime("http://www.telemach.net");
		promise.then(function(response){
			console.log($scope.test);
			$scope.test.push(response);
			loop();
		});
	}
	loop();	
}]);

app.factory("responseTime", ["$http","$q", function($http, $q) {
	return function(address) {
		return $q(function(resolve, reject) {
			var now = Date.now();
			var then = null;
			var promise = $http.get(address);
			promise.then(function(response){
				then = Date.now();
				then = then - now;
				resolve(then);
			});
		});
	}
}]);
