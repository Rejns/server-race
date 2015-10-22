var app = angular.module("widget",[]);


app.controller("widgetController", ["$scope", "racerFactory","$http","$rootScope", function($scope, racerFactory, $http, $rootScope) {	

	$scope.racerAddr = "www.siol.net";
	$scope.startRace = start;
	$scope.add = add;
	$scope.stop = stop;
	$scope.remove = remove;
	$scope.race = { numRacers : 0, racers: [] }
	var racerId = 0;

	function ipInRace(ip) {
		for(var i = 0; i < $scope.race.racers.length; i++) {
			if($scope.race.racers[i].ip === ip)
				return true;
				break;
		}
		return false;
	}

	function add() {
		
		var promise = $http.get("http://ip-api.com/json/"+$scope.racerAddr);
		promise.then(function(response){
			var racer = null;
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				racer = racerFactory("http://89.143.151.155:3000/?addr="+response.data.query);
			}
			else
				racer = racerFactory("http://192.168.1.2:3000/?addr="+response.data.query);
			
			racer.address = $scope.racerAddr;
			racer.id = racerId;
			racer.ip = response.data.query;
			racer.setupEventListener();

			if(response.data.query !== $scope.racerAddr && !ipInRace(racer.ip)){
				$scope.race.racers.push(racer);
				$scope.race.numRacers = $scope.race.racers.length;
				racerId++;
				
			}
			else
				alert("no matching ip for this domain or ip is already active");
		});	
	}

	var stoppedCounter = -1;
	var firstClick = true;

	$rootScope.$on("processed", function(event, data){
		if(data.completed < 100) 
			$rootScope.$broadcast("start", data.id);	
		else 
			$rootScope.$emit("stopped");
		
	});

	$rootScope.$on("stopped", function(event, racerId){
		stoppedCounter++;
		console.log(stoppedCounter);
		if(stoppedCounter === $scope.race.racers.length && allFinished()) {
			firstClick = true;
			stoppedCounter = -1;
		}
		else if(stoppedCounter === $scope.race.racers.length || stoppedCounter == 0) {
			$rootScope.$broadcast("start", "all");
			stoppedCounter = 0;
		}
	});

	function start() {
		if(firstClick === true) {
			firstClick = false;
			$rootScope.$emit("stopped");
		}
		else {
			$rootScope.$broadcast("stop");	
			console.log("broadcast stop");
		}

	}

	function allFinished() {
		for(var i = 0; i < $scope.race.racers.length; i++) {
			if($scope.race.racers[i].currentRequests < 100) {
				return false;
			}
		}
		return true;
	}
	
	function remove(racer) {
		var index = $scope.race.racers.indexOf(racer);
		$scope.race.racers.splice(index, 1);
		$scope.race.numRacers -= 1;
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
					$rootScope.$emit("processed", { id : racer.id, completed: racer.currentRequests } );
					console.log(racer.id+" emit processed");
				}
				else {
					$rootScope.$emit("stopped", [racer.id]);
					console.log("emit stopped");
				}
			});
		}

		return {
			goNextReq : true,
			totalTime : 0,
			currentRequests: 0,
			address: address,
			setupEventListener: function() {	
				var racer = this
				var unbindStart = $rootScope.$on("start", function(event, message){
					if(message === "all") {
						racer.currentRequests = 0;
						racer.totalTime = 0;
						racer.goNextReq = true;
						processOneRequest(racer);
					}
					else if (message === racer.id) {
						racer.goNextReq = true;
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

