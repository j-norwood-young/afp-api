# AFP API

This app grabs articles from AFP's Mobile Forum site and posts them on to an API. You will need an AFP account to use it.

It doesn't stay resident, so I suggest putting it into a cron. It can take a while to go through all the articles, so I suggest a cron time of around 5 mins to be safe.

## Installing

`npm i`

## Setup

Create a `.env` file with the following in it:

```
AFP_USERNAME=<your AFP username>
AFP_PASSWORD=<your AFP password>
AFP_URL=http://www.afpforum.com/afpmobile.0.16.04.22/indexapp.html
API_USERNAME=<your RESTful API username>
API_PASSWORD=<your RESTful API password>
API_ENDPOINT=<url to the API's endpoint to store the articles>
```

## Running

`npm start`
