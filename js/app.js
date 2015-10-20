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
		
		/*var promise = $http.get("http://ip-api.com/json/"+$scope.racerAddr);
		promise.then(function(response){
			var racer = null;
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				racer = racerFactory("http://89.143.151.155:3000/?addr="+response.data.query);
			}
			else
				racer = racerFactory("http://192.168.1.2:3000/?addr="+response.data.query); */
			
			racer = racerFactory("http://192.168.1.2:3000/?addr="+ "89.143.249.230");
			racer.address = $scope.racerAddr;
			racer.id = racerId;
			//response.data.query = "89.143.249.230";
			racer.ip = "89.143.249.230";
			racer.setupEventListener();

			if(/*response.data.query !== $scope.racerAddr &&  */addedIPs.indexOf(racer.ip) === -1){
				addedIPs.push(racer.ip);
				$scope.race.racers.push(racer);
				$scope.race.numRacers = $scope.race.racers.length;
				racerId++;
				
			}
			else
				alert("no matching ip for this domain or ip is already active");
		//});	
	}
	var req = 0;

	function stopRace() {
		$rootScope.$broadcast("stop");
		req = 0;
	}

	$rootScope.$on("processed", function(event, data){
		console.log("on processed"+data);
		req++;
		if(req < 100)
			$rootScope.$broadcast("start");
		if(req === 100)
			$rootScope.$emit("finish");
	});

	$rootScope.$on("stopped", function(){
		console.log("on stopped")
		req = 0;
		$scope.race.racers[0].currentRequests = 0;
		$scope.race.racers[0].totalTime = 0;
		$rootScope.$broadcast("start");

	});

	var firstClick = true;

	$rootScope.$on("finish", function(){
		firstClick = true;
	});
	

	function start() {
		if(firstClick === true)
			$rootScope.$emit("stopped");
		else
			stopRace();	
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
					$rootScope.$emit("processed", [racer.id]);
					console.log("emit processed");
				}
				else {
					$rootScope.$emit("stopped");
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
				$rootScope.$on("start", function(){
					console.log("on start");
					racer.goNextReq = true;
					processOneRequest(racer);
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