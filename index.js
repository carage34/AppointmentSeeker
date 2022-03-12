const { Client, Intents } = require('discord.js');
const { token, channelId} = require('./config.json');
const cheerio = require('cheerio');
const axios = require('axios');
const request = require('request');
const moment = require('moment');

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
    client.channels.cache.get(channelId).send("---------------------------");
    parsePage(client, "Provins", listeRdv["Provins"]).then(() => {
        parsePage(client, "Nangis", listeRdv["Nangis"]).then(() => {
            client.channels.cache.get(channelId).send("---------------------------").then(() => {
                process.exit()
            })

        })
    })
});

client.login(token);

function parsePage(client, ville, data) {
     return new Promise((resolve, reject) => {
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

                     client.channels.cache.get(channelId).send("Pas de créneaux disponible");
                     resolve();
                 }
                 $('a').each((index, el) => {

                     let value = $(el).attr('onclick');
                     let splitP = value.substring(
                         value.indexOf("(") + 1,
                         value.lastIndexOf(")")
                     )
                     if(!splitP.includes((','))) {
                         const date = moment(splitP.split('\'')[1].split(' ')[0]).format('DD/MM/YYYY');
                         if(!dates.includes(date)) {
                             dates.push(date);
                             client.channels.cache.get(channelId).send("Créneau disponible à " + ville  + " le " + date);
                         }
                     }
                 });
                 resolve();
             }
         );
     })
}

