module( "parse" );

function testParts( color, parts ) {
	var prefix = parts.prefix || "";

	if ( parts.expect ) {
		expect( parts.expect );
	}

	jQuery.each( parts, function( key , value ) {

		// these two properties are just helpers for the test function, ignore them
		if ( key === "expect" || key === "prefix" ) {
			return;
		}

		strictEqual( color[ key ](), value, prefix + "."+key+"() is "+value);
	});
}

function parseTest( str, results, descr ) {
	test( descr || "jQuery.Color( \""+str+"\" )", function() {
		var color = descr ? str : jQuery.Color( str );
		testParts( color, results );
	});
}

test( "jQuery.Color({ hue: 100, saturation: 1, lightness: 0.5 })", function() {
	var blue = jQuery.Color({ hue: 100, saturation: 1, lightness: 0.5 });
	testParts( blue, {
		red: 85,
		green: 255,
		blue: 0,
		alpha: 1,
		hue: 100,
		saturation: 1,
		lightness: 0.5
	});
	deepEqual( blue._rgba, [ 85, 255, 0, 1 ], "RGBA cache has correct values");
	deepEqual( blue._hsla, [ 100, 1, 0.5, 1 ], "HSLA cache has correct values");
});

test( "jQuery.Color", function() {

	var _rgb = [ 85, 255, 0 ]
		, _rgba = [ 85, 255, 0, 1 ]

		, _hsv = [ 100, 1, 1 ]
		, _hsva = [ 100, 1, 1, 1 ]

		, _hsl = [ 100, 1, 0.5 ]
		, _hsla = [ 100, 1, 0.5, 1 ]
	;

	deepEqual( jQuery.Color().rgba(85, 255, 0).rgba(), _rgba, "has correct values");
	deepEqual( jQuery.Color().hsla(100, 1, 0.5).hsla(), _hsla, "has correct values");
	deepEqual( jQuery.Color().hsva(100, 1, 1).hsva(), _hsva, "has correct values");

});
test( "jQuery.Color.hsv2rgb(100,1,1)", function() {

	var _rgb = [ 85, 255, 0 ]
		, _rgba = [ 85, 255, 0, 1 ]

		, _hsv = [ 100, 1, 1 ]
		, _hsva = [ 100, 1, 1, 1 ]
	;

	jQuery.Color.hsv2rgb(100,1,1);

	deepEqual( jQuery.Color.hsv2rgb.apply(jQuery.Color, _hsv), _rgb, "hsv2rgb has correct values");
	deepEqual( jQuery.Color.rgb2hsv.apply(jQuery.Color, _rgb), _hsv, "rgb2hsv has correct values");

	deepEqual( jQuery.Color.hsv2rgb.apply(this, jQuery.Color().hsva(100, 1, 1, 1)._hsva), _rgb, "hsv2rgb has correct values");

	deepEqual( jQuery.Color().hsva(100,1,1, 1)._hsva, _hsva, "has correct values");
	deepEqual( jQuery.Color().rgba(85, 255, 0, 1).hsva(), _hsva, "has correct values");

	deepEqual( jQuery.Color().hsva(100, 1, 1, 1).rgba(), _rgba, "has correct values");
	deepEqual( jQuery.Color().rgba(85, 255, 0 ).rgba(), _rgba, "has correct values");

	testParts( jQuery.Color({
			red: 85,
			green: 255,
			blue: 0,
		}), {
		red: 85,
		green: 255,
		blue: 0,
		alpha: 1,
		hue: 100,
		saturation: 1,
		brightness: 1,
		lightness: 0.5,
	});

	testParts( jQuery.Color({
			hue: 100,
			saturation: 1,
			brightness: 1
		}), {
		red: 85,
		green: 255,
		blue: 0,
		alpha: 1,
		hue: 100,
		saturation: 1,
		brightness: 1,
		lightness: 0.5,
	});

});

test("jQuery.Color({hue: 100, saturation: 1, brightness: 1}, 'hsva')", function() {
	testParts( jQuery.Color({
			hue: 100,
			saturation: 1,
			brightness: 1,
		}, 'hsva'), {
		red: 85,
		green: 255,
		blue: 0,
		alpha: 1,
		hue: 100,
		saturation: 1,
		brightness: 1,
		lightness: 0.5,
	});
});

test("jQuery.Color([100, 1, 1], 'hsva')", function() {
	testParts( jQuery.Color([
			100,
			1,
			1,
		], 'hsva'), {
		red: 85,
		green: 255,
		blue: 0,
		alpha: 1,
		hue: 100,
		saturation: 1,
		brightness: 1,
		lightness: 0.5,
	});
});

test("jQuery.Color({hue: 100, saturation: 1, lightness: 0.5}, 'hsla')", function() {
	testParts( jQuery.Color({
			hue: 100,
			saturation: 1,
			lightness: 0.5,
		}, 'hsla'), {
		red: 85,
		green: 255,
		blue: 0,
		alpha: 1,
		hue: 100,
		saturation: 1,
		brightness: 1,
		lightness: 0.5,
	});
});

test("jQuery.Color([100, 1, 0.5], 'hsla')", function() {
	testParts( jQuery.Color([
			100,
			1,
			0.5,
		], 'hsla'), {
		red: 85,
		green: 255,
		blue: 0,
		alpha: 1,
		hue: 100,
		saturation: 1,
		brightness: 1,
		lightness: 0.5,
	});
});

test("jQuery.Color.hsv2hsl(100, 1, 1)", function() {
	deepEqual( jQuery.Color.hsv2hsl(100, 1, 1), [100, 1, 0.5]);
});

test("jQuery.Color.hsl2hsv(100, 1, 0.5)", function() {
	deepEqual( jQuery.Color.hsl2hsv(100, 1, 0.5), [100, 1, 1]);
});

test("HSLA Transitions", function() {
	var red = jQuery.Color("red"),
		desaturate = red.transition( jQuery.Color({ saturation: 0 }), 0.5 ),
		hue10 = red.transition( jQuery.Color({ hue: 10 }), 0.5),
		hue350 = red.transition( jQuery.Color({ hue: 350 }), 0.5),
		hueWrapPos = jQuery.Color({ hue: 350 }).transition( jQuery.Color({ hue: 10 }));

	testParts( desaturate, {
		prefix: "red -> desaturatue 0.5",
		hue: 0,
		saturation: 0.5,
		lightness: 0.5,
		alpha: 1
	});
	testParts( hue10, {
		prefix: "red -> hue 10 0.5",
		hue: 5,
		saturation: 1,
		lightness: 0.5,
		alpha: 1
	});
	testParts( hue350, {
		prefix: "red -> hue 350 0.5",
		hue: 355,
		saturation: 1,
		lightness: 0.5,
		alpha: 1
	});
	testParts( hueWrapPos, {
		prefix: " hue 350 -> hue 10 0.5",
		hue: 0,
		saturation: null,
		lightness: null,
		alpha: 1
	});

});

test( "alpha setter leaves space as hsva", function() {
	var test = jQuery.Color({hue: 0, saturation: 0, brightness: 0, alpha: 0}).alpha( 1 );
	ok( test._hsva, "HSVA cache still exists after calling alpha setter" );
});
