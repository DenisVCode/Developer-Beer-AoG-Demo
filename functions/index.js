const functions = require('firebase-functions')
const rp = require('request-promise');

const {
  dialogflow,
  Image,
  Permission
} = require('actions-on-google')

const app = dialogflow()

app.intent("order.beer - custom", (conv, {number}) => {
    conv.contexts.set('orderbeer-yes-followup ', 1, {number: number});
    conv.ask(`${number} beers coming up! What is the number of the table?`);
})

app.intent("order.beer_yes", conv => {
    return conv.followup("order_beer");
})

app.intent("order.beer - yes - custom", (conv) => {
    let numberOfBeers = conv.contexts.get("orderbeer-yes-followup").parameters.number;
    let numberTable = conv.contexts.get("orderbeer-yes-followup").parameters.numberTable;
    let response = `I got it. Table number ${numberTable} and ${numberOfBeers} beers.`;
    let name = conv.user.storage.user.display;
    if(numberOfBeers === undefined) {
        numberOfBeers = "1";
        response = `I got it. Table number ${numberTable} and one beer.`;
    }
    console.log(conv.contexts.get("orderbeer-yes-followup").parameters);
    
    let url = `https://script.google.com/macros/s/AKfycbyG38Mt_KQVxTzrlbud05ptcNHz2DUrwsio9Z1T7QDQBYl_E4ZQ/exec?name=${name}&numberOfBeers=${numberOfBeers}&tableNumber=${numberTable}`;
    url = encodeURI(url);
    console.log(url);
    return rp(url)
    .then((result) => {
        conv.ask(response);
    })
    .catch((error) => {
       console.log(error); 
    });
})

app.intent("order.beer", conv => {
    conv.ask("OK, just one?");
})

app.intent('Default Welcome Intent', conv => {
  const name = conv.user.storage.user;
  if(name !== undefined) {
      conv.contexts.set('yes-no-beer', 1, {});
      conv.ask(`So ${name.given}, you want a beer? Am I right?`);
  } else {
    const options = {
        context: 'Welcome to Developer Beer! To address you by name',
        permissions: ['NAME'],
    };
    conv.ask(new Permission(options));
    
  }
})


app.intent('ask.for.name.confirmation', (conv, params, confirmationGranted) => {
  const {name} = conv.user;
  conv.user.storage.user = name;
  conv.contexts.set('yes-no-beer', 1, {});
  if (confirmationGranted) {
    if (name) {
      conv.ask(`Hi  ${name.given}, I am your GDG waitress, and I serve you a beer. 
            You can order a regular size or small beer. 
            If you get lost or need help - say "HELP.`);
    } else {
        conv.ask(`Hi, I am your GDG waitress, and I serve you a beer. 
            You can order a regular size or small beer. 
            If you get lost or need help - say "HELP".`);
        
    }
  }
});

app.intent('Goodbye', conv => {
  conv.close('See you later!')
})

app.intent('Default Fallback Intent', conv => {
    let contexts = conv.contexts.input;
    console.log(contexts);
    if(typeof contexts == Array) {
      contexts.forEach(context => {
        let refreshContext = conv.contexts.get(context);
        conv.contexts.set(refreshContext);
    });
    
    }
    console.log(contexts);
    conv.ask(`I didn't understand. Can you tell me something else?`)
})



exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app)