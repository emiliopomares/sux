// SUX, because you have to use the suc() function often
// Also, because it sucks

sux = {}

class Stack {
	constructor()
	{
		this.data = []
	}
	push(d)
	{
		this.data.push(d)
	}
	pop()
	{
		if(this.data.length > 0) return this.data.pop()
	}
	peek()
	{
		if(this.data.length > 0) return this.data[this.data.length-1]
		else return null
	}
	
}

sux.currentProgram = null
sux.lastClosedProgram = null
sux.refreshEnd = new Stack()
sux.currentFold = new Stack() // null // <- this must be a Stack also!!
sux.in = false
sux.result = false

var node = 0

function wasteTime()
{
	for(var a = 0; a < 1000000; ++a) {
		for(var b = 0; b < 2000; ++b) {
			var c = a*b
		}
	}
}

var IND = 0



class Operation {
	constructor(parent) {
		this.status = 'open'
		
		this.inputOps = []
		this.inputs = []
		this.closedInputs = 0

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
		//console.log(this.name + " <- " + op.name + " @ input: "+this.inputOps.length)
		//if(this.name.startsWith('fold') && this.inputOps.length > 0) sux.currentFold = this
		this.inputOps.push(op)
		
		this.inputs.push(false)
		this.nInputs = this.nInputs + 1
	}
	assignParent(parent) {
		this.parent = parent
	}
	
	notifyResult(op) {

		if(this == sux.refreshEnd.peek()) return

		console.log("      ---- " + this.name + " (fixInp: "+this.nFixedInputs+"/closedInps: "+this.closedInputs+") is being notified of result from " + op.name + " with refreshEnd: " + sux.refreshEnd.peek())
		IND++
		if(IND==16000) {
			console.log("shit! stuck!")
			process.exit(0)
		}
		for (var i = 0; i < this.inputOps.length; ++i) {
			if(this.inputOps[i] == op) {
				console.log( "   >>> updating input " + i + " with " + op.result)
				this.inputs[i] = op.result
				this.closedInputs++
				if(this.closedInputs == this.nFixedInputs) {
					console.log("    -----  all inputs satified on " + this.name + ", closing...")
					this.close()
					//sux.currentProgram = this
					//console.log("    >>>>> Current program set to " + this.name + " becuase of closure")
				}
				break;
			}
		}
		
		var rn = sux.refreshEnd.peek() == null ? "(null)" : sux.refreshEnd.peek().name
		//console.log(" >>>>>>>>>>>>>>>> operation  " + this.name + " received result " + op.result + " from " + op.name + "(refreshend="+rn+")")
			
		/*	
		if(sux.refreshEnd.peek() != null && (this.inputs.length == this.nFixedInputs)) {
			if(this != sux.refreshEnd.peek()) {
				console.log("  >>> executing "+this.name+" on notify")
				this.execute()
			}
			else {
				//console.log("  >>> notify exec prevcented on " + this.name)
			}
		}
		else {
			console.log( "  >>> execute on " + this.name + " prevented")
		}
		*/	

	}
	execute() {
	
	}
	refresh() {
		//console.log ("   $$$$$$ refreshing " + this.name + " with input:   " + this.inputOps.length)
		this.nFixedInputs = this.inputOps.length
		this.closedInputs = 0
		this.status = 'open'
		for(var i = 0; i < this.inputOps.length; ++i) {
			this.inputOps[i].refresh()
		}
		if(this.inputOps.length == 0) this.execute()
		//this.execute()<-ésta si que no pued3e ser, porque si no se ejecuta miuchas veces
	}
	close() {
		
		if(this.status == 'open') {
			
			sux.currentProgram = this
			console.log("  ########## setting current program to : " + this.name)
			this.execute()
			this.status = 'closed'
			if(this.name.startsWith('fold')) { sux.currentFold.pop()
				console.log("   popping currentFold, currentFold is now " + sux.currentFold.peek())
			}
		}
	}
}

class Accumulator extends Operation {
	constructor(parent) {
		super(parent)
		this.name = 'accum'+(node++)
		this.foldOp = sux.currentFold.peek()
		//console.log("Creating "+this.name+" ~ fold: " + this.foldOp.name)
	}
	execute() {
		this.result = this.foldOp.accumulator
		//console.log("  EXEC "+ this.name + ": " + JSON.stringify(this.result) + ", foldOp: " + this.foldOp.name+ " notifying parent: " + this.parent.name)
		if(this.name == 'Accum21') {
			
			//wasteTime()

		}
		this.parent.notifyResult(this)
	}
}

class Next extends Operation {
	constructor(parent) {
		super(parent)
		this.name = 'next'+(node++)		
		this.foldOp = sux.currentFold.peek()
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
		console.log(" ## EXEC List  >> List inputs length: " + this.inputs.length)
		for(var i = 0; i < this.inputs.length; ++i) {
			if((this.inputs[i].length == 1) && typeof(this.inputs[i][0] == 'number')) {
				res.push(this.inputs[i][0])
			}
			else {
				if(this.inputOps[i].name.startsWith('ones') || this.inputOps[i].name.startsWith('tail')) {
					for(var j = 0; j < this.inputs[i].length; ++j) {
						res.push(this.inputs[i][j])
					}
				}
				else {
					res.push(this.inputs[i])
				}
			}
		}
		//this.inputs.forEach(function(r) {
		//	if((r.length == 1) && typeof(r[0]) == 'number') res.push(r[0])
		//	else res.push(r)
		//})
		//if(res == []) {
		//	this.result = 0
		//}
		//else {
		console.dir(res)
		this.result = res
		//}
		//console.log("  >> List finish op, result : " + res)
		this.parent.notifyResult(this)
		this.status = 'close'
	}
}

class Constant extends Operation {
	constructor(parent, value) {
		super(parent)
		this.name = "constant" + (node++)
		this.result = value
	}	
	execute() {
		this.parent.notifyResult(this)
	}
}

class Program extends Operation {
	constructor(parent) {
		super(parent)
		this.nFixedInputs = 1
		this.name = 'program'+(node++)
	}
	execute() {
		console.log("Attempting to exec program")
		if(this.status == 'open') {
			console.log("  ## Execing program!!!! with result = " + this.inputs[0])
			this.result = this.inputs[0]
			sux.result = this.result
			this.status = 'close'
		}
	}
}

class Tail extends Operation {
	constructor(parent) {
		super(parent)
		this.nFixedInputs = 1
		this.name = 'tail'+(node++)
	}
	execute() {
		if(this.status == 'open') {
			this.result = sux.tail(this.inputs[0])
                	this.parent.notifyResult(this)
                	this.status = 'close'
		}
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
	}
	execute() {
		//console.log("executing "+ this.name + " with inputs[0]: " + this.inputs[0])
		
		// we have inputs[0] (list) and inputs[1] (function to evaluate)
		if(typeof(this.inputs[0]) == 'number' || this.inputs[0].length < 2) {
			this.result = this.inputs[0]
		}
		else {
			this.accumulator = this.inputs[0][0]
			for (var i = 1; i < this.inputs[0].length; ++i) {
				this.next = this.inputs[0][i]
				console.log("                        >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> iter: " + i + "    ac: " + this.accumulator + ", next: " + this.next)
				console.log("                        >>>>>> refreshEnd : "+ this.name)
				sux.refreshEnd.push(this)
				console.log("                        >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> refreshing " + this.inputOps[1].name)
				this.inputOps[1].refresh()
				sux.refreshEnd.pop()
				
				this.accumulator = this.inputOps[1].result	
			}
		}
		console.log("                          >>>>>>> finished Fold loop with result " + this.accumulator)
		this.result = this.accumulator
		this.status = 'close'
		//console.log("executing "+ this.name + " finished")
		this.parent.notifyResult(this)
		this.status = 'close'
	}
}

sux.appendOnesToList = function(list, ones) {
	for (var i = 0; i < ones; ++i) {
		list.push(1)
	}
}

sux.printStructure = function(Op, level) {

	var s = ""
	for(var i = 0; i < level; ++i) {
		s = s + "  "
	}
	s = s + level + ">"
	s = s + Op.name + " (" + Op.status + ")"
	if(Op.name.startsWith("accum") || Op.name.startsWith("next")) s = s + " " + Op.foldOp.name
	console.log(s)
	for(var k = 0; k < Op.inputOps.length; ++k) {
		sux.printStructure(Op.inputOps[k], level+1)
	}

}

sux.tail = function(list) {
	if(list == null) return []
	if(typeof(list) == 'number') return []
	return list.slice(1, list.length)	
}

sux.listToOnes = function(list) {
	result = []
	if(list == null) return result
	if(typeof(list) == 'number')
	{
		for (var i = 0; i < list; ++i)
		{
			result.push(1)
		}
		return result
	}
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

	if(sux.currentProgram.parent == null) return sux.currentProgram
	
	sux.currentProgram = sux.currentProgram.parent
	
	if(sux.currentProgram.name == 'program') return sux.currentProgram
	if(sux.currentProgram == null || sux.currentProgram == undefined) {
		console.log("THIS SHOULD NOT HAPPEN")
		return sux.currentProgram
	}
	// i have to stop when currentProgram.nFixedInputs == -1 or sux.currentProgram.inputs.length < nFixedInputs13,	
	while(
		(sux.currentProgram.nFixedInputs == 1)

		||

		(sux.currentProgram.name.startsWith("fold") && sux.currentProgram.inputOps.length == 2)
		//&&

		//(sux.currentProgram.inputs.length >=  sux.currentProgram.nFixedInputs)
	    ) {
			
		sux.currentProgram = sux.currentProgram.parent
	}
//	console.log("       && up operation fetched " + sux.currentProgram.name + " with nFixedInputs : " + sux.currentProgram.nFixedInputs)
	//if(sux.currentProgram.name == 'fold') sux.currentFold.push(sux.currentProgram)
	return sux.currentProgram

}

class Ones extends Operation {
	constructor(parent) {
		super(parent)
		this.name = 'ones'+(node++)
	}
	execute() {
		//
		this.result = sux.listToOnes(this.inputs[0])
		console.log(" ## EXEC " + this.name + " with input: "+this.inputs[0]+", result: " + this.result)
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
	sux.in = eval(input)
	sux.lastClosedProgram = null
	sux.refreshEnd = new Stack()
	sux.currentFold = new Stack() // null // <- this must be a Stack also!!
	sux.result = false
	var LastList = null

	var node = 0

	IND = 0


	const len = code.length
	var i = 0

	while(i<len) {
		console.log("i: " + i + " (" + code[i] +")")
		//console.log("          ////////////////////// parsing : " + code[i] + " current program: " + sux.currentProgram.name + ", i: " + i)
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
			LastList = list
		}
		else if (code[i] == ',') {
			//console.log(" >> comma, LOL")
			sux.currentProgram.close()
			//console.log("climbing from " + sux.currentProgram.name + " to ... ")
			sux.currentProgram = sux.climbUpToNextOperationWithArguments()
			//if(sux.currentProgram.name.startsWith('fold')) sux.currentFold.push(sux.currentProgram)
			console.log("  setting current program to:  " + sux.currentProgram.name + " currentFold: " + sux.currentFold.peek())
			//console.log("     >> next op after comma : " + sux.currentProgram.name)
		}
		else if (code[i] == '.') {
			
			//console.log( "   ------------------   about to close :  " + sux.currentProgram.name)
			//wasteTime();
			sux.currentProgram.close()
		}
		else if (code[i] == ']') {
			var prevCurrentProgram = sux.currentProgram
			sux.currentProgram.close()
			//console.log("climbing from " + sux.currentProgram.name + " to ... ")
			if(LastList != prevCurrentProgram) {
                sux.currentProgram = sux.climbUpToNextOperationWithArguments()
                console.log("  ... Finishing list, setting current to: " + sux.currentProgram.name )
				sux.currentProgram.close()
			}
			else {
				console.log("   ... closing [] list")
			}
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
		else if ((code[i] == 'i') && (code[i+1]=='n')) {
			var constant = new Constant(sux.currentProgram, sux.in)
			sux.currentProgram.assignInput(constant)
			sux.currentProgram = constant
			sux.currentProgram.close() // finishes immediately	
			++i
		}
		else if(code[i]==' ') {
			// nothing here
		}
		else if(code[i]=='\n') {
			// nothing here
		}
		else if(code[i]=='\t') {
			// nothing here
		}
		else if(code[i]=='\r') {
			// nothing here
		}
		else if (code[i] == '-') {
			var tail = new Tail(sux.currentProgram)
			sux.currentProgram.assignInput(tail)
			sux.currentProgram = tail
		}
		else if (code[i] == 'f') {
			var fold = new Fold(sux.currentProgram)
			sux.currentFold.push(fold)
			sux.currentProgram.assignInput(fold)
			sux.currentProgram = fold
		}
		sux.printStructure(program, 0)
		console.log("")
		console.log("")
		console.log("")
		++i
		//if(sux.result != false) {
		//	return sux.result
		//}
	
	}
	console.log("")
	console.log("All symbols consumed!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	console.log("")
//	while(sux.currentProgram != program) {
//		cp = sux.currentProgram
		console.log("Closing current program: " + sux.currentProgram.name)
		sux.currentProgram.close()
//		if(cp == sux.currentProgram) {
//			sux.currentProgram = sux.currentProgram.parent
//		}
//	}
	console.log("attempting to close root program")
	program.execute()
	console.log(" >> eof closure...")
	sux.printStructure(program, 0)
        console.log("")
        console.log("")
        console.log("")	
	return sux.beautify(sux.result)
	
}

sux.beautify = function(item) {
	if(item == undefined) return [0]
	if(item == []) return [0]
	if(item == null) return [0]
	if(item == false) return [0]
	if(typeof(item) == 'number') return [item]
	return item
}

//sux.interpret("", "sosss....")
//sux.interpret("", "s[ss,[sss,[ss,sssssssss]],ssss]")
//console.log(sux.interpret("", "osss"))

//console.log(sux.interpret("", "sssss"))

//console.log(sux.interpret("", "f[ss,ss],1"))
//console.log(sux.interpret("", "f[f[ss,ss],1,oss],s1"))
//console.log(sux.interpret("", "f[ss,sss,f[ss,ss],1],f[1,o2],s1...."))
//console.log(sux.interpret("", "f[sss,f[ss,ss],1],[1,2]"))
//console.log(sux.interpret("", "f[sss,ss],f[1,o2],s1"))
//console.log(sux.interpret("[3,5]", "fin,f[1,o2],s1"))
//console.log(sux.interpret("3", "sin"))
//sux.interpret("", "f[ss,sss,ssss],s1.......")
//console.log(sux.suc([1]))
//console.log(sux.interpret("", "f[ss,ss],-o2"))
//console.log(sux.interpret("", "-[sss,sssss]"))
//console.log(sux.interpret("", "f[ssss,sss],f[f[1,o1],s1,o2],s1"))
//console.log(sux.interpret("3", "f[[oin],[-oin]],s1"))
//console.log(sux.interpret("3", "soin"))
//console.log(sux.interpret("", "f[[ossss],-ossss],s1"))
//console.log(sux.interpret("3", "-oin"))
//console.log(sux.interpret("", "ff[sss,ss],[o1,o2],s1"))
//console.log(sux.interpret("", "f[s,s,s,s,s],s1"))
//console.log(sux.interpret("", "osss"))
//console.log(sux.interpret("", "-oss"))
//console.log(sux.interpret("", "f[[osss],-oss],s1"))
//console.log(sux.interpret("", "f[ssss,ss,sss],[o1,o2]"))
//console.log(sux.interpret("5", "fff[[oin],-oin],s1,[o1,o2],s1"))
//console.log(sux.interpret("0", "of[s,oin],s"))
//console.log(sux.interpret("", "s[s,[s[],s[]]]"))
console.log(sux.interpret("1", "f[[s,s],osin],-1")) // this should be the not function

sux.shit = function()
{
	return "shit"
}

function shitFunction() {
	return "shit"
}

module.exports = sux
