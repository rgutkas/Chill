/*	ast.js
		The AST
*/

function ASTUnaryNode(symbol,l) {
	this.type=symbol;
	this.l=l;
	this.comment;
	this.line;
}

function ASTBinaryNode(symbol,l,r) {
	this.constructor(symbol,l);
	this.r=r;	
}
ASTBinaryNode.prototype=new ASTUnaryNode;


function ASTListNode(symbol) {
	this.constructor(symbol,[]);
	
	this.add=function(content) {
		this.l.push(content);
	}
}
ASTListNode.prototype=new ASTUnaryNode;

//AST: "class"    {"name":Identifier,"extends": (""|Identifier),"scope":symbolTable,"code":ASTNode("classBlock")}


