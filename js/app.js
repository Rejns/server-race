var app = angular.module("widget",[]);


app.controller("widgetController", ["$scope", "racerFactory","$http","$rootScope", function($scope, racerFactory, $http, $rootScope) {	

	$scope.racerAddr = "www.siol.net";
	$scope.startRace = start;
	$scope.add = add;
	$scope.race = { numRacers : 0, racers: [] }
	var racerId = 0;
	var addedIPs = [];

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
			racer.setupEventListener();

			if(response.data.query !== $scope.racerAddr &&  addedIPs.indexOf(racer.ip) === -1)
			{
				addedIPs.push(racer.ip);
				$scope.race.racers.push(racer);
				$scope.race.numRacers = $scope.race.racers.length;
				racerId++;
				
			}
			else
				alert("no matching ip for this domain or ip is already active");
		});	
	}

	var req = 0;
	

	function start() {
	
		$scope.race.racers[0].currentRequests = 0;
		$scope.race.racers[0].totalTime = 0;
		$rootScope.$broadcast("start");
		$rootScope.$on("processed", function(){
			req++;
			if(req < 100)
				$rootScope.$broadcast("start");
		})
		
	}
}]);

app.factory("responseTime", ["$http","$q", function($http, $q) {
	return function(address) {
		return $q(function(resolve, reject) {
			var now = Date.now();
			var promise = $http.get(address);
			promise.then(function(response) {
				var then = Date.now();
				then = then - now;
				resolve(then);
			});
		});
	}
}]);

app.factory("racerFactory", ["responseTime","$rootScope", function(responseTime, $rootScope){
	return function(address) {
		function processOneRequest(racer) {	
			var promise = responseTime(address);
			var racer = racer;
			promise.then(function(response) {
				racer.currentRequests += 1;
				racer.totalTime = racer.totalTime + response;
				var els = document.getElementById(racer.id).childNodes;
				for(var i = 0; i < els.length; i++) {
					if(els[i].className === "wrapper") {
						els = els[i].childNodes;
						for(var j = 0; j < els.length; j++) {
							if(els[j].className === "fill") 
								els[j].style.width = 2*racer.currentRequests+"px";
						}	
					}
				}
				$rootScope.$emit("processed");
			});
		}

		return {
			totalTime : 0,
			currentRequests: 0,
			address: address,
			setupEventListener: function() {	
				var racer = this
				$rootScope.$on("start", function(){
					processOneRequest(racer);
				});		
			}
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