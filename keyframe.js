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
    requestAnimFrame = (function () {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
          window.setTimeout(callback, 0);
        };
    }());

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
      domNode.style[getPrefixedProperty(domNode, name + capitalize(key))] = value;
    };
  }

  function on(node, type, evt, handler) {
    node.addEventListener(getPrefixedEvent(type, evt, prefix), handler, false);
  }

  function off(node, type, evt, handler) {
    node.removeEventListener(getPrefixedEvent(type, evt, prefix), handler, false);
  }


  function Keyframes(keyframes) {
    var css, key, prop;
    if (!Keyframes.isSupported) {
      throw new Error('not supported');
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

  Keyframes.isSupported = !!animationProperty;

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


  function Transition(domNode, opts) {
    //Chaining
    this.node = domNode;
    this.opts = opts || {};
    this.states = [];
    this.inTransition = false;
  }

  Transition.isSupported = !!transitionProperty;

  Transition.prototype.to = function (to, opts, endCallback, startCallback) {
    var self = this, k, transition, setTo = function () {
      for (var prop in to) {
        if (to.hasOwnProperty(prop)) {
          if (to.hasOwnProperty(prop)) {
            self.node.style[getPrefixedProperty(self.node, prop)] = toCssValue(to[prop]);
          }
        }
      }
    };

    if (typeof opts === 'function') {
      endCallback = opts;
      startCallback = endCallback;
      opts = null;
    }
    if (!opts) {
      opts = self.opts;
    } else {
      for (k in self.opts) {
        if (self.opts.hasOwnProperty(k) && !opts.hasOwnProperty(k)) {
          opts[k] = self.opts[k];
        }
      }
    }

    if (!Transition.isSupported) {
      transition = function () {
        setTo();
        if (typeof startCallback === 'function') {
          startCallback();
        }
        self.node.offsetHeight;
        if (typeof endCallback === 'function') {
          endCallback();
        }
      };
    } else {
      transition = function () {
        var prop, key, transitionProperty = [];

        //Fill in props
        for (prop in to) {
          if (to.hasOwnProperty(prop)) {
            transitionProperty.push(toCssName(getPrefixedProperty(self.node, prop)));
          }
        }
        transitionProperty = transitionProperty.join(',');
        //Fill in transition
        setTransitionValue(self.node, 'property', transitionProperty);
        for (key in opts) {
          if (opts.hasOwnProperty(key)) {
            setTransitionValue(self.node, key, opts[key]);
          }
        }
        setTo();
        on(self.node, transitionString, 'start',startCallback);
        on(self.node, transitionString, 'end', function handler(e) {
          if (e.target === self.node && e.propertyName && transitionProperty.indexOf(e.propertyName) !== -1) {
            off(self.node, transitionString, 'end', handler);
            off(self.node, transitionString, 'start',startCallback);
            //Remove style
            setTransitionValue(self.node, 'property', '');
            for (key in opts) {
              if (opts.hasOwnProperty(key)) {
                setTransitionValue(self.node, key, '');
              }
            }
            if (typeof endCallback === 'function') {
              endCallback.apply(this, arguments);
            }

            //Go next
            self.node.offsetHeight;
            var next = self.states.shift();
            if (next) {
              requestAnimFrame(next);
            } else {
              self.inTransition = false;
            }
          }
        });
        self.inTransition = true;
        self.node.offsetHeight;
      };
    }
    if (!this.inTransition) {
      transition();
    } else {
      this.states.push(transition);
    }
    return this;
  };

  return {
    isSupported: Transition.isSupported && Keyframes.isSupported,
    keyframe: function (keyframes) {
      return new Keyframes(keyframes);
    },
    transition: function (domNode, opts) {
      return new Transition(domNode, opts);
    }
  };
}));