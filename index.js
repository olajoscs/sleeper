const express = require('express');
const app = express();
const path = require('path');
const execSync = require('child_process').execSync;
const expressLayouts = require('express-ejs-layouts');

app.use(expressLayouts);
app.set('layout', path.join(__dirname, '/templates/layout.html'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static('public'));


function renderResponse(res, template, data = {}) {
	res.render(path.join(__dirname, '/templates', `/${template}`), data);
}

function restartProcess(appProperties) {
	let taskName = appProperties.taskName;
	let exePath = appProperties.exePath;
	let processFound = null;

	let commandResult;
	try {
		commandResult = execSync('tasklist | findstr "' + taskName + '"');
		processFound = true;
	} catch(e) {
		console.log('no process found');
		processFound = false;
	}

	if (processFound) {
		killProcess(commandResult);
	}

	console.log(exePath);
	console.log('start "" ""' + exePath + '""');

	setTimeout(
		() => {
			execSync('start "" "' + exePath + '"', {stdio: 'inherit', shell: true});
		},
		3000
	);
}

function killProcess(commandResult) {
	let processes = commandResult
		.toString()
		.split("\n")
		.map(str => str.trim())
		.filter(str => !!str);

	let processIds = processes
		.map(str => {
			return str
				.split(' ')
				.filter(v => !!v)
				.filter(v => /^\d+$/.test(v))
		})
		.map(arr => arr[0])
	;

	for (let processId of processIds) {
		execSync('taskkill /PID '+processId);
	}
}

app.get('/', function(req, res) {
    renderResponse(res, 'main.html');
});

app.get('/sleep', function(req, res){
    execSync('Rundll32.exe Powrprof.dll,SetSuspendState Sleep');
});

app.get('/restart', function(req, res){
	execSync('shutdown /r');
	renderResponse(res, 'restart-computer.html');
});

app.get('/free-space', function(req, res) {
    let output = execSync(' wmic LogicalDisk Where DriveType="3" Get DeviceID,FreeSpace')
        .toString()
        .split("\n")
        .map((str) => str.trim())
        .filter(v => !!v)
        .map(str => str.split(' ').filter(v => !!v))
        .map(arr => {
            let number = Number.parseInt(arr[1]);

            if (Number.isInteger(number)) {
                arr[1] = Math.round(number / 1000 / 1000 / 1000).toString() + ' GB';
            }

            return arr;
        })
    ;

	renderResponse(res, 'free-space.html', {freeSpaceEntries: output});
});

app.get('/restart-plex', function(req, res) {
	// render loading screen
	renderResponse(res, 'restart-plex.html');

	restartProcess({
		taskName: "Plex\ Media\ Server",
		exePath: "C:\\Program\ Files\\Plex\\Plex\ Media\ Server\\Plex\ Media\ Server.exe",
	});
});


app.get('/restart-plex-done', function(req, res) {
	renderResponse(res, 'restart-plex-done.html');
});

app.get('/restart-qbittorrent', function (req, res) {
	// render loading screen
	renderResponse(res, 'restart-qbittorrent.html');

	restartProcess({
		taskName: 'qbittorrent',
		exePath: "C:\\Program\ Files\\qBittorrent\\qbittorrent.exe",
	});
});

app.get('/restart-qbittorrent-done', function (req, res) {
	renderResponse(res, 'restart-qbittorrent-done.html');
});

app.listen(3000);