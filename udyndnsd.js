#!/usr/bin/env node

var DNS_PORT = 53;

var fs = require('fs');
var dns = require('native-dns');

var config = JSON.parse(fs.readFileSync('/etc/udyndnsd.json'));
var domains = config.domains;

var dnsServer = dns.createServer()
.on('request', function(req, res) {
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
});

dnsServer.serve(DNS_PORT);
