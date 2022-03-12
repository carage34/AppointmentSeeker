const { Client, Intents } = require('discord.js');
const { token, channelId} = require('./config.json');
const cheerio = require('cheerio');
const request = require('request');
const moment = require('moment');
const fs = require('fs');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const dataRdvProvins = {
    body: {
        space: "565",
        prestationID1: "792741",
        prestationPrice1: "0",
        prestationDuree1: "20",
        total_duree: "20",
        total_prix: "0",
        pro: "66682",
        date_resa: "",
        nb_prestations: "1",
        direction: ""
    },
    url: 'https://www.rdv360.com/pro/66682/availabilities'

}

const dataRdvNangis = {
    body : {
        space: "427",
        prestationID1: "1127287",
        prestationPrice1: "0",
        prestationDuree1: "20",
        total_duree: "20",
        total_prix: "0",
        pro: "79932",
        date_resa: "",
        nb_prestations: "1",
        direction: ""
    },
    url : 'https://www.rdv360.com/pro/79932/availabilities'

}

let listeRdv = [];
listeRdv['Provins'] = dataRdvProvins;
listeRdv['Nangis'] = dataRdvNangis;

client.once('ready', c => {
    console.log("Ready");
    const listPromise = []
    client.channels.cache.get(channelId).send("---------------------------");
    let file_content = fs.readFileSync('date-rdv.json');
    let content = JSON.parse(file_content);
    for(key in listeRdv) {
        listPromise.push(parsePage(client, key, listeRdv[key], content));
    }
    Promise.all(listPromise).then((values) => {
        if(values[0] === false && values[1] === false) {
            client.channels.cache.get(channelId).send("Batch executé : Pas de nouveaux créneaux libérés");
        }
        client.channels.cache.get(channelId).send("---------------------------").then(() => {
            process.exit()
        });
    })
});

client.login(token);

function parsePage(client, ville, data, content) {
     return new Promise((resolve, reject) => {

         let newRdv = false;

         request.post(
             {
                 url: data.url,
                 form: data.body
             },
             function (err, httpResponse, body) {
                 const $ = cheerio.load(body);
                 const dates = [];
                 let bold = $('.bold');
                 if($(bold).html()) {
                     resolve(false);
                 }
                 $('a').each((index, el) => {

                     let value = $(el).attr('onclick');
                     let splitP = value.substring(
                         value.indexOf("(") + 1,
                         value.lastIndexOf(")")
                     )
                     if(!splitP.includes((','))) {
                         let date = moment(splitP.split('\'')[1].split(' ')[0]).format('DD/MM/YYYY');
                         if(!dates.includes(date)) {
                             let splitted = date.split('/');
                             let fileSplitted = content[ville].split('/');
                             if(new Date(parseInt(splitted[0], 10), parseInt(splitted[1], 10), parseInt(splitted[2], 10)) < new Date(parseInt(fileSplitted[0], 10), parseInt(fileSplitted[1], 10), parseInt(fileSplitted[2], 10))) {
                                 newRdv = true;
                                 content[ville] = splitted[0] + '/' +  splitted[1] + '/' +  splitted[2];
                                 fs.writeFileSync('date-rdv.json', JSON.stringify(content));
                                 client.channels.cache.get(channelId).send("Nouveau créneau disponible à " + ville  + " le " + date);
                             }
                             dates.push(date);

                         }
                     }
                 });
                 resolve(newRdv);
             }
         );
     })
}

