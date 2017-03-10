'use strict';

let Wit = null;
let interactive = null;

Wit = require('node-wit').Wit;
interactive = require('node-wit').interactive;

const accessToken = 'WUBZ5SLRMTIXGXEO74MFTAKIFSB4JWYW';  // WIT access_token

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

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    console.log(JSON.stringify(request));
    console.log('sending...', JSON.stringify(response));
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

    return context;
  },
};

const client = new Wit({accessToken, actions});
interactive(client);
