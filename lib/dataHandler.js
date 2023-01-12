const getFunParms = (codigo,regex) => {
    const matches = codigo.matchAll(regex);
    const FunParms = {}
    for (const match of matches) {
        FunParms.nombre = match[1].trim()
        FunParms.parametros = match[2].split(',').map(ele=>ele.trim())
        //COMPROBAR ERROR DE COMA var,
        return FunParms
    }
}

const getVarParms = (codigo,regex) => {
    const matches = codigo.matchAll(regex);
    const VarParms = {}
    for (const match of matches) {
        //console.log(match);
        if (match[15]) {
            VarParms.nombre = match[1];
            VarParms.asignacion=match[0].split('=')[1]
        }else if (match[11]) {
            VarParms.nombre = match[1];
            VarParms.asignacion=match[11]
        }else{
            VarParms.nombre = match[1];
            VarParms.asignacion = match[2];
            VarParms.msg = match[4];
        }
        return VarParms
    }
}

const getOperParms = (codigo,regex) => {
    const matches = codigo.matchAll(regex);
    const VarParms = {}
    for (const match of matches) {
        //console.log(match);
        VarParms.var1 = match[1];
        VarParms.operador = match[7];
        VarParms.var2 = match[8];
        VarParms.extra = match[10];
        return VarParms
    }
}

const getIdentacion = (linea)=>{
    let numIdent = 0;
    while(linea.startsWith('    ')){
        linea=linea.replace('    ','');
        numIdent++;
    }
    return numIdent;
}

module.exports = {
    getFunParms,
    getVarParms,
    getOperParms,
    getIdentacion
}