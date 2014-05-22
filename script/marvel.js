/*
 *	Integración y paginado de la API de Marvel
 *	Pedro Gutiérrez
 */

function _addEvent(event,func,o){o=o?o:window; return (!Boolean(window.addEventListener)?o.attachEvent('on'+event,func):o.addEventListener(event,func,false));}


function MarvelAPI(key, sType, search, onInit, onNext, onLoading){
	var targetsPerPage = 12; // Tarjetas por página
	var timeFromLastReturn = 300; // Tiempo pasado desde la última devolución

	this.actualPage = 1;
	this.totalTargets = 0;
	this.lastPageReturned = 0;
	this.key = key;
	this.sType = sType;
	this.search = search;
	this.onLoading = onLoading;
	this.onInit = onInit;
	this.onNext = onNext;
	this.lastTimeout;

	this.results = [];

	this.ajaxIsBusy = false;

	var queries = {
		char: "http://gateway.marvel.com:80/v1/public/characters?nameStartsWith={{search}}&limit={{limit}}&offset={{offset}}&apikey={{key}}",
		comic: "http://gateway.marvel.com:80/v1/public/comics?titleStartsWith={{search}}&limit={{limit}}&offset={{offset}}&apikey={{key}}",
		serie: "http://gateway.marvel.com:80/v1/public/series?titleStartsWith={{search}}&limit={{limit}}&offset={{offset}}&apikey={{key}}"
	};
	var filters = [
		["name"],
		["title"],
		["thumbnail"],
		["description"],
		["comics", "available"],
		["series", "available"],
		["pageCount"],
		["prices"],
		["endYear"],
		["startYear"]
	];

	// Al construir el objeto
	this.init = function(){
		this.AJAX(this.genURL(targetsPerPage * 2, 0),function(ajax, objThis){
			var data = JSON.parse(ajax.responseText);
			objThis.onGetInitialData(data.data);
		});
	}

	// Al cargar la información inicial
	this.onGetInitialData = function(APIData){
		this.storeResults(APIData);
		this.totalTargets = APIData.total;
		this.lastPageReturned = (new Date()).getTime();
		this.onInit(this.sType, this.getResult(targetsPerPage, 0), this.totalTargets);
	}

	// Paginación
	this.getData = function(limit, offset){
		this.AJAX(this.genURL(limit, offset),function(ajax, objThis){
			var data = JSON.parse(ajax.responseText);
			objThis.onGetData(data.data);
		});
	}

	// Al cargar información (de paginación)
	this.onGetData = function(APIData){
		this.storeResults(APIData);
		this.nextPage();
	}

	// Selecciona la página de resultados
	this.nextPage = function(){
		var actualOffset = targetsPerPage * (this.actualPage);
		var nextOffset = targetsPerPage * (this.actualPage + 1);

		if(actualOffset < this.totalTargets){
			if(actualOffset <= this.results.length){
				if((this.lastPageReturned  + timeFromLastReturn) > (new Date()).getTime()){
					return false;
				}
				if(	nextOffset >= this.results.length &&
					nextOffset < this.totalTargets &&
					!this.ajaxIsBusy)
						this.getData(targetsPerPage * 2, nextOffset)

				this.onNext(this.getResult(targetsPerPage, actualOffset));
				this.actualPage++;
				this.lastPageReturned = (new Date()).getTime();

			}else if(this.ajaxIsBusy){
				if(!!this.lastTimeout) clearTimeout(this.lastTimeout);
				var objThis = this;
				this.lastTimeout = setTimeout(function(){objThis.nextPage()}, 100);
			}

		}
	}

	// Almacena los resultados
	this.storeResults = function(APIData){
		var results = filterResults(APIData.results, filters);
		for(var n in results){
			if(isNaN(n)) continue;

			results[n].index = this.results.length;
			this.results.push(results[n]);
		}
	}

	// Devuelve un rango de resultados
	this.getResult = function(limit, offset){
		return this.results.slice(offset, offset + limit);
	}

	this.AJAX = function(URL, onReady, onError){
		var onReady = onReady ? onReady : function(){};
		var onError = onError ? onError : function(){};
		var ajax = new XMLHttpRequest();
		
		// Captamos el objeto XMLHttpRequest()
		if(typeof XMLHttpRequest != 'undefined'){
			var ajax = new XMLHttpRequest();
		}else if(typeof ActiveXObject != 'undefined'){
			var ajax = (Number(navigator.appVersion.substr(0,3))>=5)?
				new ActiveXObject('Msxml2.XMLHTTP'):
				new ActiveXObject('Microsoft.XMLHTTP');
		}

		// Función que se ejecuta al recibir el resultado
		var objThis = this;
		ajax.onreadystatechange = function(){
			if(ajax.readyState == 4) {
				// Loaded
				objThis.ajaxIsBusy = false;
				objThis.onLoading(false);
				if(ajax.status == 200) {
					onReady(ajax, objThis);
				}else{
					onError();	
				}
			}
		}

		//enviando ajax
		ajax.open("GET", URL, true);
		ajax.send(null);
		this.ajaxIsBusy = true;
		this.onLoading(true);
	}

	this.genURL = function(limit, offset){
		var url = queries[this.sType];
		url = url.replace('{{search}}', this.search);
		url = url.replace('{{limit}}', limit);
		url = url.replace('{{offset}}', offset);
		url = url.replace('{{key}}', this.key);
		return encodeURI(url);
	}

	var filterResults = function(APIResults, filters){
		var newResults = [];

		for(var n in APIResults){
			if(isNaN(n)) continue;

			var newresult = {}

			for(var filter in filters){
				if(isNaN(filter)) continue;

				var actual = filters[filter];
				
				if(!APIResults[n][actual[0]] && isNaN(APIResults[n][actual[0]])) continue;
			
				if(actual.length == 1)
					newresult[actual[0]] = APIResults[n][actual[0]];

				if(actual.length == 2){
					newresult[actual[0]] = {};
					newresult[actual[0]][actual[1]] = APIResults[n][actual[0]][actual[1]];
				}
			}
			newResults.push(newresult);
		}
		return newResults;
	}

	this.init();
}
