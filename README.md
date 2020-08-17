# wbeng-stats

## Installation

Install the module from github repository:

`npm i @ttbooking/wbeng-stats`

Then create a `config` directory in your app root, if it's missing and add the `stats` field. If you want to 
overwrite default config values, you may follow the structure below: 

```json
{
    "stats": {
        "timelinePrecisions": [
            "1 minutes",
            "1 hours",
            "1 days",
            "1 weeks",
            "1 months",
            "3 months",
            "6 months"
        ],
        "redisPort": 6379
    }
}
```

where `timelinePrecisions` is the list of precisions to save counters for.

## Usage

To update all API calls counters use `updateAPICalls` method with express response object. Please note,
that the object must contain `entryPoint` and `profile` fields.

```js

const wbengstats = require('./index');

/**
* @var expressRequest
*/
const request = {
    entryPoint: "flights",
    profile: "default"
};

wbengstats.updateAPICalls(request);

```

Use async method `getAPIsalls` to get stats data over timeline precision. Allowed timeline precisions are as follows:

```
            "1 minutes",
            "1 hours",
            "1 days",
            "1 weeks",
            "1 months",
            "3 months",
            "6 months"
```

or whatever is listed in the `timelinePrecisions` config field. Please note, these titles must comply with `moment.duration` format.


```js
const wbengstats = require('./index');

wbengstats.getAPICalls("1 weeks").then(res => {
    console.dir(res);
});

```

Response example:

```json
{
  "1597325940": "1",
  "1597389360": "5",
  "1597393500": "8",
  "1597414380": "1",
  "1597414440": "2",
  "1597414500": "1"
}
```

Here, key is a timestamp, value is a number of calls performed in a timeslice. 