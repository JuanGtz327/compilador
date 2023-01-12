#include <iostream>
#include <vector>
#include <string>
using namespace std;

void impresion(string mensaje,string informacion);
vector<int> llenarLista(int longitud);
int sumatoria(vector<int> Lista);
int calcularProducto(vector<int> Lista);

int main() {
    cout << "Bienvenido a compiladores" << "\n";
    string Datos; cout << "Datos a introducir" << "\n"; cin >> Datos;
    impresion("El usuario introducira ",Datos);
    vector<int> Datos2 = llenarLista(stoi(Datos));
    int Suma = sumatoria(Datos2);
    impresion("La sumatoria de los numeros es ",to_string(Suma));
    int Producto = calcularProducto(Datos2);
    impresion("El producto de los numeros es ",to_string(Producto));
    return 0;
}

void impresion(string mensaje,string informacion){
    cout << mensaje << informacion << "\n";
}

vector<int> llenarLista(int longitud){
    vector<int> Contenedor;
    for (int i = 0; i < longitud; i++) {
        int elemento; cout << "Introduce un numero" << "\n"; cin >> elemento;
        Contenedor.push_back(elemento);
    }
    return Contenedor;
}

int sumatoria(vector<int> Lista){
    int suma = 0;
    for (int x = 0; x < Lista.size(); x++) {
        suma = suma + Lista[x];
    }
    return suma;
}

int calcularProducto(vector<int> Lista){
    int vActual = Lista[0];
    for (int x = 1; x < Lista.size(); x++) {
        vActual = vActual * Lista[x];
    }
    return vActual;
}