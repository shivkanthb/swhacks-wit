import sys
from wit import Wit

access_token = 'WUBZ5SLRMTIXGXEO74MFTAKIFSB4JWYW'

def first_entity_value(entities, entity):
    if entity not in entities:
        return None
    val = entities[entity][0]['value']
    if not val:
        return None
    return val['value'] if isinstance(val, dict) else val

def send(request, response):
    print(response['text'])

def set_pizza(request):
    context = request['context']
    entities = request['entities']

    pizza_type = first_entity_value(entities,'type')
    pizza_size = first_entity_value(entities,'size')

    if pizza_size and pizza_type:
        context['pizzaType'] = pizza_type
        context['pizzaSize'] = pizza_size
    elif pizza_type and not pizza_size:
        context['pizzaType'] = pizza_type
    elif pizza_size and not pizza_type:
        context['pizzaSize'] = pizza_size
    else:
        context['missingInfo'] = True
    return context

actions = {
    'send': send,
    'setPizza': set_pizza,
}

client = Wit(access_token=access_token, actions=actions)
client.interactive()