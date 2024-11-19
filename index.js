const express = require('express');
const app = express();
const path = require('path');
const execSync = require('child_process').execSync;

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/main.html'));
});

app.get('/sleep', function(req, res){
    execSync('Rundll32.exe Powrprof.dll,SetSuspendState Sleep');
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

    res.render(path.join(__dirname, '/free-space.html'), {freeSpaceEntries: output});
});

app.get('/restart-plex', function(req, res) {
	let commandResult;
	try {
		commandResult = execSync('tasklist | findstr "Plex\\ Media\ Server"');
	} catch(e) {
		console.log('no process found'); 
		return;
	}
	
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
	
	setTimeout(
		() => {
			execSync('start "" "C:\\Program Files\\Plex\\Plex Media Server\\Plex Media Server.exe"', { stdio: 'inherit', shell: true });
			
			res.render(path.join(__dirname, '/restart-plex.html'));
		},
		3000
	);
});

app.listen(3000);