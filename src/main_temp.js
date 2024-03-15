// Import
const express = require('express');
const route = require('./routes/route_maintenance');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const process = require('node:process');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Static Files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/img', express.static(path.join(__dirname, '../public/img')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', route);

// Set Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Listen on port 3000
const port = 3000;
app.listen(port, function () {
  console.log('Bubble node app running on port ' + port);
});

process.on('uncaughtException', (err, origin) => {
    console.error("An unexpected error occurred. server will shutdown.\n\nREASON:\n\n" + err + "\n\nORIGIN:\n\n" + origin);
    const currentTimeMillis = Date.now();

    var transporter = nodemailer.createTransport({
        service: 'gmail',
	    auth: {
	        user: 'maugreyalastor8@gmail.com',
	        pass: 'gpqg kwup wqhj mtwv'
	    }
    });

    var mailOptions = {
	    from: 'maugreyalastor8@gmail.com',
	    to: 'chatgptapiusg@gmail.com',
	    subject: '---------SERVER CRASH REPORT ' + currentTimeMillis + '-uncaught.txt---------',
	    text: 'The server crashed due to error: \n\n' + err + '\n\nwhich occurred due to:\n\n' + origin
	    //Removed due to "552-5.7.0 security issue" raised from gmail which suspects strange attached files
	    //Instead, send the path with extension, it will be managed later
	    /*attachments: [
	        {
	            filename: 'archive.tar.gz',
           	        path: dirPath + dirExtension + ".tar.gz"
	        }
	    ]*/
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error("Failed to send server crash email: " + error + "////" + info);
	    process.exit(1);
	}	
    
	const file = "/home/quentin_nivon/UI/public/generated/crashes/" + currentTimeMillis + "-uncaught.txt";
        const errormessage = "Server encountered the following unexpected error:\n\n" + err + "\n\nwhich has origin:\n\n" + origin;

        fs.writefile(file, errormessage, function(error) {
	    if (error) {
	        console.error("Failed to handle and write crash report for unexpected reason " + error);
	    }
	
	    process.exit(1);
        });
    });
});

process.on('unhandledRejection', (reason, p) => {
    console.error("An unexpected error occurred. server will shutdown.\n\nREASON:\n\n" + reason + "\n\nPROMISE:\n\n" + p);
    const currentTimeMillis = Date.now();

    var transporter = nodemailer.createTransport({
        service: 'gmail',
	    auth: {
	        user: 'maugreyalastor8@gmail.com',
	        pass: 'gpqg kwup wqhj mtwv'
	    }
    });

    var mailOptions = {
	    from: 'maugreyalastor8@gmail.com',
	    to: 'chatgptapiusg@gmail.com',
	    subject: '---------SERVER CRASH REPORT ' + currentTimeMillis + '-unhandled.txt---------',
	    text: 'The server crashed due to error: \n\n' + reason + '\n\nwhich occurred on promise:\n\n' + p
	    //Removed due to "552-5.7.0 security issue" raised from gmail which suspects strange attached files
	    //Instead, send the path with extension, it will be managed later
	    /*attachments: [
	        {
	            filename: 'archive.tar.gz',
           	        path: dirPath + dirExtension + ".tar.gz"
	        }
	    ]*/
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error("Failed to send server crash email: " + error + "////" + info);
	    process.exit(1);
	}	
    
	const file = "/home/quentin_nivon/UI/public/generated/crashes/" + currentTimeMillis + "-unhandled.txt";
        const errormessage = "Server encountered the following unexpected error:\n\n" + reason + "\n\nfor promise:\n\n" + p;

        fs.writefile(file, errormessage, function(error) {
	    if (error) {
	        console.error("Failed to handle and write crash report for unexpected reason " + error);
	    }
	
	    process.exit(1);
        });
    });
});
