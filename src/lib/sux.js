// SUX, because you have to use the suc() function often
// Also, because it sucks

sux = {}

sux.currentProgram = null
sux.lastClosedProgram = null
sux.refreshEnd = null
sux.currentFold = null

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
		this.inputs.push(false)
		this.nInputs = this.nInputs + 1
	}
	assignParent(parent) {
		this.parent = parent
	}
	notifyResult(op) {
		console.log( "   >>> notifyResult on " + this.name)
		for (var i = 0; i < this.inputOps.length; ++i) {
			if(this.inputOps[i] == op) {
				console.log( "   >>> updating input " + i + " with " + op.result)
				this.inputs[i] = op.result
				break;
			}
		}
		//console.log(" program  " + this.name + " received result " + op.result)
		if(sux.refreshEnd != null || (this.inputs.length == this.nFixedInputs)) {
			if(this != sux.refreshEnd) {
				console.log("  >>> executing on notify")
				this.execute()
			}
			else {
				console.log("  >>> notify exec prevcented")
				sux.refreshEnd = null
			}
		}
		else {
			console.log( "  >>> execute on " + this.name + " prevented")
		}

	}
	execute() {
	
	}
	refresh() {
		console.log ("   $$$$$$ refreshing " + this.name + " with input:   " + this.inputOps.length)
		for(var i = 0; i < this.inputOps.length; ++i) {
			this.inputOps[i].status = 'open'
			this.inputOps[i].refresh()
		}
		if(this.inputOps.length == 0) this.execute()
		//this.execute()
	}
	close() {
		if(this.status == 'open') {
			//console.log("  ########## executing and closing " + this.name)
			this.status = 'closed'
			this.execute()
		}
	}
}

class Accumulator extends Operation {
	constructor(parent) {
		super(parent)
		this.name = 'Accum'+(node++)
		this.foldOp = sux.currentFold
		console.log("Creating accum ~ fold: " + this.foldOp.name)
	}
	execute() {
		
		this.result = this.foldOp.accumulator
		console.log("  EXEC accum : " + JSON.stringify(this.result) + ", notifying parent: " + this.parent.name)
		this.parent.notifyResult(this)
	}
}

class Next extends Operation {
	constructor(parent) {
		super(parent)
		this.name = 'Next'+(node++)		
		this.foldOp = sux.currentFold
	}
	execute() {
		this.result = this.foldOp.next
		this.parent.notifyResult(this)
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
		this.name = 'fold'+(node++)
		this.accumulator = 0
		this.next = 0
		this.newInput = 0
		this.nFixedInputs = 2
		sux.currentFold = this
	}
	execute() {
		console.log("executing fold with inputs[0]: " + this.inputs[0])
		// we have inputs[0] (list) and inputs[1] (function to evaluate)
		if(typeof(this.inputs[0]) == 'number' || this.inputs[0].length < 2) {
			this.result = this.inputs[0]
		}
		else {
			this.accumulator = this.inputs[0][0]
			for (var i = 1; i < this.inputs[0].length; ++i) {
				console.log("  >>> iter: " + i + "    ac: " + this.accumulator + ", next: " + this.next)
				this.next = this.inputs[0][i]
				sux.refreshEnd = this
				this.inputOps[1].refresh()
				this.accumulator = this.inputs[1]	
			}
		}
		this.result = this.accumulator
		this.status = 'close'
		this.parent.notifyResult(this)
		this.status = 'close'
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

	if(typeof(list) == 'number') return list+1

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
		(sux.currentProgram.nFixedInputs == 1)

		//&&

		//(sux.currentProgram.inputs.length >=  sux.currentProgram.nFixedInputs)
	    ) {
			
		sux.currentProgram = sux.currentProgram.parent
	}
//	console.log("       && up operation fetched " + sux.currentProgram.name + " with nFixedInputs : " + sux.currentProgram.nFixedInputs)
	if(sux.currentProgram.name == 'fold') sux.currentFold = sux.currentProgram
	return sux.currentProgram

}

class Ones extends Operation {
	constructor(parent) {
		super(parent)
		this.name = 'ones'+(node++)
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
		console.log(" EXEC " + this.name + "  input: " + this.inputs[0] + " result= " + this.result)
		this.parent.notifyResult(this)
		this.status = 'close'
	}
}

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
		else if (code[i] == '1') {
			var accum = new Accumulator(sux.currentProgram)
			sux.currentProgram.assignInput(accum)
			sux.currentProgram = accum
			sux.currentProgram.close() // finishes immediately				
		}
		else if (code[i] == '2') {
			var next = new Next(sux.currentProgram)
			sux.currentProgram.assignInput(next)
			sux.currentProgram = next
			sux.currentProgram.close() // finishes immediately
		}
		else if (code[i] == 'f') {
			var fold = new Fold(sux.currentProgram)
			sux.currentProgram.assignInput(fold)
			sux.currentProgram = fold
		}
		++i
	}
	if(sux.currentProgram.status == 'open')
	{
		sux.currentProgram.close()
	}	
	program.close()

}

//sux.interpret("", "sosss....")
//sux.interpret("", "s[ss,[sss,[ss,sssssssss]],ssss]")
//sux.interpret("", "osss")

//sux.interpret("", "f[sss,ssss,sssss],f[1,o2],s1.....")
sux.interpret("", "f[ssss,osss],s1")

//console.log(sux.suc([1]))

module.exports = sux
