if (!window._ua) {
    var _ua = navigator.userAgent.toLowerCase();
}

var browser = {
    version: (_ua.match(/.+(?:me|ox|on|rv|it|era|opr|ie)[\/: ]([\d.]+)/) || [0, '0'])[1],
    opera_presto: /opera/i.test(_ua),
    opera_webkit: /opr/i.test(_ua),
    msie: (/msie/i.test(_ua) && !/opera/i.test(_ua)),
    msie6: (/msie 6/i.test(_ua) && !/opera/i.test(_ua)),
    msie7: (/msie 7/i.test(_ua) && !/opera/i.test(_ua)),
    msie8: (/msie 8/i.test(_ua) && !/opera/i.test(_ua)),
    msie9: (/msie 9/i.test(_ua) && !/opera/i.test(_ua)),
    msie11: (/rv:11/i.test(_ua)),
    mozilla: /firefox/i.test(_ua),
    chrome: /chrome/i.test(_ua),
    safari: (!(/chrome/i.test(_ua)) && /webkit|safari|khtml/i.test(_ua)),
    iphone: /iphone/i.test(_ua),
    ipod: /ipod/i.test(_ua),
    iphone4: /iphone.*OS 4/i.test(_ua),
    ipod4: /ipod.*OS 4/i.test(_ua),
    ipad: /ipad/i.test(_ua),
    android: /android/i.test(_ua),
    bada: /bada/i.test(_ua),
    mobile: /iphone|ipod|ipad|opera mini|opera mobi|iemobile|android/i.test(_ua),
    msie_mobile: true,
    safari_mobile: /iphone|ipod|ipad/i.test(_ua),
    opera_mobile: /opera mini|opera mobi/i.test(_ua),
    opera_mini: /opera mini/i.test(_ua),
    mac: /mac/i.test(_ua),
    air: /AdobeAIR/i.test(_ua)
};
(function () {


  


    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                                   || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());
function Controls() {
    this.value = null;
    this.callbacks = jQuery.Callbacks('unique');
    this.refresh = function (emitter, value) {
        console.log(value);
        this.value = value;
        this.callbacks.fire(emitter, value);
    };



    this.controls = [new Panorama({ controls: this })];

    var pg = new Playground({
        element: '.b-playground',
        movingElement: '.b-playground__bg',
        controls: this,
        indicator: {
            element: '.b-playground__indicator'
        }
    });
    this.refresh(null, 0.5);
}



function Panorama(settings) {
        this.options = {
            $viewport: jQuery('.b-panorama'),
            $container: jQuery('.b-panorama__scroll'),
            $items: jQuery('.scroll-content-item'),
            $window: jQuery(window),
            $document: jQuery(document),
            scroller: {
                selector: '.b-panorama',
                options: { scrollX: true, scrollY: false, probeType: 3 }
            },
            visibilityOffset: 300
        };
        this.timerApplySrc = null;
        this.timerExecEvent = null;
        var _ = jQuery.extend(true, this.options, settings || {});
        this.viewport = {
            width: null,
            height: null
        };
        this.container = {
            width: null,
            height: null
        };


        var self = this;
        this.init = function () {
      
            this.scroller = !browser.msie_mobile ? new IScroll(_.scroller.selector, _.scroller.options): null;
            this.reflow();
            this.bindEvents();
       
        };

        this.setValue = function (value) {
            var rightPos = self.container.width - self.viewport.width;
            if (browser.msie_mobile) {
                _.$viewport.scrollLeft(rightPos * value);
                return;
            }
          
            this.scroller.scrollTo(-(rightPos * value), 0);
            this.scroller._execEvent('scroll');

        };
        this.checkItemVisibility = function ($item, startXoffset, endXoffset) {

            var leftStart = $item.offset().left;
            var leftEnd = leftStart + $item.outerWidth();

            return (leftStart > endXoffset || leftEnd < startXoffset) ? false : true;
        };
  

        this.getValue = function () {
            var rightPos = this.container.width - this.viewport.width, scrollLeft;
            if (browser.msie_mobile) {
                scrollLeft = _.$viewport.scrollLeft() / rightPos;
            } else {
                scrollLeft = Math.abs(self.scroller.x) / rightPos;
            }
            return scrollLeft;
        };
        this.applySrc = function () {
            console.log('apply')
            _.$items.each(function () {
                var $item = jQuery(this), $images = $item.find('img'), lazySrc;
                if (self.checkItemVisibility($item, -(_.visibilityOffset), _.$window.width() + _.visibilityOffset)) {
                    $images.each(function () {
                        var $image = jQuery(this);
                        if (lazySrc = $image.attr('lazy-src')) {
                            $image.attr('src', lazySrc).removeAttr('lazy-src');
                        }
                    });
              
                };
            });
        };

   
        this.bindEvents = function () {

            _.controls.callbacks.add(function (emitter, value) {
                if (emitter == self) {
                    return;
                }
                self.setValue(value);
            });
            
            if (!browser.msie_mobile) {
                this.scroller.on('scroll', function(e) {
                    _.controls.refresh(self, self.getValue());
                    self.applySrc();
                });
            } else {
                _.$viewport.on('scroll', function() {
                    _.controls.refresh(self, self.getValue());
                    self.applySrc();
                });
            }
            
            

       
            _.$window.on('resize.reflow.panorama', function () {
                self.reflow();
            });
            //_.$document.on('touchmove.prevent', function (e) {
            //    e.preventDefault();
            //});
        };
        this.resizeItems = function(height) {
            _.$items.each(function() {
                var $item = jQuery(this),
                    aspectratio = $item.data('width') / $item.data('height'),
                    newHeight = height;
           
                $item
                    .height(newHeight)
                    .width(newHeight * aspectratio);
            });
        };
        this.resizeContainer = function() {
            var width = 0;
            _.$items.each(function() {
                width += jQuery(this).outerWidth();
            });
            _.$container.width(width);
        }
        this.reflow = function () {
            this.resizeItems(_.$container.outerHeight());
            this.resizeContainer();
            this.container.width = _.$container.outerWidth();
            this.viewport.width = _.$viewport.outerWidth();
            this.container.height = _.$container.outerHeight();
            this.viewport.height = _.$viewport.outerHeight();
            if (!browser.msie_mobile) {
                 this.scroller.refresh();     
            }
           
        };


        this.init();


    }


    function Indicator(settings) {
        this.$element = null;
        this.width = null;
        this.height = null;
        this.playground = null;
        var self = this;
        this.dragging = false;

        this.$document = jQuery(document);
        this.$window = jQuery(window);
        this.value = null;
        this.$debug = jQuery("#debug");
        this.maxDistance = 200;
        this.setupPosition = null;
        this.playground = settings.playground;
        var $element = this.$element = jQuery(settings.element);


        this.checkCoordinates = function (position) {
            var l;
            if (position.left < (l = this.setupPosition.left - this.maxDistance)) {
                return { left: l };
            }
            if (position.left > (l = this.setupPosition.left + this.maxDistance)) {
                return { left: l };
            }
            return position;
        };


        this.fillDimensions = function () {
            this.width = this.$element.outerWidth();
            this.height = this.$element.outerHeight();
        };

        this.setValue = function (position) {
            if (this.setupPosition.left > position.left) { //left
                this.value = position.left - this.setupPosition.left;
            }
            if (this.setupPosition.left < position.left) { //rigtb
                this.value = position.left - this.setupPosition.left;
            }
            self.playground.$element.triggerHandler('indicator.value.changed', { value: this.value });
        };

        this.bindEvents = function () {
            this.$window.on('resize.repaint.indicator', function () {
                self.setupPosition.left = self.playground.$element.outerWidth() / 2;
                self.$element.css('left', self.setupPosition.left + 'px');
            });

        }
        this.init = function() {
            this.bindEvents();
            this.fillDimensions();
            var position = $element.position();
            this.setupPosition = { left: position.left, top: position.top };
            $element.draggable({
                scroll: false,
                axis: 'x',

                containment: this.playground.$element
            }).on('dragstart', function() {
                self.playground.$element.triggerHandler('start.move');
                self.dragging = true;
                $element.removeClass('b-playground__indicator_animation');

            }).on('dragstop', function () {
                $element.css("left", self.setupPosition.left + 'px');
                $element.addClass('b-playground__indicator_animation');
                self.playground.$element
                    .triggerHandler('stop.move');
                self.playground.$element.triggerHandler('indicator.value.changed', { value: 0 });
                self.dragging = false;
            }).on('drag', function(event, ui) {
                if (!ui) return;
                ui.position = jQuery.extend(ui.position, self.checkCoordinates(ui.position));
                self.setValue(ui.position);
            });
            this.$document.on("pointerup.end.drag mouseup.end.drag", function() {
                if (self.dragging) {
                    self.playground.$element.triggerHandler('stop.move');
                }
            });
        };



        this.init();
        return this;
    };



    function Playground(settings) {
        this.$element = null;
        this.moving = false;
        this.indicator = null;
        this.movingInterval = null;
        this.settings = {};
        this.$movingElement = null;
        this.speedCoeff = 0.2;
        this.speed = 0;
        this.step = null;
        this.options = {};

        var _ = jQuery.extend(this.options, settings || {}),
            self = this;
        this.stop = function() {
            window.cancelAnimationFrame(this.movingInterval);
            this.moving = false;
        };
        this.getValue = function () {
            var position = this.$movingElement.position();
            var coord = Math.abs(position.left - self.$element.outerWidth() / 2) / self.$movingElement.outerWidth();
            return coord;
        };
        this.setValue = function (value) {//0-1
            var coord = -1 * (((value * self.$movingElement.outerWidth()) - self.$element.outerWidth() / 2));
            this.setPosition(self.$movingElement, { left: coord });
        };
        this.setPosition = function ($element, position) {
            if (position) $element.css(position);
        };
        this.step = function () {
            var speed = this.speed * this.speedCoeff;
            var position = this.$movingElement.position(),
                movingWidth = this.$movingElement.outerWidth(),
                playgroundWidth = this.$element.outerWidth();
            if (speed < 0) { //direction left
                this.$movingElement.css({ left: position.left - speed });
                if (this.$movingElement.position().left >= playgroundWidth / 2) {
                    this.$movingElement.css({ left: playgroundWidth / 2 });
                    this.stop();

                }
            }
            if (speed > 0) { //direction right
                this.$movingElement.css({ left: position.left - Math.abs(speed) });
                var d, l;
                if ((d = Math.abs(movingWidth - (l = Math.abs(this.$movingElement.position().left)))) <= playgroundWidth / 2) {
                    this.$movingElement.css({ left: playgroundWidth / 2 - movingWidth });
                    this.stop();
                }
            }
            _.controls.refresh(this, this.getValue());
            this.movingInterval = window.requestAnimationFrame(function () {
                self.step();
            });
        }

        this.move = function () {
            this.moving = true;
            this.step();
        };
        this.reflow = function () {
            this.width = self.$element.outerWidth();
        };
        this.bindEvents = function () {
            this.$element.on('stop.move', function () {
                self.stop();

            });
            this.$element.on('indicator.value.changed', function (e, data) {
                self.speed = data.value;
            });

            this.$element.on("click.force.scroll", function (e) {
                var x = e.pageX,
                    movingWidth = self.$movingElement.outerWidth(),
                    movingOffset = self.$movingElement.position().left,
                    delta;
                if ((delta = x - movingOffset)< 0) {
                    delta = 0;
                }
            
                if (delta > movingWidth ) {
                    delta = movingWidth;
                }
                _.controls.refresh(self, delta / movingWidth);
            });
            this.$element.on('start.move', function (e, data) {
                if (self.moving) return;
                self.move();
            });

            _.controls.callbacks.add(function (emitter, value) {
                if (emitter == self)
                    return;

                self.setValue(value);
            });

            jQuery(window).on('resize', this.reflow);
        }
        this.init = function (settings) {
            jQuery.extend(this.settings, settings);
            this.$element = jQuery(settings.element);
            this.$movingElement = jQuery(settings.movingElement);
            this.reflow();
            this.indicator = new Indicator(jQuery.extend(this.settings.indicator, { playground: this }));

            this.bindEvents();


            return this;
        };

        this.init(_);

    }