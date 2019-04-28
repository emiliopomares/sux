// SUX, because you have to use the suc() function often
// Also, because it sucks

sux = {}

sux.currentProgram = null
sux.lastClosedProgram = null


var node = 0

class Operation {
	constructor(parent) {
		this.status = 'open'
		
		this.inputOps = []
		this.inputs = []

		this.input1 = null
		this.input2 = null
		this.parent = parent
		this.result = ""
		this.nInput = 1
		this.nInputs = 0
		this.nFixedInputs = 1
		this.name = ''
	}	
	assignInput(op) {

		this.inputOps.push(op)
		this.nInputs = this.nInputs + 1
	}
	assignParent(parent) {
		this.parent = parent
	}
	notifyResult(op) {

		this.inputs.push(op.result)
		//console.log(" program  " + this.name + " received result " + op.result)
		if(this.inputs.length == this.nFixedInputs) this.execute()

	}
	execute() {
		this.status = 'close'
	}
	close() {
		if(this.status == 'open') {
			this.execute()
		}
	}
}

class List extends Operation {
	constructor(parent) {
		super(parent)
		this.name = 'List'+(node++)
		this.nFixedInputs = -1 // no fixed amount of inputs
	}
	execute() {
		var res = []
		//console.log(" ## EXEC List  >> List inputs length: " + this.inputs.length)
		this.inputs.forEach(function(r) {
			if((r.length == 1) && typeof(r[0]) == 'number') res.push(r[0])
			else res.push(r)
		})
		this.result = res
		//console.log("  >> List finish op, result : " + res)
		this.parent.notifyResult(this)
		this.status = 'close'
	}
}

class Program extends Operation {
	constructor(parent) {
		super(parent)
		this.nFixedInputs = 1
		this.name = 'program'+(node++)
	}
	execute() {
		//console.log("  ## Exec program")
		this.result = this.inputs[0]
		console.log(this.result)
		this.status = 'close'
		process.exit(0)
	}
}

class Fold extends Operation {
	constructor(parent) {
		super(parent)
		this.name = 'fold'
		this.nFixedInputs = 2
	}
}

sux.appendOnesToList = function(list, ones) {
	for (var i = 0; i < ones; ++i) {
		list.push(1)
	}
}

sux.listToOnes = function(list) {
	result = []
	if(list == null) return result

	for(var i = 0; i < list.length; ++i) {
		if(typeof(list[i]) == 'number') {
			sux.appendOnesToList(result, list[i])
		}
		else {
			result = result.concat(sux.listToOnes(list[i]))	
		}
	}
	return result
}

sux.suc = function(list) {

	if(list == null) {
		return [1]
	}

	if(list.length == 0) {
		return [1]
	}

	for(var i = 0; i < list.length; ++i) {
		if(typeof(list[i]) == 'number') {
			list[i]++
		}
		else {
			list[i] = sux.suc(list[i])
		}
	}
	return list
}

sux.climbUpToNextOperationWithArguments = function() {

	//console.log( "  called climb up to next with current = " + sux.currentProgram.name)

	sux.currentProgram = sux.currentProgram.parent
	
	if(sux.currentProgram.name == 'program') return sux.currentProgram
	if(sux.currentProgram == null || sux.currentProgram == undefined) {
		console.log("THIS SHOULD NOT HAPPEN")
		return sux.currentProgram
	}
	// i have to stop when currentProgram.nFixedInputs == -1 or sux.currentProgram.inputs.length < nFixedInputs13,	
	while(
		(sux.currentProgram.nFixedInputs != -1)

		//&&

		//(sux.currentProgram.inputs.length >=  sux.currentProgram.nFixedInputs)
	    ) {
			
		sux.currentProgram = sux.currentProgram.parent
	}
//	console.log("       && up operation fetched " + sux.currentProgram.name + " with nFixedInputs : " + sux.currentProgram.nFixedInputs)
	return sux.currentProgram

}

class Ones extends Operation {
	constructor(parent) {
		super(parent)
		this.namne = 'ones'+(node++)
	}
	execute() {
		//console.log(" ## EXEC ones")
		this.result = sux.listToOnes(this.inputs[0])
		this.parent.notifyResult(this)
		this.status = 'close'
	}
}

class Suc extends Operation {
	constructor(parent) {
		super(parent)
		this.name = 'suc'+(node++)
	}
	execute() {
		//console.log(" ## EXEC suc")
		this.result = sux.suc(this.inputs[0])
		this.parent.notifyResult(this)
		this.status = 'close'
	}
}
/*
class Constant extends Operation {
	
}

class Concat extends Operation {
	constructor(parent) {
		
	}
}


sux.parseList = function(list) {
	return eval(list)
}
*/


// interpret: osss
// outputs: [1, 1, 1]


sux.interpret = function(input, code) {

	var program = new Program()
	sux.currentProgram = program

	const len = code.length
	var i = 0
	while(i<len) {
		//console.log(" parsing : " + code[i] + " current program: " + sux.currentProgram.name)
		if(code[i] == 's') {
			var suc = new Suc(sux.currentProgram)
			sux.currentProgram.assignInput(suc)
			sux.currentProgram = suc
		}
		else if (code[i] == 'o') {
			var ones = new Ones(sux.currentProgram)
			sux.currentProgram.assignInput(ones)
			sux.currentProgram = ones
		}
		else if (code[i] == '[') {
			var list = new List(sux.currentProgram)
			sux.currentProgram.assignInput(list)
			sux.currentProgram = list
		}
		else if (code[i] == ',') {
			//console.log(" >> comma, LOL")
			sux.currentProgram.close()
			//console.log("climbing from " + sux.currentProgram.name + " to ... ")
			sux.currentProgram = sux.climbUpToNextOperationWithArguments()
			//console.log("  ... " + sux.currentProgram.name )
			//console.log("     >> next op after comma : " + sux.currentProgram.name)
		}
		else if (code[i] == '.') {
			sux.currentProgram.close()
		}
		else if (code[i] == ']') {
			sux.currentProgram.close()
			//console.log("climbing from " + sux.currentProgram.name + " to ... ")
                        sux.currentProgram = sux.climbUpToNextOperationWithArguments()
                        //console.log("  ... " + sux.currentProgram.name )
			sux.currentProgram.close()
		}
		++i
	}
	//if(sux.currentProgram.status == 'open')
	//{
	//	sux.currentProgram.execute()
	//}
	//program.close()

}

//sux.interpret("", "sosss....")
sux.interpret("", "[s,[s,s],s]")

module.exports = sux
