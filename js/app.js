var app = angular.module("widget",[]);


app.controller("widgetController", ["$scope", "racerFactory","$http","$rootScope", function($scope, racerFactory, $http, $rootScope) {	

	$scope.racerAddr = "www.siol.net";
	$scope.startRace = start;
	$scope.add = add;
	$scope.stopRace = stop;
	$scope.remove = remove;
	$scope.race = { numRacers : 0, racers: [] }
	var racerId = 0;

	$rootScope.$on("processed", function(event, racer){
		if(racer.currentRequests < 100) 
			$rootScope.$broadcast("start", racer.id);	
		else {
			if(racerId !== undefined) {
				$scope.race.racers[racer.id].ready = true;
				$rootScope.$emit("stopped");
			}
		}
	});

	$rootScope.$on("stopped", function(event, racerId) {
		if(racerId !== undefined)
			$scope.race.racers[racerId].ready = true; 
		if(allReady()) 
			document.getElementById("status").innerHTML = "all ready!";
	});

	function ipInRace(ip) {
		for(var i = 0; i < $scope.race.racers.length; i++) {
			if($scope.race.racers[i].ip === ip) {
				return true;
				break;
			}
		}
		return false;
	}

	function add() {
		
		var promise = $http.get("http://ip-api.com/json/"+$scope.racerAddr);
		promise.then(function(response){
			var racer = null;
		
			racer = racerFactory("http://192.168.1.4:3000/proxy/?addr="+response.data.query);
			
			racer.address = $scope.racerAddr;
			racer.id = racerId;
			racer.ip = response.data.query;
			racer.setupEventListener();

			if(!ipInRace(racer.ip)){
				$scope.race.racers.push(racer);
				$scope.race.numRacers = $scope.race.racers.length;
				racerId++;
				
			}
			else
				alert("no matching ip for this domain or ip is already active");
			$rootScope.$emit("stopped");
		});	
	}

	function start() {
		if(allReady()) {
			document.getElementById("status").innerHTML = "";
			$rootScope.$broadcast("start", "all");
		}
			
	}

	function stop() {
		$rootScope.$broadcast("stop");
	}

	function allReady() {
		for(var i = 0; i < $scope.race.racers.length; i++) {
			if(!$scope.race.racers[i].ready) {
				return false;
				break;
			}
		}
		return true;
	}
	
	function remove(racer) {
		var index = $scope.race.racers.indexOf(racer);
		$scope.race.racers.splice(index, 1);
		$scope.race.numRacers -= 1;
		if(allReady())
			$rootScope.$emit("stopped");
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
				if(racer.goNextReq) {
					racer.currentRequests += 1;
					racer.totalTime = racer.totalTime + response;
					if(document.getElementById(racer.id) != null) {
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
						$rootScope.$emit("processed", racer);
					}
				}
				else {
					$rootScope.$emit("stopped", racer.id);
				}
			});
		}

		return {
			ready : true,
			goNextReq : true,
			totalTime : 0,
			currentRequests: 0,
			address: address,
			setupEventListener: function() {	
				var racer = this
				$rootScope.$on("start", function(event, message){
					if(message === "all") {
						racer.currentRequests = 0;
						racer.totalTime = 0;
						racer.goNextReq = true;
						racer.ready = false;
						processOneRequest(racer);
					}
					else if (message === racer.id) {
						racer.goNextReq = true;
						racer.ready = false;
						processOneRequest(racer);
					}
				});

				$rootScope.$on("stop", function(){
					racer.goNextReq = false;
				});	
			}
		};
	};
}]);

