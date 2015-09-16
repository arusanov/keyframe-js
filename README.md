# Keyframe
Keyframe is tiny JS library which exposes helper methods for creating css3 animations and transitions.
The goal is to ease the creation of keyframes in cases where a property's value need to be set at runtime.
In addition, Keyframe can determine whether a given css property need to have a vendor prefix,
taking away some cross-browser dependent code.

## Install

`bower install keyframe-js`

## Usage

Creating keyframe:
```
//Create a keyframe (can be used later)
var keyframes = Keyframe.keyframe({
    from: {
      top: 100,
      left: 100,
      background: 'yellow'
    },
    50: {
      top: 200,
      left: 200,
      background: 'green',
      transform: 'scale(0.5,0.5)'
    },
    to: {
      top: 300,
      left: 300,
      background: 'blue',
      transform: 'scale(1.5,1.5)'
    }
    })
```

Animating element:
```
/*
    animate takes 2 parameters:
        1. DOM element to animate
        2. animation settings like in css but without 'animation' prefix
           (duration, delay, iterationCount, direction, timingFunction)
    it returns animation object with start() method
*/
var animation = keyframes.animate(document.getElementById('element'), {
    duration: 100,
    iterationCount: 3
  });

/*
  start an animation by calling 'start'.
  It accepts 3 callback parameters.
      (endCallback, startCallback, iterationCallback)
  it returns animation object with 3 methods for animation flow control
*/
var animationControls = animation.start();

/* Animation control can pause, resume and stop running animation */
animationControls.pause();
animationControls.resume();
animationControls.stop();
```

Transitions:
```
/*
    transition takes 2 parameters:
        1. DOM element to animate
        2. transition settings like in css but without 'transition' prefix
           (duration, delay, timingFunction)
    it returns transition object chain
*/
var transition = Keyframe.transition(node,
  {
    duration: 100
  })
  .to({
    left: 100,
    top: 100,
    width: 200,
    height: 200,
    background: 'red'
  },function onend() {
    //Called when step ended
  }, function oncancel() {
    //Called when step canceled
  })
  .then({ //Starts transition when previous completed
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      background: 'red'
    },function onend() {
      //Called when step ended
    }, function oncancel() {
      //Called when step canceled
    });
```
