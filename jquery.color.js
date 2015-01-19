/*!
 * jQuery Color Animations v@VERSION
 * https://github.com/jquery/jquery-color
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: @DATE
 */
(function($, undefined)
{

	var stepHooks = "backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor",

		// plusequals test for += 100 -= 100
		rplusequals = /^([\-+])=\s*(\d+\.?\d*)/,
		// a set of RE's that can match strings and generate color tuples.
		stringParsers = [
			{
				re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
				parse: function(execResult)
				{
					return [
						execResult[1],
						execResult[2],
						execResult[3],
						execResult[4]
					];
				}
		},
			{
				re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
				parse: function(execResult)
				{
					return [
						execResult[1] * 2.55,
						execResult[2] * 2.55,
						execResult[3] * 2.55,
						execResult[4]
					];
				}
		},
			{
				// this regex ignores A-F because it's compared against an already lowercased string
				re: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,
				parse: function(execResult)
				{
					return [
						parseInt(execResult[1], 16),
						parseInt(execResult[2], 16),
						parseInt(execResult[3], 16)
					];
				}
		},
			{
				// this regex ignores A-F because it's compared against an already lowercased string
				re: /#([a-f0-9])([a-f0-9])([a-f0-9])/,
				parse: function(execResult)
				{
					return [
						parseInt(execResult[1] + execResult[1], 16),
						parseInt(execResult[2] + execResult[2], 16),
						parseInt(execResult[3] + execResult[3], 16)
					];
				}
		},
			{
				re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
				space: "hsla",
				parse: function(execResult)
				{
					return [
						execResult[1],
						execResult[2] / 100,
						execResult[3] / 100,
						execResult[4]
					];
				}
		},
			{
				// hsv(30,100%,40%)

				re: /hsva?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
				space: "hsva",
				parse: function(execResult)
				{
					return [
						execResult[1],
						execResult[2] / 100,
						execResult[3] / 100,
						execResult[4]
					];
				}
		},
		],

		// $.Color( )
		color = $.Color = function(color, green, blue, alpha)
		{
			return new $.Color.fn.parse(color, green, blue, alpha);
		},
		spaces = {
			rgba:
			{
				props:
				{
					red:
					{
						idx: 0,
						type: "byte"
					},
					green:
					{
						idx: 1,
						type: "byte"
					},
					blue:
					{
						idx: 2,
						type: "byte"
					}
				}
			},

			hsla:
			{
				props:
				{
					hue:
					{
						idx: 0,
						type: "degrees"
					},
					saturation:
					{
						idx: 1,
						type: "percent"
					},
					lightness:
					{
						idx: 2,
						type: "percent"
					}
				}
			},

			// not work on css
			/*
				[a = $jQuery.Color('rgb(128, 25, 0)'), a.hsla(), a.hsva(), a + '', a.toHslaString(), a.toHsvaString(),
				a.brightness(), a.lightness(), a.brightness(0.25),
				a.brightness(0.25).toHsvaString(), a.brightness(0.25) + '']
			*/
			hsva:
			{
				props:
				{
					hue:
					{
						idx: 0,
						type: "degrees"
					},
					saturation:
					{
						idx: 1,
						type: "percent"
					},
					//value:
					brightness:
					{
						idx: 2,
						type: "percent"
					}
				}
			},
		},
		propTypes = {
			"byte":
			{
				floor: true,
				max: 255
			},
			"percent":
			{
				max: 1
			},
			"degrees":
			{
				mod: 360,
				floor: true
			},
		},
		support = color.support = {},

		// element for support tests
		supportElem = $("<p>")[0],

		// colors = $.Color.names
		colors,

		// local aliases of functions called often
		each = $.each;

	// determine rgba support immediately
	supportElem.style.cssText = "background-color:rgba(1,1,1,.5)";
	support.rgba = supportElem.style.backgroundColor.indexOf("rgba") > -1;

	// define cache name and alpha properties
	// for rgba and hsla spaces
	each(spaces, function(spaceName, space)
	{
		space.cache = "_" + spaceName;
		space.props.alpha = {
			idx: 3,
			type: "percent",
			def: 1
		};
	});

	function clamp(value, prop, allowEmpty)
	{
		var type = propTypes[prop.type] || {};

		if (value == null)
		{
			return (allowEmpty || !prop.def) ? null : prop.def;
		}

		// ~~ is an short way of doing floor for positive numbers
		value = type.floor ? ~~value : parseFloat(value);

		// IE will pass in empty strings as value for alpha,
		// which will hit this case
		if (isNaN(value))
		{
			return prop.def;
		}

		if (type.mod)
		{
			// we add mod before modding to make sure that negatives values
			// get converted properly: -10 -> 350
			return (value + type.mod) % type.mod;
		}

		// for now all property types without mod have min and max
		return 0 > value ? 0 : type.max < value ? type.max : value;
	}

	function stringParse(string)
	{
		var inst = color(),
			rgba = inst._rgba = [];

		string = string.toLowerCase();

		each(stringParsers, function(i, parser)
		{
			var parsed,
				match = parser.re.exec(string),
				values = match && parser.parse(match),
				spaceName = parser.space || "rgba";

			if (values)
			{
				parsed = inst[spaceName](values);

				// if this was an rgba parse the assignment might happen twice
				// oh well....
				inst[spaces[spaceName].cache] = parsed[spaces[spaceName].cache];
				rgba = inst._rgba = parsed._rgba;

				// exit each( stringParsers ) here because we matched
				return false;
			}
		});

		// Found a stringParser that handled it
		if (rgba.length)
		{

			// if this came from a parsed string, force "transparent" when alpha is 0
			// chrome, (and maybe others) return "transparent" as rgba(0,0,0,0)
			if (rgba.join() === "0,0,0,0")
			{
				$.extend(rgba, colors.transparent);
			}
			return inst;
		}

		// named colors
		return colors[string];
	}

	color.fn = $.extend(color.prototype,
	{
		parse: function(red, green, blue, alpha)
		{
			if (red === undefined)
			{
				this._rgba = [null, null, null, null];
				return this;
			}
			if (red.jquery || red.nodeType)
			{
				red = $(red)
					.css(green);
				green = undefined;
			}

			var inst = this,
				type = $.type(red),
				rgba = this._rgba = [];

			// more than 1 argument specified - assume ( red, green, blue, alpha )
			if (green !== undefined)
			{
				red = [red, green, blue, alpha];
				type = "array";
			}

			if (type === "string")
			{
				return this.parse(stringParse(red) || colors._default);
			}

			if (type === "array")
			{
				each(spaces.rgba.props, function(key, prop)
				{
					rgba[prop.idx] = clamp(red[prop.idx], prop);
				});
				return this;
			}

			if (type === "object")
			{
				if (red instanceof color)
				{
					each(spaces, function(spaceName, space)
					{
						if (red[space.cache])
						{
							inst[space.cache] = red[space.cache].slice();
						}
					});
				}
				else
				{
					each(spaces, function(spaceName, space)
					{
						var cache = space.cache;
						each(space.props, function(key, prop)
						{

							// if the cache doesn't exist, and we know how to convert
							if (!inst[cache] && space.to)
							{

								// if the value was null, we don't need to copy it
								// if the key was alpha, we don't need to copy it either
								if (key === "alpha" || red[key] == null)
								{
									return;
								}
								inst[cache] = space.to(inst._rgba);
							}

							// this is the only case where we allow nulls for ALL properties.
							// call clamp with alwaysAllowEmpty
							inst[cache][prop.idx] = clamp(red[key], prop, true);
						});

						// everything defined but alpha?
						if (inst[cache] && $.inArray(null, inst[cache].slice(0, 3)) < 0)
						{
							// use the default of 1
							inst[cache][3] = 1;
							if (space.from)
							{
								inst._rgba = space.from(inst[cache]);
							}
						}
					});
				}
				return this;
			}
		},
		is: function(compare)
		{
			var is = color(compare),
				same = true,
				inst = this;

			each(spaces, function(_, space)
			{
				var localCache,
					isCache = is[space.cache];
				if (isCache)
				{
					localCache = inst[space.cache] || space.to && space.to(inst._rgba) || [];
					each(space.props, function(_, prop)
					{
						if (isCache[prop.idx] != null)
						{
							same = (isCache[prop.idx] === localCache[prop.idx]);
							return same;
						}
					});
				}
				return same;
			});
			return same;
		},
		_space: function()
		{
			var used = [],
				inst = this;
			each(spaces, function(spaceName, space)
			{
				if (inst[space.cache])
				{
					used.push(spaceName);
				}
			});
			return used.pop();
		},
		transition: function(other, distance)
		{
			var end = color(other),
				spaceName = end._space(),
				space = spaces[spaceName],
				startColor = this.alpha() === 0 ? color("transparent") : this,
				start = startColor[space.cache] || space.to(startColor._rgba),
				result = start.slice();

			end = end[space.cache];
			each(space.props, function(key, prop)
			{
				var index = prop.idx,
					startValue = start[index],
					endValue = end[index],
					type = propTypes[prop.type] || {};

				// if null, don't override start value
				if (endValue === null)
				{
					return;
				}
				// if null - use end
				if (startValue === null)
				{
					result[index] = endValue;
				}
				else
				{
					if (type.mod)
					{
						if (endValue - startValue > type.mod / 2)
						{
							startValue += type.mod;
						}
						else if (startValue - endValue > type.mod / 2)
						{
							startValue -= type.mod;
						}
					}
					result[index] = clamp((endValue - startValue) * distance + startValue, prop);
				}
			});
			return this[spaceName](result);
		},
		blend: function(opaque)
		{
			// if we are already opaque - return ourself
			if (this._rgba[3] === 1)
			{
				return this;
			}

			var rgb = this._rgba.slice(),
				a = rgb.pop(),
				blend = color(opaque)
				._rgba;

			return color($.map(rgb, function(v, i)
			{
				return (1 - a) * blend[i] + a * v;
			}));
		},
		toRgbaString: function()
		{
			var prefix = "rgba(",
				rgba = $.map(this._rgba, function(v, i)
				{
					return v == null ? (i > 2 ? 1 : 0) : v;
				});

			if (rgba[3] === 1)
			{
				rgba.pop();
				prefix = "rgb(";
			}

			return prefix + rgba.join() + ")";
		},
		toHslaString: function()
		{
			var prefix = "hsla(",
				hsla = $.map(this.hsla(), function(v, i)
				{
					if (v == null)
					{
						v = i > 2 ? 1 : 0;
					}

					// catch 1 and 2
					if (i && i < 3)
					{
						v = Math.round(v * 100) + "%";
					}
					return v;
				});

			if (hsla[3] === 1)
			{
				hsla.pop();
				prefix = "hsl(";
			}
			return prefix + hsla.join() + ")";
		},
		toHexString: function(includeAlpha)
		{
			var rgba = this._rgba.slice(),
				alpha = rgba.pop();

			if (includeAlpha)
			{
				rgba.push(~~(alpha * 255));
			}

			return "#" + $.map(rgba, function(v)
				{

					// default to 0 when nulls exist
					v = (v || 0)
						.toString(16);
					return v.length === 1 ? "0" + v : v;
				})
				.join("");
		},
		toString: function()
		{
			return this._rgba[3] === 0 ? "transparent" : this.toRgbaString();
		},

		clone: function()
		{
			var rgba = this._rgba.slice();

			return color(rgba);
		},

		invert: function(skipAlpha)
		{
			var rgba = this._rgba.slice();

			if (skipAlpha)
			{
				var _copy = this.clone().blend();

				rgba = _copy._rgba.slice();
			}

			var i;

			for (i = 0; i<3; i++)
			{
				rgba[i] = Math.abs(255 - rgba[i]);
			}

			return color(rgba);
		},

		/**
		 * @url https://gist.github.com/kozo002/6806421
		 **/
		chkBrightness: function(skipAlpha)
		{
			var rgba = this._rgba.slice();

			if (!skipAlpha && rgba[3] === 0)
			{
				return null;
			}

			if (skipAlpha)
			{
				var _copy = this.clone().blend();

				rgba = _copy._rgba.slice();
			}

			var y = 2.99 * rgba[0] + 5.87 * rgba[1] + 1.14 * rgba[2];

			if (y >= 1275)
			{
				//return 'light';
				return 'white';
			}
			else
			{
				//return 'dark';
				return 'black';
			}
		},

		exec: function(fn)
		{
			var args = Array.prototype.slice.call(arguments, 1) || [];

			var ret = fn.apply(this, args);

			return ret === undefined ? this : ret;
		},

		blendBrightness: function(options, skipAlpha)
		{
			var rgb = this._rgba.slice(),
				a = rgb.pop()
				;

			console.log([rgb, a]);

			if (skipAlpha)
			{
				var _copy = this.clone().blend();

				rgb = _copy._rgba.slice();
				a = rgb.pop();
			}

			var max = (rgb.slice().sort(function(l,r){return r-l}))[0];
			var multiplier = max;

			multiplier = (multiplier / 255) + 1;

			// if it would still be too dark, make it lighten more
			if (multiplier < 1.5) multiplier = options || 1.9;

			// if it gets to white, move away a bit
			if ((max * multiplier) > 255)
			{
				multiplier = (multiplier / 230) + 1.005;
			}

			$.each(rgb, function(i, v)
			{
				rgb[i] = multiplier * v;
			});

			rgb.push(a);

			return color(rgb);
		},

		rand: function(fn)
		{
			var rgba = this._rgba.slice();

			if (!$.isFunction(fn))
			{
				fn = Math.random;
			}

			var i;

			for (i = 0; i<3; i++)
			{
				rgba[i] = Math.round(fn(i, rgba[i]) * (1 + rgba[i]));
			}

			return color(rgba);
		},

		scale: function(value)
		{
			var rgba = this._rgba.slice();

			var i;

			if (!$.isArray(value))
			{
				value = [value, value, value, 1];
			}

			rgba.map(function(v, i)
			{
				rgba[i] = Math.round(value[i] * v);
			});

			return color(rgba);
		},

		contrastColor: function()
		{
			var r = this._rgba[0], g = this._rgba[1], b = this._rgba[2];
			return color((((r*299)+(g*587)+(b*144))/1000) >= 131.5 ? 'black' : 'white');
		},

		toHsvaString: function()
		{
			var prefix = "hsva(",
				hsva = $.map(this.hsva(), function(v, i)
				{
					if (v == null)
					{
						v = i > 2 ? 1 : 0;
					}

					// catch 1 and 2
					if (i && i < 3)
					{
						v = Math.round(v * 100) + "%";
					}
					return v;
				});

			if (hsva[3] === 1)
			{
				hsva.pop();
				prefix = "hsv(";
			}
			return prefix + hsva.join() + ")";
		},

		greyscale: function()
		{
			return this.saturation(0);
		},
	});
	color.fn.parse.prototype = color.fn;

	/*
	$.extend(color, {
		_defaults: {
			format: 'rgba',
		},

		options: {
			format: 'Rgba',
		},
	});
	*/

	$.extend(color, {
		rand: function(options)
		{
			return color(options || [255, 255, 255, 1]).rand();
		},

		// hsla conversions adapted from:
		// https://code.google.com/p/maashaack/source/browse/packages/graphics/trunk/src/graphics/colors/HUE2RGB.as?r=5021
		hue2rgb: function (p, q, h)
		{
			h = (h + 1) % 1;
			if (h * 6 < 1)
			{
				return p + (q - p) * h * 6;
			}
			if (h * 2 < 1)
			{
				return q;
			}
			if (h * 3 < 2)
			{
				return p + (q - p) * ((2 / 3) - h) * 6;
			}
			return p;
		},

		// https://gist.github.com/xpansive/1337890
		hsv2hsl: function(hue, sat, val)
		{
			return [
				//[hue, saturation, lightness]
				//Range should be between 0 - 1
				hue, //Hue stays the same

				//Saturation is very different between the two color spaces
				//If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
				//Otherwise sat*val/(2-(2-sat)*val)
				//Conditional is not operating with hue, it is reassigned!
				sat * val / ((hue = (2 - sat) * val) < 1 ? hue : 2 - hue),
				hue / 2 //Lightness is (2-sat)*val/2
				//See reassignment of hue above
			];
		},

		hsl2hsv: function(hue, sat, light)
		{
			sat *= light < .5 ? light : 1 - light;

			return [
				//[hue, saturation, value]
				//Range should be between 0 - 1
				hue, //Hue stays the same
				2 * sat / (light + sat), //Saturation
				light + sat //Value
			];
		},

		// https://gist.github.com/xpansive/1241234
		hsv2rgb: function (
			//parameters range from 0 - 1
			a, // hue 0.0 - 1.0
			b, // saturation 0.0 - 1.0
			c, // value 0.0 - 1.0

			d, // hue divider
			e, // value splitter
			f // array placeholder
		)
		{
			d = a * 6 % 1; // deviation of the current hue (red<->yellow<->green<->cyan<->blue<->violet),
			// the higher the value, the more the color deviates to the next hue

			// create an array of the color strength regardless of hue
			f = [
				c, // full value on this color
				-c * d * b + c, // deviation part 1
				e = -c * b + c, // deviation part 2
				e, // median deviation
				c * d * b + e, // deviation part 3
				c // full value
			];

			// select the colors out of the array in regard of hue
			var ret = [
				// [r,g,b] - ranges from 0 to 1
				f[d = a * 6 | 0], //red
				f[(4 + d) % 6], //green
				f[(2 + d) % 6] //blue
			];

			return [
				Math.round(ret[0] * 255),
				Math.round(ret[1] * 255),
				Math.round(ret[2] * 255),
			];
		},

		// http://stackoverflow.com/questions/5833624/increase-css-brightness-color-on-click-with-jquery-javascript
		// http://jsfiddle.net/K8cMX/7/
		rgb2hsv: function (r, g, b)
		{
			var min = Math.min(r, g, b),
				max = Math.max(r, g, b),
				delta = max - min,
				h, s, v = max;

			v = Math.floor(max / 255 * 100);

			if (max == 0) return [0, 0, 0];

			s = Math.floor(delta / max * 100);
			var deltadiv = delta == 0 ? 1 : delta;

			if (r == max) h = (g - b) / deltadiv;
			else if (g == max) h = 2 + (b - r) / deltadiv;
			else h = 4 + (r - g) / deltadiv;

			h = Math.floor(h * 60);
			if (h < 0) h += 360;

			return [
				h,
				s / 100,
				v / 100
			];
		},
	});

	spaces.hsla.to = function(rgba)
	{
		if (rgba[0] == null || rgba[1] == null || rgba[2] == null)
		{
			return [null, null, null, rgba[3]];
		}
		var r = rgba[0] / 255,
			g = rgba[1] / 255,
			b = rgba[2] / 255,
			a = rgba[3],
			max = Math.max(r, g, b),
			min = Math.min(r, g, b),
			diff = max - min,
			add = max + min,
			l = add * 0.5,
			h, s;

		if (min === max)
		{
			h = 0;
		}
		else if (r === max)
		{
			h = (60 * (g - b) / diff) + 360;
		}
		else if (g === max)
		{
			h = (60 * (b - r) / diff) + 120;
		}
		else
		{
			h = (60 * (r - g) / diff) + 240;
		}

		// chroma (diff) == 0 means greyscale which, by definition, saturation = 0%
		// otherwise, saturation is based on the ratio of chroma (diff) to lightness (add)
		if (diff === 0)
		{
			s = 0;
		}
		else if (l <= 0.5)
		{
			s = diff / add;
		}
		else
		{
			s = diff / (2 - add);
		}
		return [Math.round(h) % 360, s, l, a == null ? 1 : a];
	};

	spaces.hsla.from = function(hsla)
	{
		if (hsla[0] == null || hsla[1] == null || hsla[2] == null)
		{
			return [null, null, null, hsla[3]];
		}
		var h = hsla[0] / 360,
			s = hsla[1],
			l = hsla[2],
			a = hsla[3],
			q = l <= 0.5 ? l * (1 + s) : l + s - l * s,
			p = 2 * l - q;

		return [
			Math.round(color.hue2rgb(p, q, h + (1 / 3)) * 255),
			Math.round(color.hue2rgb(p, q, h) * 255),
			Math.round(color.hue2rgb(p, q, h - (1 / 3)) * 255),
			a
		];
	};

	spaces.hsva.to = function(rgba)
	{
		var arr;
		if (arr = _valid_rgba(rgba))
		{
			return arr;
		}

		var a = rgba[3];

		var hsva = color.rgb2hsv(rgba[0], rgba[1], rgba[2]);
		hsva[3] = (a == null ? 1 : a);

		return hsva;
	};

	spaces.hsva.from = function(hsva)
	{
		var arr;
		if (arr = _valid_rgba(hsva))
		{
			return arr;
		}

		var h = hsva[0] / 360,
			s = hsva[1],
			v = hsva[2],
			a = hsva[3]
			;

		var rgba = color.hsv2rgb(h, s, v);
		rgba[3] = (a == null ? 1 : a);

		return rgba;
	};

	function _valid_rgba(arr)
	{
		if (arr[0] == null || arr[1] == null || arr[2] == null)
		{
			return [null, null, null, arr[3]];
		}
	}

	each(spaces, function(spaceName, space)
	{
		var props = space.props,
			cache = space.cache,
			to = space.to,
			from = space.from;

		// makes rgba() and hsla()
		color.fn[spaceName] = function(value)
		{

			// generate a cache for this space if it doesn't exist
			if (to && !this[cache])
			{
				this[cache] = to(this._rgba);
			}
			if (value === undefined)
			{
				return this[cache].slice();
			}

			var ret,
				type = $.type(value),
				arr = (type === "array" || type === "object") ? value : arguments,
				local = this[cache].slice();

			each(props, function(key, prop)
			{
				var val = arr[type === "object" ? key : prop.idx];
				if (val == null)
				{
					val = local[prop.idx];
				}
				local[prop.idx] = clamp(val, prop);
			});

			if (from)
			{
				ret = color(from(local));
				ret[cache] = local;
				return ret;
			}
			else
			{
				return color(local);
			}
		};

		// makes red() green() blue() alpha() hue() saturation() lightness()
		each(props, function(key, prop)
		{
			// alpha is included in more than one space
			if (color.fn[key])
			{
				return;
			}
			color.fn[key] = function(value)
			{
				var vtype = $.type(value),
					fn = (key === "alpha" ? (this._hsva ? 'hsva' : (this._hsla ? "hsla" : "rgba")) : spaceName),
					local = this[fn](),
					cur = local[prop.idx],
					match;

				if (vtype === "undefined")
				{
					return cur;
				}

				if (vtype === "function")
				{
					value = value.call(this, cur);
					vtype = $.type(value);
				}
				if (value == null && prop.empty)
				{
					return this;
				}
				if (vtype === "string")
				{
					match = rplusequals.exec(value);
					if (match)
					{
						value = cur + parseFloat(match[2]) * (match[1] === "+" ? 1 : -1);
					}
				}
				local[prop.idx] = value;
				return this[fn](local);
			};
		});
	});

	// add cssHook and .fx.step function for each named hook.
	// accept a space separated string of properties
	color.hook = function(hook)
	{
		var hooks = hook.split(" ");
		each(hooks, function(i, hook)
		{
			$.cssHooks[hook] = {
				set: function(elem, value)
				{
					var parsed, curElem,
						backgroundColor = "";

					if (value !== "transparent" && ($.type(value) !== "string" || (parsed = stringParse(value))))
					{
						value = color(parsed || value);
						if (!support.rgba && value._rgba[3] !== 1)
						{
							curElem = hook === "backgroundColor" ? elem.parentNode : elem;
							while (
								(backgroundColor === "" || backgroundColor === "transparent") &&
								curElem && curElem.style
							)
							{
								try
								{
									backgroundColor = $.css(curElem, "backgroundColor");
									curElem = curElem.parentNode;
								}
								catch (e)
								{}
							}

							value = value.blend(backgroundColor && backgroundColor !== "transparent" ?
								backgroundColor :
								"_default");
						}

						value = value.toRgbaString();
					}
					/*
					try
					{
						elem.style[hook] = value;
					}
					catch (e)
					{
						// wrapped to prevent IE from throwing errors on "invalid" values like 'auto' or 'inherit'
					}
					*/

					// let jquery handle hook value
					return value;
				},
			};
			$.fx.step[hook] = function(fx)
			{
				if (!fx.colorInit)
				{
					fx.start = color(fx.elem, hook);
					fx.end = color(fx.end);
					fx.colorInit = true;
				}
				$.cssHooks[hook].set(fx.elem, fx.start.transition(fx.end, fx.pos));
			};
		});

	};

	color.hook(stepHooks);

	$.cssHooks.borderColor = {
		expand: function(value)
		{
			var expanded = {};

			each(["Top", "Right", "Bottom", "Left"], function(i, part)
			{
				expanded["border" + part + "Color"] = value;
			});
			return expanded;
		}
	};

	// Basic color names only.
	// Usage of any of the other color names requires adding yourself or including
	// jquery.color.svg-names.js.
	colors = $.Color.names = {
		// 4.1. Basic color keywords
		aqua: "#00ffff",
		black: "#000000",
		blue: "#0000ff",
		fuchsia: "#ff00ff",
		gray: "#808080",
		green: "#008000",
		lime: "#00ff00",
		maroon: "#800000",
		navy: "#000080",
		olive: "#808000",
		purple: "#800080",
		red: "#ff0000",
		silver: "#c0c0c0",
		teal: "#008080",
		white: "#ffffff",
		yellow: "#ffff00",

		// 4.2.3. "transparent" color keyword
		transparent: [null, null, null, 0],

		_default: "#ffffff",
	};

}(jQuery));
