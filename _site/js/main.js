/*
	Kube. CSS & JS Framework
	Version 6.5.2
	Updated: February 2, 2017

	http://imperavi.com/kube/

	Copyright (c) 2009-2017, Imperavi LLC.
	License: MIT
*/
if (typeof jQuery === 'undefined') {throw new Error('Kube\'s requires jQuery')};
;(function($) { var version = $.fn.jquery.split('.'); if (version[0] == 1 && version[1] < 8) {throw new Error('Kube\'s requires at least jQuery v1.8'); }})(jQuery);

;(function()
{
    // Inherits
    Function.prototype.inherits = function(parent)
    {
        var F = function () {};
        F.prototype = parent.prototype;
        var f = new F();

        for (var prop in this.prototype) f[prop] = this.prototype[prop];
        this.prototype = f;
        this.prototype.super = parent.prototype;
    };

    // Core Class
    var Kube = function(element, options)
    {
        options = (typeof options === 'object') ? options : {};

        this.$element = $(element);
        this.opts     = $.extend(true, this.defaults, $.fn[this.namespace].options, this.$element.data(), options);
        this.$target  = (typeof this.opts.target === 'string') ? $(this.opts.target) : null;
    };

    // Core Functionality
    Kube.prototype = {
        getInstance: function()
        {
            return this.$element.data('fn.' + this.namespace);
        },
        hasTarget: function()
        {
           return !(this.$target === null);
        },
        callback: function(type)
        {
    		var args = [].slice.call(arguments).splice(1);

            // on element callback
            if (this.$element)
            {
                args = this._fireCallback($._data(this.$element[0], 'events'), type, this.namespace, args);
            }

            // on target callback
            if (this.$target)
            {
                args = this._fireCallback($._data(this.$target[0], 'events'), type, this.namespace, args);
    		}

    		// opts callback
    		if (this.opts && this.opts.callbacks && $.isFunction(this.opts.callbacks[type]))
    		{
                return this.opts.callbacks[type].apply(this, args);
    		}

    		return args;
        },
        _fireCallback: function(events, type, eventNamespace, args)
        {
            if (events && typeof events[type] !== 'undefined')
            {
    			var len = events[type].length;
    			for (var i = 0; i < len; i++)
    			{
    				var namespace = events[type][i].namespace;
    				if (namespace === eventNamespace)
    				{
    					var value = events[type][i].handler.apply(this, args);
    				}
    			}
    		}

            return (typeof value === 'undefined') ? args : value;
        }
    };

    // Scope
    window.Kube = Kube;

})();
/**
 * @library Kube Plugin
 * @author Imperavi LLC
 * @license MIT
 */
(function(Kube)
{
    Kube.Plugin = {
        create: function(classname, pluginname)
        {
            pluginname = (typeof pluginname === 'undefined') ? classname.toLowerCase() : pluginname;

            $.fn[pluginname] = function(method, options)
            {
                var args = Array.prototype.slice.call(arguments, 1);
                var name = 'fn.' + pluginname;
                var val = [];

                this.each(function()
                {
                    var $this = $(this), data = $this.data(name);
                    options = (typeof method === 'object') ? method : options;

                    if (!data)
                    {
                        // Initialization
                        $this.data(name, {});
                        $this.data(name, (data = new Kube[classname](this, options)));
                    }

                    // Call methods
                    if (typeof method === 'string')
                    {
                        if ($.isFunction(data[method]))
                        {
                            var methodVal = data[method].apply(data, args);
                            if (methodVal !== undefined)
                            {
                                val.push(methodVal);
                            }
                        }
                        else
                        {
                            $.error('No such method "' + method + '" for ' + classname);
                        }
                    }

                });

                return (val.length === 0 || val.length === 1) ? ((val.length === 0) ? this : val[0]) : val;
            };

            $.fn[pluginname].options = {};

            return this;
        },
        autoload: function(pluginname)
        {
            var arr = pluginname.split(',');
            var len = arr.length;

            for (var i = 0; i < len; i++)
            {
                var name = arr[i].toLowerCase().split(',').map(function(s) { return s.trim() }).join(',');
                this.autoloadQueue.push(name);
            }

            return this;
        },
        autoloadQueue: [],
        startAutoload: function()
        {
            if (!window.MutationObserver || this.autoloadQueue.length === 0)
            {
                return;
            }

            var self = this;
    		var observer = new MutationObserver(function(mutations)
    		{
    			mutations.forEach(function(mutation)
    			{
    				var newNodes = mutation.addedNodes;
    			    if (newNodes.length === 0 || (newNodes.length === 1 && newNodes.nodeType === 3))
    			    {
    				    return;
    				}

                    self.startAutoloadOnce();
    			});
    		});

    		// pass in the target node, as well as the observer options
    		observer.observe(document, {
    			 subtree: true,
    			 childList: true
    		});
        },
        startAutoloadOnce: function()
        {
            var self = this;
            var $nodes = $('[data-component]').not('[data-loaded]');
    		$nodes.each(function()
    		{
        		var $el = $(this);
        		var pluginname = $el.data('component');

                if (self.autoloadQueue.indexOf(pluginname) !== -1)
                {
            		$el.attr('data-loaded', true);
                    $el[pluginname]();
                }
            });

        },
        watch: function()
        {
            Kube.Plugin.startAutoloadOnce();
            Kube.Plugin.startAutoload();
        }
    };

    $(window).on('load', function()
    {
        Kube.Plugin.watch();
    });

}(Kube));
/**
 * @library Kube Animation
 * @author Imperavi LLC
 * @license MIT
 */
(function(Kube)
{
    Kube.Animation = function(element, effect, callback)
    {
        this.namespace = 'animation';
        this.defaults = {};

        // Parent Constructor
        Kube.apply(this, arguments);

        // Initialization
        this.effect = effect;
        this.completeCallback = (typeof callback === 'undefined') ? false : callback;
        this.prefixes = ['', '-moz-', '-o-animation-', '-webkit-'];
        this.queue = [];

        this.start();
    };

    Kube.Animation.prototype = {
        start: function()
        {
	    	if (this.isSlideEffect()) this.setElementHeight();

			this.addToQueue();
			this.clean();
			this.animate();
        },
        addToQueue: function()
        {
            this.queue.push(this.effect);
        },
        setElementHeight: function()
        {
            this.$element.height(this.$element.height());
        },
        removeElementHeight: function()
        {
            this.$element.css('height', '');
        },
        isSlideEffect: function()
        {
            return (this.effect === 'slideDown' || this.effect === 'slideUp');
        },
        isHideableEffect: function()
        {
            var effects = ['fadeOut', 'slideUp', 'flipOut', 'zoomOut', 'slideOutUp', 'slideOutRight', 'slideOutLeft'];

			return ($.inArray(this.effect, effects) !== -1);
        },
        isToggleEffect: function()
        {
            return (this.effect === 'show' || this.effect === 'hide');
        },
        storeHideClasses: function()
        {
            if (this.$element.hasClass('hide-sm'))      this.$element.data('hide-sm-class', true);
            else if (this.$element.hasClass('hide-md')) this.$element.data('hide-md-class', true);
        },
        revertHideClasses: function()
        {
            if (this.$element.data('hide-sm-class'))      this.$element.addClass('hide-sm').removeData('hide-sm-class');
            else if (this.$element.data('hide-md-class')) this.$element.addClass('hide-md').removeData('hide-md-class');
            else                                          this.$element.addClass('hide');
        },
        removeHideClass: function()
        {
            if (this.$element.data('hide-sm-class'))      this.$element.removeClass('hide-sm');
            else if (this.$element.data('hide-md-class')) this.$element.removeClass('hide-md');
            else                                          this.$element.removeClass('hide');
        },
        animate: function()
        {
            this.storeHideClasses();
            if (this.isToggleEffect())
			{
				return this.makeSimpleEffects();
            }

            this.$element.addClass('kubeanimated');
			this.$element.addClass(this.queue[0]);
            this.removeHideClass();

			var _callback = (this.queue.length > 1) ? null : this.completeCallback;
			this.complete('AnimationEnd', $.proxy(this.makeComplete, this), _callback);
        },
        makeSimpleEffects: function()
        {
           	if      (this.effect === 'show') this.removeHideClass();
            else if (this.effect === 'hide') this.revertHideClasses();

            if (typeof this.completeCallback === 'function') this.completeCallback(this);
        },
		makeComplete: function()
		{
            if (this.$element.hasClass(this.queue[0]))
            {
				this.clean();
				this.queue.shift();

				if (this.queue.length) this.animate();
			}
		},
        complete: function(type, make, callback)
		{
    		var event = type.toLowerCase() + ' webkit' + type + ' o' + type + ' MS' + type;

			this.$element.one(event, $.proxy(function()
			{
				if (typeof make === 'function')     make();
				if (this.isHideableEffect())        this.revertHideClasses();
				if (this.isSlideEffect())           this.removeElementHeight();
				if (typeof callback === 'function') callback(this);

				this.$element.off(event);

			}, this));
		},
		clean: function()
		{
			this.$element.removeClass('kubeanimated').removeClass(this.queue[0]);
		}
    };

    // Inheritance
    Kube.Animation.inherits(Kube);

}(Kube));

// Plugin
(function($)
{
    $.fn.animation = function(effect, callback)
    {
        var name = 'fn.animation';

        return this.each(function()
        {
            var $this = $(this), data = $this.data(name);

            $this.data(name, {});
            $this.data(name, (data = new Kube.Animation(this, effect, callback)));
        });
    };

    $.fn.animation.options = {};

})(jQuery);
/**
 * @library Kube Sticky
 * @author Imperavi LLC
 * @license MIT
 */
(function(Kube)
{
    Kube.Sticky = function(element, options)
    {
        this.namespace = 'sticky';
        this.defaults = {
            classname: 'fixed',
            offset: 0, // pixels
            callbacks: ['fixed', 'unfixed']
        };

        // Parent Constructor
        Kube.apply(this, arguments);

        // Initialization
        this.start();
    };

    // Functionality
    Kube.Sticky.prototype = {
        start: function()
        {
    	    this.offsetTop = this.getOffsetTop();

    	    this.load();
    	    $(window).scroll($.proxy(this.load, this));
    	},
    	getOffsetTop: function()
    	{
        	return this.$element.offset().top;
    	},
    	load: function()
    	{
    		return (this.isFix()) ? this.fixed() : this.unfixed();
    	},
    	isFix: function()
    	{
            return ($(window).scrollTop() > (this.offsetTop + this.opts.offset));
    	},
    	fixed: function()
    	{
    		this.$element.addClass(this.opts.classname).css('top', this.opts.offset + 'px');
    		this.callback('fixed');
    	},
    	unfixed: function()
    	{
    		this.$element.removeClass(this.opts.classname).css('top', '');
    		this.callback('unfixed');
        }
    };

    // Inheritance
    Kube.Sticky.inherits(Kube);

    // Plugin
    Kube.Plugin.create('Sticky');
    Kube.Plugin.autoload('Sticky');

}(Kube));
/**
 * @library Kube Tabs
 * @author Imperavi LLC
 * @license MIT
 */
(function(Kube)
{
    Kube.Tabs = function(element, options)
    {
        this.namespace = 'tabs';
        this.defaults = {
    		equals: false,
    		active: false, // string (hash = tab id selector)
    		live: false, // class selector
    		hash: true, //boolean
    		callbacks: ['init', 'next', 'prev', 'open', 'opened', 'close', 'closed']
        };

        // Parent Constructor
        Kube.apply(this, arguments);

        // Initialization
        this.start();
    };

    // Functionality
    Kube.Tabs.prototype = {
        start: function()
        {
            if (this.opts.live !== false) this.buildLiveTabs();

            this.tabsCollection = [];
            this.hashesCollection = [];
            this.currentHash = [];
            this.currentItem = false;

            // items
            this.$items = this.getItems();
            this.$items.each($.proxy(this.loadItems, this));

            // tabs
    		this.$tabs = this.getTabs();

            // location hash
    		this.currentHash = this.getLocationHash();

    		// close all
    		this.closeAll();

            // active & height
    		this.setActiveItem();
    		this.setItemHeight();

            // callback
    		this.callback('init');

    	},
    	getTabs: function()
    	{
        	return $(this.tabsCollection).map(function()
        	{
            	return this.toArray();
            });
    	},
    	getItems: function()
    	{
    		return this.$element.find('a');
    	},
    	loadItems: function(i, el)
    	{
    		var item = this.getItem(el);

    		// set item identificator
    		item.$el.attr('rel', item.hash);

    		// collect item
            this.collectItem(item);

            // active
    		if (item.$parent.hasClass('active'))
    		{
    			this.currentItem = item;
    			this.opts.active = item.hash;
    		}

    		// event
    		item.$el.on('click.tabs', $.proxy(this.open, this));

    	},
    	collectItem: function(item)
    	{
    		this.tabsCollection.push(item.$tab);
    		this.hashesCollection.push(item.hash);
    	},
    	buildLiveTabs: function()
    	{
    		var $layers = $(this.opts.live);

    		if ($layers.length === 0)
    		{
    			return;
    		}

    		this.$liveTabsList = $('<ul />');
    		$layers.each($.proxy(this.buildLiveItem, this));

    		this.$element.html('').append(this.$liveTabsList);

    	},
    	buildLiveItem: function(i, tab)
    	{
    		var $tab = $(tab);
    		var $li = $('<li />');
    		var $a = $('<a />');
    		var index = i + 1;

    		$tab.attr('id', this.getLiveItemId($tab, index));

    		var hash = '#' + $tab.attr('id');
    		var title = this.getLiveItemTitle($tab);

    		$a.attr('href', hash).attr('rel', hash).text(title);
    		$li.append($a);

    		this.$liveTabsList.append($li);
    	},
    	getLiveItemId: function($tab, index)
    	{
        	return (typeof $tab.attr('id') === 'undefined') ? this.opts.live.replace('.', '') + index : $tab.attr('id');
    	},
    	getLiveItemTitle: function($tab)
    	{
        	return (typeof $tab.attr('data-title') === 'undefined') ? $tab.attr('id') : $tab.attr('data-title');
    	},
    	setActiveItem: function()
    	{
    		if (this.currentHash)
    		{
    			this.currentItem = this.getItemBy(this.currentHash);
    			this.opts.active = this.currentHash;
    		}
    		else if (this.opts.active === false)
    		{
    			this.currentItem = this.getItem(this.$items.first());
    			this.opts.active = this.currentItem.hash;
    		}

    		this.addActive(this.currentItem);
    	},
    	addActive: function(item)
    	{
    		item.$parent.addClass('active');
    		item.$tab.removeClass('hide').addClass('open');

    		this.currentItem = item;
    	},
    	removeActive: function(item)
    	{
    		item.$parent.removeClass('active');
    		item.$tab.addClass('hide').removeClass('open');

    		this.currentItem = false;
    	},
    	next: function(e)
    	{
    		if (e) e.preventDefault();

    		var item = this.getItem(this.fetchElement('next'));

    		this.open(item.hash);
    		this.callback('next', item);

    	},
    	prev: function(e)
    	{
    		if (e) e.preventDefault();

    		var item = this.getItem(this.fetchElement('prev'));

    		this.open(item.hash);
    		this.callback('prev', item);
    	},
    	fetchElement: function(type)
    	{
            var element;
    		if (this.currentItem !== false)
    		{
    			// prev or next
    			element = this.currentItem.$parent[type]().find('a');

    			if (element.length === 0)
    			{
    				return;
    			}
    		}
    		else
    		{
    			// first
    			element = this.$items[0];
    		}

    		return element;
    	},
    	open: function(e, push)
    	{
        	if (typeof e === 'undefined') return;
    		if (typeof e === 'object') e.preventDefault();

    		var item = (typeof e === 'object') ? this.getItem(e.target) : this.getItemBy(e);
    		this.closeAll();

    		this.callback('open', item);
    		this.addActive(item);

    		// push state (doesn't need to push at the start)
            this.pushStateOpen(push, item);
    		this.callback('opened', item);
    	},
    	pushStateOpen: function(push, item)
    	{
    		if (push !== false && this.opts.hash !== false)
    		{
    			history.pushState(false, false, item.hash);
    		}
    	},
    	close: function(num)
    	{
    		var item = this.getItemBy(num);

    		if (!item.$parent.hasClass('active'))
    		{
    			return;
    		}

    		this.callback('close', item);
    		this.removeActive(item);
    		this.pushStateClose();
    		this.callback('closed', item);

    	},
    	pushStateClose: function()
    	{
            if (this.opts.hash !== false)
            {
    			history.pushState(false, false, ' ');
    		}
    	},
    	closeAll: function()
    	{
    		this.$tabs.removeClass('open').addClass('hide');
    		this.$items.parent().removeClass('active');
    	},
    	getItem: function(element)
    	{
    		var item = {};

    		item.$el = $(element);
    		item.hash = item.$el.attr('href');
    		item.$parent = item.$el.parent();
    		item.$tab = $(item.hash);

    		return item;
    	},
    	getItemBy: function(num)
    	{
    		var element = (typeof num === 'number') ? this.$items.eq(num-1) : this.$element.find('[rel="' + num + '"]');

    		return this.getItem(element);
    	},
    	getLocationHash: function()
    	{
    		if (this.opts.hash === false)
    		{
    			return false;
    		}

    		return (this.isHash()) ? top.location.hash : false;
    	},
    	isHash: function()
    	{
        	return !(top.location.hash === '' || $.inArray(top.location.hash, this.hashesCollection) === -1);
    	},
    	setItemHeight: function()
    	{
    		if (this.opts.equals)
    		{
    	    	var minHeight = this.getItemMaxHeight() + 'px';
        		this.$tabs.css('min-height', minHeight);
    		}
    	},
    	getItemMaxHeight: function()
    	{
    		var max = 0;
    		this.$tabs.each(function()
    		{
    			var h = $(this).height();
    			max = h > max ? h : max;
    		});

    		return max;
    	}
    };

    // Inheritance
    Kube.Tabs.inherits(Kube);

    // Plugin
    Kube.Plugin.create('Tabs');
    Kube.Plugin.autoload('Tabs');

}(Kube));
/**
 * @library Kube Toggleme
 * @author Imperavi LLC
 * @license MIT
 */
(function(Kube)
{
    Kube.Toggleme = function(element, options)
    {
        this.namespace = 'toggleme';
        this.defaults = {
            toggleEvent: 'click',
            target: null,
            text: '',
            animationOpen: 'slideDown',
            animationClose: 'slideUp',
            callbacks: ['open', 'opened', 'close', 'closed']
        };

        // Parent Constructor
        Kube.apply(this, arguments);

        // Initialization
        this.start();
    };

    // Functionality
    Kube.Toggleme.prototype = {
        start: function()
        {
            if (!this.hasTarget()) return;

            this.$element.on(this.opts.toggleEvent + '.' + this.namespace, $.proxy(this.toggle, this));
        },
        stop: function()
        {
            this.$element.off('.' + this.namespace);
            this.revertText();
        },
        toggle: function(e)
        {
            if (this.isOpened()) this.close(e);
            else                 this.open(e);
        },
        open: function(e)
        {
            if (e) e.preventDefault();

            if (!this.isOpened())
            {
                this.storeText();
                this.callback('open');
                this.$target.animation('slideDown', $.proxy(this.onOpened, this));

                // changes the text of $element with a less delay to smooth
                setTimeout($.proxy(this.replaceText, this), 100);
    		}
        },
        close: function(e)
        {
            if (e) e.preventDefault();

            if (this.isOpened())
            {
                this.callback('close');
                this.$target.animation('slideUp', $.proxy(this.onClosed, this));
    		}
        },
    	isOpened: function()
        {
            return (this.$target.hasClass('open'));
        },
        onOpened: function()
        {
            this.$target.addClass('open');
         	this.callback('opened');
        },
        onClosed: function()
        {
            this.$target.removeClass('open');
            this.revertText();
        	this.callback('closed');
        },
        storeText: function()
        {
            this.$element.data('replacement-text', this.$element.html());
        },
        revertText: function()
        {
            var text = this.$element.data('replacement-text');
            if (text) this.$element.html(text);

            this.$element.removeData('replacement-text');
        },
        replaceText: function()
        {
            if (this.opts.text !== '')
            {
                this.$element.html(this.opts.text);
            }
        }
    };

    // Inheritance
    Kube.Toggleme.inherits(Kube);

    // Plugin
    Kube.Plugin.create('Toggleme');
    Kube.Plugin.autoload('Toggleme');

}(Kube));

function changeSiteNavActive(newActive){
  $('#siteNav .active').removeClass('active');
  $("#siteNav [href='"+newActive+"']").parent().addClass('active');
}

$(function(){

  /*Add bottom border under nav when scrolled down*/
  $('#siteNav').on('fixed.sticky', function()
  {
    $('#siteNav').addClass("scrolled");
  });

  $('#siteNav').on('unfixed.sticky', function()
  {
    $('#siteNav').removeClass("scrolled");
  });

  $("#siteNav li").on("click",function(){
    if($("[data-target='#toggleNav']").toggleme('isOpened')){
      $("[data-target='#toggleNav']").toggleme('close');
    }
  });

  /*Smooth scroll all anchor links*/
  $("a[href*='#']").not("#livetabs ul li a").click(function(e) {
      e.preventDefault();
      var hash = this.hash;
      $('html, body').animate({
        scrollTop: $(hash).offset().top-$(siteNav).innerHeight()
      }, "slow", function(){
        window.location.hash = hash;
        changeSiteNavActive(hash);
      });
  });

  /*Change active nav on scroll*/
  $(window).on("scroll",function(){
    var scrollPos = $(document).scrollTop();
    $('#toggleNav a').each(function () {
      var currLink = $(this);
      var refElement = $(currLink.attr("href"));
      if(scrollPos+$(window).height() > $("#contact").position().top+$("#contact").height()){
        changeSiteNavActive("#contact");
      }
      else if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
        changeSiteNavActive(currLink[0].hash);
      }
    });
  });

})
