// node work.js --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results --excel=worldcup.csv --dataFolder=data

let minimist =require('minimist');
let axios=require('axios');
let jsdom=require('jsdom');
let excel4node=require('excel4node');
let pdf=require('pdf-lib');
let fs=require("fs");
let path=require("path");
const { bytesFor } = require('pdf-lib');

let args=minimist(process.argv);

//using axios
let result=axios.get(args.source);

result.then((response)=>{
  let html=response.data;

  let dom=new jsdom.JSDOM(html);
  let document=dom.window.document;


  let matches=[];
  let matchinfo=document.querySelectorAll("div.match-score-block");

  for(let i=0;i<matchinfo.length;i++){
      let match={
          
      };
       let nameP=matchinfo[i].querySelectorAll("p.name");
       match.t1=nameP[0].textContent;
       match.t2=nameP[1].textContent;

       let nameSpans=matchinfo[i].querySelectorAll("div.score-detail>span.score");

       //abonended matches
       if(nameSpans.length==2){
        match.t1s=nameSpans[0].textContent;
        match.t2s=nameSpans[1].textContent;
       }else if(nameSpans.length==1){
        match.t1s=nameSpans[0].textContent;
        match.t2s="";
       }else{
        match.t1s="";
        match.t2s="";
       }

       let resultDivs=matchinfo[i].querySelector("div.status-text > span");
       match.result = resultDivs.textContent;

      matches.push(match);
  }

  let matchesJSON=JSON.stringify(matches);
  fs.writeFileSync("matches.json",matchesJSON,"utf-8");

  let teams=[];
  for(let i=0;i<matches.length;i++){
    populateTeams(teams,matches[i]);
  }

  for(let i=0;i<matches.length;i++){
    putMatchInAppro(teams,matches[i]);
  }

  let teamsJSON=JSON.stringify(teams);
  fs.writeFileSync("teams.json",teamsJSON,"utf-8");

  //creating excel sheet
  createExcelFile(teams);
  createFolders(teams);

}).catch((err)=>{
    console.log(err);
})


function populateTeams(teams,match){

  let team1idx=-1;
  for(let i=0;i<teams.length;i++){
    if(teams[i].name == match.t1){
      team1idx=i;
      break;
    }
  }
  if(team1idx==-1){
    teams.push({
      name:match.t1,
      matches:[]
    });

  }

  let team2idx=-1;
  for(let i=0;i<teams.length;i++){
    if(teams[i].name == match.t1){
      team2idx=i;
      break;
    }
  }
  if(team2idx==-1){
    teams.push({
      name:match.t2,
      matches:[]
    });

  }
}

function putMatchInAppro(teams,match){
  let t1idx=-1;

  for(let i=0;i<teams.length;i++){
    if(teams[i].name == match.t1){
      t1idx=i;
      break;
    }
  }

  let team1=teams[t1idx];
  team1.matches.push({
    vs:match.t2,
    selfScore:match.t1s,
    oppScore:match.t2s,
    result:match.result
  });

  let t2idx=-1;

  for(let i=0;i<teams.length;i++){
    if(teams[i].name == match.t1){
      t2idx=i;
      break;
    }
  }

  let team2=teams[t2idx];
  team2.matches.push({
    vs:match.t1,
    selfScore:match.t2s,
    oppScore:match.t1s,
    result:match.result
  });

}


function createExcelFile(teams){
  let wb=new excel4node.Workbook();

  for(let i=0;i<teams.length;i++){

    let sheet=wb.addWorksheet(teams[i].name);

    sheet.cell(2,1).string("VS");
    sheet.cell(2,2).string("Self Score");
    sheet.cell(2,3).string("Opp Score");
    sheet.cell(2,4).string("Result");


    for(let j=0;j<teams[i].matches.length;j++){
         sheet.cell(j+2,1).string(teams[i].matches[j].vs);
         sheet.cell(j+2,2).string(teams[i].matches[j].selfScore);
         sheet.cell(j+2,3).string(teams[i].matches[j].oppScore);
         sheet.cell(j+2,4).string(teams[i].matches[j].result);
    }
  }
  wb.write(args.excel);
}

function createFolders(teams){
   fs.mkdirSync(args.dataFolder);

   for(let i=0;i<teams.length;i++){
     let teamFN = path.join(args.dataFolder,teams[i].name);
     fs.mkdirSync(teamFN);

     for(let j=0;j<teams[i].matches.length;j++){
      let matchFileName = path.join(teamFN,teams[i].matches[j].vs + ".pdf");
      createScoreCard(teams[i].name,teams[i].matches[j],matchFileName);
    }
   }
}


function createScoreCard(teamName,match,matchFileName){
  let t1=teamName;
  let t2=match.vs;
  let t1s=match.selfScore;
  let t2s=match.oppScore;
  let result=match.result;

  let byteofPDF=fs.readFileSync("Template.pdf");
  let pdfdocPromise=pdf.PDFDocument.load(byteofPDF);

  pdfdocPromise.then(function(pdfdoc){
      let page=pdfdoc.getPage(0);

      page.drawText(t1,{
        x:320,
        y:744,
        size:8
      });

      page.drawText(t2,{
        x:320,
        y:730,
        size:8
      });

      page.drawText(t1s,{
        x:320,
        y:706,
        size:8
      });

      page.drawText(t2s,{
        x:320,
        y:702,
        size:8
      });

      page.drawText(result,{
        x:320,
        y:688,
        size:8
      });


      let finalPDFBytes=pdfdoc.save();

      finalPDFBytes.then((finalBytes)=>{
          fs.writeFileSync(matchFileName,finalBytes);
      })
  })
}