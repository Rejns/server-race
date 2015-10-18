var app = angular.module("widget",[]);


app.controller("widgetController", ["$scope", "racerFactory","$http", function($scope, racerFactory, $http) {	
	$scope.racerAddr = "www.google.com";
	$scope.startRace = start;
	$scope.add = add;
	$scope.race = { numRacers : 0, racers: []}
	var racerId = 0;

	function add() {
		var promise = $http.get("http://ip-api.com/json/"+$scope.racerAddr);
		promise.then(function(response){
			var racer = null;
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				racer = racerFactory("http://89.143.151.155:3000/?addr="+response.data.query);
			}
			else
				racer = racerFactory("http://192.168.1.4:3000/?addr="+response.data.query);
			racer.address = $scope.racerAddr;
			racer.id = racerId;
			racer.ip = response.data.query;

			if(response.data.query !== $scope.racerAddr)
			{
				$scope.race.racers.push(racer);
				$scope.race.numRacers = $scope.race.racers.length;
				racerId++;
			}
			else
				alert("no matching ip for this domain");
		});	
	}

	function start() {
		for(var i = 0; i < $scope.race.racers.length; i++) {
			$scope.race.racers[i].currentRequests = 0;
			$scope.race.racers[i].totalTime = 0;
			$scope.race.racers[i].startRacing(100);
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
					var els = document.getElementById(racer.id).childNodes;
					for(var i = 0; i < els.length; i++) {
						if(els[i].className === "wrapper") {
							els = els[i].childNodes;
							for(var j = 0; j < els.length; j++) {
								if(els[j].className === "fill") {
									els[j].style.width = 2*racer.currentRequests+"px";

								}
							}	
						}
					}
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
}]);

app.directive("remove", function(){
	return {	
		link: function(scope, el, attrs) {
			scope.remove = function() {
				var index = scope.race.racers.indexOf(scope.racer);
				scope.race.racers.splice(index, 1);
				scope.race.numRacers -= 1;
				el.parent()[0].innerHTML = "";
			}
		}
	}
})