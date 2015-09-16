describe("Common", function () {
  it('should define global export', function () {
    expect(window.Keyframe).toBeDefined();
    expect(typeof window.Keyframe.keyframe).toBe('function');
    expect(typeof window.Keyframe.transition).toBe('function');
  });
});

describe("Keyframe animation", function () {
  var node, keyframes;
  beforeEach(function () {
    keyframes = {
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
    };

    node = document.createElement('div');
    node.style.position = 'absolute';
    node.style.top = '50px';
    node.style.left = '50px';
    node.style.width = '100px';
    node.style.height = '100px';
    document.body.appendChild(node);
  });

  afterEach(function () {
    document.body.removeChild(node);
  });

  it('should be able to define keyframes', function (next) {
    var counter = 0, started = false;
    Keyframe.keyframe(keyframes).animate(node, {
      duration: 100,
      iterationCount: 3
    }).start(function () {
        expect(counter).toBe(2);
        expect(started).toBeTruthy();
        next();
      },
      function () {
        started = true;
      },
      function () {
        counter++;
      }
    )
  });

  it('should be able to pause and resume animation', function (next) {
    var counter = 0, started = false;
    var control = Keyframe.keyframe(keyframes).animate(node, {
      duration: 300,
      iterationCount: 3
    }).start(function () {
        expect(counter).toBe(2);
        expect(started).toBeTruthy();
        next();
      },
      function () {
        started = true;
      },
      function () {
        counter++;
      }
    );
    setTimeout(function () {
      control.pause();
      setTimeout(function () {
        control.resume();
      }, 300);
    }, 300);
  });

  it('should be able to abort animation', function (next) {
    var counter = 0, started = false, ended = false;
    var control = Keyframe.keyframe(keyframes).animate(node, {
      duration: 1000,
    }).start(function () {
        ended = true;
      },
      function () {
        started = true;
      }
    );
    setTimeout(function () {
      control.stop();
      expect(started).toBeTruthy();
      expect(ended).toBeFalsy();
      expect(node.getBoundingClientRect()).toEqual(jasmine.objectContaining({top: 50, left: 50}));
      next();
    }, 100);
  });
});

describe("Transition animation", function () {
  var node, keyframes;
  beforeEach(function () {
    node = document.createElement('div');
    node.style.position = 'absolute';
    node.style.top = '50px';
    node.style.left = '50px';
    node.style.width = '100px';
    node.style.height = '100px';
    document.body.appendChild(node);
  });

  afterEach(function () {
    document.body.removeChild(node);
  });

  it('should transition form initial state to end state', function (next) {
    Keyframe.transition(node,
      {
        duration: 100
      })
      .to({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        background: 'red'
      }, function () {
        expect(node.getBoundingClientRect()).toEqual(jasmine.objectContaining({
          top: 100,
          left: 100,
          width: 200,
          height: 200
        }));
        next();
      });
  });

  it('should transition form initial state to end state with stops', function (next) {
    Keyframe.transition(node,
      {
        duration: 100
      })
      .to({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        background: 'red'
      }, function () {
        expect(node.getBoundingClientRect()).toEqual(jasmine.objectContaining({
          top: 100,
          left: 100,
          width: 200,
          height: 200
        }));
      })
      .then({
        left: 200,
        top: 200,
        width: 100,
        height: 100,
        background: 'blue'
      }, function () {
        expect(node.getBoundingClientRect()).toEqual(jasmine.objectContaining({
          top: 200,
          left: 200,
          width: 100,
          height: 100
        }));
      }).then({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        background: 'green'
      }, function () {
        expect(node.getBoundingClientRect()).toEqual(jasmine.objectContaining({
          top: 100,
          left: 100,
          width: 200,
          height: 200
        }));
        next();
      });
  });

  it('should cancel transition form initial state to end state when new state added', function (next) {
    var called = false, canceled = false;

    Keyframe.transition(node,
      {
        duration: 100
      })
      .to({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        background: 'red'
      }, function () {
        called = true;
      },function () {
        canceled = true;
      })
      .to({
        left: 200,
        top: 200,
        width: 100,
        height: 100,
        background: 'blue'
      }, function () {
        expect(node.getBoundingClientRect()).toEqual(jasmine.objectContaining({
          top: 200,
          left: 200,
          width: 100,
          height: 100
        }));
        expect(called).toBeFalsy();
        expect(canceled).toBeTruthy();
        next();
      });
  });
});