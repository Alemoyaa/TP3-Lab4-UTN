const fetch = require('node-fetch');
const mongoose = require('mongoose');


// URL de conexión con la BD  
const URI = "mongodb://localhost/paises_db";

mongoose.connect(URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const cliente = mongoose.connection;

cliente.on('error', console.error.bind(console, 'connection error:')); //Si no se conecta con mongo
cliente.once('open',//Si se pudo conectar
    async function() {  
        await cargarDB();  //Metodo para cargar la base de datos de paises
        await manipulacionDeDatos(); //Metodo que posee todos los metodos solicitados
});

const paisSchema = mongoose.Schema({ //Esquema de pais esperado
    codigoPais:     {type: Number, index: true},
    nombrePais:     String,
    capitalPais:    String,
    region:         String,
    poblacion:      Number,
    latitud:        Number, 
    longitud:       Number,
    superficie:     Number
});

var PaisModelo = mongoose.model('paises', paisSchema); //Modelo de pais seteado en la coleccion paises

cliente.collection("paises").createIndex({"codigoPais":1});//Index creado como demostracion

async function cargarDB(){ //Inicializamos la funcion en asincrona ya que debemos esperar la respuesta de la pagina
    
    for (let index = 1; index <= 300; index++) {
        await fetch(`https://restcountries.eu/rest/v2/callingcode/${index}`)
        .then(res => res.json()) //Casteamos la respuesta a JSON
        .then(data => {    //Luego la enviamos a revisar si contiene algo o no
            vacio(data);
        })
        .catch(err => {
            console.log(err);
        });
    }  
}

function vacio(Dato){ 
    if(Dato.status === 404){
        console.log("Pagina vacia");        
    } else{   
        guardarJSON(Dato); 
    }
}

async function guardarJSON(Registro){ 

    var paisTemp = new PaisModelo({ //Creamos un modelo de pais temporal el cual lo usaremos unicamente para ser guardado en la db
        codigoPais: Registro[0].callingCodes[0],
        nombrePais: Registro[0].name,
        capitalPais: Registro[0].capital,
        region: Registro[0].region,
        poblacion: Registro[0].population,
        latitud: Registro[0].latlng[0],
        longitud: Registro[0].latlng[1],
        superficie: Registro[0].area
    });
  
    PaisModelo.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(paisTemp._id) //Indicamos el campo por el cual queremos buscar en la db si tiene coincidencias
    }, paisTemp, {upsert: true}, function (err){//Mandamos el obj que queremos almacenar. Si este objeto existe sera actualizado.
        //Si el obj no existe, atravez de la opcion "upsert: true", almacena en la bd el objeto. 
        //Si este es creado atravez de un callback podremos indicar lo que sucedio
        if(err) {
            console.error(err); throw err; 
        } 
        console.log("Pais: ",paisTemp.nombrePais," guardado."); 
    });
     
}

function manipulacionDeDatos(){
    //("--------Ejercicio 5.1--------")
    obtenerAmericas();
    
    //("--------Ejercicio 5.2--------")
    obtenerAmericasYPoblacion();

    //("--------Ejercicio 5.3--------")
    obtenerDistintoAfrica();

    //("--------Ejercicio 5.4--------")
    actualizarEgipt();

    //("--------Ejercicio 5.5--------")
    eliminar258();

    //("--------Ejercicio 5.7--------")
    paisesEntreIntervalo();

    //("--------Ejercicio 5.8--------")
    paisesOrdenados();

    //("--------Ejercicio 5.9--------")
    ejemploSkip();

    //("--------Ejercicio 5.10--------")
    ejemploExRegular();
}

function obtenerAmericas(){
    PaisModelo.find({"region":"Americas"}, function(err, paises) {
        if (err) return console.error(err);
        console.log(paises);
    });
}

function obtenerAmericasYPoblacion(){
    PaisModelo.find({"region":"Americas", "poblacion": {$gte: 100000000}}, function(err, paises) {
        if (err) return console.error(err);
        console.log(paises);
    });
}

function obtenerDistintoAfrica(){
    PaisModelo.find({"region":{$ne: "Africa"}}, function(err, paises) {
        if (err) return console.error(err);
        console.log(paises);
    });
}

function actualizarEgipt(){
    PaisModelo.updateOne({ "nombrePais": "Egypt" },{ "nombrePais": "Egypto", "poblacion": "95000000" }, function(err,pais) {
        if (err) return console.error(err);
        console.log(pais);
    });
}

function eliminar258(){
    PaisModelo.deleteOne({ "codigoPais": 258 }, function(err,pais) {
        if (err) return console.error(err);
        console.log(pais);
    });
}

function paisesEntreIntervalo() {
    PaisModelo.find({"poblacion":{$gte: 50000000, $lte: 150000000}}, function(err, paises) {
        if (err) return console.error(err);
        console.log(paises);
    });
}

function paisesOrdenados() {
    PaisModelo.find({},{"nombrePais":""}).sort("nombrePais").exec(function(err, articles) {
        if (err) return console.error(err);
        console.log(articles);
    });
}

function ejemploSkip() {
    PaisModelo.find({}, {"nombrePais":""}).skip(100).exec(function(err, paises) {
        if (err) return console.error(err);
        console.log(paises);
    });
}

function ejemploExRegular() {
    PaisModelo.find({"nombrePais":/^M/}, {"nombrePais":""}).exec(function(err, paises) {
        if (err) return console.error(err);
        console.log(paises);
    }); 
}
