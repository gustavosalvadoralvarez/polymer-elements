
var utils = {}; 


function asArray(thing, flattenKey){
	return Array.prototype.slice.call(thing)
}

utils.asArray = asArray; 


function repeat(str, times){

	return Array.apply(null, Array(times)).map(function(){return str}).join('')
}

utils.repeat = repeat;


function invoke(methodKey, methodArgs){
	var args = asArray(arguments), 
		methodKey = args[0], 
		methodArgs = args.slice(1);
	return function invocation(obj){
		return obj[methodKey](methodArgs)
	}
}

utils.invoke = invoke;

function getFrom(k){
	return function (o){
		return o[k]
	}
}

function partial(fnRef, pArgs){ 
	var pArgs = Array.prototype.slice.call(arguments, 1);
	return function callWith(rArgs){
		return fnRef.call(null, 
						  pArgs.concat(Array.prototype.slice.call(rArgs)))
	}
}

utils.partial = partial;


function range(ops, args){
	var to, from, by;

	if(typeof(ops) === 'string' || typeof(ops) === 'number'){
		to = Number(ops), 
		from = arguments[1]
			? Number(arguments[1]) 
			: 0, 
		by = arguments[2]
			? Number(arguments[2]) 
			:  1;
	} else {
		to = Number(ops.to), 
		from = Number(ops.from) || 0, 
		by = Number(ops.by) || 1;
	}

	return Array.apply(null, Array(1 + ((to - from) / by))).map(
		function rangeVal(v, i) { 
				return from + (i * by) 
		}
	)
}

utils.range = range;


function labeledChild(obj, label){
	var labelKey, labelVal, child; 
	console.log(obj);
	labelKey = label || 'label'; 
	labelVal = Object.keys(obj)[0]; 
	console.log(Object.keys(obj));
	child = obj[labelVal]; 
	child[labelKey] = labelVal; 
	return child
}

utils.labeledChild = labeledChild;

function numericObject(arr){
	return arr.reduce(
		function(o, v, i){
			o[i] = v;
			return 0
		},
		{}
	)
}

function keyCopy(obj, typ){
	typ = typ || String;
	return Object.keys(obj).reduce(function(o, k){ o[k] = typ(); return o }, {})
}

function stripInstanceMethods(o){
	return Object.keys(o).reduce(
		function (r, k){
			var v;
			v = o[k];
			if (!(v instanceof Function)){
				r[k] = v; 
			}
			return r
		},
		{}
	)
}

function propertyKeys(o){
	return Object.keys(o).reduce(
	function(ks, k){
		if (!o[k].call){
			ks = ks.concat(k)
		}
		return ks
	},
	[]
}

function loadInstanceMethods(fns){
	var fnKeys;
	fnKeys = Object.keys(fns);
	return function (inst){
		fnKeys.forEach(
			function (k){
				inst[k] = fns[k];
			}
		);
		return inst
	}
}

function checkEquals(v){
	if(v.length){
		return function (cv){
			return cv in v
		}
	}
	return 	function (cv){
		return cv === v
	}
}

function keySubset(o, ks){
	return ks.reduce(
		function(r, k){
			r[k] = o[k];
			return r
		}, 
		{}
	)
}

function dCopy(o){
	return JSON.parse(JSON.stringify(o))
}

function dataFrame(csvData, dataFrameView){
	var self, columns;
	function extract(csvString){
		var csvLines, headers, ncol, nrow;
		csvLines = csvString.split("\n").map(invoke("split", ","));
		ncol = csvLines[0].length;
		nrow = csvLines.length;
		if(!ops.noHeaders){
			headers = csvLines[0];
			csvLines = csvLines.slice(1, ncol);
		} else {
			headers = range(ncol).map(String).map(function(v){ return "X."+v });
		}
		return headers.reduce(
			function(r, col, i){
				r[col] = csvLines.map(getFrom(i));
				return r
			},
			{}
		);
	} 
	function getRows(d, s, e){
		return Object.keys(d).reduce(
			function (r, cl, i){
				r[cl] = d[cl].slice(e, s);
				return r
			},
			{}
		)
	}
	function fiterRowsBy(d, cc, cfn){
		var cs; 
		cs = Object.keys(d);
		return d[cc].reduce(
			function (r, v, i){
				if (cfn(v)){
					cs.forEach(
						function(c){
							r[c] = r[c].concat(d[c][i]);
						}
					);
				}
				return r
			},
			keyCopy(d, Array)
		)
	}
	
	self = dataFramView || extract(csvString);
	self.columns = Object.keys(self);
	self.nrow = self[columns[0]].length;
	self.ncol = self.columns.length;
	self.createView = function (exps){
		// :: String, String || String
		//
		// if String, String, the first is interpreted as a 
		// a conditional expressions for selecting across objects (rows)
		// and can take the form column = String || JSON.stringify(Array)
		// values in the columns is === the String or in case of Array is contained therein
		// or the form Num : Num, in which case the range starting at the first Num and ending at the 
		// second is returned.
		// The second argument is interpreted as a column name or stringifyed array of column names
		// if String, it is interpreted as a column argument
		var args, view, rowExp, colExp, isJSONArray;
		args = asArray(arguments);
		rowExp = ((args.length > 2 && args[1]) || null); 
		colExp = (rowExp && args[2]) || args[1]); 
		isJSONArray = /(\[([\w]+,?)+\])/;
		view = subsetKeys(this, this.columns);
		if (typeof(colExp) === 'string'){
			if (isJSONArray.test(colExp)) {
				view = keySubset(view, JSON.parse(colExp));
			} else{ 
				view = view[rowExp];
			}
		} else if (Array.isArray(colExp)) {
			view = keySubset(view, colExp);
		} 
		if (rowExp){
			if ("=" in rowExp){
				var expParts, col, val; 
				expParts = rowExp.split('='); 
				col = expRows[0];
				val = expRows[1];
				if (isJSONArray(val)){
					view = filterRowsBy(view, col, checkEquals(JSON.parse(val)));
				}else{
					view = filterRowsBy(view, col, checkEquals(val));
				}
			} else if(":" in rowExp){
				var expRows; 
				expRows = rowExp.split(':');
				view = getRows(view, Number(expRows[1]), Number(expRows[2]));
			}
		} 
		
		return dataFrame(null, view); 
	}

	return self 
}

function unique(arr){
	return Object.keys(arr.map(JSON.stringify).reduce(function findUunique(tmpObj, item){
		if (!(item in tmpObj)){ 
			tmpObj[item] = '';
		}
		return tmpObj
	}, {})).map(JSON.parse)
}

utils.unique = unique; 


function closest(selector, el) {
    function testContainer(el){
    	return el.parentNode.querySelectorAll(selector)
    }
    var matches;
    for ( ; el && el !== document; elem = elem.parentNode ) {
    	matches = testContainer(el); 
    	if (matches.length > 0){ 
    		return matches
    	}
    }

    return false;

}

utils.closest = closest; 

function deepCopy(item){
	return JSON.parse(JSON.stringify(item));
}

utils.deepCopy = deepCopy;


function unSelect(menuEl){
	menuEl.selectedIndex = -1;
}

utils.unSelect = unSelect;


function jsonImport(importLink){
	console.log(importLink);
	console.log(importLink.import);
	return JSON.parse(importLink.import.querySelector('BODY').textContent)
}

function safeParse(o){
	try{
		return JSON.parse(o)
	} catch (e){
		return o
	}
}

utils.JSON = {
	'import': jsonImport
}


if (typeof module !== 'undefined' && module.exports){
	var k; 
	for(k in utils){
		module.exports[k] = utils[k];
	}
}
