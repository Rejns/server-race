var app = angular.module("widget",[]);


app.controller("widgetController", ["$scope", "racerFactory", function($scope, racerFactory) {	
	
	var siol = racerFactory("http://localhost:3000");
	siol.startRacing(100); //pass in number of requests to complete the race
	var telemach = racerFactory("http://localhost:3000");
	telemach.startRacing(100);
	
	setInterval(function(){
		$scope.currentX = siol.totalTime;
		var el = document.getElementById("time");
		el.style.width = siol.totalTime/100+"px";
		$scope.currentX2 = telemach.totalTime;
		var el = document.getElementById("time2");
		el.style.width = telemach.totalTime/100+"px";

	},1);

}]);

app.factory("responseTime", ["$http","$q", function($http, $q) {
	return function(address) {
		return $q(function(resolve, reject) {
			var now = Date.now();
			var then = null;
			var promise = $http.get(address, {withCredentials: true});
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