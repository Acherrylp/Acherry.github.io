var gapApp = new angular.module('gapApp', ['ngRoute', 'ngSanitize', 'angularUtils.directives.dirPagination', 'ui.bootstrap', 'ui.select', 'daterangepicker', 'ui.bootstrap.datetimepicker', 'ui.grid', 'uiGmapgoogle-maps']);

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

gapApp.controller('DashboardCtrl', function($scope, $http, uiGmapIsReady){
	$scope.charts = {
		province:{
			apiUrl: 'api/statistics/province',
/* 			chartId: 'province', */
			chartType: 'donut'
		},producttype:{
			apiUrl: 'api/statistics/producttype',
/* 			chartId: 'producttype', */
			chartType: 'donut'
		},status:{
			apiUrl: 'api/statistics/status',
/* 			chartId: 'status', */
			chartType: 'bar'
		},device:{
			apiUrl: 'api/statistics/device',
/* 			chartId: 'device', */
			chartType: 'bar'
		},office:{
			apiUrl: 'api/statistics/office',
/* 			chartId: 'office', */
			chartType: 'donut'
		},productstatus:{
			apiUrl: 'api/statistics/productstatus',
/* 			chartId: 'productstatus', */
			chartType: 'table'
		},statusmap:{
			apiUrl: 'api/statistics/provincestatus',
			/* 			chartId: 'map', */
			chartType: 'map',
			markers: [],
			map: {
				center: {latitude: 13.7245995, longitude: 100.6331106}, 
				zoom: 5, 
				bounds: {}, 
				control: {},
				options: {}
			}
		}
	};
	angular.forEach($scope.charts, function(chart, id){
		$http.get(chart.apiUrl).success(function(response){
			switch(chart.chartType){
				case 'donut':
					Morris.Donut({
						element: id,
						data: response.items,
						colors: ['#85144b', '#f56954', '#f39c12', '#39cccc', '#00c0ef', '#0073b7', '#3c8dbc', '#001f3f', '#3d9970', '#00a65a', '#01ff70'],
						formatter: function (x) { return x + " ราย"; }
					});				
					break;
				case 'bar':
					Morris.Bar({
						element: id,
						resize: true,
						data: response.items,
						barColors: ['#00c0ef', '#00a65a', '#3c8dbc', '#f56954'],
						xkey: 'y',
						ykeys: response.keys,
						labels: response.keys,
						hideHover: 'auto'
					});
					break;
				case 'table':
					$scope.productstatus = response;
					break;
				case 'map':
					var items = response.items;
					window.chart = chart;
					angular.forEach(items, function(coords, key){
						var item = {
							id: key,
							coords: coords,
/* 							province: coords.province, */
/* 							product_status: coords.product_status, */
/* 							value: coords.value, */
							showWindow: false,
							closeClick: function(){
								item.showWindow = false;
/* 								$scope.$apply(); */
							},
							onClicked: function(){
								item.showWindow = true;
/* 								$scope.$apply(); */
							}
						};
						this.push(item);					
					}, chart.markers);

/* 					uiGmapIsReady.promise().then(function(instances) {
						var map = chart.map.control.getGMap();
						var control = chart.map.control;
						control.refresh();
					}); */
					break;
			}

		});
	});
});

gapApp.controller('SearchCtrl', function($scope, $http, $locale, $modal){
	window.scope = $scope;
	$locale.id = 'th-th';

	$scope.page = 1;
	$scope.modes = [{
		name: 'เกษตรกร',
		placeholder: 'ชื่อ-สกุล เกษตรกร',
		alias: 'farmer',
		field: 'farmer_name',
		templateUrl: 'tmpl/search-farmer.html'
	},{
		name: 'แปลงเพาะปลูก',
		placeholder: 'ชื่อแปลงเพาะปลูก',
		alias: 'site',
		field: 'site_name',
		templateUrl: 'tmpl/search-site.html'
	}];
	$scope.input = {
		standard_id: '',
		standard_option: '',
		product_type: '',
		product_status: '',
		startDate: '',
		endDate: '',
		province: '',
		district: '',
		subdistrict: '',
		start: 1,
		num: 25
	};
	$scope.mode = $scope.modes[0];
	$scope.siteProvinces = [];
	$scope.siteDistricts = [];
	$scope.siteSubdistricts = [];
	$scope.standardIds = [];
	$scope.standardOptions = [];
	$scope.productTypes = [];
	$scope.productStatuses = [];
	$scope.result = {
		items: null,
		totalItems: 0
	};
	
	$scope.search = function(){
		$http({
			method: 'GET',
			url: 'api/search/'+$scope.mode.alias,
			params: $scope.input
		}).success(function(response){
			$scope.result = response;
		});		
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

	$scope.farmerOpen = function (farmer_id) {
		var modalInstance = $modal.open({
			templateUrl: 'tmpl/farmer.html',
			controller: 'FarmerCtrl',
			size: 'lg',
			backdrop: 'static',
			resolve: {
				farmer_id: function () {
					return farmer_id;
				}
			}
		});
	};
	
	$scope.siteOpen = function (site_uuid) {
		var modalInstance = $modal.open({
			templateUrl: 'tmpl/site.html',
			controller: 'SiteCtrl',
			size: 'lg',
			backdrop: 'static',
			resolve: {
				site_uuid: function () {
					return site_uuid;
				}
			}
		});
	};
	
	$http.get('api/standardIds').success(function(response){
		$scope.standardIds = response;
	});
 	$http.get('api/siteProvinces').success(function(response){
		$scope.siteProvinces = response;
	});

	$http.get('api/standardOptions').success(function(response){
		$scope.standardOptions = response;
	});
 	$http.get('api/productTypes').success(function(response){
		$scope.productTypes = response;
	});
	$http.get('api/productStatuses').success(function(response){
		$scope.productStatuses = response;
	});
	
	$scope.$watch('input.province', function(newProvince, oldProvince){
		if(newProvince !== ''){
			$http.get('api/siteDistricts/'+newProvince).success(function(response){
				$scope.siteDistricts = response;
				$scope.input.district = '';
				$scope.input.subdistrict = '';
			});
		}
	});
	
	$scope.$watch('input.district', function(newDistrict, oldDistrict){
		if(newDistrict !== ''){
			$http.get('api/siteSubdistricts/'+$scope.input.province+'/'+newDistrict).success(function(response){
				$scope.siteSubdistricts = response;
				$scope.input.subdistrict = '';
			});			
		}
	});	
	
	$scope.$watch('page', function(newPage, oldPage){
		if(newPage != oldPage){
			$scope.input.start = ((newPage - 1) * $scope.input.num) + 1;
			$scope.search();
		}
	});
	
	$scope.modeChanged = function(){
		$scope.result = {
			items: null,
			totalItems: 0
		};
		delete $scope.input.farmer_name;
		delete $scope.input.site_name;
/* 		$scope.$apply(); */
	};
	
	$scope.setPage = function(page){
		$scope.page = page;
	};
});

gapApp.controller('FarmerCtrl', function($scope, $http, $modalInstance, $modal, farmer_id){
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

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
	
	$scope.open = function (site_uuid) {
		var modalInstance = $modal.open({
			templateUrl: 'tmpl/site.html',
			controller: 'SiteCtrl',
			size: 'lg',
			backdrop: 'static',
			resolve: {
				site_uuid: function () {
					return site_uuid;
				}
			}
		});
	};
});

gapApp.controller('FarmersCtrl', function($scope, $http, $filter, $locale, $modal){
	$locale.id = 'th-th';
	$scope.page = 1;
	$scope.items = [];
	$scope.farmers = {
		items: null,
		totalItems: 0
	};
	$scope.input = {
		filter: '',
		start: 1,
		num: 25
	};
	$scope.view = {};
	$scope.gridOptions = {
		enableFiltering: true,
		columnDefs: [
			{
				field: 'name',
				displayName: 'ชื่อ - สกุล',
				cellTemplate: '<div class="ui-grid-cell-contents"><a ng-click="getExternalScopes().open(row.entity.id)">{{COL_FIELD}}</a></div>'
			},{
				field: 'gender',
				displayName: 'เพศ'
			},{
				field: 'age',
				displayName: 'อายุ'
			},{
				field: 'address',
				displayName: 'ที่อยู่'
			}
		],
		enableColumnMenus: false,
		data: []
	};
	$scope.view.open = function (farmer_id) {
		console.log(farmer_id);
		var modalInstance = $modal.open({
			templateUrl: 'tmpl/farmer.html',
			controller: 'FarmerCtrl',
			size: 'lg',
			backdrop: 'static',
			resolve: {
				farmer_id: function () {
					return farmer_id;
				}
			}
		});
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
	
	$scope.list = function(){
		$http({
			method: 'GET',
			url: 'api/farmers',
			params: $scope.input
		}).success(function(response){
			$scope.farmers = response;
			angular.forEach(response.items, function(farmer, index){
				var item = {
					id: farmer.person_id,
					name: farmer.prename+farmer.firstname+' '+farmer.lastname,
					gender: $scope.getGender(farmer.sex),
					age: $scope.getAge(farmer.birthdate)+' ('+$filter('date')(farmer.birthdate, 'mediumDate')+')',
					address: 
						(farmer.house_no ? 'บ้านเลขที่ ' + farmer.house_no : '') + ' ' + 
						(farmer.village ? 'หมู่บ้าน ' + farmer.village : '') + ' ' + 
						(farmer.township ? 'หมู่ที่ ' + farmer.township : '') + ' ' + 
						(farmer.road ? 'ถนน ' + farmer.road : '') + 
						(farmer.subdistrict + ' ' + farmer.district + ' ' + farmer.province + ' ' + farmer.postcode)

				};
				this.push(item);
			}, $scope.gridOptions.data);
		});		
	};

	$scope.$watch('page', function(newPage, oldPage){
		$scope.input.start = ((newPage - 1) * $scope.input.num) + 1;
		$scope.list();
	});
});

gapApp.controller('SiteCtrl', function($scope, $http, $modalInstance, $modal, uiGmapGoogleMapApi, site_uuid){
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
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
	
	$scope.open = function (boundary) {
		uiGmapGoogleMapApi.then(function(maps) {
			var latlngs = _.sortBy(boundary, function(latlng){
				return latlng.no;
			});
			var path = [];
			var bounds = new maps.LatLngBounds();
			for(var i in latlngs){
				var latlng = new maps.LatLng(latlngs[i].lat, latlngs[i].lng);
				path[i] = latlng;
				bounds.extend(latlng);
			}
			var modalInstance = $modal.open({
				templateUrl: 'tmpl/product.html',
				controller: 'ProductCtrl',
				size: 'lg',
				backdrop: 'static',
				resolve: {
					boundary: function () {
						return {path: path, bounds: bounds}; 
					}
				}
			});
		});
	};
});

gapApp.controller('SitesCtrl', function($scope, $http, $modal){
	$scope.page = 1;
	$scope.sites = {
		items: null,
		totalItems: 0
	};
	$scope.input = {
		filter: '',
		start: 1,
		num: 25
	};
	
	$scope.open = function (site_uuid) {
		var modalInstance = $modal.open({
			templateUrl: 'tmpl/site.html',
			controller: 'SiteCtrl',
			size: 'lg',
			backdrop: 'static',
			resolve: {
				site_uuid: function () {
					return site_uuid;
				}
			}
		});
	};
	$scope.list = function(){
		$http({
			method: 'GET',
			url: 'api/sites',
			params: $scope.input
		}).success(function(response){
			$scope.sites = response;
		});		
	};
	
	$scope.$watch('page', function(newPage, oldPage){
		$scope.input.start = ((newPage - 1) * $scope.input.num) + 1;
		$scope.list();
	});
});

gapApp.controller('ProductCtrl', function($scope, $http, $modalInstance, uiGmapIsReady, boundary){
	$scope.boundary = boundary.path;
	$scope.bounds = boundary.bounds;
	$scope.fill =  {
		color: '#46D6C5',
		opacity: 0.5
	};
	$scope.stroke = {
		color: '#3EC0B1',
		weight: 1	
	};
	$scope.map = {
		center: {
			latitude: 13.7245995,
			longitude: 100.6331106
		}, 
		zoom: 15, 
		bounds: {}, 
		control: {},
		options: {
			mapTypeId: "hybrid"
		}
	};
/* 	uiGmapGoogleMapApi.then(function(maps) {
		console.log("maps",maps);
		console.log('control',$scope.map.control);
    }); */
	uiGmapIsReady.promise().then(function(instances) {
		var map = $scope.map.control.getGMap();
		var control = $scope.map.control;
		control.refresh();
		map.fitBounds($scope.bounds);
		map.setMapTypeId('hybrid');

/* 		instances.forEach(function(inst) {
			console.log('inst.map', inst.map);
		}); */
	});
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});

gapApp.controller('ProductsCtrl', function($scope, $http, $modal, uiGmapGoogleMapApi){
	$scope.page = 1;
	$scope.products = {
		items: null,
		totalItems: 0
	};
	$scope.input = {
		filter: '',
		start: 1,
		num: 25
	};
	
	$scope.open = function (boundary) {
		uiGmapGoogleMapApi.then(function(maps) {
			var latlngs = _.sortBy(boundary, function(latlng){
				return latlng.no;
			});
			var path = [];
			var bounds = new maps.LatLngBounds();
			for(var i in latlngs){
				var latlng = new maps.LatLng(latlngs[i].lat, latlngs[i].lng);
				path[i] = latlng;
				bounds.extend(latlng);
			}
			var modalInstance = $modal.open({
				templateUrl: 'tmpl/product.html',
				controller: 'ProductCtrl',
				size: 'lg',
				backdrop: 'static',
				resolve: {
					boundary: function () {
						return {path: path, bounds: bounds}; 
					}
				}
			});
		});
	};
	
	$scope.list = function(){
		$http({
			method: 'GET',
			url: 'api/products',
			params: $scope.input
		}).success(function(response){
			$scope.products = response;
		});		
	};
	
	$scope.$watch('page', function(newPage, oldPage){
		$scope.input.start = ((newPage - 1) * $scope.input.num) + 1;
		$scope.list();
	});

});

gapApp.controller('ApiCtrl', function($scope, $http, $modal){
	$scope.response = null;
	$scope.params = '';
	$scope.apis = [
		{entity: 'farmer', method: 'index', alias: 'รายการเกษตรกร', url: 'api/farmers'},
		{entity: 'site', method: 'index', alias: 'รายการแปลงเพาะปลูก', url: 'api/sites'},
		{entity: 'product', method: 'index', alias: 'รายการการตรวจประเมิน', url: 'api/products'},
		{entity: 'address', method: 'index', alias: 'ค้นหารหัสที่อยู่', url: 'api/addresses'},
		{entity: 'farmer', method: 'show', alias: 'ช้อมูลเกษตรกร', url: 'api/farmer/'},
		{entity: 'site', method: 'show', alias: 'ข้อมูลแปลงเพาะปลูก', url: 'api/site/'},
		{entity: 'product', method: 'show', alias: 'ข้อมูลการตรวจประเมิน', url: 'api/product/'},
		{entity: 'address', method: 'show', alias: 'ช้อมูลที่อยู่', url: 'api/address/'}
	];
	$scope.api = {
		input: {},
		selected: $scope.apis[0],
		fields: [],
		request: function(){
/* 			$scope.buildParams(); */
			$http.get($scope.api.selected.url+$scope.params).success(function(response){
				$scope.response = response;
			});
		}
	};
	$scope.buildParams = function(){
		var params = [];
		angular.forEach($scope.api.input, function(value, key){
			if(value !== ''){
				params.push(key+'='+value);
			}
		});
		switch($scope.api.selected.method){
			case 'index':
				if(params.length > 0){
					$scope.params = '?'+(params.join('&'));	
				}else{
					$scope.params = '';
				}
				break;
			case 'show':
				$scope.params = ($scope.api.input.id !== undefined && $scope.api.input.id.length > 0)?$scope.api.input.id:'{id}';
				break;
		}
	};
	$scope.open = function (page) {
		var modalParams = {backdrop: 'static'};
		switch(page){
			case 'register':
				modalParams.templateUrl = 'tmpl/api-register.html';
				modalParams.controller = 'ApiRegisterCtrl';
				break;
			case 'retrieve':
				modalParams.templateUrl = 'tmpl/api-retrieve.html';
				modalParams.controller = 'ApiRetrieveCtrl';
				break;
			default:
				return;
		}
		var modalInstance = $modal.open(modalParams);
	};
	angular.forEach($scope.apis, function(api, key){
		$http.get('api/fields/'+api.entity+'.'+api.method).success(function(response){
			$scope.api.fields[api.entity+'.'+api.method] = response;
		});		
	});
});

gapApp.controller('ApiRegisterCtrl', function($scope, $http, $modalInstance){
	$scope.submitted = false;
	$scope.response = null;
	$scope.api = {
		name_org: '',
		contact_org: '',
		tel_org: '',
		email_org: ''
	};
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
	
	$scope.submit = function(valid){
		$scope.submitted = valid;
		var req = {};
/* 		console.log($scope.api); */
		$http({
			method: 'POST',
			url: 'api/key',
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			data: $.param($scope.api)
		}).success(function(response){
			$scope.response = response;
		});
	};
});

gapApp.controller('ApiRetrieveCtrl', function($scope, $http, $modalInstance){
	$scope.submitted = false;
	$scope.response = null;
	$scope.api = {
		email_org: ''
	};
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
	
	$scope.submit = function(valid){
		$scope.submitted = valid;
/* 		console.log($scope.api); */
		$http({
			method: 'GET',
			url: 'api/key',
			params: $scope.api
		}).success(function(response){
			$scope.response = response;
		});
	};
});

gapApp.controller('AboutCtrl', function($scope, $http){

});

gapApp.controller('ExportCtrl', function($scope, $http){

});