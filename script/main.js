function _(id){return (document.getElementById(id));}
function _name(name){return (document.getElementsByName(name)[0]);}
function _q(query){return (document.querySelector(query));}
function _query(query){return (document.querySelectorAll(query));}
function _class(className){return (_query('.'+className)[0]);}
function _addEvent(event,func,o){o=o?o:window; return (!Boolean(window.addEventListener)?o.attachEvent('on'+event,func):o.addEventListener(event,func,false));}
function _switchClass(o,className){o.classList.contains(className)?o.classList.remove(className):o.classList.add(className);}
function _cangueClass(o,className,remove){remove?o.classList.remove(className):o.classList.add(className);}
function _noNull(text){return text==null?'':text;}
var _get = {
	scroll: function(){ return document.documentElement.scrollTop || document.body.scrollTop;},
	scrollY: function(){ return document.documentElement.scrollLeft || document.body.scrollLeft;},
	windowHeight: function(){ return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;},
	windowWidth: function(){ return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;}
};


var INFO_MAX_HEIGHT = 220;
var TARGET_WIDTH = 270 + 20 + 20;
var TARGET_HEIGHT = 492 + 40;
var CONTENT_EXTRA_WIDTH = 20 + 20 + 16;
var CONTENT_EXTRA_HEIGHT = 170;
var CONTENT_SHOW_DELAY = 200;

var MARVEL_KEY = "f526f137d0d0411937e54a018676190d";

var MARVEL = null;

var MARVEL_BUFFER = {};





// Search
function searchOnEnter(e){
	if(e.keyCode == 13){
		searchInput();
	}
}
function search(sType, sSearch, sURLType){
	var onLoading = function(status){
		_cangueClass(_('load-bar'), 'loading', !status);
	}
	var onInit = function(type, APIResults, total){
		templateSystem.initial(type, APIResults, total);
	}
	var onNext = function(APIResults){
		templateSystem.addElements(APIResults);
	}
	var onError = function(code){
		var initial = 200;
		var interval = 300;
		var steps = 4;

		for(var i=0; i<steps; i++){
			if((i%2)==0)
				setTimeout(function(){_cangueClass(_('load-bar'), 'error');}, initial + (interval * i));
			else
				setTimeout(function(){_cangueClass(_('load-bar'), 'error', true);}, initial + (interval * i));
		}
	}

	if(sSearch != '' && (MARVEL ? MARVEL.genCode(sType, sSearch, sURLType) != MARVEL.getCode() : true)){
		_q('#load-bar .loaded').style.width = '0%';

		if(!!MARVEL){
			MARVEL.terminate();
			MARVEL_BUFFER[MARVEL.getCode()] = MARVEL;
		}

		if(MARVEL && MARVEL_BUFFER[MARVEL.genCode(sType, sSearch, sURLType)]){
			MARVEL = MARVEL_BUFFER[MARVEL.genCode(sType, sSearch, sURLType)];
			MARVEL.initCreated();
		}else
			MARVEL = new MarvelAPI(MARVEL_KEY, sType, sURLType, sSearch, onInit, onNext, onLoading, onError);

		crossScroll.hideControls();
		setTimeout(function(){crossScroll.hideControls();}, 100);
	}
}

// Search desde input
function searchInput(){
	var sType = _('search-opt').value;
	var sSearch = _('search').value;
	var sURLType = sType;

	if(sSearch == '') return false;

	document.location.href = encodeURI('#' + sType + ':' + sURLType + ':' + sSearch);
	searchFromURL();
}

// Search desde tarjeta
function searchTarget(sType, sSearch, sURLType){
	_('search').value = '';
	isWrote(_('search'));

	document.location.href = encodeURI('#' + sType + ':' + sURLType + ':' + sSearch);
	searchFromURL();
}

// Search desde URL
function searchFromURL(){
	var splitURL = decodeURI(document.location.href).split('#');

	if(splitURL.length <= 1)
		return false;

	splitURL = splitURL[1].split(':');
	var sType = splitURL[0];
	var sURLType = splitURL[1];
	var sSearch = splitURL[2];

	if(sURLType != sType){
		search(sType, sSearch, sURLType);
		return false;
	}
	
	_('search-opt').value = sType;
	_('search-type-' + sType).checked = true;
	changueOption(_('search-type-' + sType), true);
	_('search').value = sSearch;
	isWrote(_('search'));

	search(sType, sSearch, sURLType);
}


// Está vacío la búsqueda?
function isWrote(o){
	_cangueClass(o.parentElement, 'search-wrote', o.value === '');
}

// Vaciar búsqueda
function clearSearch(id){
	_(id).value = '';
	_cangueClass(_(id).parentElement, 'search-wrote', true);
}

// Mostrar y ocultar opciones
function showOptionObj(){
	this.canShow = true;
	this.isHidden = 0;
	this.changue = function(o){
		if(this.canShow){
			_switchClass(o, 'show-options');
			this.isHidden = 1;
		}else{
			this.canShow = true;
			this.isHidden = 0;
		}
	}
	this.hide = function(){
		if(this.isHidden == 2)
			_cangueClass(_('search-opt').parentElement, 'show-options', true);
		else if(this.isHidden == 1) this.isHidden = 2;
	}
}
var showOption = new showOptionObj();

// Cambiar de opción
function changueOption(o, fromSearch){
	var newValue = o.value;
	var title = o.parentElement.querySelector('span').innerHTML;

	while(!o.classList.contains('select-options'))
		o=o.parentElement;

	o.querySelector('input[type=hidden]').value = newValue;
	o.querySelector('span').innerHTML = title;
	if(!fromSearch) showOption.canShow = false;
}



// Movimientos del contenido
function crossScrollObj(onFinish, isFinish){
	window.scrollTo(0,0);
	this.size = 0;
	this.targets = 0;
	this.totalTargets = 0;
	this.onFinish = onFinish;
	this.isFinish = isFinish;
	this.isTouch = false;

	// Añadir nuevas tarjetas
	this.addTargets = function(n){
		this.targets += n;
	}

	// Dar tamaño a los contendedores para controlar el scroll
	this.setSizeToScroll = function(){

		var lines = contentLines();
		if(lines == 0) lines++;
		var targetsPerLine =  lines <= 1 ? this.targets : (Math.floor(this.targets/lines - 0.001) + 1) * lines;
		
		this.size = (TARGET_WIDTH * targetsPerLine);
		this.size /= lines;
		this.size += CONTENT_EXTRA_WIDTH;

		_('content').style.width = this.size + 'px';

		if(_get.windowWidth() < this.size)
			_('contentScroll').style.height = this.size + 'px';
		else
			_('contentScroll').style.height = '0px';
	}

	// Mover el contenedor de las tarjetas
	this.moveTargetsContainer = function(x, y){
		if(this.isTouch){
			this.loadInTouch(x, y);
			return false;
		}
		var scrollHeight = this.size - _get.windowHeight();
		var scroll = _get.scroll() / scrollHeight;
		var availableX = this.size - _get.windowWidth();
		var xPos = availableX * scroll;

		_('content').style.left = (-xPos) + 'px';

		if(_get.scroll() > (scrollHeight - this.isFinish)) onFinish();
	}

	// Cargar tarjetas con el scroll horizontal
	this.loadInTouch = function(x, y){
		var scrollWidth = this.size - _get.windowWidth();
		if(_get.scrollY() > (scrollWidth - this.isFinish)) onFinish();
	}

	// Muestra información relativa al número de tarjetas
	this.showInfo = function(){
		var loaded = this.targets / this.totalTargets;
		_q('#load-bar .loaded').style.width = (loaded * 100) + '%';
	}

	// Establecer si tiene entrada táctil
	this.isTouchScreen = function(touch){
		this.isTouch = touch;
		_cangueClass(document.body, 'touch', !touch);
	}

	// Establecer si tiene entrada táctil
	this.showControls = function(show){
		if(this.isTouch)
			_switchClass(document.body, 'hide-controls');
	}
	this.hideControls = function(){
		if(this.isTouch)
			_cangueClass(document.body, 'hide-controls');
	}

	// Ajustar número de líneas
	function contentLines(){
		var lines = Math.floor((_get.windowHeight() - CONTENT_EXTRA_HEIGHT) / TARGET_HEIGHT);
		_('content').className = 'line' + lines;
		return lines;
	}
}

var crossScroll =  new crossScrollObj(function(){MARVEL.nextPage()}, 500);


// Plantillas
function templateSystemObj(){

	this.actualType = null;
	this.index = 0;

	// Añadir inicialmente tarjetas
	this.initial = function(type, APIResults, total){
		this.actualType = type;
		this.index = 0;
		_('content').innerHTML = '';
		crossScroll =  new crossScrollObj(function(){MARVEL.nextPage()}, 500);
		crossScroll.totalTargets = total;
		crossScroll.isTouchScreen("ontouchstart" in document.documentElement);
		this.addElements(APIResults);
	}

	// Añadir tarjetas
	this.addElements = function(APIResults){
		var template = _('template-align').innerHTML;
		var eContent = _('content');

		switch(this.actualType){
			case "char": template += _('template-char').innerHTML.replace(/(\n|\t)/g, ''); break;
			case "comic": template += _('template-comic').innerHTML.replace(/(\n|\t)/g, ''); break;
			case "serie": template += _('template-serie').innerHTML.replace(/(\n|\t)/g, ''); break;
			case "story": template += _('template-story').innerHTML.replace(/(\n|\t)/g, ''); break;
		}

		crossScroll.addTargets(APIResults.length);
		crossScroll.setSizeToScroll();

		for(var n in APIResults){
			var temp = template;
			var result = APIResults[n];

			eContent.innerHTML += this.template[this.actualType](temp, result, --this.index);
		}

		collapseDescription();
		this.processLine();
		crossScroll.showInfo();
	}

	// Mostrar progresivamente tarjetas
	this.processLine = function(){
		var elem = _('content').querySelector('article.hidden');

		if(elem != null){
			elem.className = '';
			setTimeout(function(){
				templateSystem.processLine();
			}, CONTENT_SHOW_DELAY);
		}
	}

	this.template = {
		// Plantilla personaje
		char: function(temp, result, index){
			temp = temp.replace('{{index}}', index);
			temp = temp.replace('{{name}}', result.name);
			temp = temp.replace('{{thumbnail}}', result.thumbnail.path + "/landscape_xlarge." + result.thumbnail.extension);
			temp = temp.replace('{{description}}', _noNull(result.description));
			temp = temp.replace('{{series}}', result.series.available);
			temp = temp.replace('{{comics}}', result.comics.available);
			temp = temp.replace('{{stories}}', result.stories.available);
			temp = temp.replace(/\{\{haveseries\}\}/g, !!result.series.available);
			temp = temp.replace(/\{\{havecomics\}\}/g, !!result.comics.available);
			temp = temp.replace(/\{\{havestories\}\}/g, !!result.stories.available);
			temp = temp.replace(/\{\{id\}\}/g, result.id);
			return temp;
		},
		// Plantilla cómic
		comic: function(temp, result, index){
			temp = temp.replace('{{index}}', index);
			temp = temp.replace('{{title}}', result.title);
			temp = temp.replace('{{thumbnail}}', result.thumbnail.path + "/landscape_xlarge." + result.thumbnail.extension);
			temp = temp.replace('{{description}}', _noNull(result.description));
			temp = temp.replace('{{chars}}', result.characters.available);
			temp = temp.replace('{{pages}}', result.pageCount);
			temp = temp.replace('{{price}}', result.prices[0].price);
			temp = temp.replace(/\{\{havechars\}\}/g, !!result.characters.available);
			temp = temp.replace(/\{\{id\}\}/g, result.id);
			return temp;
		},
		// Plantilla serie
		serie: function (temp, result, index){
			var years = (result.endYear == 2099 ? (new Date()).getFullYear() : result.endYear) - result.startYear + 1;

			temp = temp.replace('{{index}}', index);
			temp = temp.replace('{{title}}', result.title);
			temp = temp.replace('{{thumbnail}}', result.thumbnail.path + "/landscape_xlarge." + result.thumbnail.extension);
			temp = temp.replace('{{description}}', _noNull(result.description));
			temp = temp.replace('{{comics}}', result.comics.available);
			temp = temp.replace('{{chars}}', result.characters.available);
			temp = temp.replace(/\{\{havecomics\}\}/g, !!result.comics.available);
			temp = temp.replace(/\{\{havechars\}\}/g, !!result.characters.available);
			temp = temp.replace('{{years}}', years + (years == 1 ? ' año' : ' años'));
			temp = temp.replace(/\{\{id\}\}/g, result.id);
			return temp;
		},
		// Plantilla historia
		story: function (temp, result, index){
			temp = temp.replace('{{index}}', index);
			temp = temp.replace('{{title}}', result.title);
			temp = temp.replace('{{thumbnail}}', "http://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available/landscape_xlarge.jpg");
			temp = temp.replace('{{description}}', _noNull(result.description));
			temp = temp.replace('{{comics}}', result.comics.available);
			temp = temp.replace('{{chars}}', result.characters.available);
			temp = temp.replace('{{crea}}', result.creators.available);
			temp = temp.replace(/\{\{havecomics\}\}/g, !!result.comics.available);
			temp = temp.replace(/\{\{havechars\}\}/g, !!result.characters.available);
			temp = temp.replace(/\{\{id\}\}/g, result.id);
			return temp;
		}
	}

	// Ajustar tamaño de descripción

	function collapseDescription(){
		var elements = _query('#content article.trim');

		for(var elem in elements){
			if(isNaN(elem)) continue;

			elements[elem].classList.remove('trim');

			var info = elements[elem].querySelector('.info');
			var desc = elements[elem].querySelector('.description');

			if(desc.textContent.length > 400){
				desc.textContent = desc.textContent.substr(0, 400);
			}
			while(info.offsetHeight > INFO_MAX_HEIGHT){
				var step = (info.offsetHeight-INFO_MAX_HEIGHT) > 34 ? 30 : 6;
				desc.textContent = desc.textContent.substr(0, desc.textContent.length - step) + '...';
			}
		}
	}
}

var templateSystem = new templateSystemObj();


// Saber si está focus o no el search
function searchFocus(focus){
	_cangueClass(document.body, 'searching', !focus);
}





// Eventos

// scroll
_addEvent('scroll', function(e){
	var x = e.clientX;
	var y = e.clientY;
	crossScroll.moveTargetsContainer(x, y);
	searchFocus(false);
});

// Resize
_addEvent('resize', function(){
	crossScroll.setSizeToScroll();
	window.scrollTo(0, _get.scroll() - 1);
	window.scrollTo(0, _get.scroll() + 1);
});

// Click
_addEvent('click', function(e){
	showOption.hide();
});

// Keyup
_addEvent('keyup', function(){
	showOption.hide();
});

// Page loaded
function LOAD(){
	searchFromURL();
}

// Comprobación de cambio de hash
function checkHashChangue(onChangue){
	this.hash = document.location.hash;
	this.onChangue = onChangue;

	this.check = function(){
		if(this.hash != document.location.hash){
			this.hash = document.location.hash;
			this.onChangue();
		}
		var objThis = this;
		setTimeout(function(){
			objThis.check();
		}, 150);
	}

	this.check();
}

new checkHashChangue(function(){
	searchFromURL();
});