var gapApp = new angular.module('gapApp', ['ngRoute', 'ngSanitize', 'angularUtils.directives.dirPagination', 'ui.bootstrap', 'ui.select', 'daterangepicker']);

gapApp.config(function($routeProvider, uiSelectConfig){
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
		response.unshift({standard_id:''});
		$scope.standardIds = response;
	});
	$http.get('api/siteProvinces').success(function(response){
		response.unshift({province:' '});
		$scope.siteProvinces = response;
	});
	$http.get('api/standardOptions').success(function(response){
		response.unshift({standard_options:' '});
		$scope.standardOptions = response;
	});
	$http.get('api/productTypes').success(function(response){
		response.unshift({product_type:' '});
		$scope.productTypes = response;
	});
	$http.get('api/productStatuses').success(function(response){
		response.unshift({product_status:' '});
		$scope.productStatuses = response;
	});
});

gapApp.controller('FarmersCtrl', function($scope, $http, $locale){
	$locale.id = 'th-th';
	$scope.farmers = [];
	window.scope = $scope;
	
	$scope.getAge = function(birthdate){
		return moment().diff(birthdate, 'years');
	};
	
	$http.get('api/farmers').success(function(response){
		$scope.farmers = response;
	});
});

gapApp.controller('SitesCtrl', function($scope, $http){
	$scope.sites = [];
	window.scope = $scope;
	$http.get('api/sites').success(function(response){
		$scope.sites = response;
	});
});

gapApp.controller('ProductsCtrl', function($scope, $http){
	$scope.products = [];
	window.scope = $scope;
	
	$scope.toList = function(json){
		return JSON.parse(json).join(', ');
	};
	$http.get('api/products').success(function(response){
		$scope.products = response;
	});
});

gapApp.controller('AboutCtrl', function($scope, $http){

});