#!/usr/bin/env node

var fs = require('fs');
var dns = require('native-dns');
var express = require('express');

var DNS_PORT = 53;
var DEFAULT_HTTP_PORT = 8080;
var DEFAULT_TTL = 1; // seconds

var config_filename = '/etc/udyndnsd.json';
var config = JSON.parse(fs.readFileSync(config_filename));
var domains = config.domains;
if (!config.httpPort) {
    config.httpPort = DEFAULT_HTTP_PORT;
}
if (!config.ttl) {
    config.ttl = DEFAULT_TTL;
}

dns.createServer().on('request', function(req, res) {
    var hostname = req.question[0].name;
    console.log('request', hostname);

    if (domains[req.question[0].name]) {
        res.answer.push(dns.A({
            name: hostname,
            address: domains[hostname],
            ttl: config.ttl
        }));
    }

    res.send();
}).on('socketError', function(event, error, socket) {
    console.log('socketError:', event, error, socket);
}).serve(DNS_PORT);

express().get('/', function(req, res) {
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
    fs.writeFileSync(config_filename, JSON.stringify(config, null, 4));
}).listen(config.httpPort);
