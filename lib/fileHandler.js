const fs = require('fs')
let codigo = fs.readFileSync('./data/codigo.py').toString();

const compileFile = (mainCode,funCode) => {
    var stream = fs.createWriteStream("./data/codigo.cpp");
    stream.write('#include <iostream>\n');
    stream.write('#include <vector>\n');
    stream.write('#include <string>\n');
    stream.write('using namespace std;\n');
    stream.write('\n');
    stream.once('open', async (fd) => {
        //DEFINICION FUNCIONES
        for (let i = 0; i < funCode.length; i++) {
            stream.write(`${funCode[i].cabecera};\n`);    
        }
        //MAIN
        stream.write('\n');
        stream.write('int main() {\n');
        for (let i = 0; i < mainCode.length; i++) {
            stream.write(`    ${mainCode[i]}\n`);    
        }
        stream.write('    return 0;\n');
        stream.write('}\n');
        stream.write('\n');
        //FUNCIONES
        for (let i = 0; i < funCode.length; i++) {
            stream.write(`${funCode[i].cabecera}{\n`); 
            for (let j = 0; j < funCode[i].contenido.length; j++) {
                stream.write(`    ${funCode[i].contenido[j]}\n`);
            }
            stream.write('}\n');
            stream.write('\n');
        }
        stream.end();
    });
}

module.exports = {
    codigo,
    compileFile
}