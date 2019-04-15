# [![TAURUS](taurus-banner.gif)](https://bullhon.github.io)

> The official client library for connecting to Bullhorn REST API

---

[![Build Status](https://travis-ci.org/bullhorn/taurus.svg?branch=master)](https://travis-ci.org/bullhorn/taurus)
[![Dependency Status](https://dependencyci.com/github/bullhorn/taurus/badge)](https://dependencyci.com/github/bullhorn/taurus)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![npm version](https://badge.fury.io/js/%40bullhorn%2Ftaurus.svg)](https://badge.fury.io/js/%40bullhorn%2Ftaurus)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

---

[Website](http://bullhorn.github.io) • [Docs](http://bullhorn.github.io/taurus) • [Blog](https://medium.com/bullhorn-dev)

## What can Taurus do?

- **Authentication** - built-in authentication functionality.
- **Realtime bindings** - Synchronize database collections as objects or lists.
- **Note** - Taurus is designed for use only in client side environments

## Install

```bash
npm install --save @bullhorn/taurus @bullhorn/bullhorn-types
```

## Authentication

First, in the _src_ folder create an _app.js_ file. Then, you will need setup your Application with the credentials provided to you by Bullhorn.

> Note: Don't have a `clientId`? Partner keys are only available directly from Bullhorn. If you are interested in becoming a partner, send a email message to [partners@bullhorn.com](partners@bullhorn.com) or fill out the form available at the [Bullhorn Marketplace](https://www.bullhorn.com/marketplace/partner-application/).

### app.js

```typescript
import { Staffing, StaffingCredentialsAuthProvider } from '@bullhorn/taurus';

const provider = new StaffingCredentialsAuthProvider('docsamson', 'secrets');
const staffing: Staffing = new Staffing({
  restUrl: 'https://login.bullhorn.com',
  BhRestToken: '~BULLHORN_REST_TOKEN~',
});

staffing.login(provider).then(() => {
  console.log('We Are Doing it!');
});

// or

const app = Staffing.loginWithPopup('https://login.bullhorn.com');
```

## Getting the data

Now we need to get some data. Taurus provides several convience function to Search and retrieve entities within the system.

### Object Data

For this example we are going to get and entiy by id.

```typescript
import { EntityTypes, Candidate } from '@bullhorn/bullhorn-types';
import { Entity } from '@bullhorn/taurus';

let record: Entity<Candidate> = new Entity(EntityTypes.Candidate).fields('id', 'name');
// Populate from server with data for Candidate #100
record.get(100);
// Listen for changes
record.subscribe((response) => {
  console.log(record.data);
  // output: {id: 100, name: 'Theodore'}
});
```

### List Data

For this example we are going to search for some Jobs and display a list of them.

```typescript
import { EntityTypes, Candidate } from '@bullhorn/bullhorn-types';
import { EntityList } from '@bullhorn/taurus';

let list: EntityList<Candidate> = new EntityList(EntityTypes.Candidate, {
  fields: ['id', 'name'],
  startAt: 0,
  limitTo: 25,
  filter: { isDeleted: 0 },
});

list.subscribe((response) => {
  let total = list.info.total;
  // TODO: Finish this
});
```

## Lets Get Started

This tutorial will take you through creating a simple application using Taurus and briefly explain its main concepts. We assume you are familiar with JavaScript, HTML, and CSS. To get a quick overview, we recommend you skip down to the section titled "Setting Up The HTML Page" so you can see how to use Taurus straight away. To view the completed results of this tutorial, please have a look at our [examples project](https://github.com/bullhorn/examples).

## Configuring Your Environment

Let's start by getting you set up with a great set of tools that you can use to build modern JavaScript applications. All our tooling is built on [Node.js](http://nodejs.org/). If you have that installed already, great! If not, you should go to [the official web site](http://nodejs.org/), download and install it. Everything else we need will be installed via Node's package manager ([npm](https://docs.npmjs.com/getting-started/what-is-npm)).

## Setting Up The HTML Page

If you've followed along this far, you now have all the libraries, build configuration and tools you need to create amazing JavaScript apps with Taurus. The next thing we need to do is create our _index.html_ file in the root of our project folder. Create that now and use the markup below.

### index.html

```html
<!doctype html>
<html>
  <head>
	<link rel="stylesheet" type="text/css" href="//cdn.bullhorn.com/bullhorncss/1.0/bullhorn.css">
	<script src="//unpkg.com/@reactivex/rxjs@5.0.0-beta.12/dist/global/Rx.js"></script>
	<script src="//unpkg.com/axios/dist/axios.min.js"></script>
	<script src="//unpkg.com/@bullhorn/taurus@1.5.1/lib/index.umd.js"></script>
	<script>
        var provider = new taurus.StaffingCredentialsAuthProvider('docsamson', 'secretpassword');
        var staffing = new taurus.Staffing({
            useCookies: false,
            client_id: '~~YOUR-BULLHORN-CLIENT-ID~~',
            apiVersion: '*',
            redirect_url: 'http://your-app.com',
            authorization_url: 'http://auth.bullhornstaffing.com/oauth/authorize',
            token_url: 'http://auth.bullhornstaffing.com/oauth/token',
            login_url: 'http://rest.bullhornstaffing.com/rest-services/login'
        });

        staffing.login(provider).then(() => {
            // Now we are authenticated
            var list = new taurus.EntityList('Candidate', {
                fields: ['id', 'name'],
                startAt: 0,
                limitTo: 25,
                filter: { isDeleted: 0 }
            });
            list.subscribe((results) => {
				// The list has retrieved your results
                console.log('Results: ', results);
                console.log('Total Candidate: ', list.info.total);
            });
        });
    </script>
  </head>
  <body>
  </body>
</html>
```

Yes, that's it. This is the only HTML page in our application.

## View the page

We can install another npm package called [live-server](https://www.npmjs.com/package/live-server). This with host our application and watch the directory structure for any changes, there is no configuration, so it always works.

```shell
npm install -g live-server
```

You can now browse to [http://localhost:8080/](http://localhost:8080/) to see the app.

Let's recap. To add a page to your app:

1. Add your SDK Credentials
2. Authenticate
3. Get data from Bullhorn
4. Celebrate.

## Conclusion

With its strong focus on developer experience, Taurus can enable you to not only create amazing applications, but also enjoy the process. We've designed it with simple conventions in mind so you don't need to waste time with tons of configuration or write boilerplate code just to satisfy a stubborn or restrictive framework.

If you need more help, check out the [Documentation](http://bullhorn.github.io/taurus) and [Api Reference](http://bullhorn.github.io/taurus)

---

<p>
	<img src="bully.png" align="left" width="32" />
	<span>&nbsp; built by Bullhorn, copyright (c) forever!</span>
</p>
