
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

function dataFrame(csvData, opts){
	var self, instanceMethods, loadInstance;
	opts = opts || {};
	function transform(csvString){
		var csvLines, headers, ncol, nrow;
		csvLines = csvString.split("\n").map(invoke("split", ","));
		ncol = csvLines[0].length;
		nrow = csvLines.length;
		if(!opts.noHeaders){
			headers = csvLines[0];
			csvLines = csvLines.slice(1, ncol);
		} else {
			headers = range(ncol).map(String).map(function(v){ return "X."+v });
		}
		self.data = headers.reduce(
			function(obj, col, oi){
				obj[col] = csvLines.map(getFrom(oi));
				return obj
			},
			{}
		);
		self.ncol = ncol;
		self.nrow = nrow; 
		self.columns = headers; 
		self.rows = range(0, nrow);
	} 
	function getRows(d, s, e, c){
		var cols = c || Object.keys(d);
		return cols.reduce(
			function (r, col, i){
				r[col] = d[col].slice(e, s);
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

	self = ops.data || transform(); 

	function createView(exps){
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
		var args, view, rowExp, colExp, viewOps, isJSONArray;
		args = asArray(arguments):
		rowExp = ((args.length > 2 && args[1]) || null); 
		colExp = (rowExp && args[2]) || args[1]); 
		isJSONArray = /(\[([\w]+,?)+\])/;
		view = this;
		viewOps = ops;
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
				var expParts, col, val, sval; 
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

		return view 
	}












































	if (typeof(csvData) === String){
		data = transform(csvString);
	} else 
	if(data && data.nrow > 0 && data.ncol > 0 ) {
		self.data = data;
	}else{
		return new Error("Failed to parse or did not receive valid data: \n"+JSON.stringify(csvData));
	}
	self.view 



}

function csvParser(csvString, headers){
	var lines = csvString.split('\n')
		firstLine = lines[0].split(','),
		csvKeys = headers !== false
				? firstLine
				: range(1, firstLine.length).map(function(i){ return 'X' + i }),
		dataLines = headers !== false
					? lines.slice(1)
					: lines,
		emptyLine = repeat(',', firstLine.length -1);
			
	return (
	dataLines
		.filter(
			function checkEmpty(line){
			return line.indexOf(emptyLine) === -1
			}
		)
		.map(invoke('split', [',']))
		.map(
			function toObj(line){
				return csvKeys.reduce(
					function addKey(obj, k, i){
						obj[k] = line[i];
						return obj
					}, 
				{})
			}
		)
	)
}

utils.csvParser = csvParser; 

function csvRownum(csv){

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


function csvCol(csvList, colName){
	return csvList.map(
		function gather(line){
			return line[colName]
		}
	)
}

utils.csvCol = csvCol; 


function csvGroupBy(csv, groupColName){ 
	var groupedObj = {}; 
	groupedObj[groupColName] = unique(csvCol(csv, groupColName)).reduce(
		function groupRows(grouped, group){
			grouped[group] = csv.filter(
				function groupMember(row){ 
					return row[groupColName] === group 
				}
			).map(
				function partialCopy(obj){
					var copyObj = {}, k;
					for (k in obj){
						if (k !== groupColName) {
							copyObj[k] = obj[k];
						}
					}
					return copyObj
				}
			); 
			return grouped
		}, {}) 
	return groupedObj
}

utils.csvGroupBy = csvGroupBy; 


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
