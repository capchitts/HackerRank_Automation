
// node script.js --url="https://www.hackerrank.com" --config="config.json" 

// npm init -y
// npm install minimist
// npm install puppeteer 

//imports
let minimist = require("minimist");
let puppeteer = require("puppeteer");
let fs = require("fs");

const { cachedDataVersionTag } = require("v8");

//args 
let args = minimist(process.argv);

//json object for configuration file
let configJSON = fs.readFileSync(args.config, "utf-8");

//convert it to JS object
let configJSO = JSON.parse(configJSON);


async function run() {
    // start the browser
    let browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-maximized'
        ],
        defaultViewport: null
    });

    // get the tabs (there is only one tab)
    let pages = await browser.pages();
    let page = pages[0];

    // open the url
    await page.goto(args.url);

    // wait and then click on login on page1
    await page.waitForSelector("a[data-event-action='Login']");
    await page.click("a[data-event-action='Login']");

    // wait and then click on login on page2
    await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await page.click("a[href='https://www.hackerrank.com/login']");

    // type userid
    await page.waitForSelector("input[name='username']");
    await page.type("input[name='username']", configJSO.userid, { delay: 20 });

    // type password
    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']", configJSO.password, { delay: 20 });

    page.waitFor(2000);
    // press click on page3
    await page.waitForSelector("button[data-analytics='LoginPassword']");
    await page.click("button[data-analytics='LoginPassword']",{delay:1000});
    
    page.waitFor(2000);
    // click on compete
    await page.waitForSelector("a[data-analytics='NavBarContests']");
    await page.click("a[data-analytics='NavBarContests']",{delay:1000});

    page.waitFor(2000);
    // click on manage contests
    await page.waitForSelector("a[href='/administration/contests/']");
    await page.click("a[href='/administration/contests/']",{delay:1000});

    //we only have one page
    await handleAllContestsOfAPage(page, browser);
    /*
    // find number of pages
    await page.waitForSelector("a[data-attr1='Last']");
    let numPages = await page.$eval("a[data-attr1='Last']", function (atag) {
        let totPages = parseInt(atag.getAttribute("data-page"));
        return totPages;
    });
    console.log(numPages);

    for (let i = 1; i <= numPages; i++) {
        await handleAllContestsOfAPage(page, browser);

        if (i != numPages) {
            await page.waitForSelector("a[data-attr1='Right']");
            await page.click("a[data-attr1='Right']");
        }
    }
    */
   await browser.close();
}

async function handleAllContestsOfAPage(page, browser) {
    
    // find all urls cntaining contests link within same page
    await page.waitForSelector("a.backbone.block-center");
    let curls = await page.$$eval("a.backbone.block-center", function (atags) {
        let urls = [];

        for (let i = 0; i < atags.length; i++) {
            let url = atags[i].getAttribute("href");
            urls.push(url);
        }

        return urls;
    });

    //iterate over each url one by one and add moderator
    for (let i = 0; i < curls.length; i++) {
        //open a new page
        let ctab = await browser.newPage();
        await saveModeratorInContest(ctab, args.url + curls[i], configJSO.moderators);
        await ctab.close();
    }
}


async function saveModeratorInContest(ctab, fullCurl, moderator) {
    //ctab is a new page and this will move focus on bringToFront

    await ctab.bringToFront();
    //goto the url
    await ctab.goto(fullCurl);

    // click on moderators tab
    await ctab.waitForSelector("li[data-tab='moderators']");
    await ctab.click("li[data-tab='moderators']",{delay:1000});

    // type in moderator
    await ctab.waitForSelector("input#moderator");
    await ctab.type("input#moderator", moderator, { delay: 2000 });

    // press enter to add 
    await ctab.keyboard.press("Enter");
}



run();



