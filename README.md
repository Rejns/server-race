#Asynchronous server race
This was project was built with intension to practice angularjs promises. User may input one more internet addresses
and upon pressing start race begins by sending 100 requests to each server one by one. For each independent racer (server) new request cannot be sent before prior request is completed, though more racers may send a request at the same time.

##Installation

1.  `git clone https://github.com/Rejns/server-race.git`
2. `cd server-race`
3. `npm install`
4. `cd js`
5. `node proxy.js`
4. user your browser and visit `http://localhost:4000/`
