var app = angular.module("widget",[]);


app.controller("widgetController", ["$scope", "racerFactory","$http", function($scope, racerFactory, $http) {	
	$scope.racers = [];
	$scope.racerAddr = "www.google.com";
	$scope.start = start;
	$scope.add = add;
	$scope.numRacers = $scope.racers.length; 
	var racerId = 0;

	function add() {
		var promise = $http.get("http://ip-api.com/json/"+$scope.racerAddr);
		promise.then(function(response){
			var racer = racerFactory("http://192.168.1.2:3000/?addr="+response.data.query);
			racer.address = $scope.racerAddr;
			racer.id = racerId;
			$scope.racers.push(racer);
			$scope.numRacers = $scope.racers.length;
			racerId++;
		});	
	}
	function start() {
		for(var i = 0; i < $scope.racers.length; i++) {
			$scope.racers[i].startRacing(100);
		}
	}
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

app.factory("racerFactory", ["responseTime", function(responseTime){
	return function(address) {
		function loop(totalRequests) {
			var promise = responseTime(address);
			var racer = this;
			promise.then(function(response) {
				if(racer.currentRequests < totalRequests) {
					racer.currentRequests += 1;
					racer.totalTime = racer.totalTime + response;
					document.getElementById(racer.id).style.width = 2*racer.currentRequests+"px";
					loop.apply(racer, [totalRequests]);
				}
			});
		}
		return {
			totalTime : 0,
			currentRequests: 0,
			address: address,
			startRacing: loop
		};
	};
}])