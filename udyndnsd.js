#!/usr/bin/env node

var fs = require('fs');
var dns = require('native-dns');
var express = require('express');

var config = JSON.parse(fs.readFileSync('/etc/udyndnsd.json'));
var domains = config.domains;

var DNS_PORT = 53;
dns.createServer().on('request', function(req, res) {
    var hostname = req.question[0].name;
    console.log('request', hostname);

    if (domains[req.question[0].name]) {
        res.answer.push(dns.A({
            name: hostname,
            address: domains[hostname],
            ttl: 1
        }));
    }

    res.send();
}).serve(DNS_PORT);

var HTTP_PORT = 8080;
var app = express().get('/', function(req, res) {
    var html = '';
    for (domain in domains) {
        ipAddress = domains[domain];
        html += domain + ' &rarr; ' + ipAddress + '<br>\n';
    }
    res.send(html);
}).get('/update', function(req, res) {
    var domain = req.query.domain;
    var clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    res.setHeader('content-type', 'text/plain');

    if (!domain) {
        res.send('ERROR\nMandatory domain parameter not specified.');
        return;
    }

    domains[domain] = clientIp;
    res.send('UPDATED\n' + domain + ' set to ' + clientIp);
}).listen(HTTP_PORT);
