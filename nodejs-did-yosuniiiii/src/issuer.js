const issuer = {};
var {
  log,
  logIssuer,
  logOK,
  sendToProver,
  logKO,
  createAndOpenWallet,
  closeAndDeleteWallet,
  createAndOpenPoolHandle,
  closeAndDeletePoolHandle,
  createAndStoreMyDid,
  postSchemaToLedger,
  getSchemaFromLedger,
  postCredDefToLedger,
  sleep
} = require("./wallet-ledger-misc");
const indy = require("indy-sdk");
const util = require("./util");
const bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({extended : true});
var readline = require("readline-sync");
const { render } = require("ejs");
const { error } = require("jquery");
const { json } = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("issuer.db");
module.exports = function (app){
  app.use(bodyParser.json());
 



  app.get("/", async function(req,res){
      //Main code starts here
  log("Set protocol version 2");
  await indy.setProtocolVersion(2);

    res.render("issuer_1.ejs");
  });

  app.post("/No1",urlencodedParser, async function(req,res){

    log("Issuer Open connections to ledger");

    var name = req.body.name;


      const poolName = name + "-pool-sandbox";

      const poolGenesisTxnPath = await util.getPoolGenesisTxnPath(poolName);

      const poolConfig = { genesis_txn: poolGenesisTxnPath };

      issuer.poolHandle=await indy.openPoolLedger(poolName, poolConfig); 

      db.serialize(function() {
        const stmt = db.prepare('INSERT INTO issuerID(pool_name, date) VALUES (?,?)');
        const date = new Date();
        const strDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
        
      stmt.run(poolName,strDate);
      stmt.finalize();

      db.each('SELECT aid, pool_name, date FROM issuerID', (err, row) =>{
        logIssuer(`${row.aid})  pool_name: ${row.pool_name}  Date: ${row.date}` );
      });
    });


      
        // issuer.poolHandle = await createAndOpenPoolHandle("issuer");

      log("Issuer Open Wallet");
      const walletConfig = { id: "issuer" + ".wallet" };
      const walletCredentials = { key: 'issuer' + ".wallet_key" };
      issuer.wallet= await indy.openWallet(walletConfig, walletCredentials);

        // issuer.wallet = await createAndOpenWallet("issuer");

      log("Issuer Create DID");
      issuer.did = await createAndStoreMyDid(
        issuer.wallet,
        "000000000000000000000000Steward1"
      );
      logKO("\tIssuer's DID is: " + issuer.did);
        
        db.get('SELECT * FROM DID', function(err, row){
          if (row.length != 0) {
            console.log("already exist", `${row.DID}`);
          }else {
            db.run('INSERT INTO DID VALUES (?)', [issuer.did]);
            console.log("saved on Database");
          };

          res.redirect("/No2");

        });
  });

  app.get("/No2", async function(req, res){
    
    const sql = ('SELECT * FROM DID');
    db.get(sql, (err,row) => {
      if (err){
        return logKO(err.message);
      }
      const test =  `${row.DID}`;
      console.log(test,"you have got DID successfully ");
      const render_data = {
        did : test
      }
      res.render("issuer_2.ejs", render_data)

      });
  
  });
    
 // ######################################done register schema to the ledger#######################################################################

  // app.post("/No2", async function(req, res){
// 
    // try{
// 
    // logIssuer("Issuer creates credential schema");
// 
// 
      // const [schemaId, schema] = await indy.issuerCreateSchema(
// 
        // issuer.did,
        // "YOSUNIIIII",
        // "1.0",
        // `["name", "age", "gender", "food", "address"]`
// 
      // )
      // issuer.schemaId = schemaId;
      // issuer.schema = schema;
      // console.log(schema, schemaId);
// 
      // logIssuer("Issuer posts schema to ledger");
      // await postSchemaToLedger(
        // issuer.poolHandle,
        // issuer.wallet,
        // issuer.did,
        // issuer.schema
      // );
      // 
      // logOK("\n\n\n" ,"done");
// 
    // }
// 
    // catch(err){
// 
      // logOK("ERROR !!!! ", err)
    // }
  // });

  // ##############################done register schema to the ledger#######################################################################






  app.post("/No2" , urlencodedParser,async function(req,res){

    issuer.schemaId = req.body.schemaId;

    try {
    
      logIssuer("Issuer gets schema from ledger");
      issuer.schema = await getSchemaFromLedger(
        issuer.poolHandle,
        issuer.did,
        issuer.schemaId
      );



      // ########### differnt way 1)###########
      for (var i in issuer.schema) {
        console.log(issuer.schema[i])
        i = i+1  
      };



      // ########### differnt way 2)###########
      for (var key in issuer.schema) {
        console.log("attr:" + key + ", value:" + issuer.schema[key]);
      };

      
       // ########### differnt way 3)###########

      var test = JSON.stringify(issuer.schema);
      logOK(test);







      logIssuer("Issuer creates credential definition for schema");
      {
        const [
          credDefId,
          credDef
        ] = await indy.issuerCreateAndStoreCredentialDef(
          issuer.wallet,
          issuer.did,
          issuer.schema,
          "Yosuniiiii_test_ID_credential",
          "CL",
          { support_revocation: false }
        ); 
        issuer.credDefId = credDefId;
        issuer.credDef = credDef;
      }
      logIssuer("Issuer posts credential definition");
      await postCredDefToLedger(
        issuer.poolHandle,
        issuer.wallet,
        issuer.did,
        issuer.credDef
      );
    } catch(error) {
      console.log("errerrrrrrrr", error);
    };


    logKO("\tSchemaId: " + issuer.schemaId);
    logKO("\tCredential Defination ID: " + issuer.credDefId);


    log(
      "Issuer shares public data (schema ID, credential definition ID, ...) (via HTTP or other communication protocol) ..."
    );

    res.redirect("/No3");
  });




// ######## post done 
// ######## post done 
// ######## post done 
// ######## post done 
// ######## post done 
// ######## post done !!!!


  app.get("/No3", async function(req,res){
      
    const sql = ('SELECT * FROM DID');
    db.get(sql, (err,row) => {
      if (err){
        return logKO(err.message);
      }
      const test =  `${row.DID}`;
      const render_data = {
        did : test
      }

    res.render("issuer_3.ejs", render_data);
  });
});





  app.post("EEEEEE", async function(req, res){


  //Sending SchemaId to Prover
  logKO("\tSchemaId: " + issuer.schemaId);
  await sendToProver("schemaId", issuer.schemaId);

  //Sending CredDefId to Prover
  logKO("\tCredential Defination ID: " + issuer.credDefId);
  await sendToProver("credDefId", issuer.credDefId);

  logIssuer("Issuer creates credential offer");
  issuer.credOffer = await indy.issuerCreateCredentialOffer(
    issuer.wallet,
    issuer.credDefId
  );

  log(
    "Transfer credential offer from 'Issuer' to 'Prover' (via HTTP or other) ..."
  );
  await sendToProver("credOffer", JSON.stringify(issuer.credOffer));

  logOK("\nWaiting for Credential Request from prover!");
  while (issuer.credReq == undefined) {
    await sleep(2000);
  }

  const tailsWriterConfig = {
    base_dir: util.getPathToIndyClientHome() + "/tails",
    uri_pattern: ""
  };
  const tailsWriter = await indy.openBlobStorageWriter(
    "default",
    tailsWriterConfig
  );
  logIssuer("Issuer creates credential");
  {
    const credValues = {
      sex: {
        raw: "male",
        encoded: "5944657099558967239210949258394887428692050081607692519917050"
      },
      name: { raw: "Alex", encoded: "1139481716457488690172217916278103335" },
      height: { raw: "175", encoded: "175" },
      age: { raw: "28", encoded: "28" }
    };
    const [cred, _i, _d] = await indy.issuerCreateCredential(
      issuer.wallet,
      issuer.credOffer,
      issuer.credReq,
      credValues,
      undefined,
      tailsWriter
    );
    issuer.cred = cred;
  }

  logOK(issuer.cred);
  logIssuer(
    "Transfer credential from 'Issuer' to 'Prover' (via HTTP or other) ..."
  );
  await sendToProver("cred", JSON.stringify(issuer.cred));

  issuer.cred = undefined;




  readline.question(
    "\n\nCredential successfully issued from issuer to prover, Press enter to terminate this session, delete issuer wallet, pool handle and teriminate program:"
  );

  // log("Issuer close and delete wallets");
  // await closeAndDeleteWallet(issuer.wallet, "issuer");

  // log("Issuer close and delete poolHandles");
  // await closeAndDeletePoolHandle(issuer.poolHandle, "issuer");

});
// ##############


app.post("/issuer", (req, res) => {
  let type = req.body.type;
  let message = req.body.message;
  switch (type) {
    case "credReq":
      issuer.credReq = JSON.parse(message);
      break;
    default:
      break;
  }
  res.status(200).send({ status: 200 });
});

};
// #########here

// app.listen(3000, () => {
//   console.log("Issuer started on port 3000!");
//   run();
// });
