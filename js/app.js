var app = angular.module("widget",[]);


app.controller("widgetController", ["$scope", "racerFactory","$http","$rootScope", function($scope, racerFactory, $http, $rootScope) {	

	$scope.racerAddr = "www.siol.net";
	$scope.startRace = start;
	$scope.add = add;
	$scope.stop = stop;
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
				racer = racerFactory("http://192.168.1.2:3000/?addr="+response.data.query);
			
			racer.address = $scope.racerAddr;
			racer.id = racerId;
			racer.ip = response.data.query;
			racer.setupEventListener();

			if(response.data.query !== $scope.racerAddr &&  addedIPs.indexOf(racer.ip) === -1){
				addedIPs.push(racer.ip);
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
	var completedCounter = 0;

	$rootScope.$on("processed", function(event, data){
		if(data.completed < 100) {	
			$rootScope.$broadcast("start", data.id);
		}
		else {
			completedCounter++;
			if(completedCounter === $scope.race.racers.length) {
				firstClick = true;
				stoppedCounter = -1;
				completedCounter = 0;
			}
		}
	});	

	$rootScope.$on("stopped", function(event, racerId){
		stoppedCounter++;
		console.log(stoppedCounter+" "+completedCounter);
		if(stoppedCounter + completedCounter === $scope.race.racers.length || stoppedCounter === 0) {
			for(var i = 0; i < $scope.race.racers.length; i++) {
				$scope.race.racers[i].completed = 0;
			}
			$rootScope.$broadcast("start", "all");
			stoppedCounter = 0;
		}
	});
	
	function start() {
		if(firstClick === true)
			$rootScope.$emit("stopped");
		else {
			$rootScope.$broadcast("stop");	
			console.log("broadcast stop");
		}
		firstClick = false;		
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
					console.log("emit processed");
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
				$rootScope.$on("start", function(event, message){
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