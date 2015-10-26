/**
 * A shorter console.log helper.
 * @param {object} one or more objects.
 */
var l = console.log.bind(console);

/**
 * Gets an element by its id attribute.
 * @param {string} The id of the target element.
 */
var byId = function byId(id) {
    return document.getElementById(id);
};

var byTagName = function byTagName(tagName, start) {
    start = start || document;
    return start.getElementsByTagName(tagName);
};

var createNode = function createNode(tagName) {
    return document.createElement(tagName);
};

var createText = function createText(str) {
    return document.createTextNode(str);
};

/**
 * Prepara dados para envio por ajax.
 *
 * @param {mixed} data Um Objeto ou Array que será serializado.
 * @return {string} Uma string com os dados serializados, prontos para o envio por ajax.
 */
function serialize( data ) {
    var arr = [];

    if ( data.constructor == Array ) {
        for ( var z = 0; z < data.length; ++z ) {

            // Assume que são campos de formulário.
            arr.push( data[ z ].name + '=' + encodeURIComponent( data[ k ].value ) );
        }
    }
    else {
        for ( var key in data ) {
            arr.push( key + '=' + encodeURIComponent( data[ key ] ) );
        }
    }

    return arr.join('&');
}

/**
 * NO MOMENTO ESSA FUNÇÃO SÓ FUNCIONA PARA RETORNO TEXTO / HTML (não suporta xml ainda).
 */
function ajax( options ) {

    /**
     * Seta os parâmetors que o usuário passou o coloca
     * valores default.
     */
    var args = {
        'type': options.type || 'POST',
        'url': options.url || '',
        'data': options.data || '',
        'hasFiles': options.hasFiles || false,
        'time': options.timeout || 60000,
        'onSuccess': options.onSuccess || function(){}
    };

    // Variável para controltar o tempo que o request será considerado "expirado".
    var requestTimeOut = false;

    // Daqui args.time milisegundos vamos considerar o request expirado.
    setTimeout( function() {
        requestTimeOut = true;
    }, args.time);

    /**
     * Verifica se está tudo OK.
     */
    function checkRequestStatus() {
        return xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304) && ! requestTimeOut;
    }

    if ( window.XMLHttpRequest ) {

        var xhr = new XMLHttpRequest();

        if ( args.type === 'GET' ) {
            args.url += '?' + serialize( args.data );
        }

        xhr.open(args.type, args.url, true);

        // O handler do onreadystatechange deve ser realmente definido/chamado
        // antes do .send().
        xhr.onreadystatechange = function() {

            if ( checkRequestStatus() ) {
                // TODO: Nem sempre será texto. Melhorar isso.
                args.onSuccess( xhr.responseText );
            }
        }

        /**
         * Se estamos enviando arquivos, assumimos que estamos usando XHR2,
         * o que no caso não se define headers nem nada.
         */
        if ( ! args.hasFiles ) {
            // Seta o header necessário.
            xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
        }

        if ( args.hasFiles ) {
            //out( 'Making a _POST_ request and sending file(s)...' );
            xhr.send( args.data );
        }
        else if ( args.type === 'GET' ) {
            //out( 'Making a _GET_ request...' );
            // Com GET os dados vão na url.
            xhr.send(null);
        }
        else {
            //out( 'Making a _POST_ request...' );
            // Com POST os dados vão como parâmetro do .send().
            xhr.send( serialize( args.data ) );
        }
    }
    else {
        alert('O seu navegador é muito antigo.');
    }
}

/**
 * Finds the position X left of an element in relation to the whole page.
 * Uses recursion.
 */
function pageX(elem) {

    //
    // While we can find an offsetParent, add it to what we
    // already have.
    //
    if (elem.offsetParent) {
        return elem.offsetLeft + pageX(elem.offsetParent);
    }

    return elem.offsetLeft;
}


/**
 * Finds the position Y top of an element in relation to the whole page.
 * Uses recursion.
 */
function pageY(elem) {

    //
    // While we can still find an offsetParent, add it to
    // the offset we already have.
    //
    if (elem.offsetParent) {
        l(elem.offsetParent);
        return elem.offsetTop + pageY(elem.offsetParent);
    }

    return elem.offsetTop;
}

function getStyle(elem, name) {

    if (elem.style[name]) {
        l('elem.style[name]');
        return elem.style[name];
    }

    else if (document.defaultView && document.defaultView.getComputedStyle) {
        l('defaultView.getComputedStyle');
        name = name.replace(/([A-Z])/g, '-$1');
        name = name.toLowerCase();
        var style = document.defaultView.getComputedStyle(elem, '');
        return style && style.getPropertyValue(name);
    }
    // IE.
    else if (elem.currentStyle) {
        l('elem.currentStyle');
        return elem.currentStyle[name]
    }

    l('null');
    return null;
}

/**
 * Loads one of more css files.
 * @param {mixed} either a string or an array.
 */
var loadCss = function loadCss(paths) {
    //
    // In this case, we can't handle the argument. Bailing out.
    //
    if (arguments.length !== 1) return false;

    //
    // Make it an array in case it is not yet.
    //
    if (paths.constructor !== Array) {
        paths = [paths];
    }

    paths.forEach(function(strHref) {
        var e = createNode('link');
        e.href= strHref + '?' + new Date().getTime();
        e.type = 'text/css';
        e.rel = 'stylesheet';
        byTagName('head')[0].appendChild(e);
    });
};
