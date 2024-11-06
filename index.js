import axios from "axios";
import papa from "papaparse";
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import urls from "./urls.js";
var results = [];

console.log("Starting a list of "+urls.length+" urls");
urls.forEach((url)=>{
    url = url.replace(/\/$/, "");
    var row = {
        URL: url,
        TITLE: null,
        STATUSCODE: null,
        EMAILS: null,
    };
    axios({
        method:"get",
        url:`${url}/login/forgot_password.php`,
    }).then((res)=>{
        checkForgotPassword(row, res);
    }, (err)=>{
        if(err.code === 'ERR_FR_TOO_MANY_REDIRECTS')
            checkMYui(row);
        else{
            console.log(url+" failed at checking forgot password");
            console.error(err.code);
        }
    });
    if(urls.indexOf(url) === urls.length-1)
        console.log("done");
});

function checkForgotPassword(row, response){
    if(response.status===200){
        getTitle(row);
        return;
    }
    checkMYui(row);
}

function checkMYui(row){
    axios({
        method:"get",
        url: row.URL,
    }).then((res)=>{
        if(res.data.includes("M.yui"))
            innerGetTitle(res, row);
    }, (err)=>{
        console.log(row.URL+" failed at checking M.yui");
        console.error(err.code);
    });
}

function getTitle(row){
    axios({
        method:"get",
        url: row.URL,
    }).then((res)=>{
        innerGetTitle(res, row);
    }, (err)=>{
        console.log(row.URL+" failed at getting title");
        console.error(err.code);
    });
}

function checkVersion(row){
    var url = new URL(row.URL);
    url = url.origin;
    axios({
        method:"get",
        url: `${url}/local/elediafile/version.php`,
        validateStatus: false,
    }).then((res)=>{
        row.STATUSCODE = res.status;
        results.push(row);
        var csv = papa.unparse(results, {
            delimiter: ";",
        });
        fs.writeFile('./list.csv',csv, (err)=>{if(err) console.log(err);});
        //console.log(csv);
    }, (err)=>{
        console.log(url+" failed at checking version");
        console.error(err.code);
    });
}

function innerGetTitle(res, row){
    if(!res.data || typeof res.data != "string")
        return;
    var emails = getEmails(res.data);
    if(emails)
        row.EMAILS = emails;
    const $ = cheerio.load(res.data);
    row.TITLE = $("title").text();
    checkVersion(row);
}

function getEmails(text){
    var emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if(emails)
        emails = [...new Set(emails)];
    return emails ?? null;
}
