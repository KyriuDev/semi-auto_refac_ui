const axios = require('axios');
const express = require('express');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const app = express();
const INFO_FILE = "information.txt";                //Identical to Java code constants
const AGREEMENT_FIELD = "agreement";                //Identical to Java code constants
const ELECTED_TASK_FIELD = "electedTask";           //Identical to Java code constants
const GAIN_FIELD = "gain";                          //Identical to Java code constants
const BPMN_PATH_FIELD = "bpmnPath";                 //Identical to Java code constants
const BPMN_FILENAME_FIELD = "bpmnFilename";         //Identical to Java code constants
const AET_FIELD = "aet";                            //Identical to Java code constants
const AGREEMENT_YES = 0;                            //Identical to Java code constants
const AGREEMENT_NO = 1;                             //Identical to Java code constants
const ORIGINAL_BPMN_FILENAME = "original.bpmn"      //Identical to Java code expectations
const DEPENDENCY_FILE_NAME = "dependencies.dep"     //Identical to Java code expectations
const JAR_FILE_NAME = "refactoring.jar";

//TODO Check if there is a real need of separating functions acceptTask/acceptProcess and declineTask/declineProcess

const index = async function (req, res){
    res.render('index', { text: 'This is EJS'})
}

const maintenance  = async function (req, res){
    res.render('maintenance', { text: 'The website is under maintenance. Please try again later.'})
}

/*
    This function reads the JSON file ``information.txt'' and duplicates the last line
    of the file (normally, a request proposing a task to move) while changing the ``agreement''
    value to ``0'' (i.e., ``True'')
*/
const acceptTask = async function(req, res) {
    const dirExtension = req.body.field1;
    const workingDirectory = req.body.field2;

    //Update information file to say that the user accepted the task
    await updateInformation(workingDirectory, AGREEMENT_YES);

    //Ask Java to propose a process
    const returnValue = launchJVM(dirExtension);
    
    console.log(returnValue['retVal'] + "/" + returnValue['msg']);

    //If Java returned an error, send it back to the client
    if (returnValue['retVal'] != 0) {
        res.send(returnValue);
        return;
    }

    //Otherwise, read the proposed process from the information file and send it to the client
    var jsonObject = await getLastLine(workingDirectory);
    const aetGain = jsonObject[GAIN_FIELD];
    const percentageGain = aetGain / (aetGain + jsonObject[AET_FIELD])
    const bpmnFilename = jsonObject[BPMN_FILENAME_FIELD]
    const bpmnFilePath = "http://localhost:3000/" + path.join("refactoring", dirExtension, bpmnFilename);
    
    console.log("Percentage gain: " + percentageGain);
    console.log("AET gain: " + aetGain);
    console.log("BPMN file name: " + bpmnFilename);
    console.log("BPMN file path: " + bpmnFilePath);    
    
    returnValue['aetGain'] = aetGain;
    returnValue['percentageGain'] = percentageGain;
    returnValue['bpmnFilePath'] = bpmnFilePath;
    res.send(returnValue);
}

/*
    This function reads the JSON file ``information.txt'' and duplicates the last line
    of the file (normally, a request proposing a task to move) while changing the ``agreement''
    value to ``1'' (i.e., ``False'')
*/
const declineTask = async function(req, res) {
    const workingDirectory = req.body.field1;
    await updateInformation(req.body.field1, AGREEMENT_NO);
}

/*
    This function reads the JSON file ``information.txt'' and duplicates the last line
    of the file (normally, a request proposing a new version of a process) while changing the
    ``agreement'' value to ``0'' (i.e., ``True'')
*/
const acceptProcess = async function(req, res) {
    const workingDirectory = req.body.field1;
    await updateInformation(req.body.field1, AGREEMENT_YES);
}

/*
    This function reads the JSON file ``information.txt'' and duplicates the last line
    of the file (normally, a request proposing a new version of a process) while changing the
    ``agreement'' value to ``1'' (i.e., ``False'')
*/
const declineProcess = async function(req, res) {
    const workingDirectory = req.body.field1;
    await updateInformation(req.body.field1, AGREEMENT_NO);
}

const uploadBPMN = async function(req, res) {
    const infos = JSON.parse(req.body);
    result = {
        directoryExtension: infos['date'],
        directoryPath: infos['path'],
        originalProcessFullPath: path.resolve(infos['path'], ORIGINAL_BPMN_FILENAME),
        originalProcessSubPath: "http://localhost:3000/" + path.join("refactoring", infos['date'], ORIGINAL_BPMN_FILENAME)
    };

    const dependencyFilePath = path.resolve(infos['path'], DEPENDENCY_FILE_NAME);

    if (!fs.existsSync(dependencyFilePath)) {
        fs.closeSync(fs.openSync(dependencyFilePath, 'w'));
    }

    console.log("RESULT: " + result['directoryPath']);
    res.send(result);
}

const computeTask = async function(req, res) {
    const dirExtension = req.body.field1;
    const workingDirectory = req.body.field2;
    //Ask Java to propose a task to move
    const returnValue = launchJVM(dirExtension);
    
    console.log(returnValue['retVal'] + "/" + returnValue['msg']);

    //If Java returned an error, send it back to the client
    if (returnValue['retVal'] != 0) {
        res.send(returnValue);
        return;
    }
    
    //Otherwise, read the proposed task from the file and send it to the client
    var jsonObject = await getLastLine(workingDirectory);
    const electedTask = jsonObject[ELECTED_TASK_FIELD];
    console.log("Elected task: " + electedTask);

    returnValue[ELECTED_TASK_FIELD] = electedTask;
    res.send(returnValue);
}

//Private methods

async function getLastLine(workingDirectory){
    //Resolve information file path
    const infoFilePath = path.resolve(workingDirectory, INFO_FILE);
    console.log("Info file: " + infoFilePath);

    //Open file
    const fileStream = fs.createReadStream(infoFilePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    var lastLine;

    //Read the file line per line, storing each line in ``lastLine''
    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        lastLine = line;
        console.log(`Line from file: ${line}`);
    }

    console.log('Last line: ' + lastLine)

    //Parse last line as a JSON object
    var jsonObject = JSON.parse(lastLine);

    return jsonObject;
}

/*
    This method updates the information sent by the Java program
    according to the answer of the user (yes or no).
    To do so, it reads the last line of the file located at
    ``infoFilePath'', parse it as a JSON object, replaces the value of
    its field ``AGREEMENT_FIELD'' by the ``agreement'' argument of this
    function and appends the JSON object at the end of the file.
*/
async function updateInformation(workingDirectory, agreement){
    //Resolve information file path
    const infoFilePath = path.resolve(workingDirectory, INFO_FILE);
    console.log("Info file: " + infoFilePath);

    //Open file
    const fileStream = fs.createReadStream(infoFilePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    var lastLine;

    //Read the file line per line, storing each line in ``lastLine''
    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        lastLine = line;
        console.log(`Line from file: ${line}`);
    }

    console.log('Last line: ' + lastLine)

    //Parse last line as a JSON object
    var jsonObject = JSON.parse(lastLine);
    //Set its field ``AGREEMENT_FIELD'' to the ``agreement'' argument value
    jsonObject[AGREEMENT_FIELD] = agreement;

    console.log('Modified object: ' + jsonObject.toString());

    //Write the modified JSON object at the end of the file
    var stream = fs.createWriteStream(infoFilePath, {flags:'a'});
    stream.write(JSON.stringify(jsonObject) + '\n');
    stream.end();
}

function launchJVM(workingDirectoryExtension){
    const process = require('child_process');
    const jarFilePath = path.resolve("..", "public", JAR_FILE_NAME);
    const javaRequest = "java -jar " + jarFilePath + " \"" + workingDirectoryExtension + "\"";
    console.log("Java request: " + javaRequest);
    var returnValue = {};

    try {
        var stdout = process.execSync(javaRequest);
        returnValue['retVal'] = 0;
        returnValue['msg'] = stdout;
    } catch (error) {
        returnValue['retVal'] = 1;
        returnValue['msg'] = error.message;
    }
    
    return returnValue;
}

module.exports = { index, maintenance, uploadBPMN, acceptTask, declineTask, acceptProcess, declineProcess, computeTask }
