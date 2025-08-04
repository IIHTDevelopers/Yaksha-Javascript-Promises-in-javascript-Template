const esprima = require('esprima');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xmlBuilder = require('xmlbuilder');

// Define TestCaseResultDto
class TestCaseResultDto {
    constructor(methodName, methodType, actualScore, earnedScore, status, isMandatory, errorMessage) {
        this.methodName = methodName;
        this.methodType = methodType;
        this.actualScore = actualScore;
        this.earnedScore = earnedScore;
        this.status = status;
        this.isMandatory = isMandatory;
        this.errorMessage = errorMessage;
    }
}

// Define TestResults
class TestResults {
    constructor() {
        this.testCaseResults = {};
        this.customData = '';  // Include custom data from the file
    }
}

// Function to read the custom.ih file
function readCustomFile() {
    let customData = '';
    try {
        customData = fs.readFileSync('../custom.ih', 'utf8');
    } catch (err) {
        console.error('Error reading custom.ih file:', err);
    }
    return customData;
}

// Function to send test case result to the server
async function sendResultToServer(testResults) {
    try {
        const response = await axios.post('https://compiler.techademy.com/v1/mfa-results/push', testResults, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Server Response:', response.data);
    } catch (error) {
        console.error('Error sending data to server:', error);
    }
}

// Function to generate the XML report
function generateXmlReport(result) {
    const xml = xmlBuilder.create('test-cases')
        .ele('case')
        .ele('test-case-type', result.status)
        .up()
        .ele('name', result.methodName)
        .up()
        .ele('status', result.status)
        .up()
        .end({ pretty: true });
    return xml;
}

// Function to write to output files
function writeOutputFiles(result, fileType) {
    const outputFiles = {
        functional: "./output_revised.txt",
        boundary: "./output_boundary_revised.txt",
        exception: "./output_exception_revised.txt",
        xml: "./yaksha-test-cases.xml"
    };

    let resultStatus = result.status === 'Pass' ? 'PASS' : 'FAIL';
    let output = `${result.methodName}=${resultStatus}\n`;

    let outputFilePath = outputFiles[fileType];
    if (outputFilePath) {
        fs.appendFileSync(outputFilePath, output);
    }
}

// Function to check if a promise is created correctly
function checkPromiseCreation() {
    let result = 'Pass';
    let feedback = [];

    // Read the student's index.js code
    const studentCode = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf-8');

    // Check if a Promise constructor is used
    if (!studentCode.includes('new Promise')) {
        result = 'Fail';
        feedback.push("You must create a promise using the 'new Promise' constructor.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking promise creation\x1b[0m`);

    return new TestCaseResultDto(
        'PromiseCreation',
        'functional',
        1,
        result === 'Pass' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check if promise chaining is used
function checkPromiseChaining() {
    let result = 'Pass';
    let feedback = [];

    // Read the student's index.js code
    const studentCode = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf-8');

    // Check if multiple .then() calls are chained
    const thenCalls = studentCode.match(/\.then/g);
    if (!thenCalls || thenCalls.length < 2) {
        result = 'Fail';
        feedback.push("You must chain at least two promises using .then() for sequential operations.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking promise chaining\x1b[0m`);

    return new TestCaseResultDto(
        'PromiseChaining',
        'functional',
        1,
        result === 'Pass' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check if .catch() is used for error handling
function checkErrorHandling() {
    let result = 'Pass';
    let feedback = [];

    // Read the student's index.js code
    const studentCode = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf-8');

    // Check if .catch() is used for error handling
    if (!studentCode.includes('.catch(')) {
        result = 'Fail';
        feedback.push("You must use .catch() to handle any errors in your promise chain.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking error handling with .catch()\x1b[0m`);

    return new TestCaseResultDto(
        'ErrorHandling',
        'functional',
        1,
        result === 'Pass' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check if multiple fetches are performed sequentially
function checkSequentialFetching() {
    let result = 'Pass';
    let feedback = [];

    // Read the student's index.js code
    const studentCode = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf-8');

    // Check if fetch() is used sequentially (one fetch followed by another)
    if (!studentCode.includes('fetch(')) {
        result = 'Fail';
        feedback.push("You must use fetch() to make asynchronous requests.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking sequential fetching of data\x1b[0m`);

    return new TestCaseResultDto(
        'SequentialFetching',
        'functional',
        1,
        result === 'Pass' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to grade the student's code
function gradeAssignment() {
    const studentFilePath = path.join(__dirname, '..', 'index.js');
    let studentCode;

    try {
        studentCode = fs.readFileSync(studentFilePath, 'utf-8');
    } catch (err) {
        console.error("Error reading student's file:", err);
        return;
    }

    const ast = esprima.parseScript(studentCode);

    // Execute checks and prepare testResults
    const testResults = new TestResults();
    const GUID = "d805050e-a0d8-49b0-afbd-46a486105170";  // Example GUID for each test case

    // Assign the results of each test case
    testResults.testCaseResults[GUID] = checkPromiseCreation();
    testResults.testCaseResults[GUID + '-promise-chaining'] = checkPromiseChaining();
    testResults.testCaseResults[GUID + '-error-handling'] = checkErrorHandling();
    testResults.testCaseResults[GUID + '-sequential-fetching'] = checkSequentialFetching();

    // Read custom data from the custom.ih file
    testResults.customData = readCustomFile();

    // Send the results of each test case to the server
    Object.values(testResults.testCaseResults).forEach(testCaseResult => {
        const resultsToSend = {
            testCaseResults: {
                [GUID]: testCaseResult
            },
            customData: testResults.customData
        };

        console.log("Sending below data to server");
        console.log(resultsToSend);

        // Log the test result in yellow for pass and red for fail using ANSI codes
        if (testCaseResult.status === 'Pass') {
            console.log(`\x1b[33m${testCaseResult.methodName}: Pass\x1b[0m`); // Yellow for pass
        } else {
            console.log(`\x1b[31m${testCaseResult.methodName}: Fail\x1b[0m`); // Red for fail
        }

        // Send each result to the server
        sendResultToServer(resultsToSend);
    });

    // Generate XML report for each test case
    Object.values(testResults.testCaseResults).forEach(result => {
        const xml = generateXmlReport(result);
        fs.appendFileSync('./test-report.xml', xml);
    });

    // Write to output files for each test case
    Object.values(testResults.testCaseResults).forEach(result => {
        writeOutputFiles(result, 'functional');
    });
}

// Function to delete output files
function deleteOutputFiles() {
    const outputFiles = [
        "./output_revised.txt",
        "./output_boundary_revised.txt",
        "./output_exception_revised.txt",
        "./yaksha-test-cases.xml"
    ];

    outputFiles.forEach(file => {
        // Check if the file exists
        if (fs.existsSync(file)) {
            // Delete the file if it exists
            fs.unlinkSync(file);
            console.log(`Deleted: ${file}`);
        }
    });
}

// Function to delete output files and run the grading function
function executeGrader() {
    // Delete all output files first
    deleteOutputFiles();

    // Run the grading function
    gradeAssignment();
}

// Execute the custom grader function
executeGrader();
