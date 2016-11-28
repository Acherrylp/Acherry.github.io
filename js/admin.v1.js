var gapApp = new angular.module('gapApp', ['ngRoute', 'ngSanitize', 'angularUtils.directives.dirPagination', 'ui.bootstrap', 'ui.select', 'daterangepicker', 'ui.bootstrap.datetimepicker', 'uiGmapgoogle-maps']);

gapApp.config(function($routeProvider, uiSelectConfig, uiGmapGoogleMapApiProvider){
	$routeProvider.when('/dashboard', {
	 	templateUrl: 'tmpl/dashboard.html',
	 	controller: 'DashboardCtrl'
	});
	$routeProvider.when('/user_dashboard', {
	 	templateUrl: 'tmpl/dashboard_user.html',
	 	controller: 'DashboardCtrl'
	});
	$routeProvider.when('/search', {
	 	templateUrl: 'tmpl/search.html',
	 	controller: 'SearchCtrl'
	});
	$routeProvider.when('/farmers', {
	 	templateUrl: 'tmpl/farmers.html',
	 	controller: 'FarmersCtrl'
	});
	$routeProvider.when('/sites', {
	 	templateUrl: 'tmpl/sites.html',
	 	controller: 'SitesCtrl'
	});
	$routeProvider.when('/products', {
	 	templateUrl: 'tmpl/products.html',
	 	controller: 'ProductsCtrl'
	});
	$routeProvider.when('/api', {
	 	templateUrl: 'tmpl/api.html',
	 	controller: 'ApiCtrl'
	});
	$routeProvider.when('/export', {
	 	templateUrl: 'tmpl/export.html',
	 	controller: 'ExportCtrl'
	});
	$routeProvider.when('/about', {
		templateUrl: 'tmpl/about.html',
		controller: 'AboutCtrl'
	});
	$routeProvider.otherwise({
		redirectTo: '/dashboard'
	});
	uiSelectConfig.theme = 'selectize';
	uiGmapGoogleMapApiProvider.configure({
		key: 'AIzaSyDzsQPZ0pOhEaddE2U5Ct36kEG9SeRkUbY',
		v: '3.17',
		libraries: 'weather,geometry,visualization'
	});
});
gapApp.controller('MainCtrl', function($scope, $http, $location){
	$scope.is_active = function(tab){
		return ($location.path() === tab);
	};
});

gapApp.controller('DashboardCtrl', function($scope, $http){

});

gapApp.controller('SearchCtrl', function($scope, $http){
	window.scope = $scope;
	$scope.standardId = {};
	$scope.siteProvince = {};
	$scope.standardOption = {};
	$scope.productType = {};
	$scope.productStatus = {};
	$scope.dateRange = {startDate: null, endDate: null};
	$scope.search = function(){
		jQuery.get('api/search', jQuery('#searchForm').serialize(), function(response){
			$scope.results = response;
			$scope.$apply();
		});
	};
	$http.get('api/standardIds').success(function(response){
		$scope.standardIds = response;
	});
/* 	$http.get('api/siteProvinces').success(function(response){
		response.unshift({province:' '});
		$scope.siteProvinces = response;
	}); */
	$http.get('api/standardOptions').success(function(response){
		$scope.standardOptions = response;
	});
	$http.get('api/productTypes').success(function(response){
		$scope.productTypes = response;
	});
	$http('api/productStatuses').success(function(response){
		$scope.productStatuses = response;
	});
});

gapApp.controller('FarmerCtrl', function($scope, $http, $modalInstance, farmer_id){
	$scope.farmer_id = farmer_id;
	var req = {
		method: 'GET',
		url: 'api/sites',
		params: {
			farmer_id: farmer_id
		}
	};
	$http(req).success(function(response){
		$scope.sites = response.items;
		$scope.totalItems = response.totalItems;
	});
});

gapApp.controller('FarmersCtrl', function($scope, $http, $locale, $modal){
	$locale.id = 'th-th';
	$scope.farmers = [];
	window.scope = $scope;

	$scope.open = function (farmer_id) {
		var modalInstance = $modal.open({
			templateUrl: 'tmpl/farmer.html',
			controller: 'FarmerCtrl',
			size: 'lg',
			resolve: {
				farmer_id: function () {
					return farmer_id;
				}
			}
		});

/* 		modalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		}); */
	};
	
	$scope.getGender = function(sex){
		if(sex == 'male'){
			return 'ชาย';
		}else if(sex == 'female'){
			return 'หญิง';
		}else{
			return '';
		}
	};
	
	$scope.getAge = function(birthdate){
		return moment().diff(birthdate, 'years');
	};

    $scope.pageChanged = function(newPage) {
		console.log(newPage);
		var start = (newPage * 25) + 1;
		$http.get('api/farmers?start='+start).success(function(response){
			$scope.farmers = response.items;
			$scope.totalItems = response.totalItems;
		});
    };
	
	$http.get('api/farmers').success(function(response){
		$scope.farmers = response.items;
		$scope.totalItems = response.totalItems;
	});
});

gapApp.controller('SiteCtrl', function($scope, $http, $modalInstance, site_uuid){
	$scope.site_uuid = site_uuid;
	var req = {
		method: 'GET',
		url: 'api/products',
		params: {
			site_uuid: site_uuid
		}
	};
	$http(req).success(function(response){
		$scope.products = response.items;
		$scope.totalItems = response.totalItems;
	});
});

gapApp.controller('SitesCtrl', function($scope, $http, $modal){
	$scope.sites = [];
	$http.get('api/sites').success(function(response){
		$scope.sites = response.items;
		$scope.totalItems = response.totalItems;
	});
	$scope.open = function (site_uuid) {
		var modalInstance = $modal.open({
			templateUrl: 'tmpl/site.html',
			controller: 'SiteCtrl',
			size: 'lg',
			resolve: {
				site_uuid: function () {
					return site_uuid;
				}
			}
		});

/* 		modalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		}); */
	};
});

gapApp.controller('ProductCtrl', function($scope, $http, $modalInstance, boundary, center){
	$scope.boundary = boundary;
	$scope.fill =  {
		color: '#ff0000',
		opacity: 0.8
	};
	$scope.stroke = {
		color: '#6060FB',
		weight: 3	
	};
	$scope.map = {center: center/*{latitude: 40.1451, longitude: -99.6680 }*/, zoom: 15, bounds: {}};
/* 	$scope.boundary = [
            {
                id: 1,
                path: [
                    {
                        latitude: 50,
                        longitude: -80
                    },
                    {
                        latitude: 30,
                        longitude: -120
                    },
                    {
                        latitude: 20,
                        longitude: -95
                    }
                ],
                stroke: {
                    color: '#6060FB',
                    weight: 3
                },
                editable: true,
                draggable: true,
                geodesic: false,
                visible: true,
                fill: {
                    color: '#ff0000',
                    opacity: 0.8
                }
            }
        ]; */
	console.log('boundary', boundary);
/* 	uiGmapGoogleMapApi.then(function(maps) {

    });
	 */
/* 	$scope.getMap = function(boundary){
		var mapOptions = {
			zoom: 5,
			center: new google.maps.LatLng(24.886436490787712, -70.2685546875),
			mapTypeId: google.maps.MapTypeId.TERRAIN
		};

		var bermudaTriangle;
		console.log($('#map-product'));
		var map = new google.maps.Map($('#map-product'),
									  mapOptions);
		console.log(map);

		// Define the LatLng coordinates for the polygon's path.
		var triangleCoords = [
			new google.maps.LatLng(25.774252, -80.190262),
			new google.maps.LatLng(18.466465, -66.118292),
			new google.maps.LatLng(32.321384, -64.75737),
			new google.maps.LatLng(25.774252, -80.190262)
		];

		// Construct the polygon.
		bermudaTriangle = new google.maps.Polygon({
			paths: triangleCoords,
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.35
		});

		bermudaTriangle.setMap(map);
	};
	$scope.getMap(boundary); */
});

gapApp.controller('ProductsCtrl', function($scope, $http, $modal){
	$scope.products = [];
	
	$scope.toList = function(json){
		return JSON.parse(json).join(', ');
	};
	
	$scope.open = function (boundary) {
		var points = JSON.parse(boundary);
		console.log(points);
		console.log(new google.maps.LatLng(10,20));
		var path = [];
		var latmin,lngmin,latmax,lngmax;
		for(var i in points){
			if(latmin === undefined || points[i].lat < latmin){
				latmin = points[i].lat;
			}
			if(lngmin === undefined || points[i].lat < lngmin){
				lngmin = points[i].lng;
			}
			if(latmax === undefined || points[i].lat < latmax){
				latmax = points[i].lat;
			}
			if(lngmax === undefined || points[i].lng < lngmax){
				lngmax = points[i].lng;
			}
			
/* 						path[i] = new google.maps.LatLng(points[i].lat, points[i].lng); */
			path[i] = {
				latitude: points[i].lat,
				longitude: points[i].lng
			};
		}
		var center = {latitude: (latmin+latmax)/2, longitude: (lngmin+lngmax)/2};
		var modalInstance = $modal.open({
			templateUrl: 'tmpl/product.html',
			controller: 'ProductCtrl',
			size: 'lg',
			resolve: {
				boundary: function () {
/* 					var points = JSON.parse(boundary);
					console.log(points);
					console.log(new google.maps.LatLng(10,20));
					var path = [];
					var latmin,lngmin,latmax,lngmax;
					for(var i in points){
						if(latmin === undefined || points[i].lat < latmin){
							latmin = points[i].lat;
						}
						if(lngmin === undefined || points[i].lat < lngmin){
							lngmin = points[i].lng;
						}
						if(latmax === undefined || points[i].lat < latmax){
							latmax = points[i].lat;
						}
						if(lngmax === undefined || points[i].lng < lngmax){
							lngmax = points[i].lng;
						}
						var center = {latitude: (latmin+latmax)/2, longitude: (lngmin+lngmax)/2};
 						path[i] = new google.maps.LatLng(points[i].lat, points[i].lng); 
						path[i] = {
							latitude: points[i].lat,
							longitude: points[i].lng
						};
					}*/
					return path; 
				},
				center: function(){
					return center;
				}
			}
		});
	};
	
	$http.get('api/products').success(function(response){
		$scope.products = response.items;
		$scope.totalItems = response.totalItems;
	});
});

gapApp.controller('ApiCtrl', function($scope, $http){

});

gapApp.controller('AboutCtrl', function($scope, $http){

});