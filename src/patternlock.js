(function (factory) {
    var global = Function('return this')() || (0, eval)('this');
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], function($) {
            return factory($, global)
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'), global);
    } else {
        // Browser globals (global is window)
        global.PatternLock = factory(global.jQuery, global);
    }
}(function (undefined, window) {
    let patternEvent = {}
    if(false) {
        // mobile
        patternEvent.start = 'touchstart';
        patternEvent.move = 'touchmove';
        patternEvent.end = 'touchend';
    }else {
        // pc
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
        38: true, // pageup
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

    function PatternLock(undefined, options) {
        // test
        let svgNS = 'http://www.w3.org/2000/svg';
        let svgElement = document.createElementNS(svgNS, 'svg');
        svgElement.setAttribute('class', 'patternlock');
        svgElement.setAttribute('id', 'lock');
        svgElement.setAttribute('viewBox', '0 0 100 100');
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        let activesElement = document.createElementNS(svgNS, 'g');
        activesElement.setAttribute('class', 'lock-actives');
        let linesElement = document.createElementNS(svgNS, 'g');
        linesElement.setAttribute('class', 'lock-lines');

        let dotsElement = document.createElementNS(svgNS, 'g');
        dotsElement.setAttribute('class', 'lock-dots');
        
        for(let i = 0; i < 3; i++){
            for (let j = 0; j < 3; j++){
                let circleElement = document.createElementNS(svgNS, 'circle');
                circleElement.setAttribute('cx', 20 + (j * 30));
                circleElement.setAttribute('cy', 20 + (i * 30));
                circleElement.setAttribute('r', 2);
                dotsElement.appendChild(circleElement);
            }
        }

        let subSvgElement = document.createElementNS(svgNS, 'svg');

        svgElement.appendChild(activesElement);
        svgElement.appendChild(linesElement);
        svgElement.appendChild(dotsElement);
        svgElement.appendChild(subSvgElement);

        document.getElementById('testDiv').appendChild(svgElement);

        let svg = svgElement
        let self = this;
        let dots = dotsElement.childNodes
        let lines = linesElement
        let actives = activesElement
        var pt = svg.createSVGPoint();
        let code = []
        let currentline
        let currenthandler

        options = Object.assign(PatternLock.defaults, options || {})

        svg.addEventListener(patternEvent.start, (e)=> {
            clear();
            e.preventDefault();
            disableScroll();
            svg.addEventListener(patternEvent.move, discoverDot);
            
        });
        
        svg.addEventListener(patternEvent.end, (e)=>{
            // 이벤트 한번만
            document.removeEventListener(patternEvent.end, arguments.callee, false);
            end();

        })

        // Exported methods
        Object.assign(this, {
            clear,
            success,
            error,
            getPattern,
        })

        function success() {
            svg.classList.remove('error');
            svg.classList.add('success');
        }

        function error() {
            svg.classList.remove('success');
            svg.classList.add('error');
        }

        function getPattern() {
            //return parseInt(code.map((i) => dots.index(i)+1).join(''))
            let res = '', val = 0;
            code.map((i) => {
                val = 0; 
                dots.forEach((element, index) => {
                   if(element == i) {
                       val = index + 1;
                       res += val + '';
                   } 
                });
            })

            return res;
        }

        function end() {
            enableScroll()
            stopTrack(currentline)
            currentline && currentline.remove()
            svg.removeEventListener(patternEvent.move, discoverDot);
            let val = options.onPattern.call(self, getPattern())
            if (val === true) {
                success()
            } else if (val === false) {
                error()
            }
        }
        
        function childAllRemove(element) {
            while(element.hasChildNodes()) {
                element.removeChild(element.firstChild);
            }
        }
        
        function clear() {
            code = []
            currentline = undefined
            currenthandler = undefined
            svg.classList.remove('success');
            svg.classList.remove('error');
            childAllRemove(lines);
            childAllRemove(actives);
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
            for (let i = 0; i < code.length; i++) {
                if (code[i] === target) {
                    return true
                }
            }
            return false
        }

        function isAvailable(target) {
            for (let i = 0; i < dots.length; i++) {
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
                let pos = svgPosition(e.target, e)
                line.setAttribute('x2', pos.x)
                line.setAttribute('y2', pos.y)
                return false
            }
        }

        function discoverDot(e, target) {
            if (!target) {
                let {x, y} = getMousePos(e)
                target = document.elementFromPoint(x, y);
            }
            let cx = target.getAttribute('cx')
            let cy = target.getAttribute('cy')
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
            let x = target.getAttribute('cx')
            let y = target.getAttribute('cy')
            line.setAttribute('x2', x)
            line.setAttribute('y2', y)
        }

        function beginTrack(target) {
            code.push(target)
            let x = target.getAttribute('cx')
            let y = target.getAttribute('cy')
            var line = createNewLine(x, y)
            var marker = createNewMarker(x, y)
            actives.appendChild(marker)
            currenthandler = updateLine(line)
            svg.addEventListener(patternEvent.move, currenthandler);
            lines.appendChild(line);
            if(options.vibrate) vibrate()
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
                x: e.clientX || e.originalEvent.touches[0].clientX,
                y :e.clientY || e.originalEvent.touches[0].clientY
            }
        }

        function svgPosition(element, e) {
            let {x, y} = getMousePos(e)
            pt.x = x; pt.y = y;
            return pt.matrixTransform(element.getScreenCTM().inverse());
        }
    }


    PatternLock.defaults = {
        onPattern: () => {},
        vibrate: true,
    }


    return PatternLock
}));