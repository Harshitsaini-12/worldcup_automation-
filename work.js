// node work.js --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results --excel=worldcupt.csv --dataFolder=data

let minimist =require('minimist');
let axios=require('axios');
let jsdom=require('jsdom');
let excel4node=require('excel4node');
let pdf=require('pdf-lib');

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
console.log(matches);

}).catch((err)=>{
    console.log(err);
})