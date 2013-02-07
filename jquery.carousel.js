/**
 * RealyCarousel
 */

(function($, undefined) {

	var Whell = (function() {

		var handlesWheel = [];

		$(document).ready(function() {
			// Инициализация события mousewheel
			if (window.addEventListener) // mozilla, safari, chrome
				window.addEventListener('DOMMouseScroll', wheel, false);
			// IE, Opera.
			window.onmousewheel = document.onmousewheel = wheel;
		});

		function wheel(event) {
			var delta = 0;
			if (!event) event = window.event; // Событие IE.
			// Установим кроссбраузерную delta
			if (event.wheelDelta) {
				// IE, Opera, safari, chrome - кратность дельта равна 120
				delta = event.wheelDelta/120;
			} else if (event.detail) {
				// Mozilla, кратность дельта равна 3
				delta = -event.detail/3;
			}
			// Вспомогательная функция обработки mousewheel
			if (delta && handlesWheel.length > 0) {
				for ( var i = 0; i < handlesWheel.length; i++ ) {
					if ( handlesWheel[i][1] ) {
						handlesWheel[i][0].call( handlesWheel[i][1], delta );
					} else {
						handlesWheel[i][0](delta);
					}

				}
				// Отменяет текущее событие - событие по умолчанию (скролинг окна).
				if (event.preventDefault)
					event.preventDefault();
				event.returnValue = false;
			}
		}

		return {
			on: function(callback, context) {
				handlesWheel.push([callback, context]);
			},
			off: function(callback) {
				for( var i = 0; i < handlesWheel.length; i++ ) {
					if ( handlesWheel[i][0] === callback ) {
						handlesWheel.splice(i, 1);
					}
				}
			}
		};
	}());

	var PI = Math.PI;

	function position(degree, radius, item) {

		var corner = PI - degree / 180 * PI;            // переводим градусы в радианы с учетом периода в 2 пи

		var x = Math.round(radius * Math.cos(corner) + item.x);   // считаем новые координаты точки по оси х
		var y = Math.round(radius * Math.sin(corner) + item.y);   // считаем новые координаты по оси у

		return {
			x: x,
			y: y
		};
	}

	function Carousel(box, options) {

		this.x = this.y = Math.floor(options.radius/2);
		this.options = options;

		var elements = box.find('li');
		this.elements = elements;
		var count = elements.length;
		count = options.show ? (options.show > count ? count : options.show) : (Math.abs(options.step * count) > 360 ? Math.floor(360 / options.step) : count);
		options.show = count;

		var half = count/2;

		var halfCount = half - Math.floor(half) == 0 ? half - 0.5 : Math.floor(half);
//		console.log(1 / (2 + (half - Math.floor(half))))
		var a = this.normalizeGrad(options.center - (halfCount * Math.abs(options.step)));
		var b = this.normalizeGrad(a + Math.abs(options.step) * (count-1));

		if ( options.step < 0 ) {
			this.first = b;
			this.last = a;
		} else {
			this.first = a;
			this.last = b;
		}



//		console.log(this.first, this.last)
//		console.log(this.first, this.last)
//
//      120 90 60
//		135 105 75 45
//

		this.zero_first_pos = position(this.normalizeGrad(this.first - options.step), options.radius/2, this);
		this.first_pos      = position(this.first, options.radius/2, this);
		this.last_pos       = position(this.last, options.radius/2, this);
		this.zero_last_pos  = position(this.normalizeGrad(this.last + options.step), options.radius/2, this);

		var type = 0;

		for ( var i = 0; i < elements.length; i++ ) {

			var el = $(elements[i]), pos;
			var grad = this.normalizeGrad(this.first + (options.step * i) );
			var pos = position(grad, options.radius/2, this);

			if ( grad === this.first && type == 0 ) {
				type = 1;
			} else if ( grad === this.last && type == 2 ) {
				pos = this.last_pos;
				type = 3;
			} else if ( type === 3 ) {
				type = 4;
				pos = this.zero_last_pos;
				el.hide();
			} else if ( type === 4 ) {
				pos = this.zero_last_pos;
				el.hide();
			} else {
				type = 2;
			}

			el.data('grad', grad);
			el.data('type', type);
			el.css({
				left: pos.y + 'px',
				top: pos.x + 'px'
			});
		}

		options.next.on('click', function() {
			_this.next();
		});

		options.prev.on('click', function() {
			_this.prev();
		});

		$(box).off().hover(function() {
			Whell.on(_this.wheelEvent, _this);
		}, function() {
			Whell.off(_this.wheelEvent);
		});

		var _this = this;
	}

	Carousel.prototype = {

		constructor: Carousel,

		wheelEvent : function(delta) {
			if (delta > 0) {
				this.prev();
			} else {
				this.next();
			}
		},

		next: function() {
			if ( this.animated ) return;

			var step = this.options.step,
				_this = this,
				int = 0,
				pos = this.options.show - 1,
				status = 0,
				opacity,
				animProp,
				length = this.elements.length;

			if ( this.options.show >= length ) return;

			if ( this.options.stop ) {
				if ( this.options.stop[0] ==  $(this.elements[0]).data('pos') ) return;
			} else if ( $(this.elements[0]).data('type') !== 0 ) return;

			if ( $(this.elements[length-1]).data('type') === 2 ) {
				var start = this.options.show;
				this.elements.each(function(i, value) {
					var type = $(this).data('type');
					if ( type == 1 || type == 2 || type == 3 ) {
						start--;
					}
				});
				pos = this.options.show - start;
			}

			for ( var i = length; i >= 0; i-- ) {
				var el = $(this.elements[i]);
				opacity = undefined;

				if ( status == 4 ) break;

				var grad = this.normalizeGrad(el.data('grad') + step);
				var type = el.data('pos', -1).data('type');

				switch (type) {
					case 4:
						continue;
						break;
					case 3:
						status = 1;
						el.data('type', 4);
						opacity = 0;
						break;
					case 2:
						if ( status === 1 ) {
							el.data('type', 3);
							status = 2;
						}
						if ( status == 0 && grad == this.last ) {
							el.data('type', 3);
							status = 2;
						}
						el.data('pos', pos--);
						break;
					case 1:
						el.data({ 'type': 2, 'pos' : pos-- });
						status = 3;
						break;
					case 0:
						if ( status === 3 ) {
							status = 4;
							el.data({'type': 1, 'pos' : pos-- });
							opacity = 1;
							grad = this.first;
						}
						break;
				}
				this.animated = true;
				animProp = this.animate(el, position(grad, this.options.radius/2, this), int++, opacity);
				el.data('grad', grad);
			}
			animProp.complete = function() {
				_this.animated = false;
				_this.options.complete.call(_this);
			};
		},

		prev: function() {
			if ( this.animated ) return;

			var step = this.options.step,
				_this = this,
				int = 0,
				pos = 0,
				status = 0,
				opacity,
				animProp,
				length = this.elements.length;

			if ( this.options.show >= length ) return;

			if ( this.options.stop ) {
				if ( this.options.stop[1] === $(this.elements[length - 1]).data('pos') ) return;
			} else if ( $(this.elements[length - 1]).data('type') !== 4 ) return;

			if ( $(this.elements[0]).data('type') === 2 ) {
				var start = this.options.show;
				this.elements.each(function(i, value) {
					var type = $(this).data('type');
					if ( type == 1 || type == 2 || type == 3 ) {
						start--;
					}
				});
				pos = start - 1;
			}

			for ( var i = 0; i < length; i++ ) {
				var el = $(this.elements[i]);
				opacity = undefined;

				if ( status === 4 ) break;

				var grad = this.normalizeGrad(el.data('grad') - step);
				var type = el.data('pos', -1).data('type');

				switch (type) {
					case 0:
						continue; break;
					case 1:
						status = 1;
						el.data('type', 0);
						opacity = 0;
						break;
					case 2:
						if ( status === 1 ) {
							el.data('type', 1);
							status = 2;
						}
						if ( status === 0 && grad === this.first ) {
							el.data('type', 1);
							status = 2;
						}
						el.data('pos', pos++);
						break;
					case 3:
						el.data({'type': 2, 'pos': pos++});
						status = 3;
						break;
					case 4:
						if ( status === 3 ) {
							status = 4;
							el.data({'type': 3, 'pos': pos++});
							opacity = 1;
							grad = this.last;
						}
						break;
				}

				this.animated = true;
				animProp = this.animate(el, position(grad, this.options.radius/2, this), int++, opacity);

				el.data('grad', grad);
			}

			animProp.complete = function() {
				_this.animated = false;
				_this.options.complete.call(_this);
			};

		},

		getPosition: function(pos) {
			for ( var i = 0; i < this.elements.length; i++ ) {
				if ( $(this.elements[i]).data('pos') == pos ) {
					return $(this.elements[i])
				}
			}
		},

		animate: function(el, pos, int, op) {

			var complete = function() {};

			var prop = {
				duration: 250,
				complete: complete
			};

			var animate = {
				left: pos.y + 'px',
				top: pos.x + 'px'
			};
			if ( typeof op !== 'undefined' ) {
				el.css({
					display: 'block',
					opacity: op == 1 ? 0 : 1
				});
				animate.opacity = op;
			}
			setTimeout(function() {
				el.animate(animate, prop);
			}, int * 50);
			return prop;
		},

		normalizeGrad: function(grad) {
			return grad >= 360 ? grad - (360 * Math.floor(grad / 360) ) : grad < 0 ? 360 + grad : grad
		}

	};

	$.fn.rCarousel= function(variables) {
		var defaults = {
			radius: 400,
			step: 20,
			center: 90,
			show: 5,
			prev: $('<div></div>'),
			next: $('<div></div>'),
			stop: null,
			complete: function(Car) {

			}
		};

		var options = $.extend(defaults, variables);

		return this.each(function() {
			return new Carousel($(this), options);
		});

	};

})(jQuery, undefined);