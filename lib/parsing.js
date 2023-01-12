const { getFunParms, getVarParms, getOperParms } = require('./dataHandler')
const { compileFile } = require('./fileHandler')

const finalcode = [];
const definidas = [];
const funDefinidas = [];

const parseMain = (mainCode, funStack, forStack) => {
    //Obtener la definicion de las funciones
    const funCode = getFunDef(funStack);
    //console.log(funCode);
    let printSct = mainCode.toString().match(/print\s*\(\s*(|(\w+)|(\w+\s*\,{1}\s*\w+)|(\"[\w\s]+\"))+\s*\)/g);
    let printSctCnt = 0;
    let varAsg = mainCode.toString().match(/([a-zA-Z]+ *)\= *(([a-zA-Z]\w+ *\(\s*((\"[\w\s\:]*\")|(\w+)|([a-zA-Z]\w+\(\s*((\"[\w\s\:]*\")|(\w+))\s*\)))\s*\))|([a-zA-Z]*\[(\w)*\s*\])|([a-zA-Z]+)|([0-9]+)) *([\+\-\*\/]{1}(([a-zA-Z]\w+ *\(\s*((\"[\w\s\:]*\")|(\w+)|([a-zA-Z]\w+\(\s*((\"[\w\s\:]*\")|(\w+))\s*\)))\s*\))|([a-zA-Z]*\[(\w)*\])|([a-zA-Z]+)|([0-9]+)))*/g);
    let varAsgCnt = 0;
    //Empezamos a recorres lina pir linea
    for (let i = 0; i < mainCode.length; i++) {
        if (printSct[printSctCnt] == mainCode[i]) {
            printSctCnt++;
        } else if (varAsg[varAsgCnt] == mainCode[i]) {
            varAsgCnt++;
        }
        //console.log(mainCode[i]);
        finalcode.push(parseVarAsg(mainCode[i], funCode, funStack, 0,forStack))
    }
    //console.log(definidas);
    //console.log(finalcode);
    //console.log(funDefinidas);
    compileFile(finalcode,funDefinidas)
}

const determinaTipo = (variable) => {
    for (let i = 0; i < definidas.length; i++) {
        if (variable == definidas[i].nombre) {
            return definidas[i].tipo;
        }
    }
    if (variable.startsWith('"') && variable.endsWith('"')) {
        return 'string';
    }
    if (variable.includes('int(')) {
        return 'int';
    }
}

const yaDefinida = (variable) => {
    for (let i = 0; i < definidas.length; i++) {
        if (variable == definidas[i].nombre)
            return true;
    }
    return false;
}

const yaDefinidaFun = (funcion) => {
    for (let i = 0; i < funDefinidas.length; i++) {
        if (funcion == funDefinidas[i].nombre)
            return true;
    }
    return false;
}

const agregaVariableDefinidas = (nombre, tipo) => {
    const variable = {}
    if (yaDefinida(nombre)) {
        variable.nombre = `${nombre}2`
        variable.nivel = 1
        variable.referencia = nombre;
    } else {
        variable.nombre = nombre
        variable.nivel = 0
    }
    variable.tipo = tipo
    definidas.push(variable);
    //console.log(definidas);
    return { nivel: variable.nivel, variable: variable.nombre };
}

const getFunDef = (funStack) => {
    //obtener parametros de la funcion nombre, asignacion, return 
    const funVarDef = [];
    for (let i = 0; i < funStack.length; i++) {
        let funEle = funStack[i];
        //SACAMOS LOS PARAMETROS DE LA FUNCION
        let parms = getFunParms(funEle[0], /([a-zA-Z]+)\((.*)\)/g);
        //COMPROBAMOS SI TIENE UN RETURN
        if (funEle[funStack[i].length - 1].includes('return')) {
            parms.return = true;
            parms.valor = funEle[funStack[i].length - 1].split('return ')[1];
        }
        funVarDef.push(parms);
    }
    return funVarDef;
}

const getFor = (forSentence,forStack,funCode,funStack)=>{
    let cuerpoFor = []
    for (let i = 0; i < forStack.length; i++) {
        if (forStack[i][0].includes(forSentence)) {
            let forEncontrado = forStack[i];
            //console.log(forEncontrado);
            let iVAR = forEncontrado[0].split(' ')[1];
            let inicio = forEncontrado[0].split(' ')[3].includes('range(')==true?forEncontrado[0].split(' ')[3].split('(')[1]: console.log(`Error en el for`);
            let fin = forEncontrado[0].split(' ')[forEncontrado[0].split(' ').length-1].substring(0,forEncontrado[0].split(' ')[forEncontrado[0].split(' ').length-1].length-2);

            if(fin.includes('len(')){
                let variable = fin.split('len(')[1].replace(')','');
                if (determinaTipo(variable).includes('vector')) {
                    fin = `${variable}.size()`
                }else{
                    throw new Error(`Se esperaba un vector<> y se encontro ${determinaTipo(variable)} para ${variable} >>> ${fin}`);
                }
            }else if(fin.includes('range(')){
                let variable = fin.split(',')[1];
                if (determinaTipo(variable)=='int') {
                    fin = `${variable}`
                }else{
                    throw new Error(`Se esperaba un int y se encontro ${determinaTipo(variable)} para ${variable} >>> ${fin}`);
                }
            }

            const cabeceraFor = `for (int ${iVAR} = ${inicio.split(',')[0]}; ${iVAR} < ${fin}; ${iVAR}++){`;
            //console.log(cabeceraFor);
            cuerpoFor.push(cabeceraFor);
            for (let j = 1; j < forEncontrado.length; j++) {
                let lineaFor = forEncontrado[j].trim();
                let resultado = parseVarAsg(lineaFor,funCode,funStack,0);
                cuerpoFor.push(`    ${resultado}`)
            }
            cuerpoFor.push('}');
            //console.log(cuerpoFor);
            return {cuerpo:cuerpoFor,tam:forEncontrado.length-1}
        }
    }
}

const getFun = (funCode, funStack, forStack) => {
    //conversion a funcion de C++
    let cuerpoFun = []
    for (let i = 0; i < funStack.length; i++) {
        if (funStack[i][0].includes(funCode.nombre)) {
            let funcionEncontrada = funStack[i];
            //console.log(funCode);
            for (let j = 1; j < funcionEncontrada.length; j++) {
                let lineaFuncion = funcionEncontrada[j].trim();
                //console.log(lineaFuncion);

                if (lineaFuncion.includes('for ')) {
                    ////ARMAR BLOQUE FOR
                    const objetoFor = getFor(lineaFuncion,forStack,funCode,funStack);
                    for (let k = 0; k < objetoFor.cuerpo.length; k++) {
                        cuerpoFun.push(objetoFor.cuerpo[k]);
                    }
                    j+=objetoFor.tam;
                    //console.log(objetoFor);
                }else{
                    let resultado = parseVarAsg(lineaFuncion,funCode,funStack,0);
                    //console.log(resultado);
                    cuerpoFun.push(resultado)
                }
                //console.log(definidas);
            }
            if (funCode.return){
                let nuevaCabecera = `${determinaTipo(funCode.valor)} ${funCode.nombre}(${lineaParametrosConTipo(funCode.parametros)})`
                funDefinidas.push({nombre:funCode.nombre,cabecera:nuevaCabecera,contenido:cuerpoFun,tipoFuncion:determinaTipo(funCode.valor)});
            }else{
                //LA FUNCION ES TIPO VOID
                let nuevaCabecera = `void ${funCode.nombre}(${lineaParametrosConTipo(funCode.parametros)})`
                //console.log(nuevaCabecera);
                funDefinidas.push({nombre:funCode.nombre,cabecera:nuevaCabecera,contenido:cuerpoFun});
            }
        }
    }
    //console.log(funDefinidas);
    //console.log('FIN DE LA FUNCION');
}

const lineaParametrosConTipo = (parametros) => {
    const parametrosNuevos = []
    for (let i = 0; i < parametros.length; i++) {
        parametrosNuevos.push(`${determinaTipo(parametros[i])} ${parametros[i]}`);
    }
    return parametros.length==1?parametrosNuevos[0]:parametrosNuevos.join(',');
}

const determinaRetornoFuncion = (nombre,funStack)=>{
    for (let i = 0; i < funStack.length; i++) {
        if (funStack[i][0].includes(nombre)) {
            let funcionEncontrada = funStack[i];
            return determinaTipo(funcionEncontrada[funcionEncontrada.length-1].trim().split(' ')[1]);
        }
    }
}

const parseVarAsg = (lineaCod, funCode, funStack, contPila,forStack) => {
    let contadorPila = contPila;
    let varAsg = getVarParms(lineaCod, /([a-zA-Z]+ *)\= *(([a-zA-Z]\w+ *\(\s*((\"[\w\s\:]*\")|(\w+)|([a-zA-Z]\w+\(\s*((\"[\w\s\:]*\")|(\w+))\s*\)))\s*\))|([a-zA-Z]*\[(\w)*\s*\])|([a-zA-Z]+)|([0-9]+)) *([\+\-\*\/]{1}(([a-zA-Z]\w+ *\(\s*((\"[\w\s\:]*\")|(\w+)|([a-zA-Z]\w+\(\s*((\"[\w\s\:]*\")|(\w+))\s*\)))\s*\))|([a-zA-Z]*\[(\w)*\])|([a-zA-Z]+)|([0-9]+)))*/g)
    let cllFun = getFunParms(lineaCod, /([a-zA-Z]+)\((.*)\)/g);
    let varOpr = getOperParms(lineaCod, /(([a-zA-Z]*\[(\w)*\])|([a-zA-Z]+)|([0-9]+)) *(([\+\-\*\/]){1}(([a-zA-Z]*\[(\w)*\])|([a-zA-Z]+)|([0-9]+)))/g);
    //console.log(varAsg);
    if (varAsg) {
        const resultadoAsignacion = parseVarAsg(varAsg.asignacion, funCode, funStack, ++contadorPila,forStack);
        if (resultadoAsignacion) {
            if(resultadoAsignacion.variable=='vector<int>'){
                agregaVariableDefinidas(varAsg.nombre, resultadoAsignacion.variable);
                return `${resultadoAsignacion.variable} ${varAsg.nombre};`;
            }else if(resultadoAsignacion.isNumber){
                agregaVariableDefinidas(varAsg.nombre, resultadoAsignacion.tipoVariable);
                return `${resultadoAsignacion.tipoVariable} ${varAsg.nombre} = ${resultadoAsignacion.variable};`;
            }else if(resultadoAsignacion.especial){
                agregaVariableDefinidas(varAsg.nombre, resultadoAsignacion.tipoVariable);
                return `${resultadoAsignacion.tipoVariable} ${varAsg.nombre} = ${resultadoAsignacion.variable};`;
            }else if(resultadoAsignacion.operacion){
                if (yaDefinida(varAsg.nombre)) {
                    return `${varAsg.nombre} = ${resultadoAsignacion.variable};`;   
                }else {
                    throw new Error(`La variable ${varAsg.nombre} no esta definida`);
                }
            }else{
                if (resultadoAsignacion.variablesFuncion[0].reservada) {
                    const parseo = resultadoAsignacion.variablesFuncion[0].equivalente.replace('%VARIABLE%', varAsg.nombre);
                    agregaVariableDefinidas(varAsg.nombre, resultadoAsignacion.tipoFuncion);
                    return `${resultadoAsignacion.tipoFuncion} ${varAsg.nombre}; ${parseo}`;
                }
                const asignacion = resultadoAsignacion.equivalente.replace('%VARIABLE%', varAsg.nombre);
                let awiwi;
                let tipoReturn;
                if (asignacion.startsWith(`${asignacion.split('(')[0]}(`) &&asignacion.endsWith(')')) {
                    tipoReturn = determinaRetornoFuncion(asignacion.split('(')[0],funStack);
                    awiwi = agregaVariableDefinidas(varAsg.nombre, tipoReturn);
                }else{
                    awiwi = agregaVariableDefinidas(varAsg.nombre, resultadoAsignacion.tipoFuncion);   
                }
                if (resultadoAsignacion.reservada == 'input') {
                    return `${resultadoAsignacion.tipoFuncion} ${varAsg.nombre}; ${asignacion}`;
                } else {
                    if (awiwi.nivel > 0) {
                        return `${tipoReturn} ${awiwi.variable} = ${asignacion};`;
                    } else {
                        return `${resultadoAsignacion.tipoFuncion} ${varAsg.nombre} = ${asignacion};`;
                    }
                }
            }
        }
        return 'MAL';
    } else if (cllFun) {
        //OBTENER LAS VARIABLES ANIDADAS ASI COMO SU TIPO
        let variablesFuncion = [];
        for (let i = 0; i < cllFun.parametros.length; i++) {
            const objetoVariable = parseVarAsg(cllFun.parametros[i], funCode, funStack, ++contadorPila,forStack)
            //console.log(objetoVariable);
            variablesFuncion.push(objetoVariable)
        }
        //DETERMINAR SI SE EJECUTA UNA FUNCION RESERVADAS DE PYTHON
        if (lineaCod.split('(')[0].includes('input')) {
            const equivalente = `cout << ${variablesFuncion[0].variable} << "\\n"; cin >> %VARIABLE%;`;
            return { equivalente, tipoFuncion: 'string', reservada: 'input', variablesFuncion }
        } else if (lineaCod.split('(')[0].includes('print')) {
            return printTOCPP(lineaCod);
        } else if (lineaCod.split('(')[0].includes('int')) {
            const equivalente = `stoi(${variablesFuncion[0].variable})`;
            return { equivalente, tipoFuncion: 'int', variablesFuncion }
        } else if (lineaCod.includes('append')) {
            const partes = lineaCod.split('.');
            const equivalente = `${partes[0]}.push_back(${partes[1].split('(')[1].replace(')','')});`;
            return equivalente;
        }
        //BUSCAMOS SI LA FUNCION ESTA EN LAS FUNCIONES DEFINIDAS
        //console.log(funCode);
        let finded;
        for (let i = 0; i < funCode.length; i++) {
            if (lineaCod.includes(`${funCode[i].nombre}(`)) {
                finded = funCode[i];
            }
        }
        //IDENTIFICAR SI UNA VARIABLE CAMBIO DE TIPO
        variablesFuncion = compruebaNivel(variablesFuncion);
        //SI LA FUNCION SI FUE ENCONTRADA EN LA PILA DE FUNCIONES
        if (finded) {
            let final = `${cllFun.nombre}(${parametrizacion(variablesFuncion,cllFun.parametros)})`
            let parms = getFunParms(final, /([a-zA-Z]+)\((.*)\)/g);
            //COMPROBAR SI EL NUMERO DE PARAMETROS
            if (finded.parametros.length == parms.parametros.length) {
                const parame = parms.parametros;
                //DETERMINAR EL TIPO DE CADA PARAMETRO
                for (let j = 0; j < parame.length; j++) {
                    //DEFINIR TIPOS DE VARIABLE DE LAS FUNCIONES
                    agregaVariableDefinidas(finded.parametros[j],determinaTipo(parame[j]))

                    if (variablesFuncion[0].tipoFuncion == 'int') {
                        parame[j] = variablesFuncion[0].equivalente
                    } else if (determinaTipo(parame[j]) != 'string') {
                        if (contadorPila - parms.parametros.length == 0) {
                            parame[j] = `to_string(${parame[j]})`
                        } else if (determinaTipo(parame[j]) == 'int') {
                            parame[j] = parame[j]
                        }
                    }
                }

                if (!yaDefinidaFun(finded.nombre)) {
                    getFun(finded, funStack,forStack);
                }

                if (contadorPila - parms.parametros.length == 0) {
                    return `${finded.nombre}(${parame.join(',')});`;
                } else {
                    return { equivalente: `${finded.nombre}(${parame.join(',')})`, tipoFuncion: 'int', variablesFuncion }
                }
            } else {
                throw new Error(`Parametros incompletos en la funcion ${finded.nombre}`);
            }
        } else {
            throw new Error(`La funcion ${lineaCod.split('(')[0].trim()} no esta definida`);
        }
    }else if(varOpr){
        return { variable: `${varOpr.var1}${varOpr.operador}${varOpr.var2}`, tipoVariable: `int` ,operacion:true}
    }else {
        //RETORNAR LA VARIABLE ASI COMO SU TIPO
        if(lineaCod.startsWith('[')){
            return { variable: 'vector<int>', tipoVariable: `int` }
        }else if(lineaCod.endsWith(']')){
            let tipo;
            if (determinaTipo(lineaCod.split('[')[0]).includes('vector')) {
                tipo = determinaTipo(lineaCod.split('[')[0]).split('<')[1].replace('>','');
            }
            return { variable: lineaCod, tipoVariable: tipo ,especial:true}
        }else if(!isNaN(lineaCod)){
            return { variable: lineaCod, tipoVariable: `int`, isNumber:true }
        }else if(lineaCod.includes('return')){
            return `${lineaCod};`;
        }else if(lineaCod.includes('*')||lineaCod.includes('+')||lineaCod.includes('/')||lineaCod.includes('-')){
            return `${lineaCod};`;
        }else{
            return { variable: lineaCod, tipoVariable: determinaTipo(lineaCod) }   
        }
    }
}

const parametrizacion = (variablesFuncion,otrosDatos) => {
    const vars = []
    for (let i = 0; i < variablesFuncion.length; i++) {
        let varAct = variablesFuncion[i].variable;
        vars.push(varAct)
    }
    if(otrosDatos[0].includes('int(')){
        return otrosDatos[0];
    }
    return (variablesFuncion.length == 0) ? variablesFuncion[0].variable : vars.join(',');
}

const compruebaNivel = (variablesFuncion) => {
    const variablesFun = []
    for (let i = 0; i < variablesFuncion.length; i++) {
        let varAct = variablesFuncion[i];
        for (let j = 0; j < definidas.length; j++) {
            if (definidas[j].referencia) {
                if (definidas[j].referencia == varAct.variable) {
                    varAct.variable = definidas[j].nombre;
                    varAct.tipoVariable = definidas[j].tipo;
                }
            }
        }
        variablesFun.push(varAct);
    }
    return variablesFun;
}

const printTOCPP = (printSct) => {
    const matches = printSct.matchAll(/print\s*\(\s*(|(\w+)|(\w+\s*\,{1}\s*\w+)|(\"[\w\s]+\"))\s*\)/g);
    for (const match of matches) {
        if (match[4]) {
            return `cout << ${match[4]} << "\\n";`;
        } else {
            const vars = match[3].split(',');
            let print = 'cout << '
            for (let i = 0; i < vars.length; i++) {
                //Checar si la variable esta definida
                const definedVar = definidas.find(vari => vari.nombre == vars[i]);
                if (!definedVar)
                    throw new Error(`La variable ${vars[i]} no esta definida`);
                print += vars[i] + ' << ';
            }
            print += '"\\n";'
            return print;
        }
    }
}

module.exports = {
    getFunDef,
    parseMain
}