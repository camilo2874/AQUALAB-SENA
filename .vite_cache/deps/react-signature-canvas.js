import {
  toPropertyKey
} from "./chunk-SGI6U4KA.js";
import {
  _typeof
} from "./chunk-NH6R5G3S.js";
import {
  _assertThisInitialized,
  _objectWithoutPropertiesLoose,
  _setPrototypeOf
} from "./chunk-VVYTI5TR.js";
import {
  require_prop_types
} from "./chunk-RYD55UQL.js";
import {
  _extends
} from "./chunk-RLGGP24I.js";
import {
  require_react
} from "./chunk-NN47QGFG.js";
import {
  __commonJS,
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/trim-canvas@0.1.2/node_modules/trim-canvas/build/index.js
var require_build = __commonJS({
  "node_modules/.pnpm/trim-canvas@0.1.2/node_modules/trim-canvas/build/index.js"(exports, module) {
    !function(e, t) {
      "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.trimCanvas = t() : e.trimCanvas = t();
    }(exports, function() {
      return function(e) {
        function t(n) {
          if (r[n]) return r[n].exports;
          var o = r[n] = { exports: {}, id: n, loaded: false };
          return e[n].call(o.exports, o, o.exports, t), o.loaded = true, o.exports;
        }
        var r = {};
        return t.m = e, t.c = r, t.p = "", t(0);
      }([function(e, t) {
        "use strict";
        function r(e2) {
          var t2 = e2.getContext("2d"), r2 = e2.width, n2 = e2.height, o2 = t2.getImageData(0, 0, r2, n2).data, f = a(true, r2, n2, o2), i = a(false, r2, n2, o2), c = u(true, r2, n2, o2), d = u(false, r2, n2, o2), p = d - c + 1, l = i - f + 1, s = t2.getImageData(c, f, p, l);
          return e2.width = p, e2.height = l, t2.clearRect(0, 0, p, l), t2.putImageData(s, 0, 0), e2;
        }
        function n(e2, t2, r2, n2) {
          return { red: n2[4 * (r2 * t2 + e2)], green: n2[4 * (r2 * t2 + e2) + 1], blue: n2[4 * (r2 * t2 + e2) + 2], alpha: n2[4 * (r2 * t2 + e2) + 3] };
        }
        function o(e2, t2, r2, o2) {
          return n(e2, t2, r2, o2).alpha;
        }
        function a(e2, t2, r2, n2) {
          for (var a2 = e2 ? 1 : -1, u2 = e2 ? 0 : r2 - 1, f = u2; e2 ? f < r2 : f > -1; f += a2) for (var i = 0; i < t2; i++) if (o(i, f, t2, n2)) return f;
          return null;
        }
        function u(e2, t2, r2, n2) {
          for (var a2 = e2 ? 1 : -1, u2 = e2 ? 0 : t2 - 1, f = u2; e2 ? f < t2 : f > -1; f += a2) for (var i = 0; i < r2; i++) if (o(f, i, t2, n2)) return f;
          return null;
        }
        Object.defineProperty(t, "__esModule", { value: true }), t.default = r;
      }]);
    });
  }
});

// node_modules/.pnpm/@babel+runtime@7.27.1/node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}

// node_modules/.pnpm/@babel+runtime@7.27.1/node_modules/@babel/runtime/helpers/esm/createClass.js
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: false
  }), e;
}

// node_modules/.pnpm/@babel+runtime@7.27.1/node_modules/@babel/runtime/helpers/esm/classCallCheck.js
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}

// node_modules/.pnpm/@babel+runtime@7.27.1/node_modules/@babel/runtime/helpers/esm/inherits.js
function _inherits(t, e) {
  if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
  t.prototype = Object.create(e && e.prototype, {
    constructor: {
      value: t,
      writable: true,
      configurable: true
    }
  }), Object.defineProperty(t, "prototype", {
    writable: false
  }), e && _setPrototypeOf(t, e);
}

// node_modules/.pnpm/@babel+runtime@7.27.1/node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
function _getPrototypeOf(t) {
  return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t2) {
    return t2.__proto__ || Object.getPrototypeOf(t2);
  }, _getPrototypeOf(t);
}

// node_modules/.pnpm/@babel+runtime@7.27.1/node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js
function _isNativeReflectConstruct() {
  try {
    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch (t2) {
  }
  return (_isNativeReflectConstruct = function _isNativeReflectConstruct2() {
    return !!t;
  })();
}

// node_modules/.pnpm/@babel+runtime@7.27.1/node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js
function _possibleConstructorReturn(t, e) {
  if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;
  if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
  return _assertThisInitialized(t);
}

// node_modules/.pnpm/@babel+runtime@7.27.1/node_modules/@babel/runtime/helpers/esm/createSuper.js
function _createSuper(t) {
  var r = _isNativeReflectConstruct();
  return function() {
    var e, o = _getPrototypeOf(t);
    if (r) {
      var s = _getPrototypeOf(this).constructor;
      e = Reflect.construct(o, arguments, s);
    } else e = o.apply(this, arguments);
    return _possibleConstructorReturn(this, e);
  };
}

// node_modules/.pnpm/react-signature-canvas@1.1._d4aa13c3f53e7c58cae36aac192a9e80/node_modules/react-signature-canvas/dist/index.mjs
var import_prop_types = __toESM(require_prop_types(), 1);
var import_react = __toESM(require_react(), 1);

// node_modules/.pnpm/signature_pad@2.3.2/node_modules/signature_pad/dist/signature_pad.mjs
function Point(x, y, time) {
  this.x = x;
  this.y = y;
  this.time = time || (/* @__PURE__ */ new Date()).getTime();
}
Point.prototype.velocityFrom = function(start) {
  return this.time !== start.time ? this.distanceTo(start) / (this.time - start.time) : 1;
};
Point.prototype.distanceTo = function(start) {
  return Math.sqrt(Math.pow(this.x - start.x, 2) + Math.pow(this.y - start.y, 2));
};
Point.prototype.equals = function(other) {
  return this.x === other.x && this.y === other.y && this.time === other.time;
};
function Bezier(startPoint, control1, control2, endPoint) {
  this.startPoint = startPoint;
  this.control1 = control1;
  this.control2 = control2;
  this.endPoint = endPoint;
}
Bezier.prototype.length = function() {
  var steps = 10;
  var length = 0;
  var px = void 0;
  var py = void 0;
  for (var i = 0; i <= steps; i += 1) {
    var t = i / steps;
    var cx = this._point(t, this.startPoint.x, this.control1.x, this.control2.x, this.endPoint.x);
    var cy = this._point(t, this.startPoint.y, this.control1.y, this.control2.y, this.endPoint.y);
    if (i > 0) {
      var xdiff = cx - px;
      var ydiff = cy - py;
      length += Math.sqrt(xdiff * xdiff + ydiff * ydiff);
    }
    px = cx;
    py = cy;
  }
  return length;
};
Bezier.prototype._point = function(t, start, c1, c2, end) {
  return start * (1 - t) * (1 - t) * (1 - t) + 3 * c1 * (1 - t) * (1 - t) * t + 3 * c2 * (1 - t) * t * t + end * t * t * t;
};
function throttle(func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};
  var later = function later2() {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function() {
    var now = Date.now();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
}
function SignaturePad(canvas, options) {
  var self = this;
  var opts = options || {};
  this.velocityFilterWeight = opts.velocityFilterWeight || 0.7;
  this.minWidth = opts.minWidth || 0.5;
  this.maxWidth = opts.maxWidth || 2.5;
  this.throttle = "throttle" in opts ? opts.throttle : 16;
  this.minDistance = "minDistance" in opts ? opts.minDistance : 5;
  if (this.throttle) {
    this._strokeMoveUpdate = throttle(SignaturePad.prototype._strokeUpdate, this.throttle);
  } else {
    this._strokeMoveUpdate = SignaturePad.prototype._strokeUpdate;
  }
  this.dotSize = opts.dotSize || function() {
    return (this.minWidth + this.maxWidth) / 2;
  };
  this.penColor = opts.penColor || "black";
  this.backgroundColor = opts.backgroundColor || "rgba(0,0,0,0)";
  this.onBegin = opts.onBegin;
  this.onEnd = opts.onEnd;
  this._canvas = canvas;
  this._ctx = canvas.getContext("2d");
  this.clear();
  this._handleMouseDown = function(event) {
    if (event.which === 1) {
      self._mouseButtonDown = true;
      self._strokeBegin(event);
    }
  };
  this._handleMouseMove = function(event) {
    if (self._mouseButtonDown) {
      self._strokeMoveUpdate(event);
    }
  };
  this._handleMouseUp = function(event) {
    if (event.which === 1 && self._mouseButtonDown) {
      self._mouseButtonDown = false;
      self._strokeEnd(event);
    }
  };
  this._handleTouchStart = function(event) {
    if (event.targetTouches.length === 1) {
      var touch = event.changedTouches[0];
      self._strokeBegin(touch);
    }
  };
  this._handleTouchMove = function(event) {
    event.preventDefault();
    var touch = event.targetTouches[0];
    self._strokeMoveUpdate(touch);
  };
  this._handleTouchEnd = function(event) {
    var wasCanvasTouched = event.target === self._canvas;
    if (wasCanvasTouched) {
      event.preventDefault();
      self._strokeEnd(event);
    }
  };
  this.on();
}
SignaturePad.prototype.clear = function() {
  var ctx = this._ctx;
  var canvas = this._canvas;
  ctx.fillStyle = this.backgroundColor;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  this._data = [];
  this._reset();
  this._isEmpty = true;
};
SignaturePad.prototype.fromDataURL = function(dataUrl) {
  var _this = this;
  var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  var image = new Image();
  var ratio = options.ratio || window.devicePixelRatio || 1;
  var width = options.width || this._canvas.width / ratio;
  var height = options.height || this._canvas.height / ratio;
  this._reset();
  image.src = dataUrl;
  image.onload = function() {
    _this._ctx.drawImage(image, 0, 0, width, height);
  };
  this._isEmpty = false;
};
SignaturePad.prototype.toDataURL = function(type) {
  var _canvas;
  switch (type) {
    case "image/svg+xml":
      return this._toSVG();
    default:
      for (var _len = arguments.length, options = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        options[_key - 1] = arguments[_key];
      }
      return (_canvas = this._canvas).toDataURL.apply(_canvas, [type].concat(options));
  }
};
SignaturePad.prototype.on = function() {
  this._handleMouseEvents();
  this._handleTouchEvents();
};
SignaturePad.prototype.off = function() {
  this._canvas.removeEventListener("mousedown", this._handleMouseDown);
  this._canvas.removeEventListener("mousemove", this._handleMouseMove);
  document.removeEventListener("mouseup", this._handleMouseUp);
  this._canvas.removeEventListener("touchstart", this._handleTouchStart);
  this._canvas.removeEventListener("touchmove", this._handleTouchMove);
  this._canvas.removeEventListener("touchend", this._handleTouchEnd);
};
SignaturePad.prototype.isEmpty = function() {
  return this._isEmpty;
};
SignaturePad.prototype._strokeBegin = function(event) {
  this._data.push([]);
  this._reset();
  this._strokeUpdate(event);
  if (typeof this.onBegin === "function") {
    this.onBegin(event);
  }
};
SignaturePad.prototype._strokeUpdate = function(event) {
  var x = event.clientX;
  var y = event.clientY;
  var point = this._createPoint(x, y);
  var lastPointGroup = this._data[this._data.length - 1];
  var lastPoint = lastPointGroup && lastPointGroup[lastPointGroup.length - 1];
  var isLastPointTooClose = lastPoint && point.distanceTo(lastPoint) < this.minDistance;
  if (!(lastPoint && isLastPointTooClose)) {
    var _addPoint = this._addPoint(point), curve = _addPoint.curve, widths = _addPoint.widths;
    if (curve && widths) {
      this._drawCurve(curve, widths.start, widths.end);
    }
    this._data[this._data.length - 1].push({
      x: point.x,
      y: point.y,
      time: point.time,
      color: this.penColor
    });
  }
};
SignaturePad.prototype._strokeEnd = function(event) {
  var canDrawCurve = this.points.length > 2;
  var point = this.points[0];
  if (!canDrawCurve && point) {
    this._drawDot(point);
  }
  if (point) {
    var lastPointGroup = this._data[this._data.length - 1];
    var lastPoint = lastPointGroup[lastPointGroup.length - 1];
    if (!point.equals(lastPoint)) {
      lastPointGroup.push({
        x: point.x,
        y: point.y,
        time: point.time,
        color: this.penColor
      });
    }
  }
  if (typeof this.onEnd === "function") {
    this.onEnd(event);
  }
};
SignaturePad.prototype._handleMouseEvents = function() {
  this._mouseButtonDown = false;
  this._canvas.addEventListener("mousedown", this._handleMouseDown);
  this._canvas.addEventListener("mousemove", this._handleMouseMove);
  document.addEventListener("mouseup", this._handleMouseUp);
};
SignaturePad.prototype._handleTouchEvents = function() {
  this._canvas.style.msTouchAction = "none";
  this._canvas.style.touchAction = "none";
  this._canvas.addEventListener("touchstart", this._handleTouchStart);
  this._canvas.addEventListener("touchmove", this._handleTouchMove);
  this._canvas.addEventListener("touchend", this._handleTouchEnd);
};
SignaturePad.prototype._reset = function() {
  this.points = [];
  this._lastVelocity = 0;
  this._lastWidth = (this.minWidth + this.maxWidth) / 2;
  this._ctx.fillStyle = this.penColor;
};
SignaturePad.prototype._createPoint = function(x, y, time) {
  var rect = this._canvas.getBoundingClientRect();
  return new Point(x - rect.left, y - rect.top, time || (/* @__PURE__ */ new Date()).getTime());
};
SignaturePad.prototype._addPoint = function(point) {
  var points = this.points;
  var tmp = void 0;
  points.push(point);
  if (points.length > 2) {
    if (points.length === 3) points.unshift(points[0]);
    tmp = this._calculateCurveControlPoints(points[0], points[1], points[2]);
    var c2 = tmp.c2;
    tmp = this._calculateCurveControlPoints(points[1], points[2], points[3]);
    var c3 = tmp.c1;
    var curve = new Bezier(points[1], c2, c3, points[2]);
    var widths = this._calculateCurveWidths(curve);
    points.shift();
    return { curve, widths };
  }
  return {};
};
SignaturePad.prototype._calculateCurveControlPoints = function(s1, s2, s3) {
  var dx1 = s1.x - s2.x;
  var dy1 = s1.y - s2.y;
  var dx2 = s2.x - s3.x;
  var dy2 = s2.y - s3.y;
  var m1 = { x: (s1.x + s2.x) / 2, y: (s1.y + s2.y) / 2 };
  var m2 = { x: (s2.x + s3.x) / 2, y: (s2.y + s3.y) / 2 };
  var l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
  var l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  var dxm = m1.x - m2.x;
  var dym = m1.y - m2.y;
  var k = l2 / (l1 + l2);
  var cm = { x: m2.x + dxm * k, y: m2.y + dym * k };
  var tx = s2.x - cm.x;
  var ty = s2.y - cm.y;
  return {
    c1: new Point(m1.x + tx, m1.y + ty),
    c2: new Point(m2.x + tx, m2.y + ty)
  };
};
SignaturePad.prototype._calculateCurveWidths = function(curve) {
  var startPoint = curve.startPoint;
  var endPoint = curve.endPoint;
  var widths = { start: null, end: null };
  var velocity = this.velocityFilterWeight * endPoint.velocityFrom(startPoint) + (1 - this.velocityFilterWeight) * this._lastVelocity;
  var newWidth = this._strokeWidth(velocity);
  widths.start = this._lastWidth;
  widths.end = newWidth;
  this._lastVelocity = velocity;
  this._lastWidth = newWidth;
  return widths;
};
SignaturePad.prototype._strokeWidth = function(velocity) {
  return Math.max(this.maxWidth / (velocity + 1), this.minWidth);
};
SignaturePad.prototype._drawPoint = function(x, y, size) {
  var ctx = this._ctx;
  ctx.moveTo(x, y);
  ctx.arc(x, y, size, 0, 2 * Math.PI, false);
  this._isEmpty = false;
};
SignaturePad.prototype._drawCurve = function(curve, startWidth, endWidth) {
  var ctx = this._ctx;
  var widthDelta = endWidth - startWidth;
  var drawSteps = Math.floor(curve.length());
  ctx.beginPath();
  for (var i = 0; i < drawSteps; i += 1) {
    var t = i / drawSteps;
    var tt = t * t;
    var ttt = tt * t;
    var u = 1 - t;
    var uu = u * u;
    var uuu = uu * u;
    var x = uuu * curve.startPoint.x;
    x += 3 * uu * t * curve.control1.x;
    x += 3 * u * tt * curve.control2.x;
    x += ttt * curve.endPoint.x;
    var y = uuu * curve.startPoint.y;
    y += 3 * uu * t * curve.control1.y;
    y += 3 * u * tt * curve.control2.y;
    y += ttt * curve.endPoint.y;
    var width = startWidth + ttt * widthDelta;
    this._drawPoint(x, y, width);
  }
  ctx.closePath();
  ctx.fill();
};
SignaturePad.prototype._drawDot = function(point) {
  var ctx = this._ctx;
  var width = typeof this.dotSize === "function" ? this.dotSize() : this.dotSize;
  ctx.beginPath();
  this._drawPoint(point.x, point.y, width);
  ctx.closePath();
  ctx.fill();
};
SignaturePad.prototype._fromData = function(pointGroups, drawCurve, drawDot) {
  for (var i = 0; i < pointGroups.length; i += 1) {
    var group = pointGroups[i];
    if (group.length > 1) {
      for (var j = 0; j < group.length; j += 1) {
        var rawPoint = group[j];
        var point = new Point(rawPoint.x, rawPoint.y, rawPoint.time);
        var color = rawPoint.color;
        if (j === 0) {
          this.penColor = color;
          this._reset();
          this._addPoint(point);
        } else if (j !== group.length - 1) {
          var _addPoint2 = this._addPoint(point), curve = _addPoint2.curve, widths = _addPoint2.widths;
          if (curve && widths) {
            drawCurve(curve, widths, color);
          }
        } else {
        }
      }
    } else {
      this._reset();
      var _rawPoint = group[0];
      drawDot(_rawPoint);
    }
  }
};
SignaturePad.prototype._toSVG = function() {
  var _this2 = this;
  var pointGroups = this._data;
  var canvas = this._canvas;
  var ratio = Math.max(window.devicePixelRatio || 1, 1);
  var minX = 0;
  var minY = 0;
  var maxX = canvas.width / ratio;
  var maxY = canvas.height / ratio;
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttributeNS(null, "width", canvas.width);
  svg.setAttributeNS(null, "height", canvas.height);
  this._fromData(pointGroups, function(curve, widths, color) {
    var path = document.createElement("path");
    if (!isNaN(curve.control1.x) && !isNaN(curve.control1.y) && !isNaN(curve.control2.x) && !isNaN(curve.control2.y)) {
      var attr = "M " + curve.startPoint.x.toFixed(3) + "," + curve.startPoint.y.toFixed(3) + " " + ("C " + curve.control1.x.toFixed(3) + "," + curve.control1.y.toFixed(3) + " ") + (curve.control2.x.toFixed(3) + "," + curve.control2.y.toFixed(3) + " ") + (curve.endPoint.x.toFixed(3) + "," + curve.endPoint.y.toFixed(3));
      path.setAttribute("d", attr);
      path.setAttribute("stroke-width", (widths.end * 2.25).toFixed(3));
      path.setAttribute("stroke", color);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      svg.appendChild(path);
    }
  }, function(rawPoint) {
    var circle = document.createElement("circle");
    var dotSize = typeof _this2.dotSize === "function" ? _this2.dotSize() : _this2.dotSize;
    circle.setAttribute("r", dotSize);
    circle.setAttribute("cx", rawPoint.x);
    circle.setAttribute("cy", rawPoint.y);
    circle.setAttribute("fill", rawPoint.color);
    svg.appendChild(circle);
  });
  var prefix = "data:image/svg+xml;base64,";
  var header = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' + (' viewBox="' + minX + " " + minY + " " + maxX + " " + maxY + '"') + (' width="' + maxX + '"') + (' height="' + maxY + '"') + ">";
  var body = svg.innerHTML;
  if (body === void 0) {
    var dummy = document.createElement("dummy");
    var nodes = svg.childNodes;
    dummy.innerHTML = "";
    for (var i = 0; i < nodes.length; i += 1) {
      dummy.appendChild(nodes[i].cloneNode(true));
    }
    body = dummy.innerHTML;
  }
  var footer = "</svg>";
  var data = header + body + footer;
  return prefix + btoa(data);
};
SignaturePad.prototype.fromData = function(pointGroups) {
  var _this3 = this;
  this.clear();
  this._fromData(pointGroups, function(curve, widths) {
    return _this3._drawCurve(curve, widths.start, widths.end);
  }, function(rawPoint) {
    return _this3._drawDot(rawPoint);
  });
  this._data = pointGroups;
};
SignaturePad.prototype.toData = function() {
  return this._data;
};
var signature_pad_default = SignaturePad;

// node_modules/.pnpm/react-signature-canvas@1.1._d4aa13c3f53e7c58cae36aac192a9e80/node_modules/react-signature-canvas/dist/index.mjs
var import_trim_canvas = __toESM(require_build(), 1);
var _excluded = ["canvasProps", "clearOnResize"];
var SignatureCanvas = function(_Component) {
  _inherits(SignatureCanvas2, _Component);
  var _super = _createSuper(SignatureCanvas2);
  function SignatureCanvas2() {
    var _this;
    _classCallCheck(this, SignatureCanvas2);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.staticThis = _this.constructor;
    _this._sigPad = null;
    _this._canvas = null;
    _this.setRef = function(ref) {
      _this._canvas = ref;
      if (_this._canvas === null) {
        _this._sigPad = null;
      }
    };
    _this._excludeOurProps = function() {
      var _this$props = _this.props;
      _this$props.canvasProps;
      _this$props.clearOnResize;
      var sigPadProps = _objectWithoutProperties(_this$props, _excluded);
      return sigPadProps;
    };
    _this.componentDidMount = function() {
      var canvas = _this.getCanvas();
      _this._sigPad = new signature_pad_default(canvas, _this._excludeOurProps());
      _this._resizeCanvas();
      _this.on();
    };
    _this.componentWillUnmount = function() {
      _this.off();
    };
    _this.componentDidUpdate = function() {
      Object.assign(_this._sigPad, _this._excludeOurProps());
    };
    _this.getCanvas = function() {
      if (_this._canvas === null) {
        throw _this.staticThis.refNullError;
      }
      return _this._canvas;
    };
    _this.getTrimmedCanvas = function() {
      var canvas = _this.getCanvas();
      var copy = document.createElement("canvas");
      copy.width = canvas.width;
      copy.height = canvas.height;
      copy.getContext("2d").drawImage(canvas, 0, 0);
      return (0, import_trim_canvas.default)(copy);
    };
    _this.getSignaturePad = function() {
      if (_this._sigPad === null) {
        throw _this.staticThis.refNullError;
      }
      return _this._sigPad;
    };
    _this._checkClearOnResize = function() {
      if (!_this.props.clearOnResize) {
        return;
      }
      _this._resizeCanvas();
    };
    _this._resizeCanvas = function() {
      var _this$props$canvasPro, _window$devicePixelRa;
      var canvasProps = (_this$props$canvasPro = _this.props.canvasProps) !== null && _this$props$canvasPro !== void 0 ? _this$props$canvasPro : {};
      var width = canvasProps.width, height = canvasProps.height;
      if (typeof width !== "undefined" && typeof height !== "undefined") {
        return;
      }
      var canvas = _this.getCanvas();
      var ratio = Math.max((_window$devicePixelRa = window.devicePixelRatio) !== null && _window$devicePixelRa !== void 0 ? _window$devicePixelRa : 1, 1);
      if (typeof width === "undefined") {
        canvas.width = canvas.offsetWidth * ratio;
      }
      if (typeof height === "undefined") {
        canvas.height = canvas.offsetHeight * ratio;
      }
      canvas.getContext("2d").scale(ratio, ratio);
      _this.clear();
    };
    _this.render = function() {
      var canvasProps = _this.props.canvasProps;
      return import_react.default.createElement("canvas", _extends({
        ref: _this.setRef
      }, canvasProps));
    };
    _this.on = function() {
      window.addEventListener("resize", _this._checkClearOnResize);
      return _this.getSignaturePad().on();
    };
    _this.off = function() {
      window.removeEventListener("resize", _this._checkClearOnResize);
      return _this.getSignaturePad().off();
    };
    _this.clear = function() {
      return _this.getSignaturePad().clear();
    };
    _this.isEmpty = function() {
      return _this.getSignaturePad().isEmpty();
    };
    _this.fromDataURL = function(dataURL, options) {
      return _this.getSignaturePad().fromDataURL(dataURL, options);
    };
    _this.toDataURL = function(type, encoderOptions) {
      return _this.getSignaturePad().toDataURL(type, encoderOptions);
    };
    _this.fromData = function(pointGroups) {
      return _this.getSignaturePad().fromData(pointGroups);
    };
    _this.toData = function() {
      return _this.getSignaturePad().toData();
    };
    return _this;
  }
  return _createClass(SignatureCanvas2);
}(import_react.Component);
SignatureCanvas.propTypes = {
  // signature_pad's props
  velocityFilterWeight: import_prop_types.default.number,
  minWidth: import_prop_types.default.number,
  maxWidth: import_prop_types.default.number,
  minDistance: import_prop_types.default.number,
  dotSize: import_prop_types.default.oneOfType([import_prop_types.default.number, import_prop_types.default.func]),
  penColor: import_prop_types.default.string,
  throttle: import_prop_types.default.number,
  onEnd: import_prop_types.default.func,
  onBegin: import_prop_types.default.func,
  // props specific to the React wrapper
  canvasProps: import_prop_types.default.object,
  clearOnResize: import_prop_types.default.bool
};
SignatureCanvas.defaultProps = {
  clearOnResize: true
};
SignatureCanvas.refNullError = new Error("react-signature-canvas is currently mounting or unmounting: React refs are null during this phase.");
export {
  SignatureCanvas,
  SignatureCanvas as default
};
/*! Bundled license information:

signature_pad/dist/signature_pad.mjs:
  (*!
   * Signature Pad v2.3.2
   * https://github.com/szimek/signature_pad
   *
   * Copyright 2017 Szymon Nowak
   * Released under the MIT license
   *
   * The main idea and some parts of the code (e.g. drawing variable width Bézier curve) are taken from:
   * http://corner.squareup.com/2012/07/smoother-signatures.html
   *
   * Implementation of interpolation using cubic Bézier curves is taken from:
   * http://benknowscode.wordpress.com/2012/09/14/path-interpolation-using-cubic-bezier-and-control-point-estimation-in-javascript
   *
   * Algorithm for approximated length of a Bézier curve is taken from:
   * http://www.lemoda.net/maths/bezier-length/index.html
   *
   *)
*/
//# sourceMappingURL=react-signature-canvas.js.map
