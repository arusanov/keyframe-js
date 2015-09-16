(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Keyframe = factory();
  }
}(this, function () {
  'use strict';

  var vendorPrefixes = ['', 'webkit', 'moz', 'ms', 'o'],
    animationString = 'animation',
    transitionString = 'transition',
    prefixedPropCache = {},
    testNode = document.createElement('div'),
    animationProperty = getPrefixedProperty(testNode, animationString) || '',
    prefix = animationProperty.replace(/(.*)animation/i, '$1'),
    setAnimationValue = setValue(animationString),
    transitionProperty = getPrefixedProperty(testNode, transitionString) || '',
    setTransitionValue = setValue(transitionString),
    styleNode = document.createElement('style'),
    keyframeId = 0,
    isSupported = !!animationProperty,
    requestAnimFrame = (function () {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
          window.setTimeout(callback, 0);
        };
    }()),
    indexOf = [].indexOf || function (item) {
        for (var i = 0, l = this.length; i < l; i++) {
          if (i in this && this[i] === item) return i;
        }
        return -1;
      };

  function capitalize(word) {
    return word[0].toUpperCase() + word.substr(1);
  }

  function toCssName(propertyName) {
    return propertyName
      .replace(/^(webkit|moz|ms|o)([A-Z])/, '-$1$2')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase();
  }

  function getPrefixedEvent(type, event, prefix) {
    if (!prefix || prefix === 'moz') {
      return type + event.toLowerCase();
    }
    return prefix + capitalize(type) + capitalize(event);
  }

  function toPropertyName(cssName) {
    return cssName.replace(/(-[a-z])/gi, function (match) {
      return match[1].toUpperCase();
    });
  }

  function toPrefixedPropertyName(propertyName, vendorPrefix) {
    return vendorPrefix ? (vendorPrefix + capitalize(propertyName)) : propertyName;
  }

  function getPrefixedProperty(domNode, property) {
    var i, propName;
    property = toPropertyName(property);
    if (!prefixedPropCache.hasOwnProperty(property)) {
      for (i = 0; i < vendorPrefixes.length; i++) {
        propName = toPrefixedPropertyName(property, vendorPrefixes[i]);
        if (propName in domNode.style) {
          prefixedPropCache[property] = propName;
          break;
        }
      }
    }
    return prefixedPropCache[property];
  }

  function toCssValue(value) {
    if (typeof value === 'number') {
      return value + 'px';
    }
    return value;
  }

  function convertDefaultNumberValue(key, value) {
    if (/(delay|duration)$/.test(key)) {
      value = value + 'ms';
    }
    return value;
  }

  function setValue(name) {
    return function (domNode, key, value) {
      if (typeof value === 'number') {
        value = convertDefaultNumberValue(key, value);
      }
      domNode.style[getPrefixedProperty(domNode, name + capitalize(key))] = value || '';
    };
  }

  function getTransitionProperties(to) {
    var transitionProperties = [];
    //Fill in props
    for (var prop in to) {
      if (to.hasOwnProperty(prop)) {
        transitionProperties.push(toCssName(getPrefixedProperty(testNode, prop)));
      }
    }
    return transitionProperties;
  }

  function options(opts, defaults) {
    if (!opts) {
      opts = defaults;
    } else {
      for (var k in defaults) {
        if (defaults.hasOwnProperty(k) && !opts.hasOwnProperty(k)) {
          opts[k] = defaults[k];
        }
      }
    }
    return opts;
  }

  function on(node, type, evt, handler) {
    node.addEventListener(getPrefixedEvent(type, evt, prefix), handler, false);
  }

  function off(node, type, evt, handler) {
    node.removeEventListener(getPrefixedEvent(type, evt, prefix), handler, false);
  }


  function Keyframes(keyframes) {
    var css, key, prop;
    if (!isSupported) {
      throw new Error('animations not supported');
    }
    this.keyframeId = ++keyframeId;
    css = '@' + (prefix ? ('-' + prefix + '-') : '') + 'keyframes keyframejs' + this.keyframeId + '{';
    for (key in keyframes) {
      if (keyframes.hasOwnProperty(key)) {
        css += (/^\d+$/.test(key) ? (key + '%') : key) + '{';
        for (prop in keyframes[key]) {
          if (keyframes[key].hasOwnProperty(prop)) {
            css += toCssName(getPrefixedProperty(testNode, prop)) + ':' + toCssValue(keyframes[key][prop]) + ';';
          }
        }
        css += '}';
      }
    }
    css += '}';

    if (!styleNode.parentNode) {
      styleNode.type = 'text/css';
      document.getElementsByTagName('head')[0].appendChild(styleNode);
    }
    this.style = document.createTextNode(css);
    styleNode.appendChild(this.style);
  }

  Keyframes.prototype.remove = function () {
    styleNode.removeChild(this.style);
  };

  Keyframes.prototype.animate = function (domNode, animation) {
    return new Animator(domNode, this, animation);
  };

  function Animator(domNode, keyframe, animation) {
    this.node = domNode;
    this.animation = animation;
    this.keyframeId = keyframe.keyframeId;
  }

  Animator.prototype.start = function (endCallback, startCallback, iterationCallback) {
    var self = this, key,
      handler = function () {
        stop();
        if (typeof endCallback === 'function') {
          endCallback.apply(this, arguments);
        }
      },
      stop = function () {
        var k;
        off(self.node, animationString, 'end', handler);
        off(self.node, animationString, 'iteration', iterationCallback);
        off(self.node, animationString, 'start', startCallback);
        setAnimationValue(self.node, 'name', '');
        for (k in self.animation) {
          if (self.animation.hasOwnProperty(k)) {
            setAnimationValue(self.node, k, '');
          }
        }
        self.node.offsetHeight;
      };

    on(self.node, animationString, 'end', handler);
    on(self.node, animationString, 'iteration', iterationCallback);
    on(self.node, animationString, 'start', startCallback);

    setAnimationValue(self.node, 'name', 'keyframejs' + self.keyframeId);
    for (key in self.animation) {
      if (self.animation.hasOwnProperty(key)) {
        setAnimationValue(self.node, key, self.animation[key]);
      }
    }

    self.node.offsetHeight;
    return {
      stop: stop,
      pause: function () {
        setAnimationValue(self.node, 'playState', 'paused');
      },
      resume: function () {
        setAnimationValue(self.node, 'playState', 'running');
      }
    };
  };


  function createTransition(node, to, opts, endCallback, cancelCallback) {
    var initialOpts = opts,
      transition;

    function setTo(to) {
      for (var prop in to) {
        if (to.hasOwnProperty(prop)) {
          node.style[getPrefixedProperty(node, prop)] = toCssValue(to[prop]);
        }
      }
    }

    function setTransition(to, opts) {
      setTransitionValue(node, 'property', getTransitionProperties(to).join(','));
      for (var key in opts) {
        if (opts.hasOwnProperty(key)) {
          setTransitionValue(node, key, opts[key]);
        }
      }
    }

    if (!transitionProperty) {
      transition = function () {
        setTo(to);
        if (typeof endCallback === 'function') {
          endCallback();
        }
      };
    } else {
      transition = function () {
        var transitionProperties = getTransitionProperties(to);

        function handler(e) {
          if (e.target === node && e.propertyName && indexOf.call(transitionProperties, e.propertyName) !== -1) {
            if (transition.cancel) {
              transition.cancel();
            }
            if (typeof endCallback === 'function') {
              endCallback.apply(this, arguments);
            }
          }
        }

        transition.cancel = function (to, opts) {
          transition.cancel = null;
          off(node, transitionString, 'end', handler);
          var toProperties = getTransitionProperties(to), newProperties = [];
          for (var i = 0; i < transitionProperties.length; i++) {
            if (indexOf.call(toProperties, transitionProperties[i]) !== -1) {
              newProperties.push(transitionProperties[i]);
            }
          }
          setTransitionValue(node, 'property', newProperties.join(','));
          for (var opt in initialOpts) {
            if (initialOpts.hasOwnProperty(opt)) {
              setTransitionValue(node, opt, opts ? opts[opt] : '');
            }
          }
          if (typeof cancelCallback === 'function' && to && opts) {
            //replacement of transition
            cancelCallback.apply(this, arguments);
          }
        };

        setTransition(to, opts);
        setTo(to);
        on(node, transitionString, 'end', handler);
      };
    }
    return transition;
  }

  function Transition(domNode, opts) {
    this.node = domNode;
    this.opts = opts || {};
    this.queue = [];
    this.current = null;
  }

  Transition.prototype.to = function (to, opts, endCallback, cancelCallback) {
    opts = options(opts, this.opts);
    if (typeof opts === 'function') {
      cancelCallback = endCallback;
      endCallback = opts;
      opts = null;
    }
    if (this.current && this.current.cancel) {
      this.current.cancel(to, opts);
    }
    this.queue.length = 0;
    this.then(to, opts, endCallback, cancelCallback);
    this.current = this.queue.shift();
    this.current();
    this.node.offsetHeight;
    return this;
  };

  Transition.prototype.then = function (to, opts, endCallback, cancelCallback) {
    var self = this;
    if (typeof opts === 'function') {
      cancelCallback = endCallback;
      endCallback = opts;
      opts = null;
    }
    opts = options(opts, this.opts);
    this.queue.push(createTransition(this.node, to, opts, function () {
      self.current = self.queue.shift();
      if (self.current) {
        requestAnimFrame(self.current);
      }
      if (typeof endCallback === 'function') {
        endCallback.apply(this, arguments);
      }
    }, cancelCallback));
    return this;
  };

  return {
    isSupported: isSupported,
    keyframe: function (keyframes) {
      return new Keyframes(keyframes);
    },
    transition: function (domNode, opts) {
      return new Transition(domNode, opts);
    }
  };
}));