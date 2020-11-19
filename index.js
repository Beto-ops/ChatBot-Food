const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const bodyParser = require('body-parser');

let db = null;
const url = 'mongodb://joao:123@localhost:27017?authSource=chatbotdb';
const dbName = 'chatbotdb';

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});

app.use(jsonParser);
app.use(urlencodedParser);

MongoClient.connect(
  url,
  { useUnifiedTopology: true, useNewUrlParser: true, },
  function (err, client) {
    assert.equal(null, err);
    console.log("bd conectado...");

    db = client.db(dbName);
  });

app.listen(3000);
console.log('servidor rodando em: localhost:3000');


app.get("/documents/find", urlencodedParser, function (req, res) {
  try{
  let objJSON = {};
  // if (req.body.code_user) objJSON.code_user = Number(req.body.code_user);
  // else objJSON.code_user= -1;
  // if (req.body.activate) objJSON.activate = Number(req.body.activate);
  // else objJSON.activate = 1;
  // console.log(objJSON);
  findDocuments(objJSON, function (result) {
    res.send(result);
  });
    }catch(e){
      
      console.log({error: 'erro de requisição 8'});
  };
});
const findDocuments = function (objJSON, callback) {
  try {
    const collection = db.collection("documents");
    collection.find(objJSON).toArray(function (err, result) {
      assert.equal(null, err);
      callback(result);
    });
  } catch (e) {
    
    console.log({ error: "erro de requisição 9" });
  }
}



/*********************Janela do Chatbot**********************************************/

app.get("/chatbot", urlencodedParser, function (req, res) {
  try {
  
    objJSON = {};

    res.set("Content-Type", "text/html");
    const fs = require("fs");
    let data = fs.readFileSync("./chatbot.html", "utf8");

    res.send(data);
  } catch (e) {
    console.log({ error: "erro de requisição 10" });
  }
});
app.get("/index", urlencodedParser, function (req, res) {
  try {
    let code_user = -1;
    objJSON = {};
    

    res.set("Content-Type", "text/html");
    const fs = require("fs");
    let data = fs.readFileSync("./index.html", "utf8");

    res.send(data);
  } catch (e) {
    console.log({ error: "erro de requisição 10" });
  }
});


/************************ ROTAS CRUD USUARIO********************************** */


app.get("/chatbot/find", urlencodedParser, function (req, res) {
  try{
  console.log('request received');
  let objJSON = {};

  if(req.query.input) objJSON.input = req.query.input; else objJSON.input = '';
  if (req.body.output) objJSON.output = req.body.output;
  
  questionData(objJSON, function(result) {
      if(result.length > 1) {
        const resultNlp = nlp(req.query.input, result);
        
        res.send(resultNlp);

      }
      else {
        res.send(result);
      }

   });
  // findData(objJSON, function (result) {
  //   res.send(result);
  // });
    }catch(e){
      
      console.log({error: 'erro de requisição 21'});
  };
});



const findData = function (objJSON, callback) {
  try {

    const collection = db.collection("chatbot");
    collection.find(objJSON).toArray(function (err, result) {
      assert.equal(null, err);
      callback(result);
    });
  } catch (e) {
    
    console.log({ error: "erro de requisição 32" });
  }
}


/************************ROTA GET PERGUNTAS******************************************** */




function questionData (objJSON, callback) {
  try {
    console.log(objJSON);
    const collection = db.collection("chatbot");
    collection.find(objJSON).toArray(function (err, result) {
      assert.equal(null, err);
      if (result.length <= 0) {
        let objFind = {};

        collection.find(objFind).toArray(function (err, result) {
          assert.equal(null, err);
          callback(result);
        });
      } else callback(result);
    });
  } catch (e) {
    
    console.log({ error: "erro de requisição 34" });
  }
};

const abreviacoes = function (Input = "") {
  try {
    Input = Input.toString().trim();
    let result = Input.replace(/ vc /g, "você");
    result = result.replace(/ tb /g, "também");
    result = result.replace(/ oq /g, "o que");
    result = result.replace(/ pq /g, "por que");
    result.toString().trim();
    return result;
  } catch (e) {
    return Input;
    
    console.log({ error: "erro de requisição 35" });
  }
};

/*******************Processamento de linguagem natural***************************************************** */

const nlp = function(question='', array=[]){
    
let originalQuestion = question.toString().trim();

  try{
  
    let findInput = 0;
    let findIndex = 0;

    let documents = getDocuments(originalQuestion);
    if(documents){
        return [
          {
    
            "input": originalQuestion,
            "output": "Ok, entendido!",
          }
        ];
    }else{

          for (let i = 0; i < array.length; i++) {
            question = question.toString().trim();
            let input = array[i].input.toString().trim();
            if (input.length <= 0) input = array[i].output.toString().trim();
            question = question
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();
            input = input
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();
            question = question.replace(/[^a-zA-Z0-9\s]/g, "");
            input = input.replace(/[^a-zA-Z0-9\s]/g, "");

            let tokenizationQuestion = question.split(" ");
            let tokenizationInput = input.split(" ");

            tokenizationQuestion = tokenizationQuestion.map(function (e) {
              if (e.length > 3) return e.substr(0, e.length - 3);
              else return e;
            });
            tokenizationInput = tokenizationInput.map(function (e) {
              if (e.length > 3) return e.substr(0, e.length - 3);
              else return e;
            });
            let words = 0;
            for (let x = 0; x < tokenizationQuestion.length; x++) {
              if (tokenizationInput.indexOf(tokenizationQuestion[x]) >= 0) words++;
            }
            if (words > findInput) {
              findInput = words;
              findIndex = i;
            }
          }
          if (findInput > 0)
            return [
              {
               
                "input": originalQuestion,
                "output": array[findIndex].output,
              }
            ];
          else
            return [
              {
                
                "input": originalQuestion,
                "output": "Desculpe, não sei te responder",
              }
            ];

        }

      }catch(e){

        
            return [
              {
                
                "input": originalQuestion,
                "output": "Desculpe, não sei te responder",
              }
            ];

      } 
    }


/******************Funções de CAPTURA de dados***************************************************** */


      const getDocuments = function (question = "", code_user = -1) {
        try {
          question = question.toString().trim();

          let _nome = getName(question);
          let _email = "";
          let _celular = "";
          let _cpf = "";
    

          let questionTokens = question.split(" ");
          for (let i = 0; i < questionTokens.length; i++) {
            let word = questionTokens[i].toString().trim();

            if (word.length >= 1) {
              if (_email.length <= 0) _email = email(word);
              if (_celular.length <= 0) _celular = celular(word);
             
              if (_cpf.length <= 0) _cpf = cpf(word);
         
            }
          }

          let objJSON = {};

          if (_nome.length > 0) objJSON.nome = _nome;
          else objJSON.nome = "";

          if (_email.length > 0) objJSON.email = _email;
          else objJSON.email = "";
          if (_celular.length > 0) objJSON.celular = Number(_celular);
          else objJSON.celular = "";
   

          if (_cpf.length > 0) objJSON.cpf = Number(_cpf);
          else objJSON.cpf = "";
 
          if (
            _nome.length > 0 ||
           
            _email.length > 0 ||
            _celular.length > 0 ||
    
            _cpf.length > 0 
     
          ) {
            const collection = db.collection("documents");
            collection.insertOne(objJSON);
            return true;
          } else return false;
        } catch (e) {
          console.log({ error: "erro de requisição 1" });

          return false;
        }
      };

      const defaultName = function (question = "") {
        try {
          let nome = "";
          const fs = require("fs");
          const data = fs.readFileSync("./names.csv", "utf8");
          const names = data.toString().trim().split(",");
          let tempName = "";
          let tempIndex = Infinity;
          for (let i = 0; i < names.length; i++) {
            let name = names[i].toString().trim();
            if (question.indexOf(name) >= 0) {
              if (name != tempName && question.indexOf(name) < tempIndex) {
                tempName = name;
                tempIndex = question.indexOf(name);

                if (question.indexOf(" e ") > question.indexOf(name))
                  nome = question.substring(
                    question.indexOf(name),
                    question.indexOf(" e ")
                  );
                else if (question.indexOf(" é ") > question.indexOf(name))
                  nome = question.substring(
                    question.indexOf(name),
                    question.indexOf(" é ")
                  );
                else if (question.indexOf(",") > question.indexOf(name))
                  nome = question.substring(
                    question.indexOf(name),
                    question.indexOf(",")
                  );
                else if (question.indexOf(";") > question.indexOf(name))
                  nome = question.substring(
                    question.indexOf(name),
                    question.indexOf(";")
                  );
                else if (question.indexOf(".") > question.indexOf(name))
                  nome = question.substring(
                    question.indexOf(name),
                    question.indexOf(".")
                  );
                else
                  nome = question.substring(
                    question.indexOf(name),
                    question.length - 1
                  );
              }
            }
          }
          return nome.trim();
        } catch (e) {
          return '';
          
          console.log({ error: "erro de requisição 36" });
        }
      };

      const getName = function (question = "") {
        try {
          question = question.toString().trim();
          let nome = "";
          let Default = defaultName(question);
          if (Default.length <= 0) {
            let start = "";

            if (question.indexOf("Nome") >= 0) start = "Nome";
            if (question.indexOf("nome") >= 0) start = "nome";
            if (question.indexOf("chamo") >= 0) start = "chamo";

            if (start.length > 0 && question.indexOf("seu") < 0) {
              let indexStart = question.indexOf(start) + start.length + 1;
              let index0 = question.indexOf(" é ");
              if (index0 < 0) index1 = Infinity;
              let index1 = question.indexOf(" e ");
              if (index1 < 0) index1 = Infinity;
              let index2 = question.indexOf(",");
              if (index2 < 0) index2 = Infinity;
              let index3 = question.indexOf(";");
              if (index3 < 0) index3 = Infinity;
              let index4 = question.indexOf(".");
              if (index4 < 0) index4 = Infinity;
              let indexEnd =
                [
                  Math.abs(index1 - indexStart),
                  Math.abs(index2 - indexStart),
                  Math.abs(index3 - indexStart),
                  Math.abs(index4 - indexStart),
                ].sort((a, b) => a - b)[0] + indexStart;
              if (indexEnd < indexStart) indexEnd = question.length;
              nome = question.substring(indexStart, indexEnd);
              nome = nome.replace(/é/g, "");
              nome = nome.replace(/:/g, "");
              nome = nome.replace(/[0-9]/g, "").trim();
              if(nome.indexOf(' é ')>0){
                nome= nome.split(' é ');
                nome= nome[0].toString().trim();
              }
              if(nome.indexOf(' e ')>0){
                nome= nome.split(' e ');
                nome= nome[0].toString().trim();
              }
              if(nome.indexOf(',')>0){
                nome= nome.split(',');
                nome= nome[0].toString().trim();
              }
              if(nome.indexOf(';')>0){
                nome= nome.split(';');
                nome= nome[0].toString().trim();
              }
              if(nome.indexOf('.')>0){
                nome= nome.split('.');
                nome= nome[0].toString().trim();
              }

            }
          } else nome = Default;
          return nome;
        } catch (e) {
          return '';
          
          console.log({ error: "erro de requisição 37" });
        }
      };

      
        
      const email = function (_email=''){
      try{
        _email = _email.toString().trim();
        _email = _email.replace(/[^0-9a-zA-Z@.-_]/g, '');
        if((_email.indexOf('@')>0)&&(_email.indexOf('.')>0)&&(_email.length>=5)) {
          let c = _email.charAt(_email.length-1);
          if(c=='.') _email = _email.substring(0,_email.length-1)
          return _email;
        }
        else return '';
          }catch(e){
            return "";
      
      console.log({error: 'erro de requisição 39'});
  };
      }

      const celular = function(_celular='') { 
       try{
        _celular =_celular.toString().trim(); 
        _celular =_celular.replace(/[^0-9]/g, ''); 
        if (_celular.indexOf('55')==0) _celular= _celular.replace('55','');
         let _cpf = cpf(_celular);
        if((_celular.length==11)&&(cpf.length<=0)&&(_celular.indexOf('9')>0)) return _celular; 
        else return '';
          }catch(e){
            return "";
      
      console.log({error: 'erro de requisição 40'});
      };
      }


     


      const cpf = function(_cpf=''){
        try{
        _cpf = _cpf.toString().trim().replace(/\D/g, '');
        if(_cpf.toString().length != 11) return '';
        let result = _cpf;
        [9,10].forEach(function(j){
          let soma = 0, r;
          _cpf.split('').splice(0,j).forEach(function(e,i){
             soma += parseInt(e) * ((j+2)-(i+1));
          });
          r = soma % 11;
          r = (r<2)? 0:11 - r;
          if(r != _cpf.substring(j, j+1)) result = '';
        });
        return result;
          }catch(e){
            return "";
      
      console.log({error: 'erro de requisição 43'});
  };
      }




