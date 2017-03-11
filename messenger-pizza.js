'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
require('dotenv').config();

app.set('port', (process.env.PORT || 3000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// index route
app.get('/', function (req, res) {
	res.send('hello world i am a secret bot')
})

// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === '1q2w3e4r') {
		res.send(req.query['hub.challenge'])
    return;
	}
	res.send('Error, wrong token')
})

let Wit = require('node-wit').Wit;
let log = require('node-wit').log;

const accessToken = process.env.WIT_TOKEN;

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

// Our bot actions
const actions = {
  send({sessionId}, {text}) {
    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    const recipientId = sessions[sessionId].fbid;
    if (recipientId) {
      sendTextMessage(recipientId, text);
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      return;
    }
  },
  setPizza({context, entities}) {
    var pizza_type = firstEntityValue(entities, 'type');
    var pizza_size = firstEntityValue(entities, 'size');
    if(pizza_size && pizza_type)
    {
      context.pizzaSize = pizza_size;
      context.pizzaType = pizza_type;
    }
    else if(pizza_type && !pizza_size)
    {
      context.pizzaType = pizza_type;
    }
    else if(pizza_size && !pizza_type)
    {
      context.pizzaSize = pizza_size;
    }
    else
    {
      context.missingInfo = true;
    }

    if(context.pizzaSize && context.pizzaType)
      context.done = true;
    return context;
  },
    greet({context, entities}) {
      console.log((JSON.stringify(context)));
      var greet_val = firstEntityValue(entities, 'greeting');
      context = {};
      if(greet_val == "hello")
        context.greetingreply = "Hello hooman!";
      else if(greet_val == "thanks")
        context.greetingreply = "You are very welcome";
	  else if(greet_val == "bye")
	  	context.greetingreply = "Bye. See you soon <3";
      return context;
    },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
};

const wit = new Wit({
  accessToken: accessToken,
  actions,
  logger: new log.Logger(log.INFO)
});

// to post data
app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id
    console.log("Incoming message");
		const sessionId = findOrCreateSession(sender);

		if (event.message && event.message.text) {
			let text = event.message.text
			
			wit.runActions(
			sessionId, // the user's current session
			text, // the user's message
			sessions[sessionId].context // the user's current session state
			).then((context) => {
				 // Our bot did everything it has to do.
			// Now it's waiting for further messages to proceed.
			console.log('Waiting for next user messages');
      console.log(JSON.stringify(context));
			// Based on the session state, you might want to reset the session.
			// This depends heavily on the business logic of your bot.
			// Example:
			if (context['done']) {
        console.log("Completed a conversation...");
			  delete sessions[sessionId];
			}
			else
			// Updating the user's current session state
				sessions[sessionId].context = context;
			})
			.catch((err) => {
			console.error('Oops! Got an error from Wit: ', err.stack || err);
			})
			// sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
		}
		if (event.postback) {
			let text = JSON.stringify(event.postback)
			sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
			continue
		}
	}
	res.sendStatus(200)
})

const token = process.env.PAGE_ACCESS_TOKEN || 'EAAFNhaSRphcBAPR7gJuEfpz88hWOc6USO9kltA3JG7IQmGuggOiHZCR4BhMsPznQGWiULJ5zEGO8OpdzPT7fNEIWSZAPSxaYGQ4TtDzMeXjoJKVFzGCxZAzxjiOAeZBt5A1pHgc3idXR8NWGfg6YqeQZBQwGFrc4BB18Q8AR78QZDZD'

function sendTextMessage(sender, text) {
	let messageData = { text:text }
	
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})