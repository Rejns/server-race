var app = angular.module("widget",[]);


app.controller("widgetController", ["$scope", "racerFactory","$http","$rootScope","$q", function($scope, racerFactory, $http, $rootScope, $q) {	

	var addresses = ["www.siol.net", "www.google.com", "kulinarika.net", "slo-tech.com", "telekom.si", "www.yahoo.com", "gmail.com", "github.com"]
	$scope.racerAddr = "www.siol.net";
	$scope.startRace = start;
	$scope.add = add;
	$scope.stopRace = stop;
	$scope.remove = remove;
	$scope.race = { numRacers : 0, racers: [] }
	var racerId = 0;
	$scope.status = "";

	for(var i = 0; i < addresses.length; i++) {
		createRacer(addresses[i])();
	}

	$rootScope.$on("processed", function(event, racer){
		if(racer.active) {
			if(racer.currentRequests < 100 && racer.goNextReq) 
				$rootScope.$broadcast("start", racer.id);	
			else {
				if(racerId !== undefined && $scope.race.racers[racer.id]) {
					$scope.race.racers[racer.id].ready = true;
					$rootScope.$emit("stopped", $scope.race.racers[racer.id]);
				}
			}
		}
	});

	$rootScope.$on("stopped", function(event, racer) {
		if(racer !== undefined)
			if(racer.active) {
				if(racer.id !== undefined && $scope.race.racers[racer.id] !== undefined)
					$scope.race.racers[racer.id].ready = true; 
				if(allReady()) {
					if($scope.race.racers.length === 0) 
						$scope.status = "";
					else
						$scope.status = "all ready!";
				}
			}
	});

	$rootScope.$on("error", function(event, racer) {
		remove(racer);
	});

	function ipInRace(ip, address) {
		for(var i = 0; i < $scope.race.racers.length; i++) {
			if($scope.race.racers[i].ip === ip || $scope.race.racers[i].address === address) {
				return true;
				break;
			}
		}
		return false;
	}

	function checkIfIp(string) {
		//check if string matches reg exp for ip
		if(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(string))
			return true;
		return false
	}

	function createRacer(addr) {
		return function() {
			var promise = $http.get("http://ip-api.com/json/"+addr);
			promise.then(function(response){
			if(checkIfIp(response.data.query)) {
				var racer = racerFactory("http://localhost:3000/proxy/?addr="+response.data.query);	
				racer.address = addr;
				racer.id = racerId;

				racer.ip = response.data.query;
				racer.setupEventListener();
				racer.active = true;

				if(!ipInRace(racer.ip, racer.address)){
					$scope.race.racers.push(racer);
					$scope.race.numRacers = $scope.race.racers.length;
					racerId++;
					$rootScope.$emit("stopped", racer); 
				}
				else 
					alert("ip already active");
			}
			else 
				alert("no matching ip for this domain");
		
			});	
		}
	}

	function add() {	
		var promise = $http.get("http://ip-api.com/json/"+$scope.racerAddr);
		promise.then(function(response){
			if(checkIfIp(response.data.query)) {
				var racer = racerFactory("http://localhost:3000/proxy/?addr="+response.data.query);	
				racer.address = $scope.racerAddr;
				racer.id = racerId;

				racer.ip = response.data.query;
				racer.setupEventListener();
				racer.active = true;

				if(!ipInRace(racer.ip, racer.address)){
					$scope.race.racers.push(racer);
					$scope.race.numRacers = $scope.race.racers.length;
					racerId++;
					$rootScope.$emit("stopped", racer); 
				}
				else 
					alert("ip already active");
			}
			else 
				alert("no matching ip for this domain");
		
		});	
	}

	function start() {
		if(allReady()) {
			$scope.status = "racing ...";
			$rootScope.$broadcast("start", "all");
		}
			
	}

	function stop() {
		$scope.status = "stopping ..."
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

	function fixRacerIndex(racers) {
		for(var i = 0; i < racers.length; i++) {
			racers[i].id = i;
		}
	}
	
	function remove(racer) {
		var index = $scope.race.racers.indexOf(racer);
		if($scope.race.racers[index] !== undefined) {
				$scope.race.racers[index].active = false;
				$scope.race.racers.splice(index, 1);
				fixRacerIndex($scope.race.racers);
				racerId--;
				$scope.race.numRacers -= 1;
				if(allReady() && $scope.race.racers.length > 0) {
					$scope.status = "all ready";
					//$rootScope.$emit("stopped");
				}
		}
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
			}, function(error) {
				reject(error);
			});
		});
	}
}]);

app.directive("racerprogress", function() {
	return {
		scope : {
			racer: '='
		},
		restrict: 'E',
		replace: true,
		template: '<div class="progress">\
					  <div class="progress-bar" role="progressbar" style="width:0%">\
					    {{ racer.currentRequests }} %\
					  </div>\
				   </div>',
		link: function(scope, element, attrs) {
			scope.$watch(function() {
				return scope.racer.currentRequests;
			}, function(val) {
				element.children()[0].style.width = scope.racer.currentRequests+"%";
			});
		}
	}
});

app.factory("racerFactory", ["responseTime","$rootScope", function(responseTime, $rootScope){
	return function(address) {
		function processOneRequest(racer) {
			var promise = responseTime(address);
			var racer = racer;
			promise.then(function(response) {
				if(racer.goNextReq) {
					racer.currentRequests += 1;
					racer.totalTime = racer.totalTime + response;
					$rootScope.$emit("processed", racer);
				}
				else {
					$rootScope.$emit("stopped", racer);
				}
			}, function(err) {
				console.log(err);
				$rootScope.$emit("error", racer);
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
					if(racer.active) {
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
					}
				});

				$rootScope.$on("stop", function(){
					racer.goNextReq = false;
				});	
			}
		};
	};
}]);

