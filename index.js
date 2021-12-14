//ref :https://blog.logrocket.com/parsing-html-nodejs-cheerio/
// ref : https://www.reddit.com/r/learnprogramming/comments/3zbhcd/nodejs_using_cheerio_to_scrape_hrefs_but_part_of/
//to do error handling, test, hash email info
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
var nodemailer = require('nodemailer');
const data = require("./mail.js");

const server = express();
server.use(express.json());

var transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: data[0].user,
    pass: data[0].pass
  }
});

let optimalPrice = 0.08;
let optimalLink = "";

let findBestPrice= 1;
let findBestLink = "";

let url1 = "https://www.trendyol.com/baby-turco-islak-mendil-x-b109299-c101411?pi=";
let searchWord1 = "Doğadan";


let url2 = "https://www.trendyol.com/sleepy-islak-mendil-x-b105101-c101411?pi=";
let searchWord2 ="Doğan";

function sendMailToUser(){
  transporter.sendMail(mailOptions, function(error, info){
  if (error) {
     console.log(error);
  } else {
     console.log('Email sent: ' + info.response);
  }
}); 
}


function calculateOnePiece(price, pieceList0, pieceList1, link) {
  if (parseInt(pieceList0, 10) < 150 && parseInt(pieceList1, 10) < 150) {  //bazı açıklamada toplam yaprak sayısı yazıldığından onları dahil etmiyoruz
    let onePiece = (parseInt(price, 10) / (parseInt(pieceList0, 10) * parseInt(pieceList1, 10))).toFixed(2);
    //optimalPrice = optimalPrice > onePiece ? onePiece : optimalPrice;
    if (optimalPrice > onePiece) {
      optimalPrice = onePiece;
      optimalLink = link;
    }
    if (findBestPrice >= onePiece) {
      findBestPrice = onePiece;
      findBestLink = link;
    }
    return console.log("Tane fiyatı: " + onePiece
      + " Yaprak: " + pieceList0 + " " + pieceList1
      + " Fiyat: " + price
      + " Link: " + link
    );
  }

}


async function mainOperation(url, searchWord){
  for (let index = 1; index <= 7; index++) {
    await axios
      .get(url + index)
      .then((response) => {
        const $ = cheerio.load(response.data);
  
        const cardAll = $('.p-card-chldrn-cntnr ');
  
        for (let i = 0; i < cardAll.length; i++) {
          let textWrapper = $(cardAll[i]).find(".hasRatings")[0],
            text = $(textWrapper).text();
          let priceWrapper = $(cardAll[i]).find(".prc-box-sllng")[0],
            price = $(priceWrapper).text().split(" ")[0];
  
          let priceDscntdWrapper = $(cardAll[i]).find(".prc-box-dscntd")[0],
            priceDscntd = $(priceDscntdWrapper).text().split(" ")[0];
  
          let links = $(cardAll[i]).find($("a")).attr("href");
  
          let pieceList = text.match(/\d+/g);
          if (priceDscntd && text.includes(searchWord)) {
            if (pieceList[1] == undefined) {
              pieceList[1] = parseInt(priceDscntd, 10) > 25 ? 18 : 1;
              calculateOnePiece(priceDscntd, pieceList[0], pieceList[1], links);
            }
            else {
              calculateOnePiece(priceDscntd, pieceList[0], pieceList[1], links);
            }
          }
          else if (text.includes(searchWord)) {
            if (pieceList[1] == undefined) {
              pieceList[1] = parseInt(price, 10) > 25 ? 18 : 1;
              calculateOnePiece(price, pieceList[0], pieceList[1], links);
            }
            else {
              calculateOnePiece(price, pieceList[0], pieceList[1], links);
            }
          }
  
        }
  
      })
      .catch((err) => console.log("Fetch error " + err));
  
  }
  
}

var intervalId = setInterval(async function() {
  await mainOperation(url2 , searchWord2);
  mailOptions.text = 'Yaprak adet fiyatı: ' + optimalPrice + ' Ürün linki: ' + 'https://www.trendyol.com' + optimalLink;
  if(optimalPrice < 0.08){ sendMailToUser() }
}, 10000);

server.get("/", (req, res) => { 
  res.send('Bulunan en uygun yaprak adet fiyatı: ' + `${findBestPrice}` + ' Ürün linki: ' + 'https://www.trendyol.com' + `${findBestLink}`);
});

var mailOptions = {
  from: data[0].user,
  to: data[0].to,
  subject: 'Discount Alert',
  text: ''
};

 

server.listen(5000, () => {
  console.log("http://localhost:5000 adresine gelen istekler dinleniyor...");
 
});
