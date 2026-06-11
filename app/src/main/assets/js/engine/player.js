/* player.js - Pizza Empire First-Person Player Controller
 * Uses Three.js globals (THREE available globally)
 * IIFE pattern - no ES modules
 */
var Player = (function () {
  'use strict';

  // ── internal state ──────────────────────────────────────────────────────────
  var _camera;
  var _position = { x: 0, y: 1.75, z: 6 };
  var _yaw = 0;       // radians, horizontal rotation
  var _pitch = 0;     // radians, vertical rotation (clamped)

  var _moveForward = false;
  var _moveBackward = false;
  var _moveLeft = false;
  var _moveRight = false;
  var _isMoving = false;

  var _bobTimer = 0;
  var _bobAmount = 0.055;
  var _bobSpeed = 9;
  var _currentBob = 0;

  var PLAYER_HEIGHT = 1.75;
  var PLAYER_RADIUS = 0.35;
  var MOVE_SPEED = 4.5;
  var PITCH_LIMIT = Math.PI / 3; // 60 degrees

  // ── touch state ─────────────────────────────────────────────────────────────
  var _leftTouch = null;    // { id, startX, startY, x, y }
  var _rightTouch = null;   // { id, startX, startY, x, y }

  var _joystickBase = null;
  var _joystickThumb = null;
  var _joystickRadius = 50; // pixels - max joystick displacement

  // For look delta
  var _lastLookX = 0;
  var _lastLookY = 0;
  var _lookSensitivity = 0.003;

  var _nearestInteractable = null;

  // ── canvas boundaries ───────────────────────────────────────────────────────
  var _canvasWidth = window.innerWidth;
  var _canvasHeight = window.innerHeight;

  // ── init ─────────────────────────────────────────────────────────────────────
  function init(scene) {
    var aspect = window.innerWidth / window.innerHeight;
    _camera = new THREE.PerspectiveCamera(75, aspect, 0.05, 150);
    _camera.rotation.order = 'YXZ';

    _position.x = 0;
    _position.y = PLAYER_HEIGHT;
    _position.z = 6;

    _camera.position.set(_position.x, _position.y, _position.z);
    _camera.rotation.set(0, 0, 0);

    // Grab joystick DOM elements
    _joystickBase  = document.getElementById('joystick-base');
    _joystickThumb = document.getElementById('joystick-thumb');

    // Bind touch events on the canvas
    var canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.addEventListener('touchstart',  _onTouchStart,  { passive: false });
      canvas.addEventListener('touchmove',   _onTouchMove,   { passive: false });
      canvas.addEventListener('touchend',    _onTouchEnd,    { passive: false });
      canvas.addEventListener('touchcancel', _onTouchEnd,    { passive: false });
    }

    // Also handle mouse for desktop testing
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mouseup',   _onMouseUp);
    document.addEventListener('keydown',   _onKeyDown);
    document.addEventListener('keyup',     _onKeyUp);

    // Resize
    window.addEventListener('resize', function () {
      _canvasWidth  = window.innerWidth;
      _canvasHeight = window.innerHeight;
      _camera.aspect = _canvasWidth / _canvasHeight;
      _camera.updateProjectionMatrix();
    });

    if (scene) {
      scene.add(_camera);
    }
  }

  // ── keyboard handlers (desktop fallback) ────────────────────────────────────
  var _mouseDown = false;
  var _lastMouseX = 0;
  var _lastMouseY = 0;

  function _onMouseDown(e) {
    if (e.button === 0) {
      _mouseDown = true;
      _lastMouseX = e.clientX;
      _lastMouseY = e.clientY;
    }
  }

  function _onMouseUp(e) {
    if (e.button === 0) _mouseDown = false;
  }

  function _onMouseMove(e) {
    if (!_mouseDown) return;
    var dx = e.clientX - _lastMouseX;
    var dy = e.clientY - _lastMouseY;
    _lastMouseX = e.clientX;
    _lastMouseY = e.clientY;
    _yaw   -= dx * _lookSensitivity * 100;
    _pitch -= dy * _lookSensitivity * 100;
    _pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, _pitch));
  }

  function _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    _moveForward  = true; break;
      case 'KeyS': case 'ArrowDown':  _moveBackward = true; break;
      case 'KeyA': case 'ArrowLeft':  _moveLeft     = true; break;
      case 'KeyD': case 'ArrowRight': _moveRight    = true; break;
    }
  }

  function _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    _moveForward  = false; break;
      case 'KeyS': case 'ArrowDown':  _moveBackward = false; break;
      case 'KeyA': case 'ArrowLeft':  _moveLeft     = false; break;
      case 'KeyD': case 'ArrowRight': _moveRight    = false; break;
    }
  }

  // ── touch handlers ───────────────────────────────────────────────────────────
  function _onTouchStart(e) {
    e.preventDefault();
    var touches = e.changedTouches;
    for (var i = 0; i < touches.length; i++) {
      var t = touches[i];
      var screenX = t.clientX;
      var isLeft = screenX < _canvasWidth / 2;

      if (isLeft && _leftTouch === null) {
        _leftTouch = {
          id: t.identifier,
          startX: t.clientX,
          startY: t.clientY,
          x: t.clientX,
          y: t.clientY
        };
        _showJoystick(t.clientX, t.clientY);
      } else if (!isLeft && _rightTouch === null) {
        _rightTouch = {
          id: t.identifier,
          startX: t.clientX,
          startY: t.clientY,
          x: t.clientX,
          y: t.clientY
        };
        _lastLookX = t.clientX;
        _lastLookY = t.clientY;
      }
    }
  }

  function _onTouchMove(e) {
    e.preventDefault();
    var touches = e.changedTouches;
    for (var i = 0; i < touches.length; i++) {
      var t = touches[i];

      if (_leftTouch && t.identifier === _leftTouch.id) {
        _leftTouch.x = t.clientX;
        _leftTouch.y = t.clientY;
        _updateJoystickVisual();
      } else if (_rightTouch && t.identifier === _rightTouch.id) {
        var dx = t.clientX - _lastLookX;
        var dy = t.clientY - _lastLookY;
        _lastLookX = t.clientX;
        _lastLookY = t.clientY;
        _yaw   -= dx * _lookSensitivity;
        _pitch -= dy * _lookSensitivity;
        _pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, _pitch));
        _rightTouch.x = t.clientX;
        _rightTouch.y = t.clientY;
      }
    }
  }

  function _onTouchEnd(e) {
    e.preventDefault();
    var touches = e.changedTouches;
    for (var i = 0; i < touches.length; i++) {
      var t = touches[i];
      if (_leftTouch && t.identifier === _leftTouch.id) {
        _leftTouch = null;
        _hideJoystick();
      } else if (_rightTouch && t.identifier === _rightTouch.id) {
        _rightTouch = null;
      }
    }
  }

  // ── joystick visual helpers ──────────────────────────────────────────────────
  function _showJoystick(x, y) {
    if (!_joystickBase) return;
    _joystickBase.style.display  = 'block';
    _joystickThumb.style.display = 'block';
    _joystickBase.style.left  = (x - 50) + 'px';
    _joystickBase.style.top   = (y - 50) + 'px';
    _joystickThumb.style.left = (x - 20) + 'px';
    _joystickThumb.style.top  = (y - 20) + 'px';
  }

  function _hideJoystick() {
    if (!_joystickBase) return;
    _joystickBase.style.display  = 'none';
    _joystickThumb.style.display = 'none';
    // Reset move flags derived from joystick
    _moveForward  = false;
    _moveBackward = false;
    _moveLeft     = false;
    _moveRight    = false;
  }

  function _updateJoystickVisual() {
    if (!_leftTouch || !_joystickBase) return;

    var dx = _leftTouch.x - _leftTouch.startX;
    var dy = _leftTouch.y - _leftTouch.startY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp to radius
    if (dist > _joystickRadius) {
      dx = (dx / dist) * _joystickRadius;
      dy = (dy / dist) * _joystickRadius;
    }

    // Move thumb visual
    if (_joystickThumb) {
      _joystickThumb.style.left = (_leftTouch.startX + dx - 20) + 'px';
      _joystickThumb.style.top  = (_leftTouch.startY + dy - 20) + 'px';
    }

    // Derive move flags from joystick displacement
    var threshold = _joystickRadius * 0.2;
    _moveForward  = dy < -threshold;
    _moveBackward = dy >  threshold;
    _moveLeft     = dx < -threshold;
    _moveRight    = dx >  threshold;
  }

  // ── AABB collision helper ────────────────────────────────────────────────────
  function _checkCollision(px, py, pz, colliders) {
    var minY = py - PLAYER_HEIGHT;
    var maxY = py;

    for (var i = 0; i < colliders.length; i++) {
      var c = colliders[i];
      // Y overlap check
      if (maxY < c.minY || minY > c.maxY) continue;
      // XZ overlap with player radius
      if (px + PLAYER_RADIUS > c.minX &&
          px - PLAYER_RADIUS < c.maxX &&
          pz + PLAYER_RADIUS > c.minZ &&
          pz - PLAYER_RADIUS < c.maxZ) {
        return true;
      }
    }
    return false;
  }

  // ── update (called each frame) ───────────────────────────────────────────────
  function update(delta, colliders) {
    if (!_camera) return { position: _position, isMoving: false, nearestInteractable: null };

    // Clamp delta to avoid huge jumps
    if (delta > 0.1) delta = 0.1;

    // ── compute move direction from yaw ──────────────────────────────────────
    var sinYaw = Math.sin(_yaw);
    var cosYaw = Math.cos(_yaw);

    var vx = 0, vz = 0;

    if (_moveForward) {
      vx += -sinYaw;
      vz += -cosYaw;
    }
    if (_moveBackward) {
      vx += sinYaw;
      vz += cosYaw;
    }
    if (_moveLeft) {
      vx += -cosYaw;
      vz +=  sinYaw;
    }
    if (_moveRight) {
      vx +=  cosYaw;
      vz += -sinYaw;
    }

    // Normalize diagonal movement
    var len = Math.sqrt(vx * vx + vz * vz);
    if (len > 0) {
      vx /= len;
      vz /= len;
    }

    var moved = (len > 0);
    var stepX = vx * MOVE_SPEED * delta;
    var stepZ = vz * MOVE_SPEED * delta;

    // ── AABB collision: try X and Z separately ───────────────────────────────
    var newX = _position.x + stepX;
    var newZ = _position.z + stepZ;

    if (colliders && colliders.length > 0) {
      // Try X
      if (_checkCollision(newX, _position.y, _position.z, colliders)) {
        newX = _position.x;
      }
      // Try Z
      if (_checkCollision(newX, _position.y, newZ, colliders)) {
        newZ = _position.z;
      }
    }

    _position.x = newX;
    _position.z = newZ;
    // Player always on ground for now (no jumping)
    _position.y = PLAYER_HEIGHT;

    _isMoving = moved;

    // ── camera bob ───────────────────────────────────────────────────────────
    if (moved) {
      _bobTimer += delta * _bobSpeed;
    } else {
      // Smoothly return bob to zero
      _bobTimer *= 0.85;
    }
    _currentBob = moved ? Math.sin(_bobTimer) * _bobAmount : _currentBob * 0.8;

    // ── apply camera transform ───────────────────────────────────────────────
    _camera.position.set(
      _position.x,
      _position.y + _currentBob,
      _position.z
    );
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    return {
      position: _position,
      isMoving: _isMoving,
      nearestInteractable: _nearestInteractable
    };
  }

  // ── setNearestInteractable (called by NPC system) ────────────────────────────
  function setNearestInteractable(npc) {
    _nearestInteractable = npc;
  }

  // ── public API ────────────────────────────────────────────────────────────────
  function getCamera()   { return _camera; }
  function getPosition() { return { x: _position.x, y: _position.y, z: _position.z }; }
  function setPosition(x, y, z) {
    _position.x = x;
    _position.y = (y !== undefined) ? y : PLAYER_HEIGHT;
    _position.z = z;
    if (_camera) _camera.position.set(_position.x, _position.y, _position.z);
  }
  function setYaw(rad) {
    _yaw = rad;
  }

  return {
    init: init,
    update: update,
    getCamera: getCamera,
    getPosition: getPosition,
    setPosition: setPosition,
    setYaw: setYaw,
    setNearestInteractable: setNearestInteractable
  };
}());
