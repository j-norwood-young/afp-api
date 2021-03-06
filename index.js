const puppeteer = require("puppeteer");
require("dotenv").config();
const rest = require("restler-bluebird");
const moment = require("moment-timezone");
var tzParisFormat = "CEST";

(async () => {
	const browser = await puppeteer.launch({ headless: true, timeout: 60000 });
	const page = await browser.newPage();
	console.log("Loading url", process.env.AFP_URL);

	page.on("response", response => {
		// console.log("Got response", response.url);
		(async () => {
			if (
				response.url ===
				"http://www.afpforum.com/AFPForum/AddDateCriterion/mobileapi.ashx"
			) {
				// console.log("Response url ", "http://www.afpforum.com/AFPForum/AddDateCriterion/mobileapi.ashx");
				var jsonResponse = await response.json();
				var articles = jsonResponse.Data.Results;
				globalArticles = articles;
				// console.log(articles);
				await page.waitFor(5000);
				for (let article of articles) {

					// if (!exists) {
						// console.log({ article });
						try {
							// console.log(
							// 	`Waiting for [data-uniquename='${
							// 		article.UniqueName
							// 	}']`
							// );
							await page.waitForSelector(
								`[data-uniquename='${article.UniqueName}']`,
								{ visible: true, timeout: 5000 }
							);
						} catch (e) {
							console.trace(e);
						}
						try {
							// console.log(
							// 	`Clicking [data-uniquename='${
							// 		article.UniqueName
							// 	}']`
							// );
							await page.click(
								`[data-uniquename='${article.UniqueName}']`
							);
						} catch (e) {
							console.trace(e);
						}
						try {
							// console.log(`Waiting for #docDetailBack`);
							await page.waitFor(1000);
						} catch (e) {
							console.trace(e);
						}
						try {
							// console.log(`Clicking #docDetailBack`);
							await page.click("#docDetailBack");
						} catch (e) {
							console.trace(e);
						}
						// console.log("Done with article");
						await page.waitFor(500);
					// }
				}
				console.log("All done");
				await page.waitFor(2000);
				await browser.close();
				console.timeEnd("AFP update");
			} else if (
				response.url ===
				"http://www.afpforum.com/AFPForum/DocumentGet/mobileapi.ashx"
			) {
				// console.log("Response url", "http://www.afpforum.com/AFPForum/DocumentGet/mobileapi.ashx");
				var jsonResponse = await response.json();
				// console.log(jsonResponse);
				var article = jsonResponse.Data;
				var globalArticle = globalArticles.find(
					ga => ga.UniqueName === jsonResponse.ContextData
				);
				// console.log(jsonResponse.ContextData, article.Title);
				var body = article.Description;
				// console.log({ globalArticle });
				// console.log(globalArticle.Date + " " + globalArticle.Time);
				var date = moment(`${ globalArticle.Date } ${ globalArticle.Time } ${ tzParisFormat }`,
					"DD/MM/YYYY HH:mm:ss z"
				).format("YYYY-MM-DDTHH:mm:ss Z");
				console.log(`${ globalArticle.Date } ${ globalArticle.Time } ${ tzParisFormat }`, date);
				date_updated = moment().format("YYYY-MM-DDTHH:mm:ss");
				// console.log({ date });
				var data = {
					headline: article.Title,
					blurb: "",
					provider_uid: jsonResponse.ContextData,
					body,
					byline: article.ByLine,
					provider: "AFP",
					city: "",
					country: "",
					keywords: article.Keywords.split("|"),
					date,
					date_updated
				};
				let exists = storedArticles.find(
					storedArticle => storedArticle.provider_uid === data.provider_uid
				);
				if (exists) {
					await rest.put(`${ process.env.API_ENDPOINT }/${ exists._id }`, {
						data,
						username: process.env.API_USERNAME,
						password: process.env.API_PASSWORD
					});
				} else {
					await rest.post(process.env.API_ENDPOINT, {
						data,
						username: process.env.API_USERNAME,
						password: process.env.API_PASSWORD
					});
				}
			}
		})();
	});
	try {
		// Load the site
		console.time("AFP update");
		await page.goto(process.env.AFP_URL);
		var storedArticleData = await rest.get(`${ process.env.API_ENDPOINT }?fields=provider_uid`, {
			username: process.env.API_USERNAME,
			password: process.env.API_PASSWORD
		});
		var storedArticles = storedArticleData.data;
		// Get rid of blocking page
		await page.waitForFunction(
			"document.getElementById('shortcutParent').style.display == 'block'"
		);
		await page.waitForFunction(
			"document.getElementById('shortcutParent').style.display = 'none'"
		);

		// Login
		await page.waitForSelector("#username");
		await page.type("#username", process.env.AFP_USERNAME);
		await page.type("#Password", process.env.AFP_PASSWORD);
		await page.click("#btnConnexion > input");

		await page.waitForSelector("#login");
		// Accept T&Cs
		await page.waitForSelector("#cbAcceptCGU");
		await page.click("#cbAcceptCGU");
		await page.click("#btnOKCGU");

		// // Get rid of overlay
		await page.click("body");
	} catch(err) {
		console.error(err);
		await browser.close();
		console.timeEnd("AFP update");
	}
})();
