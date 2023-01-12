const { codigo } = require('./lib/fileHandler');
const { parseMain } = require('./lib/parsing')
const { getIdentacion } = require('./lib/dataHandler')

const funStack = [];
const forStack = [];
const lineasCod = codigo.split(/\r\n|\n/);
const lineasFor = codigo.split(/\r\n|\n/).filter(linea => getIdentacion(linea) >= 2).map(ele => ele.trim()).join('');

let funDef = codigo.match(/def +[a-zA-Z]{1}\w+\({1}\s*(|(\w+)|(\w+\s*\,{1}\s*\w+))+\s*\){1}\:/g).map(fun => fun.split(/\r\n/));
let forSct = codigo.match(/for [a-zA-Z]+ in range\( *[0-9]+ *\, *([a-zA-Z]+(\([a-zA-Z]+\))?) *\):/g);
let operacioneVariable = codigo.match(/([a-zA-Z]+ *)\= *(([a-zA-Z]\w+ *\(\s*((\"[\w\s\:]*\")|(\w+)|([a-zA-Z]\w+\(\s*((\"[\w\s\:]*\")|(\w+))\s*\)))\s*\))|([a-zA-Z]*\[(\w)*\s*\])|([a-zA-Z]+)|([0-9]+)) *([\+\-\*\/]{1}(([a-zA-Z]\w+ *\(\s*((\"[\w\s\:]*\")|(\w+)|([a-zA-Z]\w+\(\s*((\"[\w\s\:]*\")|(\w+))\s*\)))\s*\))|([a-zA-Z]*\[(\w)*\])|([a-zA-Z]+)|([0-9]+)))*/g).map(fun => fun.split(/\r\n/).map(ele => ele.trim()).join(''));
let operacioneVariable2 = lineasFor.toString().match(/([a-zA-Z]+ *)\= *(([a-zA-Z]\w+ *\(\s*((\"[\w\s\:]*\")|(\w+)|([a-zA-Z]\w+\(\s*((\"[\w\s\:]*\")|(\w+))\s*\)))\s*\))|([a-zA-Z]*\[(\w)*\s*\])|([a-zA-Z]+)|([0-9]+)) *([\+\-\*\/]{1}(([a-zA-Z]\w+ *\(\s*((\"[\w\s\:]*\")|(\w+)|([a-zA-Z]\w+\(\s*((\"[\w\s\:]*\")|(\w+))\s*\)))\s*\))|([a-zA-Z]*\[(\w)*\])|([a-zA-Z]+)|([0-9]+)))*/g).map(fun => fun.split(/\r\n/).map(ele => ele.trim()).join(''));
let contadorVariables = 0;
let contadorVariablesFOR = 0;
//Funcion para determinar los bloques ya validados de funciones
let funCont = 0
let bloqueFuncion = []
for (let i = 0; i < lineasCod.length; i++) {
    if (funDef[funCont].length > 1) {
        i += funDef[funCont].length;
        bloqueFuncion.push(funDef[funCont].join(''))
        for (let j = i; j < lineasCod.length; j++) {
            if (lineasCod[j].startsWith('def'))
                break;
            else if (lineasCod[j].includes('return')) {
                bloqueFuncion.push(lineasCod[j])
                break;
            } else if (lineasCod[j].includes('for')) {
                bloqueFuncion.push(lineasCod[j])
                break;
            } else if (lineasCod[j].includes('print')) {
                bloqueFuncion.push(lineasCod[j])
                break;
            } else {
                bloqueFuncion.push(operacioneVariable[contadorVariables])
                contadorVariables++
            }
        }
        funCont++;
        funStack.push(bloqueFuncion);
        bloqueFuncion = []
    } else if (funDef[funCont] == lineasCod[i]) {
        bloqueFuncion.push(funDef[funCont].toString())
        for (let j = i + 1; j < lineasCod.length; j++) {
            if (lineasCod[j].startsWith('def'))
                break;
            else if (lineasCod[j].includes('return')) {
                bloqueFuncion.push(lineasCod[j])
                break;
            } else if (lineasCod[j].includes('for')) {
                bloqueFuncion.push(lineasCod[j])
            } else if (lineasCod[j].includes('print')) {
                bloqueFuncion.push(lineasCod[j])
            } else if (lineasCod[j].includes('append')) {
                bloqueFuncion.push(lineasCod[j])
            } else {
                let numIdent = getIdentacion(lineasCod[j]);
                if (numIdent <= 2) {
                    let ident = '';
                    for (let k = 0; k < numIdent; k++) {
                        ident = `    ${ident}`;
                    }
                    bloqueFuncion.push(`${ident}${operacioneVariable[contadorVariables]}`)
                    contadorVariables++
                }
            }
        }
        funCont++;
        funStack.push(bloqueFuncion);
        bloqueFuncion = []
    }
    if (funDef[funCont] === undefined)
        break;
}

//Funcion para determinar los bloques de ciclos for
let forCont = 0
let bloqueFor = []
for (let i = 0; i < lineasCod.length; i++) {
    if (forSct[forCont] === lineasCod[i].trim()) {
        bloqueFor.push(forSct[forCont])
        let forIdent = getIdentacion(lineasCod[i])
        for (let j = i + 1; j < lineasCod.length; j++) {
            if (lineasCod[j].startsWith('for'))
                break;
            else if (getIdentacion(lineasCod[j]) == forIdent) {
                break;
            } else if (lineasCod[j].includes('append')) {
                bloqueFor.push(`    ${lineasCod[j].trim()}`)
            } else {
                let numIdent = getIdentacion(lineasCod[j]);
                if (numIdent == 2) {
                    let ident = '';
                    for (let k = 0; k < numIdent - 1; k++) {
                        ident = `    ${ident}`;
                    }
                    bloqueFor.push(`${ident}${operacioneVariable2[contadorVariablesFOR]}`)
                    contadorVariablesFOR++
                }
            }
        }
        forCont++;
        forStack.push(bloqueFor);
        bloqueFor = []
    }
}

//Funcion para determinar los bloques main
let bloqueMain = []
for (let i = 0; i < lineasCod.length; i++) {
    if (getIdentacion(lineasCod[i]) == 0) {
        if (!lineasCod[i].startsWith('def') && !lineasCod[i].startsWith('for')) {
            if (!lineasCod[i] == '')
                bloqueMain.push(lineasCod[i])
        }
    }
}

parseMain(bloqueMain, funStack, forStack);

