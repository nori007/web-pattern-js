function PatternLock(options) {
    var patternEvent = {};
    var eventHandlers = {};
    var mode = (parent.innerWidth < parent.yt.vikie.getConfig().mobileMaxWidth) ? true : false;
    
    if(mode) {
        // mobile
        patternEvent.start = 'touchstart';
        patternEvent.move = 'touchmove';
        patternEvent.end = 'touchend';
    }else {
        // pc v
        patternEvent.start = 'mousedown';
        patternEvent.move = 'mousemove';
        patternEvent.end = 'mouseup';
    }
    var scrollKeys = {
        37: true, // left
        38: true, // up
        39: true, // right
        40: true, // down
        32: true, // spacebar
        // 38: true, // pageup
        33: true, // pageup
        34: true, // pagedown
        35: true, // end
        36: true, // home
    };

    function vibrate() {
        navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
        if (navigator.vibrate) {
            window.navigator.vibrate(25)
        }
    }
    
    var svgNS = 'http://www.w3.org/2000/svg';
    var svgElement = document.createElementNS(svgNS, 'svg');
    svgElement.setAttribute('class', 'patternlock');
    svgElement.setAttribute('id', 'lock');
    svgElement.setAttribute('viewBox', '0 0 100 100');
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    var activesElement = document.createElementNS(svgNS, 'g');
    activesElement.setAttribute('class', 'lock-actives');
    var linesElement = document.createElementNS(svgNS, 'g');
    linesElement.setAttribute('class', 'lock-lines');

    var dotsElement = document.createElementNS(svgNS, 'g');
    dotsElement.setAttribute('class', 'lock-dots');
    
    for(var i = 0; i < 3; i++){
        for (var j = 0; j < 3; j++){
            var circleElement = document.createElementNS(svgNS, 'circle');
            circleElement.setAttribute('cx', 20 + (j * 30));
            circleElement.setAttribute('cy', 20 + (i * 30));
            circleElement.setAttribute('r', 2);
            dotsElement.appendChild(circleElement);
        }
    }

    var subSvgElement = document.createElementNS(svgNS, 'svg');

    svgElement.appendChild(activesElement);
    svgElement.appendChild(linesElement);
    svgElement.appendChild(dotsElement);
    svgElement.appendChild(subSvgElement);

    var svg = svgElement
    var self = this;
    var dots = dotsElement.childNodes
    var lines = linesElement
    var actives = activesElement
    var pt = svg.createSVGPoint();
    var code = []
    var currentline
    var currenthandler

    svg.addEventListener(patternEvent.start, function(e){
        clear();
        e.preventDefault();
        disableScroll();
        svg.addEventListener(patternEvent.move, discoverDot);
        
    });
    
    svg.addEventListener(patternEvent.end, function(e){
        // 이벤트 한번만
        end();

    })

    function childAllRemove(element) {
        while(element.hasChildNodes()) {
            element.removeChild(element.firstChild);
        }
    }

    function addClassName(element, className) {
        if (element.classList) {
            element.classList.add(className);
        } else if (!(element.getAttribute('class').indexOf(className) > -1)) {
            element.setAttribute('class', element.getAttribute('class') + ' ' + className);
        }
    }

    function removeClassName(element, className) {
        if (element.classList) {
            element.classList.remove(className);
        } else if (element.getAttribute('class').indexOf(className) > -1) {
            element.setAttribute('class', element.getAttribute('class').replace(className, ' '));
        }
    }

    function removeElement(element) {
        var parent = element.parentNode;
        parent.removeChild(element);
    }
    
    function success() {
        removeClassName(svg, 'error');
        addClassName(svg, 'success');
    }

    function error() {
        removeClassName(svg, 'success');
        addClassName(svg, 'error');
    }

    function clear() {
        code = []
        currentline = undefined;
        currenthandler = undefined;
        console.log(svg.className);
        removeClassName(svg, 'success');
        removeClassName(svg, 'error');
        childAllRemove(lines);
        childAllRemove(actives);
    }

    function getPattern() {
        var res = '', val = 0;
        code.map(function(i){
            val = 0; 
            for(var j = 0; j < dots.length; j++) {
                if(dots[j] == i) {
                    val = j + 1;
                    res += val + '';
                }
            }
        })

        return res;
    }

    function end() {
        enableScroll()
        stopTrack(currentline)
        //currentline && currentline.remove()
        removeElement(currentline);
        svg.removeEventListener(patternEvent.move, discoverDot);
        var val = getPattern();
        if(val == '' || val == undefined) {
            error()
        }else {
            success()
        }

        if(typeof eventHandlers['done'] === 'function') {
            eventHandlers['done'](val);
        }
    }
    

    function preventDefault(e) {
        e = e || window.event;
        if (e.preventDefault)
            e.preventDefault();
        e.returnValue = false;
    }

    function preventDefaultForScrollKeys(e) {
        if (scrollKeys[e.keyCode]) {
            preventDefault(e);
            return false;
        }
    }

    function disableScroll() {
        if (window.addEventListener) // older FF
            window.addEventListener('DOMMouseScroll', preventDefault, false);
        window.onwheel = preventDefault; // modern standard
        window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
        window.ontouchmove = preventDefault; // mobile
        document.onkeydown = preventDefaultForScrollKeys;
    }

    function enableScroll() {
        if (window.removeEventListener)
            window.removeEventListener('DOMMouseScroll', preventDefault, false);
        window.onmousewheel = document.onmousewheel = null;
        window.onwheel = null;
        window.ontouchmove = null;
        document.onkeydown = null;
    }

    function isUsed(target) {
        for (var i = 0; i < code.length; i++) {
            if (code[i] === target) {
                return true
            }
        }
        return false
    }

    function isAvailable(target) {
        for (var i = 0; i < dots.length; i++) {
            if (dots[i] === target) {
                return true
            }
        }
        return false
    }

    function updateLine(line) {
        return function(e) {
            e.preventDefault()
            if (currentline !== line) return
            var pos = svgPosition(e.target, e)
            line.setAttribute('x2', pos.x)
            line.setAttribute('y2', pos.y)
            return false
        }
    }

    function discoverDot(e, target) {
        if (!target) {
            var location = getMousePos(e)
            target = document.elementFromPoint(location.x, location.y);
        }
        var cx = target.getAttribute('cx')
        var cy = target.getAttribute('cy')
        if (isAvailable(target) && !isUsed(target)) {
            stopTrack(currentline, target)
            currentline = beginTrack(target)
        }
    }

    function stopTrack(line, target) {
        if (line === undefined) return
        if (currenthandler) {
            svg.removeEventListener(patternEvent.move, currenthandler);
        }
        if (target === undefined) return
        var x = target.getAttribute('cx')
        var y = target.getAttribute('cy')
        line.setAttribute('x2', x)
        line.setAttribute('y2', y)
    }

    function beginTrack(target) {
        code.push(target)
        var x = target.getAttribute('cx')
        var y = target.getAttribute('cy')
        var line = createNewLine(x, y)
        var marker = createNewMarker(x, y)
        actives.appendChild(marker)
        currenthandler = updateLine(line)
        svg.addEventListener(patternEvent.move, currenthandler);
        lines.appendChild(line);
        vibrate()
        return line
    }

    function createNewMarker(x, y) {
        var marker = document.createElementNS(svgNS, "circle")
        marker.setAttribute('cx', x)
        marker.setAttribute('cy', y)
        marker.setAttribute('r', 6)
        return marker
    }

    function createNewLine(x1, y1, x2, y2) {
        var line = document.createElementNS(svgNS, "line")
        line.setAttribute('x1', x1)
        line.setAttribute('y1', y1)
        if (x2 === undefined || y2 == undefined) {
            line.setAttribute('x2', x1)
            line.setAttribute('y2', y1)
        } else {
            line.setAttribute('x2', x2)
            line.setAttribute('y2', y2)
        }
        return line
    }

    function getMousePos(e) {
        return {
            x: e.clientX || ((e.originalEvent) ? e.originalEvent.touches[0].clientX : e.touches[0].clientX),
            y: e.clientY || ((e.originalEvent) ? e.originalEvent.touches[0].clientY : e.touches[0].clientY)
        }
    }

    function svgPosition(element, e) {
        var location = getMousePos(e)
        pt.x = location.x; pt.y = location.y;
        return pt.matrixTransform(element.getScreenCTM().inverse());
    }

    return {
        getSVG: function() { return svg },
        getPattern: getPattern,
        addEventListener: function(name, handler) {
            switch(name) {
                case 'done':
                if(eventHandlers.hasOwnProperty(name)) return;
                eventHandlers[name] = handler;
                break;
            }
        }
    }
};