# wbeng-stats

## Installation

Install the module from github repository:

`npm i @ttbooking/wbeng-stats`

Then create a `config` directory in your app root, if it's missing. The module uses `node-config` package
to manage configs, so you are to follow basic config structure for the `node-config` package 
(please refer to https://github.com/lorenwest/node-config/wiki/Configuration-Files).

Config example: 

```json
{
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
```

where `timelinePrecisions` is the list of precisions to save counters for.

## Usage

To update all API calls counters use `updateAPICalls` method with express response object. Please note,
that the object must contain `entryPoint` and `profile` fields.