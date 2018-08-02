# middleware-socket-service [![Build Status](https://travis-ci.org/ChronoBank/middleware-socket-service.svg?branch=master)](https://travis-ci.org/ChronoBank/middleware-socket-service)

Middleware service for translate message from amqp to native sockets

### Installation

This module is a part of middleware services. You can install it in 2 ways:

1) through core middleware installer  [middleware installer](https://github.com/ChronoBank/middleware)
2) by hands: just clone the repo, do 'npm install', set your .env - and you are ready to go

##### About
This module is used for translating messages from amqp (messages from other middlewares)
and send to auth subscribers through native sockets

#### How does it work?

##### AUTH MESSAGE
Client must authorizing to service through laborx Profile service
that send auth message after 10 sec after open connection
```
{ 
    type: 'AUTH',
    token: 'sdfsdfsdfsdf'
}
```
where

where
| name | description |
| ------ | ------ |
| token | token from laborx profile service

##### OK AUTH MESSAGE
Client must get ok auth message after success authentification
```
{
    ok: true
}
```

##### SUBSCRIBE MESSAGE

Client subscribe to get messages from this service,
send message this format

```
{ 
    type: 'SUBSCRIBE',
    routing: 'app_eth.transaction.*'
}
```
where
| name | description |
| ------ | ------ |
| routing | routingKey, as subscription channel mask

##### UNSUBSCRIBE MESSAGE

Client unsubscribe to get messages from middlewares, that match to routingKey
send message this format

```
{ 
    type: 'UNSUBSCRIBE',
    routing: 'app_eth.transaction.*'
}
```

where
| name | description |
| ------ | ------ |
| routing | routingKey, as subscription channel mask

### How client get messages from service

Client get messages from this service as such format

```
{
    routing: 'app_eth.transaction.*',
    data: {
        hash: 'sdfsfdsdfs',
        id: 'ffgdgdf'
    }
}
```

where

| name | description |
| ------ | ------ |
| routing | routingKey, as client send in connection before
| data | data from middleware for this routingKey [see appropriate middleware documentation]


##### сonfigure your .env

To apply your configuration, create a .env file in root folder of repo (in case it's not present already).
Below is the expamle configuration:

```
WS_PORT=8080
RABBIT_URI=amqp://localhost:5672
RABBIT_SERVICE_NAME=socket
RABBIT_EXCHANGE=events
LABORX_URI=http://localhost:3001
MONGO_URI=mongodb://localhost:27017/data
```

The options are presented below:

| name | description|
| ------ | ------ |
| LABORX_URI   | the URI string for auth laborx profile
| RABBIT_URI   | the URI string for rabbit
| WS_PORT   | port for WebSocket server
| RABBIT_SERVICE_NAME | serviceName for create queues in rabbitMq
| RABBIT_EXCHANGE | name of exchange in rabbit that service connected
| PROFILE_PREFIX | the prefix for profileModel(cache tokens from laborx) in mongodb
| MONGO_URI | the URI string for mongo
| LEVEL_DB | the path to file, where save all cache information of service

License
----
 [GNU AGPLv3](LICENSE)

Copyright
----
LaborX PTY
